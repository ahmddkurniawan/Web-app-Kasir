import React, { useState, useEffect } from 'react';
import { transactionService } from '../../services/api';
import { Transaction } from '../../types';
import { formatRupiah } from '../../utils/device';
import { ReceiptModal } from '../pos/ReceiptModal';
import { Search, Printer, Receipt, CheckCircle, Clock } from 'lucide-react';

export const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    const list = await transactionService.getLocalTransactions();
    setTransactions(list);
    setLoading(false);
  };

  const filteredTransactions = transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.transactionNumber.toLowerCase().includes(q) ||
      t.adminName.toLowerCase().includes(q) ||
      t.paymentMethod.toLowerCase().includes(q) ||
      t.items.some((i) => i.productName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-stone-950 text-stone-100 min-h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-stone-900 border border-stone-800">
        <div>
          <h1 className="text-2xl font-black text-stone-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-amber-500" />
            Histori & Cetak Ulang Struk Kasir
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Cari transaksi, periksa status sinkronisasi server, dan cetak ulang nota pelanggan
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. Trx / Kasir / Produk..."
            className="w-full pl-9 pr-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-stone-500">Memuat histori transaksi...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">
            Tidak ada transaksi ditemukan.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-400 font-bold uppercase tracking-wider text-[10px] border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-3">No. Transaksi</th>
                    <th className="py-3 px-3">Waktu</th>
                    <th className="py-3 px-3">Kasir</th>
                    <th className="py-3 px-3">Rincian Item</th>
                    <th className="py-3 px-3">Metode</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-3 text-center">Sync Status</th>
                    <th className="py-3 px-3 text-center">Cetak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {filteredTransactions.map((t) => (
                    <tr key={t.localId} className="hover:bg-stone-800/40">
                      <td className="py-3 px-3 font-bold text-amber-500">{t.transactionNumber}</td>
                      <td className="py-3 px-3 text-stone-400">
                        {new Date(t.transactionDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-sans font-bold text-stone-200">{t.adminName}</td>
                      <td className="py-3 px-3 max-w-[200px] truncate text-stone-300">
                        {t.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-semibold">
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-400">
                        {formatRupiah(t.total)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {t.syncStatus === 'SYNCED' ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold text-[10px]">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>SYNCED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-amber-400 font-bold text-[10px]">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>PENDING</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedTransaction(t)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] inline-flex items-center space-x-1 shadow-md transition-colors"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Struk</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid md:hidden grid-cols-1 gap-4">
              {filteredTransactions.map((t) => (
                <div key={t.localId} className="bg-stone-950 p-4 rounded-xl border border-stone-800 flex flex-col space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-amber-500 text-sm">{t.transactionNumber}</div>
                      <div className="text-[10px] text-stone-400">
                        {new Date(t.transactionDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {t.adminName}
                      </div>
                    </div>
                    {t.syncStatus === 'SYNCED' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>SYNCED</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold flex items-center space-x-1">
                        <Clock className="w-3 h-3 animate-spin" />
                        <span>PENDING</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-stone-300 line-clamp-2">
                    {t.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-stone-800/60">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 rounded bg-stone-800 text-stone-300 font-semibold text-[10px]">
                        {t.paymentMethod}
                      </span>
                      <span className="font-bold text-stone-100 text-sm">
                        {formatRupiah(t.total)}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedTransaction(t)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] inline-flex items-center space-x-1.5 shadow-md transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedTransaction && (
        <ReceiptModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

    </div>
  );
};
