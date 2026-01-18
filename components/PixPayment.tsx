
import React, { useState } from 'react';

interface PixPaymentProps {
  pixData: {
    qrcode: string;
    imagem_base64: string;
    payment_url?: string;
  } | null;
  loading: boolean;
}

const PixPayment: React.FC<PixPaymentProps> = ({ pixData, loading }) => {
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-pulse">
        <div className="w-16 h-16 border-4 border-[#8E7AB5] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#8E7AB5] font-black uppercase text-[10px] tracking-[0.2em]">Criptografando Transação...</p>
      </div>
    );
  }

  if (!pixData) return null;

  const finalCode = pixData.qrcode;

  const handleCopy = () => {
    if (finalCode && finalCode !== 'LINK_PAGAMENTO') {
      navigator.clipboard.writeText(finalCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else if (pixData.payment_url) {
      window.open(pixData.payment_url, '_blank');
    }
  };

  // Define a imagem do QR Code
  let qrCodeSrc = "";
  if (pixData.imagem_base64 && pixData.imagem_base64.length > 50) {
    qrCodeSrc = pixData.imagem_base64.includes('data:image') 
      ? pixData.imagem_base64 
      : `data:image/png;base64,${pixData.imagem_base64}`;
  } else if (finalCode && finalCode !== 'LINK_PAGAMENTO') {
    qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(finalCode)}`;
  }

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-[3rem] shadow-2xl border border-[#8E7AB5]/5 animate-fadeIn max-w-md mx-auto">
      {qrCodeSrc ? (
        <div className="bg-[#FAF8F6] p-8 rounded-[2.5rem] mb-8 w-full flex items-center justify-center aspect-square shadow-inner border border-gray-50">
          <img 
            src={qrCodeSrc} 
            alt="Pix QR Code" 
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </div>
      ) : (
        <div className="bg-red-50 p-10 rounded-[2.5rem] mb-8 w-full text-center">
          <i className="fa-solid fa-link text-red-300 text-4xl mb-4"></i>
          <p className="text-[11px] font-bold text-red-500 uppercase">Use o link de pagamento abaixo</p>
        </div>
      )}

      <div className="w-full space-y-6">
        <div className="text-center">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8E7AB5]/40 mb-4 block">
            {finalCode === 'LINK_PAGAMENTO' ? 'Link de Pagamento:' : 'Copia e Cola:'}
          </label>
          <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-50 overflow-hidden">
            <div className="text-[10px] break-all font-mono text-gray-300 leading-tight max-h-20 overflow-y-auto custom-scrollbar select-all">
              {finalCode === 'LINK_PAGAMENTO' ? pixData.payment_url : finalCode}
            </div>
          </div>
        </div>

        <button 
          onClick={handleCopy}
          className={`w-full py-6 rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${
            copied ? 'bg-green-500 text-white' : 'bg-[#4A3B66] text-white hover:bg-[#3d3155]'
          }`}
        >
          {copied ? (
            <><i className="fa-solid fa-check"></i> Copiado!</>
          ) : (
            finalCode === 'LINK_PAGAMENTO' ? 
            <><i className="fa-solid fa-external-link"></i> Abrir Pagamento</> :
            <><i className="fa-solid fa-copy"></i> Copiar Código PIX</>
          )}
        </button>
        
        <div className="flex items-center justify-center gap-3 py-2">
           <div className="h-[1px] flex-1 bg-gray-100"></div>
           <p className="text-[9px] font-black text-gray-200 uppercase tracking-widest"> Pay Secure</p>
           <div className="h-[1px] flex-1 bg-gray-100"></div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #8E7AB520; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default PixPayment;
