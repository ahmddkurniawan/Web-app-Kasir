import React, { useState, useEffect } from 'react';
import { ownerService } from '../../services/api';
import { OwnerAnalytics } from '../../types';
import { formatRupiah } from '../../utils/device';
import { PieChart, Trophy, Flame, AlertCircle } from 'lucide-react';

export const ProductAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<OwnerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    const data = await ownerService.getAnalytics();
    setAnalytics(data);
    setLoading(false);
  };

  const products = analytics?.topProducts || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-stone-950 text-stone-100 min-h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-100 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-amber-500" />
            Performa & Analisis Produk Cafe
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Evaluasi ranking produk terlaris, kontribusi omzet, dan produk slow moving
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-stone-500">Memuat analisis produk...</div>
      ) : (
        <div className="space-y-6">
          {/* Top Rankings Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Best Seller */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/60 to-stone-900 border border-amber-600/50 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Trophy className="w-4 h-4" />
                <span>Best Seller #1</span>
              </div>
              <div className="text-lg font-black text-stone-100">
                {products[0]?.productName || 'Belum Ada Data'}
              </div>
              <div className="text-xs text-amber-300 font-bold">
                {products[0]?.qtySold || 0} item terjual ({formatRupiah(products[0]?.revenue || 0)})
              </div>
            </div>

            {/* High Revenue */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-stone-900 border border-emerald-600/50 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Flame className="w-4 h-4" />
                <span>Kontribusi Omzet Tertinggi</span>
              </div>
              <div className="text-lg font-black text-stone-100">
                {products[0]?.productName || 'Belum Ada Data'}
              </div>
              <div className="text-xs text-emerald-300 font-bold">
                {products[0]?.percentageContribution || 0}% dari total omzet cafe
              </div>
            </div>

            {/* Slow Moving Warning */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-900 border border-stone-800 space-y-2">
              <div className="flex items-center space-x-2 text-stone-400 font-bold text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-stone-500" />
                <span>Slow Moving Item</span>
              </div>
              <div className="text-lg font-black text-stone-300">
                {products[products.length - 1]?.productName || 'Belum Ada Data'}
              </div>
              <div className="text-xs text-stone-500">
                {products[products.length - 1]?.qtySold || 0} item terjual
              </div>
            </div>

          </div>

          {/* Detailed Performance Table */}
          <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
            <h3 className="font-bold text-base text-stone-100">Peringkat Lengkap Performa Produk</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-400 font-bold uppercase tracking-wider text-[10px] border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Peringkat</th>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-right">Qty Terjual</th>
                    <th className="py-3 px-4 text-right">Pendapatan</th>
                    <th className="py-3 px-4 text-center">Status Performa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {products.map((p, idx) => {
                    let badgeClass = 'bg-stone-800 text-stone-300';
                    let badgeText = 'Normal';
                    if (idx === 0) {
                      badgeClass = 'bg-amber-950 text-amber-300 border border-amber-700';
                      badgeText = '🔥 Best Seller';
                    } else if (idx < 3) {
                      badgeClass = 'bg-emerald-950 text-emerald-300 border border-emerald-700';
                      badgeText = '⭐ High Volume';
                    } else if (idx >= products.length - 2) {
                      badgeClass = 'bg-stone-950 text-stone-500 border border-stone-800';
                      badgeText = '💤 Slow Moving';
                    }

                    return (
                      <tr key={p.productId} className="hover:bg-stone-800/40">
                        <td className="py-3 px-4 font-bold text-amber-500">#{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-stone-100 font-sans">{p.productName}</td>
                        <td className="py-3 px-4 text-stone-400">{p.category}</td>
                        <td className="py-3 px-4 text-right font-bold text-stone-100">{p.qtySold} item</td>
                        <td className="py-3 px-4 text-right font-bold text-amber-400">{formatRupiah(p.revenue)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
