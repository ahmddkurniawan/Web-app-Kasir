import React, { useState, useEffect } from 'react';
import { ownerService } from '../../services/api';
import { DeviceInfo } from '../../types';
import { Smartphone, RefreshCw, Radio, Server, CheckCircle2, AlertCircle } from 'lucide-react';

export const DeviceMonitoring: React.FC = () => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadDevices = async () => {
    const list = await ownerService.getDevices();
    setDevices(list);
    setLoading(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-stone-950 text-stone-100 min-h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-stone-900 border border-stone-800">
        <div>
          <h1 className="text-2xl font-black text-stone-100 flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-amber-500" />
            Monitoring Perangkat Terminal POS Real-Time
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Status koneksi multi-device, pending transaksi offline, dan pendaftaran kasir baru
          </p>
        </div>

        <button
          onClick={loadDevices}
          className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-amber-500" />
          <span>Segarkan Status</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-stone-500">Memuat status perangkat...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((dev) => {
            const isOnline = dev.status === 'ONLINE';
            return (
              <div
                key={dev.deviceId}
                className={`p-6 rounded-2xl bg-stone-900 border ${
                  isOnline ? 'border-stone-800' : 'border-rose-900/40'
                } space-y-4 shadow-lg`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-500 flex items-center justify-center font-bold">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-100">{dev.deviceName}</h3>
                      <div className="text-[10px] text-stone-500 font-mono">ID: {dev.deviceId}</div>
                    </div>
                  </div>

                  {isOnline ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold flex items-center space-x-1">
                      <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>ONLINE</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-bold flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>OFFLINE</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-stone-950">
                    <span className="text-stone-400 flex items-center space-x-1.5">
                      <Server className="w-3.5 h-3.5 text-amber-500" />
                      <span>Sisa Antrean Offline:</span>
                    </span>
                    <span className={`font-bold ${dev.pendingSyncCount > 0 ? 'text-amber-400' : 'text-stone-300'}`}>
                      {dev.pendingSyncCount} Transaksi
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-stone-950">
                    <span className="text-stone-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Terakhir Sinkronisasi:</span>
                    </span>
                    <span className="font-mono text-stone-300 text-[11px]">
                      {new Date(dev.lastSyncAt).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
