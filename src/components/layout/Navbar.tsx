import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { getDeviceName, setDeviceName } from '../../utils/device';
import { Wifi, WifiOff, RefreshCw, LogOut, Coffee, Smartphone, Edit2, Check } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ toggleMobileMenu }) => {
  const { user, role, logout } = useAuth();
  const { syncState, pendingCount, triggerManualSync } = useSync();
  const [isSyncing, setIsSyncing] = useState(false);
  const [deviceName, setDeviceNameState] = useState(getDeviceName());
  const [editingDevice, setEditingDevice] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    const result = await triggerManualSync();
    setIsSyncing(false);
    
    setSyncToast(result.message || 'Sinkronisasi selesai');
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleSaveDeviceName = () => {
    if (deviceName.trim()) {
      setDeviceName(deviceName.trim());
    }
    setEditingDevice(false);
  };

  return (
    <header id="ngopay-header" className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand & Mobile Drawer Toggle */}
          <div className="flex items-center space-x-3">
            <button
              id="mobile-menu-button"
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 focus:outline-none"
              aria-label="Buka Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-amber-100 shadow-inner font-bold">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-wide text-amber-500">NGOPAY</span>
                <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 font-semibold border border-amber-800/60">POS</span>
              </div>
            </div>

            {/* Device Badge */}
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-stone-400 bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-700/60 ml-3">
              <Smartphone className="w-3.5 h-3.5 text-stone-400" />
              {editingDevice ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceNameState(e.target.value)}
                    className="bg-stone-900 text-white text-xs px-1 py-0.5 rounded border border-amber-500 w-28 focus:outline-none"
                    autoFocus
                  />
                  <button onClick={handleSaveDeviceName} className="text-amber-400 hover:text-amber-300">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-stone-300">{deviceName}</span>
                  <button onClick={() => setEditingDevice(true)} className="text-stone-500 hover:text-amber-400 ml-1">
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Center/Right: Network Sync Status & Actions */}
          <div className="flex items-center space-x-3">
            
            {/* Sync Toast Notification */}
            {syncToast && (
              <div className="hidden sm:block text-xs bg-amber-900/90 text-amber-200 border border-amber-700 px-3 py-1.5 rounded-lg shadow-lg animate-fade-in">
                {syncToast}
              </div>
            )}

            {/* Online / Offline Status Badge */}
            <div className="flex items-center space-x-2">
              {syncState === 'ONLINE' && (
                <span id="status-online-badge" className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  <Wifi className="w-3.5 h-3.5 mr-1" /> ONLINE
                </span>
              )}

              {syncState === 'OFFLINE' && (
                <span id="status-offline-badge" className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/60">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span>
                  <WifiOff className="w-3.5 h-3.5 mr-1" /> OFFLINE
                </span>
              )}

              {syncState === 'SYNCING' && (
                <span id="status-syncing-badge" className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60">
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> SINKRON
                </span>
              )}

              {/* Manual Sync Trigger Button with Badge */}
              <button
                id="manual-sync-button"
                onClick={handleSyncClick}
                disabled={isSyncing || syncState === 'OFFLINE'}
                className={`relative flex items-center text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  pendingCount > 0
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                } disabled:opacity-50`}
                title="Sinkronkan data ke server"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline ml-1.5">Sync</span>
                {pendingCount > 0 && (
                  <span id="pending-sync-badge" className="ml-1.5 px-1.5 py-0.2 bg-rose-600 text-white font-bold text-[10px] rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Avatar & Role */}
            <div className="flex items-center space-x-2 pl-2 border-l border-stone-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-stone-200">{user?.name}</div>
                <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                  {role === 'OWNER' ? '👑 Owner' : '☕ Kasir / Admin'}
                </div>
              </div>

              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full border border-amber-600/50 object-cover"
              />

              <button
                id="logout-button"
                onClick={logout}
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors ml-1"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
