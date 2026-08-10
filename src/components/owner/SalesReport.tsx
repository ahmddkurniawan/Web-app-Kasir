import React, { useState, useEffect } from 'react';
import { transactionService } from '../../services/api';
import { Transaction } from '../../types';
import { formatRupiah } from '../../utils/device';
import { Download, Printer, Calendar, TrendingUp } from 'lucide-react';

export const SalesReport: React.FC = () => {
  const [filterType, setFilterType] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [filterType, customStart, customEnd]);

  const loadTransactions = async () => {
    setLoading(true);
    const all = await transactionService.getLocalTransactions();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    
    let filtered = [...all];

    if (filterType === 'today') {
      filtered = all.filter(t => t.transactionDate.startsWith(todayStr));
    } else if (filterType === 'yesterday') {
      const y = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      filtered = all.filter(t => t.transactionDate.startsWith(y));
    } else if (filterType === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = all.filter(t => new Date(t.transactionDate) >= weekAgo);
    } else if (filterType === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = all.filter(t => new Date(t.transactionDate) >= monthAgo);
    } else if (filterType === 'custom' && customStart && customEnd) {
      filtered = all.filter(t => {
        const d = t.transactionDate.slice(0, 10);
        return d >= customStart && d <= customEnd;
      });
    }

    setTransactions(filtered);
    setLoading(false);
  };

  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalItemsSold = transactions.reduce((sum, t) => {
    return sum + t.items.reduce((itemSum, i) => itemSum + i.quantity, 0);
  }, 0);
  const aov = transactions.length > 0 ? Math.round(totalRevenue / transactions.length) : 0;

  const exportCSV = () => {
    const headers = ['No. Transaksi', 'Tanggal', 'Kasir', 'Metode Pembayaran', 'Items', 'Total'];
    const rows = transactions.map(t => [
      t.transactionNumber,
      new Date(t.transactionDate).toLocaleString('id-ID'),
      t.adminName,
      t.paymentMethod,
      `"${t.items.map(i => `${i.productName} (x${i.quantity})`).join('; ')}"`,
      t.total
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan-Penjualan-Ngopay-${filterType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-stone-950 text-stone-100 min-h-[calc(100vh-4rem)]">
      
      {/* Header & Date Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-stone-900 border border-stone-800">
        <div>
          <h1 className="text-2xl font-black text-stone-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-500" />
            Laporan Penjualan & Omzet
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Filter laporan keuangan berdasarkan rentang waktu operasional cafe
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={printReport}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Quick Date Filters */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {[
          { id: 'today', label: 'Hari Ini' },
          { id: 'yesterday', label: 'Kemarin' },
          { id: 'week', label: '7 Hari Terakhir' },
          { id: 'month', label: '30 Hari Terakhir' },
          { id: 'custom', label: 'Kustom Tanggal' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilterType(btn.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              filterType === btn.id
                ? 'bg-amber-600 text-white'
                : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {filterType === 'custom' && (
        <div className="p-4 bg-stone-900 rounded-xl border border-stone-800 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Dari:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-200 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span>Sampai:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs font-semibold text-stone-400">Total Revenue / Omzet</div>
          <div className="text-2xl font-black text-amber-500 mt-1">{formatRupiah(totalRevenue)}</div>
        </div>
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs font-semibold text-stone-400">Jumlah Transaksi</div>
          <div className="text-2xl font-black text-stone-100 mt-1">{transactions.length} Nota</div>
        </div>
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs font-semibold text-stone-400">Produk Terjual</div>
          <div className="text-2xl font-black text-stone-100 mt-1">{totalItemsSold} Item</div>
        </div>
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs font-semibold text-stone-400">Average Order Value</div>
          <div className="text-2xl font-black text-stone-100 mt-1">{formatRupiah(aov)}</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <h3 className="font-bold text-base text-stone-100">Rincian Transaksi Penjualan</h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-stone-500">Memuat data...</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">
            Tidak ada transaksi ditemukan pada rentang tanggal ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 font-bold uppercase tracking-wider text-[10px] border-b border-stone-800">
                <tr>
                  <th className="py-3 px-3">No. Trx</th>
                  <th className="py-3 px-3">Tanggal & Waktu</th>
                  <th className="py-3 px-3">Kasir</th>
                  <th className="py-3 px-3">Produk</th>
                  <th className="py-3 px-3">Metode</th>
                  <th className="py-3 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {transactions.map((t) => (
                  <tr key={t.localId} className="hover:bg-stone-800/40">
                    <td className="py-2.5 px-3 font-bold text-amber-500">{t.transactionNumber}</td>
                    <td className="py-2.5 px-3 text-stone-400">
                      {new Date(t.transactionDate).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-bold text-stone-200">{t.adminName}</td>
                    <td className="py-2.5 px-3 max-w-[220px] truncate">
                      {t.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-semibold">
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                      {formatRupiah(t.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
