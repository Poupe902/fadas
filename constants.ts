
export const FREE_SHIPPING_THRESHOLD = 0;

/**
 * Valor do frete fixado em R$ 9,90 para somar R$ 89,80 com o produto de R$ 79,90.
 */
export const STANDARD_SHIPPING_PRICE = 9.90;

export const MOCK_ITEMS = [
  {
    id: 'fadas-kit-artesanal',
    name: 'FADA ARTESANAL',
    price: 79.90,
    quantity: 1,
    image: ''
  }
];

/**
 * --- CONFIGURAÇÃO INVICTUS PAY ---
 */
export const INVICTUS_PAY_CONFIG = {
  API_URL: 'https://api.invictuspay.app.br/api/v1',
  API_TOKEN: 'IYCoH1R6LnB5POVuv5LTKwc9uyER0IPVcY9SrSSKU5fC0E1XauTIFRAMKF50',

  OFFERS: {
    FREE_SHIPPING: 'gmvowuyoib', // Oferta de R$ 79,90
    PAID_SHIPPING: 'ld4kumu4vp', // Oferta de R$ 89,80 (Hash da imagem Neymar)
    DISCOUNTED: 'offer_5990_discount', // Oferta de R$ 59,90 (Ajuste este hash se necessário)
  },

  ALLOW_TEST_MODE: false,
};

export const SUPABASE_CONFIG = {
  URL: 'https://rckqhortwgtztkcyqvik.supabase.co',
  ANON_KEY: 'sb_publishable_C9OsSGE54AbAP2mkd9QWrw_Jyg1qYG1'
};
