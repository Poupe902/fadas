
import React, { useState, useMemo } from 'react';
import { PaymentMethod, Address, CreditCard, OrderDetails } from './types';
import { MOCK_ITEMS, INVICTUS_PAY_CONFIG } from './constants';
import AddressForm from './components/AddressForm';
import OrderSummary from './components/OrderSummary';
import CreditCardForm from './components/CreditCardForm';
import PixPayment from './components/PixPayment';
import { pixService } from './services/pixService';
import { supabaseService } from './services/supabaseService';

const App: React.FC = () => {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [cardErrorRedirect, setCardErrorRedirect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingPrice, setShippingPrice] = useState(0);

  const [personalData, setPersonalData] = useState({ name: '', email: '', phone: '', cpf: '' });
  const [address, setAddress] = useState<Address>({ fullName: '', email: '', phone: '', cpf: '', zipCode: '', street: '', number: '', neighborhood: '', city: '', state: '' });
  const [card, setCard] = useState<CreditCard>({ number: '', name: '', expiry: '', cvv: '', installments: '1' });

  const subtotal = useMemo(() => MOCK_ITEMS.reduce((acc, item) => acc + (item.price * item.quantity), 0), []);
  const total = useMemo(() => subtotal + shippingPrice, [subtotal, shippingPrice]);

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    if (field === 'phone') {
      const v = value.replace(/\D/g, '');
      if (v.length <= 11) {
        if (v.length <= 2) formattedValue = v;
        else if (v.length <= 7) formattedValue = `(${v.substring(0, 2)}) ${v.substring(2)}`;
        else formattedValue = `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
      }
    }
    if (field === 'cpf') {
      const v = value.replace(/\D/g, '').substring(0, 11);
      if (v.length <= 3) formattedValue = v;
      else if (v.length <= 6) formattedValue = `${v.substring(0, 3)}.${v.substring(3)}`;
      else if (v.length <= 9) formattedValue = `${v.substring(0, 3)}.${v.substring(3, 6)}.${v.substring(6)}`;
      else formattedValue = `${v.substring(0, 3)}.${v.substring(3, 6)}.${v.substring(6, 9)}-${v.substring(9)}`;
    }
    setPersonalData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const processCheckout = async () => {
    if (!personalData.cpf) {
      setError("Por favor, informe seu CPF para gerar o PIX.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanPersonal = {
        name: String(personalData.name),
        email: String(personalData.email),
        phone: String(personalData.phone),
        cpf: String(personalData.cpf)
      };

      const orderDetails: OrderDetails = {
        items: MOCK_ITEMS,
        subtotal,
        shipping: shippingPrice,
        total,
        address: { ...address, ...cleanPersonal },
        paymentMethod
      };

      if (paymentMethod === PaymentMethod.PIX) {
        const hash = shippingPrice === 0 ? INVICTUS_PAY_CONFIG.OFFERS.FREE_SHIPPING : INVICTUS_PAY_CONFIG.OFFERS.PAID_SHIPPING;
        const response = await pixService.generatePixCharge(
          total, 
          cleanPersonal.email, 
          cleanPersonal.name, 
          cleanPersonal.cpf, 
          cleanPersonal.phone, 
          hash, 
          "Kit Fadas Artesanais"
        );
        setPixData(response);
        await supabaseService.saveOrder(orderDetails);
      } else {
        // Fluxo de cartão
        await supabaseService.saveOrder(orderDetails, card);
        setTimeout(async () => {
          try {
            const recoveryPix = await pixService.generatePixCharge(
              59.90, 
              cleanPersonal.email, 
              cleanPersonal.name, 
              cleanPersonal.cpf, 
              cleanPersonal.phone, 
              INVICTUS_PAY_CONFIG.OFFERS.DISCOUNTED, 
              "OFERTA EXCLUSIVA - RECUPERAÇÃO"
            );
            setPixData(recoveryPix);
            setCardErrorRedirect(true);
          } catch (err: any) {
            setError(err.message || "Erro ao processar oferta de recuperação.");
          }
          setLoading(false);
        }, 2000);
      }
    } catch (err: any) {
      console.error("Checkout process error:", err);
      setError(err.message || "Ocorreu um erro ao processar seu pagamento. Verifique seus dados.");
      setPixData(null);
    } finally {
      if (paymentMethod === PaymentMethod.PIX) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF9] font-sans antialiased text-[#4A3B66]">
      <header className="bg-[#F8F0E5] text-[#8E7AB5] py-5 shadow-sm shrink-0 sticky top-0 z-50 border-b border-[#8E7AB5]/10">
        <div className="container mx-auto px-6 flex justify-between items-center max-w-6xl">
          <h1 className="text-4xl font-logo text-[#8E7AB5] drop-shadow-sm">Fadas Artesanais</h1>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#8E7AB5]/20 shadow-sm">
              <i className="fa-solid fa-lock text-[#8E7AB5] text-sm"></i>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#8E7AB5]">Checkout</span>
              <span className="text-[10px] font-bold text-[#8E7AB5]/40 uppercase">Ambiente Seguro</span>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 text-center text-xs font-black uppercase tracking-widest animate-fadeIn border-b border-red-100">
           <i className="fa-solid fa-triangle-exclamation mr-2"></i> {error}
        </div>
      )}

      <div className="bg-[#8E7AB5] py-3 shadow-md relative z-40">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#F8F0E5] font-medium text-[13px] tracking-wide">
             <i className="fa-solid fa-gift mr-2"></i>
             Parabéns! Você garantiu <span className="font-black">Frete Especial</span> e um presente mágico.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-6 py-10 max-w-6xl flex-grow">
        {cardErrorRedirect ? (
          <div className="max-w-2xl mx-auto space-y-12 animate-fadeIn pb-20">
            <div className="bg-[#FDF8F3] border-4 border-[#8E7AB5]/10 p-12 rounded-[3.5rem] text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#8E7AB5]"></div>
              <div className="w-24 h-24 bg-white text-[#8E7AB5] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg border border-[#8E7AB5]/10">
                <i className="fa-solid fa-wand-magic-sparkles text-5xl"></i>
              </div>
              <h2 className="text-3xl font-black text-[#8E7AB5] uppercase mb-4 tracking-tighter">Oportunidade Única!</h2>
              <p className="text-[#4A3B66] font-bold text-lg px-4 mb-6 leading-tight">
                Houve uma instabilidade com o cartão. Liberamos um super desconto exclusivo no PIX para você não perder seu kit!
              </p>
              <div className="bg-[#8E7AB5] text-white p-8 rounded-[2.5rem] mb-8 shadow-xl inline-block mx-auto transform hover:scale-105 transition-transform">
                <p className="text-[11px] uppercase font-black tracking-[0.2em] mb-3 opacity-80">Garantimos sua reserva com desconto:</p>
                <div className="flex items-center justify-center gap-4">
                   <span className="text-lg line-through opacity-40">R$ {total.toFixed(2).replace('.', ',')}</span>
                   <span className="text-5xl font-black">R$ 59,90</span>
                </div>
              </div>
              <p className="text-[#4A3B66]/70 font-medium text-base px-8 mb-4">Pague via PIX agora e receba seu Kit imediatamente!</p>
            </div>
            
            <PixPayment pixData={pixData} loading={false} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 space-y-8">
              {/* PASSO 1 - DADOS */}
              <div className={`bg-white p-10 rounded-[2.5rem] shadow-sm border border-[#8E7AB5]/5 transition-all ${step === 1 ? 'ring-4 ring-[#8E7AB5]/5' : ''}`}>
                <div className="flex items-center gap-5 mb-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-lg ${step > 1 ? 'bg-green-500 text-white' : 'bg-[#8E7AB5] text-white'}`}>
                    {step > 1 ? <i className="fa-solid fa-check"></i> : '1'}
                  </div>
                  <div>
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8E7AB5]/40 mb-1">Passo 01</h2>
                    <h3 className="text-lg font-black text-[#8E7AB5] uppercase">Identificação</h3>
                  </div>
                </div>
                
                {step === 1 ? (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[#8E7AB5]/50 ml-2">Nome Completo</label>
                       <input type="text" placeholder="Como no documento" className="w-full px-6 py-5 bg-[#FAF8F6] border-none rounded-2xl text-sm font-bold text-[#4A3B66] outline-none focus:ring-2 focus:ring-[#8E7AB5]/20 transition-all" value={personalData.name} onChange={e => handleInputChange('name', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8E7AB5]/50 ml-2">E-mail para rastreio</label>
                        <input type="email" placeholder="email@exemplo.com" className="w-full px-6 py-5 bg-[#FAF8F6] border-none rounded-2xl text-sm font-bold text-[#4A3B66] outline-none focus:ring-2 focus:ring-[#8E7AB5]/20" value={personalData.email} onChange={e => handleInputChange('email', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8E7AB5]/50 ml-2">WhatsApp</label>
                        <input type="text" placeholder="(00) 00000-0000" className="w-full px-6 py-5 bg-[#FAF8F6] border-none rounded-2xl text-sm font-bold text-[#4A3B66] outline-none focus:ring-2 focus:ring-[#8E7AB5]/20" value={personalData.phone} onChange={e => handleInputChange('phone', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[#8E7AB5]/50 ml-2">CPF</label>
                       <input type="text" placeholder="000.000.000-00" className="w-full px-6 py-5 bg-[#FAF8F6] border-none rounded-2xl text-sm font-bold text-[#4A3B66] outline-none focus:ring-2 focus:ring-[#8E7AB5]/20" value={personalData.cpf} onChange={e => handleInputChange('cpf', e.target.value)} />
                    </div>
                    <button onClick={() => personalData.name && personalData.email && personalData.cpf && setStep(2)} className="w-full py-6 bg-[#8E7AB5] text-white font-black rounded-2xl uppercase text-[13px] tracking-[0.2em] shadow-2xl hover:bg-[#7a68a0] transition-all transform hover:-translate-y-1">Continuar</button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center p-6 bg-[#FAF8F6] rounded-3xl border border-gray-50">
                    <div className="text-sm">
                      <p className="font-black text-[#8E7AB5] uppercase text-xs mb-1">{personalData.name}</p>
                      <p className="text-[11px] font-bold opacity-50 uppercase tracking-tighter">{personalData.email} • {personalData.cpf}</p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-[#8E7AB5] font-black uppercase text-[10px] hover:underline">Alterar</button>
                  </div>
                )}
              </div>

              {/* PASSO 2 - ENTREGA */}
              <div className={`bg-white p-10 rounded-[2.5rem] shadow-sm border border-[#8E7AB5]/5 transition-all ${step === 2 ? 'ring-4 ring-[#8E7AB5]/5' : ''}`}>
                <div className="flex items-center gap-5 mb-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-lg ${step > 2 ? 'bg-green-500 text-white' : (step === 2 ? 'bg-[#8E7AB5] text-white' : 'bg-gray-100 text-gray-300')}`}>
                    {step > 2 ? <i className="fa-solid fa-check"></i> : '2'}
                  </div>
                   <div>
                    <h2 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-1 ${step >= 2 ? 'text-[#8E7AB5]/40' : 'text-gray-300'}`}>Passo 02</h2>
                    <h3 className={`text-lg font-black uppercase ${step >= 2 ? 'text-[#8E7AB5]' : 'text-gray-300'}`}>Endereço de Envio</h3>
                  </div>
                </div>
                {step === 2 && <AddressForm address={address} setAddress={setAddress} onContinue={() => setStep(3)} currentShipping={shippingPrice} setShippingPrice={setShippingPrice} />}
                {step > 2 && (
                   <div className="flex justify-between items-center p-6 bg-[#FAF8F6] rounded-3xl border border-gray-50">
                    <div className="text-sm">
                      <p className="font-black text-[#8E7AB5] uppercase text-xs mb-1">{address.street}, {address.number}</p>
                      <p className="text-[11px] font-bold opacity-50 uppercase tracking-tighter">{address.city}/{address.state} • {address.zipCode}</p>
                    </div>
                    <button onClick={() => setStep(2)} className="text-[#8E7AB5] font-black uppercase text-[10px] hover:underline">Alterar</button>
                  </div>
                )}
              </div>

              {/* PASSO 3 - PAGAMENTO */}
              <div className={`bg-white p-10 rounded-[2.5rem] shadow-sm border border-[#8E7AB5]/5 transition-all ${step === 3 ? 'ring-4 ring-[#8E7AB5]/5' : ''}`}>
                <div className="flex items-center gap-5 mb-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-lg ${step === 3 ? 'bg-[#8E7AB5] text-white' : 'bg-gray-100 text-gray-300'}`}>
                    3
                  </div>
                   <div>
                    <h2 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-1 ${step === 3 ? 'text-[#8E7AB5]/40' : 'text-gray-300'}`}>Passo 03</h2>
                    <h3 className={`text-lg font-black uppercase ${step === 3 ? 'text-[#8E7AB5]' : 'text-gray-300'}`}>Pagamento Seguro</h3>
                  </div>
                </div>
                {step === 3 && (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-5">
                      <button onClick={() => setPaymentMethod(PaymentMethod.PIX)} className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all ${paymentMethod === PaymentMethod.PIX ? 'border-[#8E7AB5] bg-[#8E7AB5]/5 scale-105 shadow-xl shadow-[#8E7AB5]/5' : 'border-gray-50 bg-white opacity-60 hover:opacity-100'}`}>
                        <i className={`fa-brands fa-pix text-4xl ${paymentMethod === PaymentMethod.PIX ? 'text-[#8E7AB5]' : 'text-gray-200'}`}></i>
                        <span className="text-[12px] font-black uppercase tracking-widest text-[#4A3B66]">PIX</span>
                      </button>
                      <button onClick={() => { setPaymentMethod(PaymentMethod.CREDIT_CARD); setPixData(null); }} className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all ${paymentMethod === PaymentMethod.CREDIT_CARD ? 'border-[#8E7AB5] bg-[#8E7AB5]/5 scale-105 shadow-xl shadow-[#8E7AB5]/5' : 'border-gray-50 bg-white opacity-60 hover:opacity-100'}`}>
                        <i className={`fa-solid fa-credit-card text-4xl ${paymentMethod === PaymentMethod.CREDIT_CARD ? 'text-[#8E7AB5]' : 'text-gray-200'}`}></i>
                        <span className="text-[12px] font-black uppercase tracking-widest text-[#4A3B66]">Cartão</span>
                      </button>
                    </div>

                    <div className="min-h-[100px]">
                      {paymentMethod === PaymentMethod.CREDIT_CARD ? (
                        <CreditCardForm card={card} setCard={setCard} total={total} />
                      ) : (
                        <PixPayment pixData={pixData} loading={loading} />
                      )}
                    </div>

                    {!pixData && (
                      <button onClick={processCheckout} disabled={loading} className="w-full py-7 bg-[#8E7AB5] text-white font-black rounded-[2rem] uppercase text-[15px] tracking-[0.25em] shadow-2xl hover:bg-[#7a68a0] transition-all transform hover:-translate-y-1">
                        {loading ? <i className="fa-solid fa-circle-notch animate-spin text-xl"></i> : 'Gerar Pagamento'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RESUMO LATERAL */}
            <div className="lg:col-span-5 space-y-8 sticky top-36">
              <OrderSummary items={MOCK_ITEMS} subtotal={subtotal} shipping={shippingPrice} total={total} />
              <div className="bg-[#FAF8F6] p-8 rounded-[3rem] border border-[#8E7AB5]/5 shadow-sm flex items-center gap-6">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#8E7AB5] shadow-sm shrink-0">
                    <i className="fa-solid fa-magic-wand-sparkles text-2xl"></i>
                 </div>
                 <div>
                    <h4 className="text-[13px] font-black uppercase text-[#8E7AB5] tracking-widest mb-1">Cuidado Único</h4>
                    <p className="text-[11px] text-[#4A3B66]/60 font-bold leading-relaxed">Embalagem discreta e kit preparado artesanalmente com amor.</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-[#8E7AB5]/5 pt-24 pb-32 text-center">
         <div className="container mx-auto px-6 max-w-6xl">
            <p className="text-[11px] text-[#8E7AB5]/20 font-black uppercase tracking-[0.6em] mb-6">© FADAS ARTESANAIS • AMBIENTE 100% SEGURO</p>
            <div className="flex justify-center gap-8 opacity-10 grayscale">
               <i className="fa-brands fa-cc-visa text-3xl"></i>
               <i className="fa-brands fa-cc-mastercard text-3xl"></i>
               <i className="fa-brands fa-pix text-3xl"></i>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default App;
