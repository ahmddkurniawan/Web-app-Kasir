import React, { useState, useEffect } from 'react';
import { ownerService } from '../../services/api';
import { OwnerAnalytics, DeviceInfo } from '../../types';
import { formatRupiah } from '../../utils/device';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart as RePieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Sparkles, 
  Smartphone, 
  RefreshCw 
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<OwnerAnalytics | null>(null);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Live poll analytics
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const data = await ownerService.getAnalytics();
    const devs = await ownerService.getDevices();
    setAnalytics(data);
    setDevices(devs);
    setLoading(false);
  };

  const CATEGORY_COLORS: Record<string, string> = {
    Coffee: '#d97706',
    'Non Coffee': '#10b981',
    Tea: '#06b6d4',
    Food: '#f59e0b',
    Snack: '#8b5cf6',
    Dessert: '#ec4899',
    Other: '#6b7280',
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-500 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-sm font-semibold">Memuat Data Owner Dashboard...</p>
        </div>
      </div>
    );
  }

  const todayRevenue = analytics?.todayRevenue || 0;
  const todayTransactions = analytics?.todayTransactions || 0;
  const todayItemsSold = analytics?.todayItemsSold || 0;
  const averageOrderValue = analytics?.averageOrderValue || 0;
  const revenueChangePercent = analytics?.revenueChangePercent || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-stone-950 text-stone-100 min-h-[calc(100vh-4rem)]">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-stone-900 via-amber-950/30 to-stone-900 border border-stone-800 shadow-xl">
        <div>
          <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">
            OWNER BUSINESS INTELLIGENCE
          </div>
          <h1 className="text-2xl font-black text-stone-100">
            Monitoring Penjualan Real-time Cafe Ngopay
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Analisis omzet, tren transaksi jam sibuk, produk terlaris, dan perangkat aktif
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-200 text-xs font-bold flex items-center space-x-2 transition-all"
        >
          <RefreshCw className="w-4 h-4 text-amber-500" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Automated Business Insights Box */}
      {analytics?.businessInsights && analytics.businessInsights.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800/60 shadow-lg space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI & Data Business Insights</span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-amber-200/90 font-medium list-disc list-inside">
            {analytics.businessInsights.map((insight, idx) => (
              <li key={idx} className="leading-relaxed">{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Today KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">Omzet Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-500">
            {formatRupiah(todayRevenue)}
          </div>
          <div className="flex items-center text-xs space-x-1 font-bold">
            {revenueChangePercent >= 0 ? (
              <span className="text-emerald-400 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />+{revenueChangePercent}%
              </span>
            ) : (
              <span className="text-rose-400 flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-1" />{revenueChangePercent}%
              </span>
            )}
            <span className="text-stone-500 font-normal">vs kemarin</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">Total Transaksi</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-100">
            {todayTransactions}
          </div>
          <div className="text-[11px] text-stone-500">Jumlah nota kasir hari ini</div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">Produk Terjual</span>
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-100">
            {todayItemsSold} item
          </div>
          <div className="text-[11px] text-stone-500">Cup / porsi makanan terjual</div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold">AOV (Rata-rata Nota)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-100">
            {formatRupiah(averageOrderValue)}
          </div>
          <div className="text-[11px] text-stone-500">Average Order Value per nota</div>
        </div>

      </div>

      {/* Charts Grid: Sales By Hour & Sales By Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trend By Hour */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
          <div>
            <h3 className="font-bold text-base text-stone-100">Tren Penjualan Per Jam (08:00 - 22:00)</h3>
            <p className="text-xs text-stone-400">Melihat periode jam tersibuk cafe untuk optimalisasi stok & staf kasir</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.salesByHour || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#78716c" fontSize={10} />
                <YAxis stroke="#78716c" fontSize={10} tickFormatter={(v) => `Rp ${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: unknown) => [formatRupiah(Number(val)), 'Omzet']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales By Category Pie Chart */}
        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
          <div>
            <h3 className="font-bold text-base text-stone-100">Kontribusi Kategori</h3>
            <p className="text-xs text-stone-400">Persentase omzet berdasarkan kategori produk</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={analytics?.salesByCategory || []}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {(analytics?.salesByCategory || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#d97706'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: unknown) => [formatRupiah(Number(val)), 'Omzet']}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(analytics?.salesByCategory || []).map((cat) => (
              <div key={cat.category} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#d97706' }} />
                <span className="text-stone-300 truncate">{cat.category}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Top 10 Best Sellers & Device Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top 10 Best Sellers Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-stone-100">Top 10 Produk Terlaris</h3>
              <p className="text-xs text-stone-400">Paling banyak terjual dan kontribusi terhadap omzet</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 font-bold uppercase tracking-wider text-[10px] border-b border-stone-800">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Nama Produk</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-right">Terjual</th>
                  <th className="py-3 px-3 text-right">Omzet</th>
                  <th className="py-3 px-3 text-right">Kontribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {(analytics?.topProducts || []).map((p, idx) => (
                  <tr key={p.productId} className="hover:bg-stone-800/40">
                    <td className="py-2.5 px-3 font-bold text-amber-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-stone-100 font-sans">{p.productName}</td>
                    <td className="py-2.5 px-3 text-stone-400">{p.category}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-stone-200">{p.qtySold} item</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-500">{formatRupiah(p.revenue)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold text-[10px]">
                        {p.percentageContribution}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Active Devices Status */}
        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-stone-100">Status Perangkat Kasir</h3>
              <p className="text-xs text-stone-400">Monitoring koneksi multi-device real-time</p>
            </div>
            <Smartphone className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3">
            {devices.map((dev) => (
              <div key={dev.deviceId} className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-stone-200">{dev.deviceName}</div>
                  <div className="text-[10px] text-stone-500 font-mono">ID: {dev.deviceId}</div>
                </div>

                <div className="text-right">
                  {dev.status === 'ONLINE' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold inline-flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                      ONLINE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-bold">
                      OFFLINE
                    </span>
                  )}
                  <div className="text-[10px] text-stone-500 mt-1">
                    Pending sync: {dev.pendingSyncCount} TRX
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
