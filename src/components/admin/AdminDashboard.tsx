import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { transactionService, mapTransaction } from '../../services/api';
import { Transaction } from '../../types';
import { formatRupiah } from '../../utils/device';
import { ShoppingBag, DollarSign, Package, ShoppingCart, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { db } from '../../db/indexedDB';

interface AdminDashboardProps {
  onStartPOS?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onStartPOS }) => {
  const { user } = useAuth();
  const { syncState, pendingCount, triggerManualSync } = useSync();
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();

    const handleRealtimeUpdate = () => {
      loadTransactions();
    };
    window.addEventListener('realtime-update', handleRealtimeUpdate);
    
    return () => {
      window.removeEventListener('realtime-update', handleRealtimeUpdate);
    };
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    // Fetch all synced transactions from Supabase (from all devices) when online
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('transaction_date', { ascending: false });
        if (!error && data) {
          const serverTrxs = data.map(mapTransaction);
          for (const trx of serverTrxs) {
            const existing = await db.transactions.get(trx.localId);
            if (!existing || existing.syncStatus !== 'pending') {
              await db.transactions.put(trx);
            }
          }
        }
      } catch (err) {
        console.warn('Falling back to local transactions:', err);
      }
    }
    const list = await transactionService.getLocalTransactions();
    const todayStr = new Date().toISOString().slice(0, 10);
    const filteredToday = list.filter(t => t.transactionDate.startsWith(todayStr));
    setTodayTransactions(filteredToday);
    setLoading(false);
  };

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  const todayItemsSold = todayTransactions.reduce((sum, t) => {
    return sum + t.items.reduce((itemSum, i) => itemSum + i.quantity, 0);
  }, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-stone-950 min-h-[calc(100vh-4rem)] text-stone-100">
      
      {/* Welcome & Status Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">
            DASHBOARD KASIR NGOPAY
          </div>
          <h1 className="text-2xl font-black text-stone-100">
            Selamat Bertugas, {user?.name}! ☕
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Pantau transaksi kasir hari ini dan kelola penjualan cafe secara offline & online.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-stone-950/80 px-4 py-2.5 rounded-xl border border-stone-800 flex items-center space-x-2">
            {syncState === 'ONLINE' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">ONLINE</span>
              </>
            )}
            {syncState === 'OFFLINE' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <WifiOff className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-rose-400">OFFLINE</span>
              </>
            )}
            {syncState === 'SYNCING' && (
              <>
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-xs font-bold text-amber-300">SYNCING</span>
              </>
            )}
          </div>

          <button
            onClick={() => {
              if (onStartPOS) {
                onStartPOS();
              } else {
                window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'pos' }));
              }
            }}
            className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl shadow-lg shadow-amber-950/50 flex items-center space-x-2 transition-all active:scale-95 text-xs tracking-wider"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>MULAI TRANSAKSI</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">Omzet Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-500">
            {formatRupiah(todayRevenue)}
          </div>
          <div className="text-[11px] text-stone-500">Total pendapatan terhitung</div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">Total Transaksi</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-100">
            {todayTransactions.length}
          </div>
          <div className="text-[11px] text-stone-500">Transaksi selesai hari ini</div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">Produk Terjual</span>
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-100">
            {todayItemsSold} item
          </div>
          <div className="text-[11px] text-stone-500">Jumlah cup/porsi terjual</div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">Pending Sync</span>
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400">
            {pendingCount} TRX
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-500">Tersimpan lokal di HP/PC</span>
            {pendingCount > 0 && (
              <button
                onClick={triggerManualSync}
                className="text-[10px] font-bold text-amber-400 hover:underline"
              >
                Sync Sekarang
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Today's Transactions Overview */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-stone-100">Transaksi Kasir Hari Ini</h3>
            <p className="text-xs text-stone-400">Daftar transaksi yang Anda proses hari ini</p>
          </div>
          <button
            onClick={loadTransactions}
            className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 hover:text-white text-xs font-semibold flex items-center space-x-1"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-stone-500">Memuat transaksi...</div>
        ) : todayTransactions.length === 0 ? (
          <div className="py-12 text-center text-stone-500 space-y-2">
            <ShoppingBag className="w-10 h-10 stroke-[1.2] mx-auto text-stone-600" />
            <p className="text-xs font-bold text-stone-400">Belum Ada Transaksi Hari Ini</p>
            <p className="text-xs text-stone-500">Klik "Mulai Transaksi" untuk melayani pelanggan pertama.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-400 font-bold uppercase tracking-wider text-[10px] border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">No. Trx</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Metode</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-center">Sync Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {todayTransactions.map((trx) => (
                    <tr key={trx.localId} className="hover:bg-stone-800/40">
                      <td className="py-3 px-4 font-bold text-amber-500">{trx.transactionNumber}</td>
                      <td className="py-3 px-4 text-stone-400">
                        {new Date(trx.transactionDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate">
                        {trx.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-semibold">
                          {trx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-stone-100">
                        {formatRupiah(trx.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {trx.syncStatus === 'synced' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                            Synced
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid md:hidden grid-cols-1 gap-3">
              {todayTransactions.map((trx) => (
                <div key={trx.localId} className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-amber-500 text-sm">{trx.transactionNumber}</div>
                      <div className="text-[10px] text-stone-400">
                        {new Date(trx.transactionDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {trx.syncStatus === 'synced' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                        Synced
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
                        Pending
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-stone-300 line-clamp-2">
                    {trx.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-stone-800/60">
                    <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-semibold text-[10px]">
                      {trx.paymentMethod}
                    </span>
                    <span className="font-bold text-stone-100 text-sm">
                      {formatRupiah(trx.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
};
