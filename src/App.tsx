import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SyncProvider, useSync } from './context/SyncContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginForm } from './components/auth/LoginForm';
import { POSScreen } from './components/pos/POSScreen';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { InventoryManagement } from './components/admin/InventoryManagement';
import { TransactionHistory } from './components/admin/TransactionHistory';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { SalesReport } from './components/owner/SalesReport';
import { ProductAnalytics } from './components/owner/ProductAnalytics';
import { AdminPerformance } from './components/owner/AdminPerformance';
import { ProductManagement } from './components/owner/ProductManagement';
import { DeviceMonitoring } from './components/owner/DeviceMonitoring';
import { Download, RefreshCw, WifiOff } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const { syncState, pendingCount } = useSync();
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Default tab when logging in
  useEffect(() => {
    if (user?.role === 'OWNER') {
      setActiveTab('owner-dashboard');
    } else if (user?.role === 'ADMIN') {
      setActiveTab('pos');
    }
  }, [user]);

  // PWA BeforeInstallPrompt listener
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Listen for in-app navigation events dispatched by child components
  useEffect(() => {
    const handleNavigateTab = (e: Event) => {
      const tab = (e as CustomEvent).detail;
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('navigate-tab', handleNavigateTab);
    return () => window.removeEventListener('navigate-tab', handleNavigateTab);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-600 selection:text-white">
      
      {/* Offline Alert Strip */}
      {syncState === 'OFFLINE' && (
        <div className="bg-amber-600 text-stone-950 px-4 py-3 sm:py-2 text-xs font-black flex flex-col sm:flex-row items-center justify-between shadow-md gap-2 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4 shrink-0 text-stone-950 animate-pulse" />
            <span className="leading-tight">MODE OFFLINE AKTIF: Kasir beroperasi normal. {pendingCount > 0 ? `${pendingCount} transaksi tersimpan lokal.` : ''}</span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest bg-stone-950 text-amber-400 px-2 py-0.5 rounded whitespace-nowrap">
            Auto Sync saat Online
          </span>
        </div>
      )}

      {/* PWA Install Banner */}
      {deferredPrompt && (
        <div className="bg-stone-900 border-b border-amber-600/40 px-4 py-2 text-xs flex items-center justify-between text-stone-200">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-amber-500" />
            <span>Install Ngopay POS App di perangkat ini untuk performa offline maksimal.</span>
          </div>
          <button
            onClick={handleInstallPWA}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded-lg shadow transition-colors"
          >
            Install App
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} mobileOpen={isMobileMenuOpen} setMobileOpen={setIsMobileMenuOpen} />

        {/* Content View */}
        <main className="flex-1 overflow-y-auto bg-stone-950 pb-20 md:pb-0">
          {/* Admin Tabs */}
          {activeTab === 'admin-dashboard' && <AdminDashboard />}
          {activeTab === 'pos' && <POSScreen />}
          {activeTab === 'transactions' && <TransactionHistory />}
          {activeTab === 'inventory' && <InventoryManagement />}

          {/* Owner Tabs */}
          {activeTab === 'owner-dashboard' && <OwnerDashboard />}
          {activeTab === 'sales-report' && <SalesReport />}
          {activeTab === 'product-analytics' && <ProductAnalytics />}
          {activeTab === 'admin-performance' && <AdminPerformance />}
          {activeTab === 'device-monitoring' && <DeviceMonitoring />}
          {activeTab === 'product-management' && <ProductManagement />}
          {activeTab === 'all-transactions' && <TransactionHistory />}
        </main>
      </div>

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <MainLayout />
      </SyncProvider>
    </AuthProvider>
  );
}
