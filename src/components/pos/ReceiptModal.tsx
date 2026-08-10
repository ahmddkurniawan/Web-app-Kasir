import React from 'react';
import { Transaction } from '../../types';
import { formatRupiah } from '../../utils/device';
import { Printer, Download, Share2, X, CheckCircle, Coffee } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const text = `
================================
         NGOPAY COFFEE          
   Kopi Nikmat, Harga Sahabat   
================================
No. Trx : ${transaction.transactionNumber}
Tanggal : ${new Date(transaction.transactionDate).toLocaleString('id-ID')}
Kasir   : ${transaction.adminName}
--------------------------------
${transaction.items
  .map(
    (i) =>
      `${i.productName}\n  ${i.quantity} x ${formatRupiah(i.price)} = ${formatRupiah(i.subtotal)}`
  )
  .join('\n')}
--------------------------------
Subtotal: ${formatRupiah(transaction.subtotal)}
Diskon  : ${formatRupiah(transaction.discount)}
TOTAL   : ${formatRupiah(transaction.total)}
Bayar (${transaction.paymentMethod}): ${formatRupiah(transaction.cashAmount || transaction.total)}
Kembali : ${formatRupiah(transaction.changeAmount || 0)}
================================
 Terima kasih telah berkunjung! 
    Follow IG @cafengopay.id    
================================
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Struk-${transaction.transactionNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Struk Ngopay POS - ${transaction.transactionNumber}`,
          text: `Struk Cafe Ngopay #${transaction.transactionNumber} Total: ${formatRupiah(transaction.total)}`
        });
      } catch {
        // Fallback or cancelled
      }
    } else {
      alert(`Struk #${transaction.transactionNumber} siap dibagikan!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in print:bg-white print:p-0">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-stone-100 space-y-4 max-h-[90vh] overflow-y-auto print:shadow-none print:border-none print:max-w-full print:w-auto print:p-0 print:bg-white print:text-black">
        
        {/* Header Actions (Hidden when printing) */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 print:hidden">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-5 h-5" />
            <span>Transaksi Berhasil!</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Body */}
        <div
          id="thermal-receipt-printable"
          className="bg-stone-950 p-5 rounded-xl border border-stone-800 font-mono text-xs text-stone-200 space-y-3 print:bg-white print:text-black print:p-0 print:border-none print:w-[58mm] print:mx-auto"
        >
          {/* Logo & Header */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center space-x-1 font-black text-base text-amber-500 print:text-black">
              <Coffee className="w-4 h-4" />
              <span>NGOPAY COFFEE</span>
            </div>
            <p className="text-[10px] text-stone-400 print:text-gray-600">Jl. Pemuda No. 88, Jakarta Selatan</p>
            <p className="text-[10px] text-stone-400 print:text-gray-600">Telp: +62 812-3456-7890</p>
          </div>

          <div className="border-t border-b border-dashed border-stone-800 print:border-black py-2 space-y-1 text-[11px] text-stone-400 print:text-black">
            <div className="flex justify-between">
              <span>No. Trx:</span>
              <span className="font-bold text-stone-200 print:text-black">{transaction.transactionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{new Date(transaction.transactionDate).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{transaction.adminName}</span>
            </div>
            <div className="flex justify-between">
              <span>Perangkat:</span>
              <span>{transaction.deviceName}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2 py-1">
            {transaction.items.map((item) => (
              <div key={item.id} className="space-y-0.5">
                <div className="font-bold text-stone-200 print:text-black text-xs">
                  {item.productName}
                </div>
                <div className="flex justify-between text-[11px] text-stone-400 print:text-black">
                  <span>
                    {item.quantity} x {formatRupiah(item.price)}
                  </span>
                  <span className="font-bold text-stone-200 print:text-black">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Calculation */}
          <div className="border-t border-dashed border-stone-800 print:border-black pt-2 space-y-1 text-[11px]">
            <div className="flex justify-between text-stone-400 print:text-black">
              <span>Subtotal:</span>
              <span>{formatRupiah(transaction.subtotal)}</span>
            </div>

            {transaction.discount > 0 && (
              <div className="flex justify-between text-amber-400 print:text-black font-semibold">
                <span>Diskon:</span>
                <span>- {formatRupiah(transaction.discount)}</span>
              </div>
            )}

            <div className="flex justify-between font-extrabold text-sm text-amber-500 print:text-black pt-1 border-t border-stone-800 print:border-black">
              <span>TOTAL:</span>
              <span>{formatRupiah(transaction.total)}</span>
            </div>

            <div className="flex justify-between text-stone-400 print:text-black pt-1">
              <span>Bayar ({transaction.paymentMethod}):</span>
              <span>{formatRupiah(transaction.cashAmount || transaction.total)}</span>
            </div>

            {transaction.paymentMethod === 'Cash' && (
              <div className="flex justify-between text-stone-400 print:text-black font-bold">
                <span>Kembali:</span>
                <span>{formatRupiah(transaction.changeAmount || 0)}</span>
              </div>
            )}
          </div>

          {/* Footer Message */}
          <div className="border-t border-dashed border-stone-800 print:border-black pt-3 text-center space-y-1 text-[10px] text-stone-400 print:text-black">
            <p className="font-semibold text-stone-300 print:text-black">Terima kasih telah berkunjung ke Cafe Ngopay!</p>
            <p>Kopi Nikmat, Harga Sahabat</p>
            <p>IG: @cafengopay.id</p>
          </div>
        </div>

        {/* Buttons (Hidden when printing) */}
        <div className="grid grid-cols-3 gap-2 pt-2 print:hidden">
          <button
            onClick={handlePrint}
            className="py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>CETAK</span>
          </button>

          <button
            onClick={handleDownloadText}
            className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>UNDUH</span>
          </button>

          <button
            onClick={handleShare}
            className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1"
          >
            <Share2 className="w-4 h-4" />
            <span>BAGI</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 text-center text-xs font-semibold text-stone-400 hover:text-stone-200 print:hidden"
        >
          Selesai & Transaksi Baru
        </button>

      </div>
    </div>
  );
};
