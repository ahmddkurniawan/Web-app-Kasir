import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { getDeviceName, setDeviceName } from '../../utils/device';
import {
  Wifi, WifiOff, RefreshCw, LogOut, Coffee, Smartphone,
  Edit2, Check, X, User, Save, CheckCircle2, Camera, Upload, Trash2
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ toggleMobileMenu }) => {
  const { user, role, logout, updateProfile, updateAvatar } = useAuth();
  const { syncState, pendingCount, triggerManualSync } = useSync();

  const [isSyncing, setIsSyncing] = useState(false);
  const [deviceName, setDeviceNameState] = useState(getDeviceName());
  const [editingDevice, setEditingDevice] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [saveNameSuccess, setSaveNameSuccess] = useState(false);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [saveAvatarSuccess, setSaveAvatarSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When modal opens, reset all state
  useEffect(() => {
    if (showProfileModal) {
      setEditName(user?.name || '');
      setSaveNameSuccess(false);
      setSaveAvatarSuccess(false);
      setAvatarPreview(null);
      setTimeout(() => nameInputRef.current?.focus(), 150);
    }
  }, [showProfileModal, user?.name]);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    const result = await triggerManualSync();
    setIsSyncing(false);
    setSyncToast(result.message || 'Sinkronisasi selesai');
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleSaveDeviceName = () => {
    if (deviceName.trim()) setDeviceName(deviceName.trim());
    setEditingDevice(false);
  };

  // Save name
  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(editName.trim());
      setSaveNameSuccess(true);
      setTimeout(() => setSaveNameSuccess(false), 2000);
    } finally {
      setSavingName(false);
    }
  };

  // Process image file → base64 compressed
  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const originalSrc = e.target?.result as string;
      // Compress via canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 200;
        const ratio = Math.min(MAX / img.width, MAX / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d')!;
        // Crop circle
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarPreview(compressed);
      };
      img.src = originalSrc;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    // reset so same file can be picked again
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  }, [processImageFile]);

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    setSavingAvatar(true);
    try {
      await updateAvatar(avatarPreview);
      setSaveAvatarSuccess(true);
      setTimeout(() => {
        setSaveAvatarSuccess(false);
        setAvatarPreview(null);
      }, 1500);
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const defaultUrl = role === 'OWNER'
      ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    await updateAvatar(defaultUrl);
    setAvatarPreview(null);
  };

  const currentAvatar = avatarPreview || user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  return (
    <>
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

            {/* Right: Sync & User */}
            <div className="flex items-center space-x-3">
              {syncToast && (
                <div className="hidden sm:block text-xs bg-amber-900/90 text-amber-200 border border-amber-700 px-3 py-1.5 rounded-lg shadow-lg">
                  {syncToast}
                </div>
              )}

              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {syncState === 'ONLINE' && (
                  <span id="status-online-badge" className="flex items-center text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 sm:mr-1.5 animate-pulse"></span>
                    <Wifi className="hidden sm:block w-3.5 h-3.5 mr-1" /> <span className="hidden sm:inline">ONLINE</span>
                  </span>
                )}
                {syncState === 'OFFLINE' && (
                  <span id="status-offline-badge" className="flex items-center text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/60">
                    <span className="w-2 h-2 rounded-full bg-rose-500 sm:mr-1.5"></span>
                    <WifiOff className="hidden sm:block w-3.5 h-3.5 mr-1" /> <span className="hidden sm:inline">OFFLINE</span>
                  </span>
                )}
                {syncState === 'SYNCING' && (
                  <span id="status-syncing-badge" className="flex items-center text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60">
                    <RefreshCw className="w-3.5 h-3.5 sm:mr-1 animate-spin" /> <span className="hidden sm:inline">SINKRON</span>
                  </span>
                )}
                <button
                  id="manual-sync-button"
                  onClick={handleSyncClick}
                  disabled={isSyncing || syncState === 'OFFLINE'}
                  className={`relative flex items-center text-xs px-2 py-1.5 sm:px-2.5 rounded-lg font-medium transition-colors ${
                    pendingCount > 0 ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm' : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  } disabled:opacity-50`}
                  title="Sinkronkan data ke server"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline ml-1.5">Sync</span>
                  {pendingCount > 0 && (
                    <span id="pending-sync-badge" className="ml-1 px-1.5 py-0.5 bg-rose-600 text-white font-bold text-[10px] rounded-full">{pendingCount}</span>
                  )}
                </button>
              </div>

              {/* User Area — click avatar to open profile modal */}
              <div className="flex items-center space-x-2 pl-2 border-l border-stone-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-stone-200 leading-tight">{user?.name}</div>
                  <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mt-0.5">
                    {role === 'OWNER' ? '👑 Owner' : '☕ Kasir / Admin'}
                  </div>
                </div>

                <button
                  id="profile-avatar-button"
                  onClick={() => setShowProfileModal(true)}
                  title="Edit Profil & Avatar"
                  className="relative group shrink-0"
                >
                  <img
                    src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={user?.name || 'User'}
                    className="w-9 h-9 rounded-full border-2 border-amber-600/50 object-cover transition-all group-hover:border-amber-400"
                  />
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </span>
                </button>

                <button
                  id="logout-button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== Profile Edit Modal ===== */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowProfileModal(false); }}
        >
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-base text-stone-100">Edit Profil</h2>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* ── Avatar Section ── */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-3">Foto Profil</label>

                {/* Drop zone + current avatar */}
                <div
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer py-6 px-4 ${
                    isDragging
                      ? 'border-amber-500 bg-amber-950/30'
                      : 'border-stone-700 bg-stone-800/40 hover:border-amber-600/60 hover:bg-stone-800/70'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  {/* Avatar preview */}
                  <div className="relative mb-3">
                    <img
                      src={currentAvatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full border-4 border-stone-700 object-cover shadow-xl"
                    />
                    {avatarPreview && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">BARU</span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-stone-300 text-sm font-medium mb-1">
                      <Upload className="w-4 h-4 text-amber-500" />
                      <span>Klik atau seret foto ke sini</span>
                    </div>
                    <p className="text-stone-500 text-[11px]">JPG, PNG, WEBP · Max ~2MB</p>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Avatar action buttons — shown when there's a preview or custom avatar */}
                <div className="flex gap-2 mt-2">
                  {avatarPreview && (
                    <button
                      id="save-avatar-button"
                      onClick={handleSaveAvatar}
                      disabled={savingAvatar || saveAvatarSuccess}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${
                        saveAvatarSuccess
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50'
                      }`}
                    >
                      {saveAvatarSuccess ? (
                        <><CheckCircle2 className="w-4 h-4" /><span>Foto Disimpan!</span></>
                      ) : savingAvatar ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /><span>Menyimpan...</span></>
                      ) : (
                        <><Save className="w-4 h-4" /><span>Simpan Foto Ini</span></>
                      )}
                    </button>
                  )}
                  {/* Reset to default */}
                  {(user?.avatarUrl?.startsWith('data:') || avatarPreview) && (
                    <button
                      onClick={() => { setAvatarPreview(null); if (user?.avatarUrl?.startsWith('data:')) handleRemoveAvatar(); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-rose-900/40 text-stone-400 hover:text-rose-400 text-xs font-semibold transition-colors"
                      title="Hapus foto, kembali ke default"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-stone-800" />

              {/* ── Name Section ── */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                  Nama Tampil <span className="text-amber-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    ref={nameInputRef}
                    type="text"
                    id="profile-name-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                    placeholder="Masukkan nama baru..."
                    className="flex-1 px-3 py-2.5 bg-stone-800 border border-stone-600 rounded-xl text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-colors"
                  />
                  <button
                    id="save-name-button"
                    onClick={handleSaveName}
                    disabled={savingName || !editName.trim() || saveNameSuccess}
                    className={`px-4 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shrink-0 ${
                      saveNameSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50'
                    }`}
                  >
                    {saveNameSuccess ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : savingName ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{saveNameSuccess ? 'Tersimpan!' : 'Simpan'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5">
                  💾 Tersimpan di perangkat ini — sinkron otomatis saat online
                </p>
              </div>

              {/* Role info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-800/50 border border-stone-700/50">
                <div className="text-xl">
                  {role === 'OWNER' ? '👑' : '☕'}
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-200">{role === 'OWNER' ? 'Owner' : 'Kasir / Admin'}</div>
                  <div className="text-[11px] text-stone-500 font-mono">@{user?.username || user?.id}</div>
                </div>
                {syncState === 'OFFLINE' && (
                  <div className="ml-auto flex items-center gap-1 text-[11px] text-amber-400 font-semibold bg-amber-950/50 px-2 py-1 rounded-lg border border-amber-800/50">
                    <WifiOff className="w-3 h-3" />
                    <span>Offline</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer close button */}
            <div className="px-5 pb-5">
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl transition-colors text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
