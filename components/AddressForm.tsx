
import React, { useEffect, useState } from 'react';
import { Address } from '../types';
import { STANDARD_SHIPPING_PRICE } from '../constants';

interface AddressFormProps {
  address: Address;
  setAddress: React.Dispatch<React.SetStateAction<Address>>;
  onContinue: () => void;
  currentShipping: number;
  setShippingPrice: (price: number) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ address, setAddress, onContinue, currentShipping, setShippingPrice }) => {
  const [loadingCep, setLoadingCep] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const [subStep, setSubStep] = useState<'address' | 'shipping'>('address');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const cep = address.zipCode.replace(/\D/g, '');
    if (cep.length === 8) {
      handleSearchCep(cep);
    }
  }, [address.zipCode]);

  const handleSearchCep = async (cep: string) => {
    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setAddress(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }));
        setShowFullForm(true);
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setLoadingCep(false);
    }
  };

  const validateAddress = () => {
    const newErrors: Record<string, string> = {};
    if (!address.street) newErrors.street = "Obrigatório";
    if (!address.number) newErrors.number = "Obrigatório";
    if (!address.neighborhood) newErrors.neighborhood = "Obrigatório";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoToShipping = () => {
    if (validateAddress()) {
      setSubStep('shipping');
    }
  };

  if (subStep === 'shipping') {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="pt-2 pb-6 border-b border-[#F8F0E5] relative">
          <button onClick={() => setSubStep('address')} className="absolute top-0 right-0 text-[#8E7AB5]/40 hover:text-[#8E7AB5] p-2">
            <i className="fa-solid fa-feather-pointed text-lg"></i>
          </button>
          <div className="space-y-1 text-sm text-gray-500">
            <p className="font-bold tracking-tight text-[#8E7AB5]">{address.street}, {address.number}</p>
            <p className="font-medium">{address.neighborhood}, {address.city}/{address.state}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`block p-5 rounded-2xl border-2 cursor-pointer transition-all ${currentShipping === 0 ? 'border-[#8E7AB5] bg-[#8E7AB5]/5' : 'border-gray-50'}`} onClick={() => setShippingPrice(0)}>
            <div className="flex justify-between">
              <span className="text-[11px] font-black uppercase text-[#8E7AB5]">Padrão (7 dias)</span>
              <span className="font-black text-xs text-[#8E7AB5]">GRÁTIS</span>
            </div>
          </div>
          <div className={`block p-5 rounded-2xl border-2 cursor-pointer transition-all ${currentShipping === STANDARD_SHIPPING_PRICE ? 'border-[#8E7AB5] bg-[#8E7AB5]/5' : 'border-gray-50'}`} onClick={() => setShippingPrice(STANDARD_SHIPPING_PRICE)}>
            <div className="flex justify-between">
              <span className="text-[11px] font-black uppercase text-[#8E7AB5]">Prioritária (2 dias)</span>
              <span className="font-black text-xs text-[#8E7AB5]">R$ {STANDARD_SHIPPING_PRICE.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>

        <button onClick={onContinue} className="w-full py-4 bg-[#8E7AB5] text-white font-black rounded-2xl uppercase text-[12px] tracking-widest mt-4">Continuar</button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="max-w-[180px]">
        <label className="block text-[10px] font-bold text-[#8E7AB5] mb-2 uppercase tracking-widest ml-1">CEP</label>
        <input type="text" name="zipCode" value={address.zipCode} onChange={handleChange} placeholder="00000-000" maxLength={9} className="w-full px-5 py-4 bg-[#F8F0E5]/30 border border-gray-100 rounded-2xl outline-none" />
      </div>

      {(showFullForm || address.street) && (
        <div className="space-y-4">
          <input type="text" name="street" value={address.street} onChange={handleChange} placeholder="Rua" className="w-full px-5 py-4 bg-[#F8F0E5]/30 border border-gray-100 rounded-2xl outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" name="number" value={address.number} onChange={handleChange} placeholder="Número" className="w-full px-5 py-4 bg-[#F8F0E5]/30 border border-gray-100 rounded-2xl outline-none" />
            <input type="text" name="neighborhood" value={address.neighborhood} onChange={handleChange} placeholder="Bairro" className="w-full px-5 py-4 bg-[#F8F0E5]/30 border border-gray-100 rounded-2xl outline-none" />
          </div>
          <button onClick={handleGoToShipping} className="w-full py-4 bg-[#8E7AB5] text-white font-black rounded-2xl uppercase text-[12px] tracking-widest mt-4">Confirmar Endereço</button>
        </div>
      )}
    </div>
  );
};

export default AddressForm;
