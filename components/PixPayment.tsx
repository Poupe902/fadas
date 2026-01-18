
import React, { useState } from 'react';

interface PixPaymentProps {
  pixData: {
    qrcode: string;
    imagem_base64: string;
  } | null;
  loading: boolean;
}

const PixPayment: React.FC<PixPaymentProps> = ({ pixData, loading }) => {
  const [copied, setCopied] = useState(false);

  // Garantimos que trabalhamos com a string original recebida
  const finalCode = pixData?.qrcode || '';

  const handleCopy = () => {
    if (finalCode) {
      // Copia a string bruta, exatamente como mostrada no print
      navigator.clipboard.writeText(finalCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-[#8E7AB5] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#8E7AB5] font-bold uppercase text-[10px] tracking-widest">Iniciando Transação Segura...</p>
      </div>
    );
  }

  if (!pixData || !finalCode) return null;

  // Gerador de QR Code sincronizado com o código que o banco aceita
  let qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(finalCode)}`;
  
  if (pixData.imagem_base64) {
    if (pixData.imagem_base64.startsWith('http')) {
      qrCodeSrc = pixData.imagem_base64;
    } else if (pixData.imagem_base64.length > 50) {
      qrCodeSrc = pixData.imagem_base64.includes('data:image') 
        ? pixData.imagem_base64 
        : `data:image/png;base64,${pixData.imagem_base64}`;
    }
  }

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 animate-fadeIn max-w-md mx-auto">
      <div className="bg-[#FAF8F6] p-10 rounded-[2.5rem] mb-8 w-full flex items-center justify-center aspect-square shadow-inner overflow-hidden">
        <img 
          src={qrCodeSrc} 
          alt="Pix QR Code" 
          className="w-full h-full object-contain mix-blend-multiply"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(finalCode)}`;
          }}
        />
      </div>

      <div className="w-full space-y-6">
        <div className="text-center">
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8E7AB5]/50 mb-4 block">
            Código Copia e Cola:
          </label>
          <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-50 relative group">
            <div className="text-[11px] break-all font-mono text-gray-400 leading-tight max-h-24 overflow-y-auto pr-2 custom-scrollbar text-center select-all">
              {finalCode}
            </div>
          </div>
        </div>

        <button 
          onClick={handleCopy}
          className={`w-full py-6 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${
            copied ? 'bg-green-500 text-white' : 'bg-[#4A3B66] text-white hover:bg-[#3d3155]'
          }`}
        >
          {copied ? (
            <><i className="fa-solid fa-check text-lg"></i> Código Copiado!</>
          ) : (
            <><i className="fa-solid fa-copy text-lg"></i> Copiar Código PIX</>
          )}
        </button>
        
        <div className="flex items-center justify-center gap-2 text-[#8E7AB5]/40 pt-4">
           <i className="fa-solid fa-shield-check text-sm text-green-500/40"></i>
           <p className="text-[11px] font-black uppercase tracking-widest">Código Original Invictus Pay</p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #8E7AB520; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default PixPayment;
