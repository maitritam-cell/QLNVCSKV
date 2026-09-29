import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 text-amber-300 border border-amber-500/50 px-3.5 py-2 text-xs font-bold shadow-2xl animate-in slide-in-from-bottom duration-300 backdrop-blur-md">
      <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-extrabold text-amber-300">
          Chế độ ngoại tuyến (Không có mạng)
        </span>
        <span className="text-[10px] text-slate-300 font-normal">
          Dữ liệu được lưu trong máy. Khi có mạng trở lại, hệ thống sẽ tự động đồng bộ.
        </span>
      </div>
    </div>
  );
};
