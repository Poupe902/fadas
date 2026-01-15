
import React, { useState, useMemo } from 'react';

interface PixPaymentProps {
  pixData: {
    qrcode: string;
    imagem_base64: string;
  } | null;
  loading: boolean;
}

const PixPayment: React.FC<PixPaymentProps> = ({ pixData, loading }: any) => {
  const [copied, setCopied] = useState(false);
  const [imgErrorCount, setImgErrorCount] = useState(0);

  // Lógica de fallback para QR Code estável - DEVE FICAR NO TOPO
  const qrCodeImage = useMemo(() => {
    if (!pixData?.qrcode) return '';

    console.log("PIX Component: Recebi dados:", {
      has_qr: !!pixData.qrcode,
      img_len: pixData.imagem_base64?.length
    });

    let url = '';
    // Se já for uma URL completa, usa ela
    if (pixData.imagem_base64 && pixData.imagem_base64.startsWith('http')) {
      url = pixData.imagem_base64;
    }
    // Se for uma string base64 longa, usa como imagem
    else if (pixData.imagem_base64 && pixData.imagem_base64.length > 50) {
      url = pixData.imagem_base64.startsWith('data:')
        ? pixData.imagem_base64
        : `data:image/png;base64,${pixData.imagem_base64}`;
    }
    // Fallback: Gera um novo QR Code usando o texto do copia e cola
    else {
      url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pixData.qrcode)}`;
    }

    console.log("PIX Component: URL da Imagem:", url.substring(0, 100));
    return url;
  }, [pixData]);

  const handleCopy = async () => {
    if (!pixData?.qrcode) return;

    try {
      // Tenta o método moderno primeiro
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(pixData.qrcode);
        setCopied(true);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (err) {
      // Fallback para navegadores sem HTTPS ou suporte à API moderna
      try {
        const textArea = document.createElement("textarea");
        textArea.value = pixData.qrcode;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) setCopied(true);
      } catch (fallbackErr) {
        console.error("Erro total ao copiar:", fallbackErr);
        alert("Não foi possível copiar automaticamente. Por favor, selecione o texto e copie manualmente.");
      }
    }

    if (copied) {
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-[#8E7AB5] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#8E7AB5] font-bold uppercase text-[10px] tracking-widest">Processando PIX Seguro...</p>
      </div>
    );
  }

  if (!pixData || !pixData.qrcode) {
    return (
      <div className="text-center p-12 text-gray-300 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
        <i className="fa-brands fa-pix text-4xl mb-4 opacity-10"></i>
        <p className="text-[10px] font-black uppercase tracking-widest">Gerando cobrança...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 animate-fadeIn max-w-md mx-auto">
      {/* Container do QR Code */}
      <div className="bg-[#FAF8F6] p-6 rounded-[2.5rem] mb-8 w-full flex items-center justify-center aspect-square shadow-inner overflow-hidden border-2 border-dashed border-gray-100">
        <img
          src={qrCodeImage}
          alt="Pix QR Code"
          className="w-full h-full object-contain rounded-xl shadow-sm"
          onError={(e) => {
            console.error("PIX QR: Erro ao carregar, tentando fallback alternativo...");
            setImgErrorCount(prev => prev + 1);
            const target = e.target as HTMLImageElement;
            if (imgErrorCount < 3) {
              target.src = `https://chart.googleapis.com/chart?cht=qr&chs=400x400&chl=${encodeURIComponent(pixData.qrcode)}`;
            }
          }}
        />
      </div>

      <div className="w-full space-y-6">
        <div className="text-center">
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8E7AB5]/50 mb-4 block">
            Código de Pagamento:
          </label>
          <div className="bg-[#FAF8F6] p-5 rounded-2xl border border-gray-50 relative group">
            <div className="text-[11px] break-all font-mono text-gray-400 leading-tight max-h-24 overflow-y-auto pr-2 custom-scrollbar">
              {pixData.qrcode}
            </div>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className={`w-full py-6 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${copied ? 'bg-green-500 text-white shadow-green-200' : 'bg-[#4A3B66] text-white hover:bg-[#3d3155] shadow-[#4A3B66]/20'
            }`}
        >
          {copied ? (
            <><i className="fa-solid fa-check text-lg"></i> Código Copiado</>
          ) : (
            <><i className="fa-solid fa-copy text-lg"></i> Copiar Código PIX</>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[#8E7AB5]/40 pt-4">
          <i className="fa-solid fa-clock-rotate-left text-sm"></i>
          <p className="text-[11px] font-black uppercase tracking-widest">Aprovação Imediata Garantida</p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #8E7AB520;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default PixPayment;
