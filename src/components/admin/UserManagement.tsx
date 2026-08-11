import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole } from '../../types';
import { supabase } from '../../services/supabase';
import {
  UserPlus, Edit2, Trash2, Check, X,
  Eye, EyeOff, Crown, Coffee, Shield, AlertCircle
} from 'lucide-react';

const STORAGE_KEY = 'ngopay_users_cache';

interface ManagedUser extends User {
  password?: string;
  createdAt?: string;
}

const defaultAvatar = (role: UserRole) =>
  role === 'OWNER'
    ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

export const UserManagement: React.FC = () => {
  const { user: currentUser, role } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<Partial<ManagedUser>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (fetchErr) throw new Error(fetchErr.message);

      const mapped: ManagedUser[] = (data || []).map((u: Record<string, unknown>) => ({
        id: u.id as string,
        username: u.username as string,
        name: u.name as string,
        email: (u.email as string) || '',
        role: (u.role as UserRole) || 'ADMIN',
        avatarUrl: (u.avatar_url as string) || defaultAvatar((u.role as UserRole) || 'ADMIN'),
        password: u.password as string | undefined,
        createdAt: u.created_at as string | undefined,
      }));

      setUsers(mapped);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
    } catch {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        setUsers(JSON.parse(cached));
        setError('Offline — menampilkan data tersimpan di perangkat ini.');
      } else {
        setError('Gagal memuat data pengguna. Pastikan terhubung ke internet.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openAddForm = () => {
    setFormData({ role: 'ADMIN', name: '', username: '', email: '', password: '' });
    setFormError(null);
    setShowPassword(false);
    setIsAddingNew(true);
    setEditingUser(null);
  };

  const openEditForm = (u: ManagedUser) => {
    setFormData({ ...u, password: '' });
    setFormError(null);
    setShowPassword(false);
    setEditingUser(u);
    setIsAddingNew(false);
  };

  const closeForm = () => {
    setIsAddingNew(false);
    setEditingUser(null);
    setFormData({});
    setFormError(null);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!formData.name?.trim()) { setFormError('Nama tidak boleh kosong.'); return; }
    if (!formData.username?.trim()) { setFormError('Username tidak boleh kosong.'); return; }
    if (isAddingNew && !formData.password?.trim()) { setFormError('Password wajib diisi untuk pengguna baru.'); return; }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (isAddingNew) {
        const newId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const { error } = await supabase.from('users').insert({
          id: newId,
          username: formData.username!.toLowerCase().trim(),
          name: formData.name!.trim(),
          email: formData.email?.trim() || '',
          role: formData.role || 'ADMIN',
          avatar_url: defaultAvatar(formData.role || 'ADMIN'),
          password: formData.password!,
          created_at: now,
          updated_at: now,
        });
        if (error) throw new Error(error.message);
      } else if (editingUser) {
        const row: Record<string, unknown> = {
          name: formData.name!.trim(),
          email: formData.email?.trim() || '',
          updated_at: now,
        };
        if (role === 'OWNER') {
          row.role = formData.role || editingUser.role;
          row.username = formData.username!.toLowerCase().trim();
        }
        if (formData.password?.trim()) {
          row.password = formData.password.trim();
        }
        const { error } = await supabase.from('users').update(row).eq('id', editingUser.id);
        if (error) throw new Error(error.message);
      }
      closeForm();
      await loadUsers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: ManagedUser) => {
    if (u.id === currentUser?.id) {
      alert('Anda tidak bisa menghapus akun Anda sendiri.');
      setDeleteConfirmId(null);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('users').delete().eq('id', u.id);
      if (error) throw new Error(error.message);
      setDeleteConfirmId(null);
      await loadUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus pengguna.');
    } finally {
      setSaving(false);
    }
  };

  const RoleBadge: React.FC<{ role: UserRole }> = ({ r }) => (
    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
      r === 'OWNER'
        ? 'bg-amber-950 text-amber-400 border-amber-800'
        : 'bg-stone-800 text-stone-300 border-stone-700'
    }`}>
      {r === 'OWNER' ? <Crown className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
      <span>{r === 'OWNER' ? 'Owner' : 'Kasir / Admin'}</span>
    </span>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-100 flex items-center space-x-2">
            <Shield className="w-7 h-7 text-amber-500" />
            <span>Manajemen Pengguna</span>
          </h1>
          <p className="text-sm text-stone-400 mt-1">Kelola akun admin dan owner kasir Ngopay</p>
        </div>
        {role === 'OWNER' && (
          <button onClick={openAddForm} className="flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-colors text-sm">
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-500 text-sm">Memuat data pengguna...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-stone-500 text-sm">Belum ada pengguna terdaftar.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-stone-300">
                <thead className="bg-stone-950 text-stone-400 text-[11px] font-bold uppercase tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4 text-left">Pengguna</th>
                    <th className="py-3 px-4 text-left">Username</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Role</th>
                    <th className="py-3 px-4 text-left">Terdaftar</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {users.map(u => (
                    <tr key={u.id} className={`hover:bg-stone-800/30 transition-colors ${u.id === currentUser?.id ? 'bg-amber-950/10' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img src={u.avatarUrl || defaultAvatar(u.role)} alt={u.name} className="w-8 h-8 rounded-full border border-stone-700 object-cover" />
                          <div>
                            <div className="font-bold text-stone-100">{u.name}</div>
                            {u.id === currentUser?.id && <div className="text-[10px] text-amber-400 font-semibold">● Sesi Aktif</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-400 text-xs">{u.username}</td>
                      <td className="py-3 px-4 text-stone-400 text-xs">{u.email || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${u.role === 'OWNER' ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-stone-800 text-stone-300 border-stone-700'}`}>
                          {u.role === 'OWNER' ? <Crown className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
                          {u.role === 'OWNER' ? 'Owner' : 'Kasir / Admin'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-500 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button onClick={() => openEditForm(u)} title="Edit" disabled={role !== 'OWNER' && u.id !== currentUser?.id} className="p-1.5 rounded-md bg-stone-800 hover:bg-amber-600/20 text-amber-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {role === 'OWNER' && u.id !== currentUser?.id && (
                            <button onClick={() => setDeleteConfirmId(u.id)} title="Hapus" className="p-1.5 rounded-md bg-stone-800 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-3 p-4">
              {users.map(u => (
                <div key={u.id} className={`p-4 rounded-xl border flex flex-col space-y-3 ${u.id === currentUser?.id ? 'border-amber-800/50 bg-amber-950/10' : 'border-stone-800 bg-stone-950'}`}>
                  <div className="flex items-center space-x-3">
                    <img src={u.avatarUrl || defaultAvatar(u.role)} alt={u.name} className="w-10 h-10 rounded-full border border-stone-700 object-cover" />
                    <div className="flex-1">
                      <div className="font-bold text-stone-100 text-sm">{u.name}</div>
                      <div className="font-mono text-stone-500 text-xs">@{u.username}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${u.role === 'OWNER' ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-stone-800 text-stone-300 border-stone-700'}`}>
                      {u.role === 'OWNER' ? <Crown className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
                      {u.role === 'OWNER' ? 'Owner' : 'Admin'}
                    </span>
                  </div>
                  {u.id === currentUser?.id && <div className="text-[10px] text-amber-400 font-semibold">● Sesi Aktif Anda</div>}
                  <div className="flex space-x-2 pt-2 border-t border-stone-800">
                    <button onClick={() => openEditForm(u)} disabled={role !== 'OWNER' && u.id !== currentUser?.id} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-stone-800 hover:bg-amber-600/20 text-amber-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-colors">
                      <Edit2 className="w-3.5 h-3.5" /><span>Edit</span>
                    </button>
                    {role === 'OWNER' && u.id !== currentUser?.id && (
                      <button onClick={() => setDeleteConfirmId(u.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-stone-800 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 text-xs font-bold transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /><span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(isAddingNew || editingUser) && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-stone-800">
              <h2 className="font-bold text-lg text-stone-100">{isAddingNew ? 'Tambah Pengguna Baru' : 'Edit Pengguna'}</h2>
              <button onClick={closeForm} className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-stone-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /><span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">Nama Lengkap *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Nama tampil pengguna" className="w-full px-3 py-2.5 bg-stone-800 border border-stone-700 rounded-lg text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500" />
              </div>
              {(role === 'OWNER' || isAddingNew) && (
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5">Username *</label>
                  <input type="text" value={formData.username || ''} onChange={e => setFormData(p => ({ ...p, username: e.target.value.toLowerCase() }))} placeholder="username_tanpa_spasi" className="w-full px-3 py-2.5 bg-stone-800 border border-stone-700 rounded-lg text-stone-100 text-sm font-mono placeholder-stone-500 focus:outline-none focus:border-amber-500" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">Email</label>
                <input type="email" value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="email@opsional.com" className="w-full px-3 py-2.5 bg-stone-800 border border-stone-700 rounded-lg text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500" />
              </div>
              {role === 'OWNER' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5">Role</label>
                  <select value={formData.role || 'ADMIN'} onChange={e => setFormData(p => ({ ...p, role: e.target.value as UserRole }))} className="w-full px-3 py-2.5 bg-stone-800 border border-stone-700 rounded-lg text-stone-100 text-sm focus:outline-none focus:border-amber-500">
                    <option value="ADMIN">☕ Kasir / Admin</option>
                    <option value="OWNER">👑 Owner</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">{isAddingNew ? 'Password *' : 'Password Baru (kosongkan jika tidak ingin ganti)'}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={formData.password || ''} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} placeholder={isAddingNew ? 'Password untuk login' : '••••••••'} className="w-full px-3 py-2.5 pr-10 bg-stone-800 border border-stone-700 rounded-lg text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500" />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 p-5 border-t border-stone-800">
              <button onClick={closeForm} className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl transition-colors">Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                {saving ? <span>Menyimpan...</span> : <><Check className="w-4 h-4" /><span>Simpan</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (() => {
        const target = users.find(u => u.id === deleteConfirmId);
        return (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-rose-950"><Trash2 className="w-5 h-5 text-rose-400" /></div>
                <h3 className="text-base font-bold text-rose-400">Hapus Pengguna?</h3>
              </div>
              <p className="text-sm text-stone-300 mb-6">Akun <strong className="text-stone-100">"{target?.name}"</strong> akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex space-x-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold transition-colors">Batal</button>
                <button onClick={() => target && handleDelete(target)} disabled={saving} className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-bold transition-colors">Ya, Hapus</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
