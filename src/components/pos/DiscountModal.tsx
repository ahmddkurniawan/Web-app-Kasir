import React, { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';
import { formatRupiah } from '../../utils/device';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  currentDiscount: number;
  onApplyDiscount: (amount: number) => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  currentDiscount,
  onApplyDiscount,
}) => {
  const [type, setType] = useState<'NOMINAL' | 'PERCENT'>(currentDiscount > 0 ? 'NOMINAL' : 'PERCENT');
  const [value, setValue] = useState<string>(currentDiscount > 0 ? String(currentDiscount) : '0');

  if (!isOpen) return null;

  const handleSave = () => {
    const num = parseFloat(value) || 0;
    let finalDiscount = 0;

    if (type === 'PERCENT') {
      finalDiscount = Math.round((subtotal * Math.min(100, num)) / 100);
    } else {
      finalDiscount = Math.min(subtotal, num);
    }

    onApplyDiscount(finalDiscount);
    onClose();
  };

  const setQuickPercent = (pct: number) => {
    setType('PERCENT');
    setValue(String(pct));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-stone-100 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base">Atur Diskon Transaksi</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Discount Type Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            type="button"
            onClick={() => setType('PERCENT')}
            className={`py-2 rounded-lg font-bold text-xs transition-colors ${
              type === 'PERCENT' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Persentase (%)
          </button>
          <button
            type="button"
            onClick={() => setType('NOMINAL')}
            className={`py-2 rounded-lg font-bold text-xs transition-colors ${
              type === 'NOMINAL' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Nominal (Rp)
          </button>
        </div>

        {/* Quick Percent Presets */}
        {type === 'PERCENT' && (
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setQuickPercent(pct)}
                className={`py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                  value === String(pct)
                    ? 'bg-amber-950 border-amber-600 text-amber-300'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        )}

        {/* Input Field */}
        <div>
          <label className="block text-xs font-medium text-stone-400 mb-1">
            {type === 'PERCENT' ? 'Persentase Diskon (%)' : 'Jumlah Diskon (Rp)'}
          </label>
          <input
            type="number"
            min="0"
            max={type === 'PERCENT' ? 100 : subtotal}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full py-2.5 px-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 font-extrabold text-base focus:outline-none focus:border-amber-500"
            placeholder="0"
            autoFocus
          />
        </div>

        {/* Summary preview */}
        <div className="p-3 bg-stone-950 rounded-xl text-xs space-y-1 text-stone-400">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-amber-400">
            <span>Potongan:</span>
            <span>
              - {formatRupiah(
                type === 'PERCENT'
                  ? Math.round((subtotal * Math.min(100, parseFloat(value) || 0)) / 100)
                  : Math.min(subtotal, parseFloat(value) || 0)
              )}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onApplyDiscount(0);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl border border-stone-800 text-xs font-bold text-stone-400 hover:bg-stone-800"
          >
            Hapus Diskon
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan</span>
          </button>
        </div>

      </div>
    </div>
  );
};
