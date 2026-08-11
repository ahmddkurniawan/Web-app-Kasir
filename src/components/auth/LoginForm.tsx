import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Coffee, Lock, User, CheckCircle2, ArrowRight } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

      const uname = username.toLowerCase().trim();
      let matchedUser = null;

      // 1. Try Online Supabase Auth
      if (navigator.onLine) {
        try {
          const { supabase } = await import('../../services/supabase');
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', uname)
            .eq('password', password)
            .single();

          if (data) {
            matchedUser = {
              id: data.id,
              name: data.name,
              username: data.username,
              role: data.role,
              avatarUrl: data.avatar_url || ''
            };
          }
        } catch (dbErr) {
          console.error('Supabase login check failed:', dbErr);
        }
      }

      // 2. Try Offline Cache Auth (if online failed or offline)
      if (!matchedUser) {
        const cachedStr = localStorage.getItem('ngopay_users_cache');
        if (cachedStr) {
          const cachedUsers = JSON.parse(cachedStr);
          const found = cachedUsers.find((u: any) => u.username === uname && u.password === password);
          if (found) {
            matchedUser = {
              id: found.id,
              name: found.name,
              username: found.username,
              role: found.role,
              avatarUrl: found.avatarUrl || ''
            };
          }
        }
      }

      // 3. Fallback to Demo Users (if custom users not found)
      if (!matchedUser) {
        if (uname === 'owner' && password === 'password123') {
          login('owner');
          return;
        } else if ((uname === 'admin' || uname === 'kasir') && password === 'password123') {
          login('admin');
          return;
        }
      }

      // If user found dynamically
      if (matchedUser) {
        login(matchedUser.username, matchedUser);
      } else {
        setErrorMsg('Login gagal. Username atau password salah.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (type: 'admin' | 'owner') => {
    if (type === 'admin') {
      setUsername('admin');
      setPassword('password123');
    } else {
      setUsername('owner');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Blur Rings */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-800/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-stone-900 border border-stone-800/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 text-stone-900 mb-4 shadow-lg shadow-amber-950/50">
            <Coffee className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-stone-100">
            NGOPAY <span className="text-amber-500">POS</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Offline-First POS & Sales Management Cafe Ngopay
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-medium leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Username / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Masukkan username kasir atau owner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
            <label className="flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-stone-700 bg-stone-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-stone-900"
              />
              <span className="ml-2">Ingat saya</span>
            </label>
            <span className="text-amber-500 text-[11px] font-medium">Offline Sync Ready</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-950/50 flex items-center justify-center space-x-2 transition-all mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>Masuk Sistem</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Preset Quick Login Demo Buttons */}
        <div className="mt-8 pt-6 border-t border-stone-800/80">
          <div className="text-[11px] font-semibold text-stone-400 mb-2.5 text-center">
            ⚡ Quick Demo Login Role:
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPreset('admin')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                username === 'admin'
                  ? 'bg-amber-950/60 border-amber-600/80 text-amber-300'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span>Kasir / Admin</span>
                {username === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">POS & Transaksi</div>
            </button>

            <button
              type="button"
              onClick={() => setPreset('owner')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                username === 'owner'
                  ? 'bg-amber-950/60 border-amber-600/80 text-amber-300'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span>Owner</span>
                {username === 'owner' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Dashboard Analytics</div>
            </button>
          </div>
        </div>

      </div>

      <div className="mt-6 text-center text-xs text-stone-600">
        Ngopay POS &copy; {new Date().getFullYear()} Cafe Ngopay. Operational Ready.
      </div>
    </div>
  );
};
