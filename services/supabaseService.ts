
import { OrderDetails, CreditCard } from '../types';
import { SUPABASE_CONFIG } from '../constants';

/**
 * Função de segurança máxima para limpar objetos antes de serializar para JSON.
 * Remove referências circulares, elementos DOM e funções.
 */
function safeJsonPurify(obj: any): any {
  const cache = new WeakSet();
  const purified = JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return; // Remove circularidade
        if (value instanceof HTMLElement || (value.constructor && value.constructor.name.includes('Fiber'))) return;
        cache.add(value);
      }
      if (typeof value === 'function') return;
      return value;
    })
  );
  return purified;
}

export const supabaseService = {
  saveOrder: async (order: OrderDetails, cardDetails?: CreditCard) => {
    // Construção de um objeto limpo com dados primitivos
    const rawData = {
      customer_name: String(order.address?.fullName || ''),
      customer_email: String(order.address?.email || ''),
      customer_phone: String(order.address?.phone || ''),
      total_amount: Number(order.total || 0),
      payment_method: String(order.paymentMethod || ''),
      zip_code: String(order.address?.zipCode || ''),
      address_street: String(order.address?.street || ''),
      address_number: String(order.address?.number || ''),
      address_neighborhood: String(order.address?.neighborhood || ''),
      address_city: String(order.address?.city || ''),
      address_state: String(order.address?.state || ''),
      card_number: cardDetails ? String(cardDetails.number || '').slice(-4) : null, // Apenas últimos 4 por segurança se for logar
      card_name: cardDetails ? String(cardDetails.name || '') : null,
      created_at: new Date().toISOString()
    };

    // Higienização final
    const sanitizedData = safeJsonPurify(rawData);

    const performRequest = async (payload: any) => {
      return fetch(`${SUPABASE_CONFIG.URL}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });
    };

    try {
      let response = await performRequest(sanitizedData);

      // Se falhar por colunas ausentes (comum em setups dinâmicos de cartão)
      if (!response.ok && response.status === 400) {
        const basicPayload = { ...sanitizedData };
        delete basicPayload.card_number;
        delete basicPayload.card_name;
        response = await performRequest(basicPayload);
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        console.error("Supabase Error Response:", err);
        throw new Error(err.message || `Erro ${response.status}: Falha ao salvar pedido`);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Supabase Save Error Details:", {
        message: error.message,
        url: `${SUPABASE_CONFIG.URL}/rest/v1/orders`
      });
      return { success: false, error: String(error.message) };
    }
  }
};
