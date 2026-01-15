
import { INVICTUS_PAY_CONFIG } from '../constants';

export const pixService = {
  generatePixCharge: async (
    amount: number,
    email: string,
    name: string,
    cpf: string,
    phone: string,
    offerHash: string,
    productTitle: string
  ) => {
    try {
      console.log("PIX Service: Iniciando geração...");
      const token = INVICTUS_PAY_CONFIG.API_TOKEN || "";
      console.log("PIX Service: Token presente?", !!token, "Tamanho:", token.length);

      const amountInCents = Math.round(amount * 100);
      const cleanCpf = cpf.replace(/\D/g, '');
      let cleanPhone = phone.replace(/\D/g, '');

      // Garante o prefixo 55 (Brasil) se não estiver presente
      if (cleanPhone && cleanPhone.length <= 11) {
        cleanPhone = "55" + cleanPhone;
      }
      if (!cleanPhone) cleanPhone = '5511999999999';

      const payload = {
        amount: amountInCents,
        product_hash: String(offerHash),
        offer_hash: String(offerHash),
        payment_method: "pix",
        customer: {
          name: String(name),
          email: String(email),
          phone_number: String(cleanPhone),
          document: String(cleanCpf)
        },
        cart: [
          {
            title: String(productTitle),
            price: amountInCents,
            quantity: 1,
            product_hash: String(offerHash),
            operation_type: 1,
            tangible: true
          }
        ],
        installments: 1,
        expire_in_days: 1,
        transaction_origin: "api"
      };

      const url = `${INVICTUS_PAY_CONFIG.API_URL}/transactions?api_token=${INVICTUS_PAY_CONFIG.API_TOKEN}`;
      console.log("PIX Service: Chamando API...");

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      console.log("PIX API Total Response:", json);

      if (!response.ok) {
        const errorMsg = json.message || json.error || JSON.stringify(json);
        console.error("ERRO DA API INVICTUS:", errorMsg);
        throw new Error(errorMsg);
      }

      const data = json.data || json;
      const pixObj = data.pix || {};

      // Tentativa de mapear diferentes formatos de resposta
      const qrcode = pixObj.pix_qr_code || data.pix_code || data.pix_qr_code || "";
      const imagem = pixObj.qr_code_base64 || data.pix_qr_code_url || "";

      return {
        qrcode,
        imagem_base64: imagem,
        id: data.hash || data.id || "tx_pix"
      };
    } catch (error: any) {
      console.error("Erro Crítico no Serviço PIX:", error.message || error);
      throw error;
    }
  },

  generateMockPix: () => {
    const mockCode = "00020101021226850014br.gov.bcb.pix0123testemockpixgalpao89520400005303986540589.905802BR5925GALPAO 896009SAO PAULO62070503***6304E2B1";
    return {
      qrcode: mockCode,
      imagem_base64: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockCode)}`,
      id: "mock_" + Date.now()
    };
  }
};
