
import React from 'react';
import { OrderItem } from '../types';

interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ items, subtotal, shipping, total }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-[#8E7AB5]/10">
        <h2 className="text-[11px] font-black text-[#8E7AB5] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
          <i className="fa-solid fa-basket-shopping"></i>
          Sua Sacola
        </h2>
        
        <div className="space-y-6 mb-8">
          {items.map(item => (
            <div key={item.id} className="flex gap-5 items-center">
              <div className="w-20 h-20 bg-[#F8F0E5]/50 rounded-[1.5rem] border border-gray-50 p-2 shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                <i className="fa-solid fa-wand-sparkles text-3xl text-[#8E7AB5]/30"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-black text-[#8E7AB5] uppercase tracking-widest mb-2">
                  {item.name}
                </h3>
                <div className="flex items-baseline gap-1">
                   <span className="text-[12px] font-black text-[#8E7AB5]/60">R$</span>
                   <span className="text-2xl font-black text-[#8E7AB5] tracking-tighter">
                     {item.price.toFixed(2).replace('.', ',')}
                   </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#F8F0E5] pt-6 space-y-4">
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Subtotal</span>
            <span className="text-[#8E7AB5] font-black">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Envio</span>
            {shipping === 0 ? (
              <span className="text-[#8E7AB5] font-black bg-[#F8F0E5] px-2 py-0.5 rounded-lg border border-[#8E7AB5]/10">GRÁTIS</span>
            ) : (
              <span className="text-[#8E7AB5] font-black">R$ {shipping.toFixed(2).replace('.', ',')}</span>
            )}
          </div>
          <div className="flex justify-between items-center pt-5 border-t border-[#F8F0E5]">
            <span className="text-[13px] font-black text-[#8E7AB5] uppercase tracking-tighter">Total</span>
            <div className="text-right">
               <div className="flex items-baseline justify-end gap-1 text-[#8E7AB5]">
                  <span className="text-[14px] font-black">R$</span>
                  <span className="text-3xl font-black tracking-tighter">{total.toFixed(2).replace('.', ',')}</span>
               </div>
               <p className="text-[9px] text-gray-300 font-bold uppercase tracking-wide">Parcelamento disponível</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
