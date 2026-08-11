import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  login: (username: string, userObj: User) => void;
  logout: () => void;
  updateProfile: (newName: string, newAvatarUrl?: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ADMIN: User = {
  id: 'usr-admin-1',
  username: 'admin',
  name: 'Ahmad (Kasir Ngopay)',
  email: 'kasir@cafengopay.id',
  role: 'ADMIN',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

const DEMO_OWNER: User = {
  id: 'usr-owner-1',
  username: 'owner',
  name: 'Pak Hendra (Owner)',
  email: 'owner@cafengopay.id',
  role: 'OWNER',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ngopay_session_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEMO_ADMIN;
      }
    }
    // Default logged in as ADMIN for immediate out-of-box usability in preview!
    return DEMO_ADMIN;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('ngopay_session_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ngopay_session_user');
    }
  }, [user]);

  const login = (username: string, userObj?: User) => {
    if (userObj) {
      setUser(userObj);
    } else if (username.toLowerCase() === 'owner') {
      setUser(DEMO_OWNER);
    } else {
      setUser(DEMO_ADMIN);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ngopay_session_user');
  };

  const updateProfile = async (newName: string, newAvatarUrl?: string) => {
    if (!user) return;
    const updatedUser = { ...user, name: newName };
    if (newAvatarUrl !== undefined) {
      updatedUser.avatarUrl = newAvatarUrl;
    }
    setUser(updatedUser);
    localStorage.setItem('ngopay_session_user', JSON.stringify(updatedUser));

    if (navigator.onLine && !updatedUser.id.startsWith('usr-admin-') && !updatedUser.id.startsWith('usr-owner-')) {
      try {
        const { supabase } = await import('../services/supabase');
        const updateData: any = { name: newName, updated_at: new Date().toISOString() };
        if (newAvatarUrl !== undefined) {
          updateData.avatar_url = newAvatarUrl;
        }
        await supabase.from('users').update(updateData).eq('id', updatedUser.id);
      } catch (err) {
        console.error('Failed to update profile to Supabase', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
