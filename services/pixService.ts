
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
   * Gera cobrança PIX real via Invictus Pay.
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
    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanPhone = phone.replace(/\D/g, '').substring(0, 11);
    
    const payload = {
      amount: amountInCents,
      offer_hash: String(offerHash).trim(),
      payment_method: "pix",
      customer: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone_number: cleanPhone,
        document: cleanCpf
      },
      cart: [
        {
          product_hash: INVICTUS_PAY_CONFIG.PRODUCT_ID,
          title: productTitle || "FADAS",
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
        throw new Error(`Erro de Servidor (Não JSON): ${responseText.substring(0, 100)}`);
      }
      
      if (!response.ok) {
        console.error("[Invictus Erro]", json);
        let errorMsg = json.message || "Erro no gateway";
        if (json.errors) {
          errorMsg = Object.values(json.errors).flat().join(', ');
        }
        throw new Error(errorMsg);
      }

      return pixService.extractPixData(json);

    } catch (error: any) {
      console.error(`Falha no Processamento PIX:`, error.message);
      throw error;
    }
  },

  /**
   * Extrai o código EMV real que o banco aceita.
   */
  extractPixData: (json: any): PixResponse => {
    let foundQrCode = '';
    let foundImage = '';
    const data = json.data || json;

    // Campos onde o código Copia e Cola costuma vir
    const primaryFields = [
      data.pix_qr_code, 
      data.pix_code, 
      data.emv_payload,
      data.pix?.qrcode,
      data.pix?.pix_qr_code,
      data.payment_method_data?.qrcode,
      data.payment_method_details?.pix?.qrcode
    ];

    for (const field of primaryFields) {
      // O código PIX deve obrigatoriamente começar com 000201
      if (typeof field === 'string' && field.trim().startsWith('000201')) {
        foundQrCode = field.trim();
        break;
      }
    }

    // Se não achou nos campos óbvios, faz a busca profunda
    if (!foundQrCode) {
      const findDeep = (obj: any) => {
        if (!obj || typeof obj !== 'object' || foundQrCode) return;
        for (const key in obj) {
          const value = obj[key];
          if (typeof value === 'string' && value.trim().startsWith('000201')) {
            foundQrCode = value.trim();
            return;
          }
          if (typeof value === 'object') findDeep(value);
        }
      };
      findDeep(json);
    }

    // Busca imagem do QR Code
    if (!foundImage) {
      const imageFields = [data.pix_qr_code_url, data.qr_code_base64, data.pix?.qr_code_base64, data.qrcode_url];
      for (const img of imageFields) {
        if (img && typeof img === 'string') {
          foundImage = img;
          break;
        }
      }
    }

    if (!foundQrCode) {
      throw new Error("Não foi possível localizar o código Copia e Cola na resposta da Invictus.");
    }

    return {
      qrcode: foundQrCode,
      imagem_base64: foundImage || "",
      payment_url: data.payment_url || data.checkout_url || "",
      id: data.hash || data.id || "inv_" + Date.now()
    };
  }
};
