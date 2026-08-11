import React, { createContext, useContext, useState, useEffect } from 'react';
import { syncManager, SyncState } from '../services/syncService';

interface SyncContextType {
  syncState: SyncState;
  pendingCount: number;
  triggerManualSync: () => Promise<{ success: boolean; syncedCount: number; message?: string }>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getStatus());
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    // Initiate realtime subscriptions
    syncManager.subscribeToRealtime();

    const unsubscribe = syncManager.subscribe((state, count) => {
      setSyncState(state);
      setPendingCount(count);
    });
    return () => unsubscribe();
  }, []);

  const triggerManualSync = async () => {
    return await syncManager.triggerSync();
  };

  return (
    <SyncContext.Provider
      value={{
        syncState,
        pendingCount,
        triggerManualSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
