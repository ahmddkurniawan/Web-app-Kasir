import React, { useState } from 'react';
import { PaymentMethod, CartItem } from '../../types';
import { formatRupiah } from '../../utils/device';
import { soundFx } from '../../utils/sound';
import { 
  Banknote, 
  QrCode, 
  CreditCard, 
  Wallet, 
  Building2, 
  X, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  discount: number;
  total: number;
  cart: CartItem[];
  onConfirmPayment: (
    method: PaymentMethod,
    cashAmount?: number,
    changeAmount?: number
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  discount,
  total,
  onConfirmPayment,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [cashInput, setCashInput] = useState<string>(String(total));

  if (!isOpen) return null;

  const cashNum = parseFloat(cashInput) || 0;
  const changeNum = Math.max(0, cashNum - total);
  const isCashInsufficient = method === 'Cash' && cashNum < total;

  const quickNominals = [
    { label: 'Uang Pas', value: total },
    { label: 'Rp 20.000', value: 20000 },
    { label: 'Rp 50.000', value: 50000 },
    { label: 'Rp 100.000', value: 100000 },
  ].filter(n => n.value >= total || n.label === 'Uang Pas');

  const handlePay = () => {
    if (method === 'Cash' && isCashInsufficient) return;

    soundFx.playSuccess();
    onConfirmPayment(
      method,
      method === 'Cash' ? cashNum : total,
      method === 'Cash' ? changeNum : 0
    );
  };

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { id: 'Cash', label: 'Tunai (Cash)', icon: Banknote },
    { id: 'QRIS', label: 'QRIS Statis/Dinamis', icon: QrCode },
    { id: 'E-Wallet', label: 'E-Wallet (Gopay/OVO/Shopee)', icon: Wallet },
    { id: 'Transfer', label: 'Bank Transfer / VA', icon: Building2 },
    { id: 'Debit', label: 'Kartu Debit', icon: CreditCard },
    { id: 'Credit Card', label: 'Kartu Kredit', icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl text-stone-100 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div>
            <h3 className="font-bold text-lg text-stone-100">Pembayaran Kasir</h3>
            <p className="text-xs text-stone-400">Pilih metode pembayaran dan masukkan jumlah uang</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Summary Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/80 to-stone-900 border border-amber-800/60 flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-400 font-semibold uppercase tracking-wide">Total Tagihan</div>
            <div className="text-2xl font-black text-amber-500">{formatRupiah(total)}</div>
          </div>
          {discount > 0 && (
            <div className="text-right text-xs">
              <span className="text-stone-400 line-through block">{formatRupiah(subtotal)}</span>
              <span className="text-amber-400 font-bold">Diskon {formatRupiah(discount)}</span>
            </div>
          )}
        </div>

        {/* Payment Methods Grid */}
        <div>
          <label className="block text-xs font-bold text-stone-300 mb-2">Metode Pembayaran</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {paymentMethods.map((m) => {
              const Icon = m.icon;
              const isSelected = method === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMethod(m.id);
                    if (m.id === 'Cash') setCashInput(String(total));
                  }}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/50'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                  <span className="text-xs font-bold">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Specific Input per Payment Method */}
        {method === 'Cash' && (
          <div className="space-y-3 p-4 bg-stone-950 rounded-xl border border-stone-800">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Uang Diterima (Cash)
              </label>
              <input
                type="number"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                className="w-full py-3 px-4 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 font-black text-xl focus:outline-none focus:border-amber-500"
                placeholder="0"
                autoFocus
              />
            </div>

            {/* Quick Nominal Buttons */}
            <div className="flex flex-wrap gap-2">
              {quickNominals.map((nom, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCashInput(String(nom.value))}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-amber-500 text-xs font-bold text-stone-300 transition-colors"
                >
                  {nom.label}
                </button>
              ))}
            </div>

            {/* Kembalian / Change calculation */}
            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-400">Kembalian:</span>
              <span className={`text-lg font-black ${isCashInsufficient ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isCashInsufficient ? 'Uang Kurang!' : formatRupiah(changeNum)}
              </span>
            </div>
          </div>
        )}

        {method === 'QRIS' && (
          <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 bg-white rounded-2xl shadow-inner">
              <QrCode className="w-32 h-32 text-stone-900 stroke-[1.5]" />
            </div>
            <div className="text-xs text-stone-400">
              Minta pelanggan scan kode <span className="text-amber-400 font-bold">QRIS Cafe Ngopay</span> di atas.
            </div>
          </div>
        )}

        {(method === 'E-Wallet' || method === 'Transfer' || method === 'Debit' || method === 'Credit Card') && (
          <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-sm text-stone-200">Verifikasi EDC / Merchant App</h4>
            <p className="text-xs text-stone-400">
              Pastikan status transaksi sebesar <span className="text-amber-400 font-bold">{formatRupiah(total)}</span> pada mesin EDC / E-Wallet merchant telah <span className="text-emerald-400 font-bold">BERHASIL</span>.
            </p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handlePay}
          disabled={method === 'Cash' && isCashInsufficient}
          className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl shadow-lg shadow-amber-950/50 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>KONFIRMASI LUNAS & CETAK STRUK</span>
        </button>

      </div>
    </div>
  );
};
