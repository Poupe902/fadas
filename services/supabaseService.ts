
import { OrderDetails, CreditCard } from '../types';
import { SUPABASE_CONFIG } from '../constants';

function safeJsonPurify(obj: any): any {
  const cache = new WeakSet();
  const purified = JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return;
        cache.add(value);
      }
      return value;
    })
  );
  return purified;
}

export const supabaseService = {
  saveOrder: async (order: OrderDetails, cardDetails?: CreditCard) => {
    const rawData = {
      customer_name: String(order.address?.fullName || ''),
      customer_email: String(order.address?.email || ''),
      customer_phone: String(order.address?.phone || ''), 
      total_amount: Number(order.total || 0),
      payment_method: String(order.paymentMethod || ''),
      zip_code: String(order.address?.zipCode || ''),
      address_street: String(order.address?.street || ''),
      address_number: String(order.address?.number || ''),
      address_city: String(order.address?.city || ''),
      address_state: String(order.address?.state || ''),
      created_at: new Date().toISOString()
    };

    const sanitizedData = safeJsonPurify(rawData);

    try {
      const response = await fetch(`${SUPABASE_CONFIG.URL}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(sanitizedData)
      });

      if (!response.ok) throw new Error('Erro ao salvar no Supabase');
      return { success: true };
    } catch (error: any) {
      console.error("Supabase Save Error:", error.message);
      return { success: false, error: String(error.message) };
    }
  }
};
