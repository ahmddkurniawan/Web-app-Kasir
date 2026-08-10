import React, { useState, useEffect } from 'react';
import { ownerService } from '../../services/api';
import { OwnerAnalytics } from '../../types';
import { formatRupiah } from '../../utils/device';
import { Users, Award, ShoppingBag, DollarSign } from 'lucide-react';

export const AdminPerformance: React.FC = () => {
  const [analytics, setAnalytics] = useState<OwnerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await ownerService.getAnalytics();
    setAnalytics(data);
    setLoading(false);
  };

  const cashiers = analytics?.cashierPerformance || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-stone-950 text-stone-100 min-h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            Laporan Performa Kasir / Admin
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Monitoring produktivitas dan kontribusi penjualan tiap staf kasir
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-stone-500">Memuat data performa kasir...</div>
      ) : cashiers.length === 0 ? (
        <div className="py-12 text-center text-xs text-stone-500 bg-stone-900 rounded-2xl border border-stone-800 p-6">
          Belum ada data transaksi kasir terrekam.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cashiers.map((c, idx) => (
            <div key={c.adminId} className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-600/20 text-amber-500 flex items-center justify-center font-bold text-sm">
                    {c.adminName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-100">{c.adminName}</h3>
                    <span className="text-[10px] text-amber-400 font-semibold uppercase">Kasir</span>
                  </div>
                </div>

                {idx === 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-bold flex items-center space-x-1">
                    <Award className="w-3 h-3" />
                    <span>Top Cashier</span>
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-xl bg-stone-950">
                  <span className="text-stone-400 flex items-center space-x-1">
                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                    <span>Total Omzet Kasir:</span>
                  </span>
                  <span className="font-black text-amber-500">{formatRupiah(c.revenue)}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-xl bg-stone-950">
                  <span className="text-stone-400 flex items-center space-x-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Jumlah Transaksi:</span>
                  </span>
                  <span className="font-bold text-stone-200">{c.transactionCount} Nota</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-xl bg-stone-950">
                  <span className="text-stone-400">Rata-rata Nota (AOV):</span>
                  <span className="font-bold text-stone-200">{formatRupiah(c.averageTransaction)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
