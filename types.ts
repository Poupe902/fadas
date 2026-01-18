
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  PIX = 'pix'
}

export interface Address {
  fullName: string;
  email: string;
  phone?: string;
  cpf?: string; // Adicionado CPF
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface CreditCard {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
  installments?: string; // Adicionado campo de parcelas
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderDetails {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  address: Address;
  paymentMethod: PaymentMethod;
}
