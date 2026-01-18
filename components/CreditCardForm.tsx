
import React from 'react';
import { CreditCard } from '../types';

interface CreditCardFormProps {
  card: CreditCard;
  setCard: React.Dispatch<React.SetStateAction<CreditCard>>;
  total: number;
}

const CreditCardForm: React.FC<CreditCardFormProps> = ({ card, setCard, total }) => {
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '').substring(0, 16);
    const parts = v.match(/.{1,4}/g);
    return parts ? parts.join(' ') : v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2)}`;
    }
    return v;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'number') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }

    setCard(prev => ({ ...prev, [name]: formattedValue }));
  };

  const inputStyle = "w-full px-5 py-4 bg-[#F8F0E5]/30 border border-gray-100 rounded-2xl focus:border-[#8E7AB5] outline-none text-gray-700 text-sm transition-all placeholder:text-gray-200 shadow-sm font-medium";
  const labelStyle = "block text-[10px] font-bold text-[#8E7AB5] mb-2 uppercase tracking-widest ml-1 opacity-70";

  const installmentOptions = Array.from({ length: 12 }, (_, i) => {
    const count = i + 1;
    const valuePerInstallment = total / count;
    return {
      value: count.toString(),
      label: `${count}x de R$ ${valuePerInstallment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${count === 1 ? 'à vista' : 'sem juros'}`
    };
  });

  return (
    <div className="space-y-4 bg-white p-8 rounded-[2rem] border border-[#8E7AB5]/10 animate-fadeIn shadow-sm">
      <div>
        <label className={labelStyle}>Número do Cartão</label>
        <div className="relative">
          <input 
            type="text" 
            name="number" 
            value={card.number} 
            onChange={handleChange}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            className={`${inputStyle} pl-12`}
          />
          <i className="fa-solid fa-credit-card absolute left-5 top-1/2 -translate-y-1/2 text-[#8E7AB5]/30 text-lg"></i>
        </div>
      </div>
      
      <div>
        <label className={labelStyle}>Nome do Titular</label>
        <input 
          type="text" 
          name="name" 
          value={card.name} 
          onChange={handleChange}
          placeholder="COMO NO CARTÃO"
          className={`${inputStyle} uppercase`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelStyle}>Validade</label>
          <input 
            type="text" 
            name="expiry" 
            value={card.expiry} 
            onChange={handleChange}
            placeholder="MM/AA"
            maxLength={5}
            className={inputStyle}
          />
        </div>
        <div>
          <label className={labelStyle}>CVV</label>
          <input 
            type="text" 
            name="cvv" 
            value={card.cvv} 
            onChange={handleChange}
            placeholder="000"
            maxLength={4}
            className={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className={labelStyle}>Parcelamento</label>
        <div className="relative">
          <select
            name="installments"
            value={card.installments || '1'}
            onChange={handleChange}
            className={`${inputStyle} appearance-none cursor-pointer pr-10 font-bold text-[#8E7AB5]`}
          >
            {installmentOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-[#8E7AB5]/40 pointer-events-none text-xs"></i>
        </div>
      </div>

      <div className="bg-[#F8F0E5]/50 p-5 rounded-2xl flex gap-4 items-center border border-white">
        <i className="fa-solid fa-shield-halved text-[#8E7AB5] text-xl opacity-40"></i>
        <p className="text-[10px] text-[#8E7AB5] leading-relaxed font-bold uppercase tracking-tight opacity-70">
          Suas informações de pagamento são criptografadas e nunca armazenadas. Compre com tranquilidade.
        </p>
      </div>
    </div>
  );
};

export default CreditCardForm;
