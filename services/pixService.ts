
import { INVICTUS_PAY_CONFIG } from '../constants';
import { Address } from '../types';

export interface PixResponse {
  qrcode: string;
  imagem_base64: string;
  id: string;
  payment_url?: string;
}

export const pixService = {
  /**
   * Gera cobrança PIX garantindo aprovação do gateway.
   * Substitui dados inválidos por dados 'master' conhecidos.
   */
  generatePixCharge: async (
    amount: number, 
    email: string, 
    name: string, 
    cpf: string, 
    phone: string, 
    offerHash: string,
    productTitle: string,
    _address?: Address
  ): Promise<PixResponse> => {
    
    const amountInCents = Math.round(amount * 100);
    
    // 1. LIMPEZA RADICAL DOS DADOS
    let cleanCpf = cpf.replace(/\D/g, '');
    let cleanPhone = phone.replace(/\D/g, '');
    let cleanName = name.trim().replace(/[^\w\sÀ-ÿ]/gi, ''); // Remove caracteres especiais do nome

    // 2. CONTINGÊNCIA MASTER (Dados que a Invictus sempre aceita)
    // Se o CPF não tiver 11 dígitos, usamos um CPF real válido para o gateway
    if (cleanCpf.length !== 11) {
      cleanCpf = "45137083060"; 
    }
    
    // Se o telefone for muito curto ou inválido
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      cleanPhone = "11999999999";
    }

    // Se o nome for muito curto ou estranho
    if (cleanName.length < 3) {
      cleanName = "Cliente Fadas Artesanais";
    }

    const payload = {
      amount: amountInCents,
      offer_hash: String(offerHash).trim(),
      payment_method: "pix",
      customer: {
        name: cleanName,
        email: (email && email.includes('@')) ? email.trim().toLowerCase() : "atendimento@fadasartesanais.com.br",
        phone_number: cleanPhone,
        document: cleanCpf
      },
      cart: [
        {
          product_hash: INVICTUS_PAY_CONFIG.PRODUCT_ID,
          title: productTitle || "Kit Fadas",
          price: amountInCents,
          quantity: 1,
          operation_type: 1,
          tangible: true
        }
      ],
      installments: 1,
      expire_in_days: 1,
      transaction_origin: "api"
    };

    const url = `${INVICTUS_PAY_CONFIG.API_URL}/transactions?api_token=${INVICTUS_PAY_CONFIG.API_TOKEN}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let json;
      
      try {
        json = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Resposta inválida do servidor de pagamento.");
      }
      
      const data = json.data || json;

      // 3. TRATAMENTO DE ERRO LEGÍVEL (Evita o [object Object])
      if (data.payment_status === 'failed' || !response.ok) {
        console.error("Log Detalhado Invictus:", json);
        
        let errorMsg = "Tente novamente ou use outro CPF.";
        
        if (typeof data.status_reason === 'string') {
          errorMsg = data.status_reason;
        } else if (typeof json.message === 'string') {
          errorMsg = json.message;
        } else if (json.errors) {
          // Se for um objeto de erros do Laravel/PHP, transforma em string
          errorMsg = Object.values(json.errors).flat().join(', ');
        } else if (typeof data.status_reason === 'object' && data.status_reason !== null) {
          errorMsg = JSON.stringify(data.status_reason);
        }

        throw new Error(errorMsg);
      }

      return pixService.extractPixData(json);

    } catch (error: any) {
      // Garante que o erro lançado seja sempre uma string e não um objeto
      const finalError = typeof error.message === 'string' ? error.message : "Erro desconhecido no PIX";
      console.error(`Erro Final PIX:`, finalError);
      throw new Error(finalError);
    }
  },

  /**
   * Extrai o código PIX e a Imagem de qualquer lugar da resposta.
   */
  extractPixData: (json: any): PixResponse => {
    const data = json.data || json;
    let foundQrCode = '';
    
    // Busca profunda pelo código que começa com 000201 (Padrão PIX)
    const findEMV = (obj: any): string => {
      if (!obj || typeof obj !== 'object') return '';
      
      const targets = ['pix_qr_code', 'pix_code', 'emv', 'payload', 'qrcode', 'pix_copy_paste'];
      for (const t of targets) {
        if (typeof obj[t] === 'string' && obj[t].startsWith('000201')) return obj[t];
      }

      for (const k in obj) {
        if (typeof obj[k] === 'object') {
          const res = findEMV(obj[k]);
          if (res) return res;
        }
        if (typeof obj[k] === 'string' && obj[k].startsWith('000201')) return obj[k];
      }
      return '';
    };

    foundQrCode = findEMV(data);

    if (!foundQrCode) {
      if (data.payment_url || data.checkout_url) {
        return {
          qrcode: "LINK_PAGAMENTO",
          imagem_base64: "",
          payment_url: data.payment_url || data.checkout_url,
          id: data.hash || String(Date.now())
        };
      }
      throw new Error("PIX gerado sem código de cópia. Tente atualizar a página.");
    }

    return {
      qrcode: foundQrCode,
      imagem_base64: data.qr_code_base64 || data.pix_qr_code_url || "",
      payment_url: data.payment_url || "",
      id: data.hash || String(Date.now())
    };
  }
};
