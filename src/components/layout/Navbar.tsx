import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { getDeviceName, setDeviceName } from '../../utils/device';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/cropImage';
import {
  Wifi, WifiOff, RefreshCw, LogOut, Coffee, Smartphone,
  Edit2, Check, X, User, Save, CheckCircle2, UploadCloud, Trash2
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ toggleMobileMenu }) => {
  const { user, role, logout, updateProfile } = useAuth();
  const { syncState, pendingCount, triggerManualSync } = useSync();

  const [isSyncing, setIsSyncing] = useState(false);
  const [deviceName, setDeviceNameState] = useState(getDeviceName());
  const [editingDevice, setEditingDevice] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When modal opens, pre-fill current name and focus input
  useEffect(() => {
    if (showProfileModal) {
      setEditName(user?.name || '');
      setEditAvatar('');
      setImageToCrop(null);
      setSaveSuccess(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showProfileModal, user?.name]);

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (imageToCrop && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        setEditAvatar(croppedImage);
        setImageToCrop(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteAvatar = () => {
    setEditAvatar('remove');
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageToCrop(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

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

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(editName.trim(), editAvatar.trim());
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowProfileModal(false);
      }, 1200);
    } catch {
      // error silently handled
    } finally {
      setSavingName(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveProfile();
    if (e.key === 'Escape') setShowProfileModal(false);
  };

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

            {/* Right: Sync Status & User */}
            <div className="flex items-center space-x-3">

              {/* Sync Toast Notification */}
              {syncToast && (
                <div className="hidden sm:block text-xs bg-amber-900/90 text-amber-200 border border-amber-700 px-3 py-1.5 rounded-lg shadow-lg">
                  {syncToast}
                </div>
              )}

              {/* Online / Offline Status Badge */}
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

                {/* Manual Sync Button */}
                <button
                  id="manual-sync-button"
                  onClick={handleSyncClick}
                  disabled={isSyncing || syncState === 'OFFLINE'}
                  className={`relative flex items-center text-xs px-2 py-1.5 sm:px-2.5 rounded-lg font-medium transition-colors ${
                    pendingCount > 0
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  } disabled:opacity-50`}
                  title="Sinkronkan data ke server"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline ml-1.5">Sync</span>
                  {pendingCount > 0 && (
                    <span id="pending-sync-badge" className="ml-1 px-1.5 py-0.5 bg-rose-600 text-white font-bold text-[10px] rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>

              {/* User Avatar & Profile — clickable to open edit modal */}
              <div className="flex items-center space-x-2 pl-2 border-l border-stone-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-stone-200 leading-tight">{user?.name}</div>
                  <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mt-0.5">
                    {role === 'OWNER' ? '👑 Owner' : '☕ Kasir / Admin'}
                  </div>
                </div>

                {/* Clickable avatar — opens profile modal on ALL devices */}
                <button
                  id="profile-avatar-button"
                  onClick={() => setShowProfileModal(true)}
                  title="Edit Profil"
                  className="relative group"
                >
                  <img
                    src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={user?.name || 'User'}
                    className="w-9 h-9 rounded-full border-2 border-amber-600/50 object-cover transition-all group-hover:border-amber-400"
                  />
                  {/* Overlay edit icon on hover */}
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 className="w-3.5 h-3.5 text-white" />
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
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-sm shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-base text-stone-100">Edit Profil</h2>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Avatar + current role display */}
              <div className="flex items-center space-x-4 p-3 rounded-xl bg-stone-800/60 border border-stone-700/50">
                <div className="relative group">
                  <img
                    src={(editAvatar === 'remove' ? '' : editAvatar) || user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={user?.name || 'User'}
                    className="w-14 h-14 rounded-full border-2 border-amber-600/60 object-cover"
                  />
                  {((editAvatar === 'remove' ? '' : editAvatar) || user?.avatarUrl) && (
                    <button
                      onClick={handleDeleteAvatar}
                      className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-stone-100">{user?.name}</div>
                  <div className="text-[11px] text-amber-400 font-semibold mt-0.5">
                    {role === 'OWNER' ? '👑 Owner' : '☕ Kasir / Admin'}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1 font-mono">@{user?.username || user?.id}</div>
                </div>
              </div>

              {/* Name input */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                  Nama Tampil <span className="text-amber-500">*</span>
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  id="profile-name-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Masukkan nama baru..."
                  className="w-full px-3 py-2.5 bg-stone-800 border border-stone-600 rounded-xl text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-colors"
                />
              </div>

              {/* Avatar Drag n Drop input */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                  Foto Profil
                </label>
                {imageToCrop ? (
                  <div className="relative w-full h-56 bg-stone-900 rounded-xl overflow-hidden border border-stone-600">
                    <Cropper
                      image={imageToCrop}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                      <button onClick={() => setImageToCrop(null)} className="px-4 py-1.5 bg-stone-700/80 hover:bg-stone-600 text-xs rounded-lg font-bold transition-colors">Batal</button>
                      <button onClick={handleCropSave} className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-xs rounded-lg font-bold text-white transition-colors">Terapkan</button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-full p-4 border-2 border-dashed rounded-xl text-center transition-colors cursor-pointer ${
                      isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-stone-600 hover:border-stone-500 bg-stone-800'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file) processImageFile(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className={`w-6 h-6 mx-auto mb-2 ${isDragging ? 'text-amber-500' : 'text-stone-400'}`} />
                    <p className="text-xs text-stone-300">
                      <span className="text-amber-400 font-semibold">Klik untuk upload</span> atau drag & drop
                    </p>
                    <p className="text-[10px] text-stone-500 mt-1">PNG, JPG dsb (Anda bisa sesuaikan posisi foto)</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processImageFile(file);
                        // Reset input value to allow selecting same file twice
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    />
                  </div>
                )}
                <p className="text-[11px] text-stone-500 mt-1.5">
                  💾 Tersimpan di perangkat ini — sinkron otomatis saat online
                </p>
              </div>

              {/* Offline notice */}
              {syncState === 'OFFLINE' && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs">
                  <WifiOff className="w-3.5 h-3.5 shrink-0" />
                  <span>Mode offline — perubahan disimpan lokal & akan disinkron saat online kembali</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex space-x-3 px-5 pb-5">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl transition-colors text-sm"
              >
                Batal
              </button>
              <button
                id="save-profile-button"
                onClick={handleSaveProfile}
                disabled={savingName || !editName.trim() || saveSuccess}
                className={`flex-1 py-2.5 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50'
                }`}
              >
                {saveSuccess ? (
                  <><CheckCircle2 className="w-4 h-4" /><span>Tersimpan!</span></>
                ) : savingName ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /><span>Menyimpan...</span></>
                ) : (
                  <><Save className="w-4 h-4" /><span>Simpan</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
