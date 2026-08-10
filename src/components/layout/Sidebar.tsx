import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Receipt, 
  Package, 
  TrendingUp, 
  PieChart, 
  Users, 
  Smartphone, 
  Coffee,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen
}) => {
  const { role } = useAuth();

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  const adminNav = [
    { id: 'admin-dashboard', label: 'Dashboard Kasir', icon: LayoutDashboard },
    { id: 'pos', label: 'Kasir POS', icon: ShoppingCart },
    { id: 'transactions', label: 'Riwayat Transaksi', icon: Receipt },
    { id: 'inventory', label: 'Stok Produk', icon: Package },
  ];

  const ownerNav = [
    { id: 'owner-dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'sales-report', label: 'Laporan Penjualan', icon: TrendingUp },
    { id: 'product-analytics', label: 'Performa Produk', icon: PieChart },
    { id: 'admin-performance', label: 'Performa Kasir', icon: Users },
    { id: 'device-monitoring', label: 'Status Perangkat', icon: Smartphone },
    { id: 'product-management', label: 'Kelola Produk', icon: Coffee },
    { id: 'inventory', label: 'Manajemen Stok', icon: Package },
    { id: 'all-transactions', label: 'Semua Transaksi', icon: Receipt },
  ];

  const navItems = role === 'OWNER' ? ownerNav : adminNav;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-stone-900/70 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 md:top-16 left-0 z-50 md:z-20 w-64 h-screen md:h-[calc(100vh-4rem)] bg-stone-900 border-r border-stone-800 text-stone-300 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          {/* Mobile Header Inside Drawer */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-800 md:hidden">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold">
                <Coffee className="w-4 h-4" />
              </div>
              <span className="font-bold text-amber-500 text-base">NGOPAY POS</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2 px-3">
            {role === 'OWNER' ? 'MENU OWNER' : 'MENU KASIR'}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-amber-600 text-white font-semibold shadow-md shadow-amber-950/40'
                      : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-100' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info inside sidebar */}
        <div className="p-4 border-t border-stone-800/80 text-xs text-stone-500 bg-stone-950/50">
          <div className="flex items-center justify-between font-mono">
            <span>Ngopay POS v1.0</span>
            <span className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded">PWA Offline</span>
          </div>
        </div>
      </aside>
    </>
  );
};
