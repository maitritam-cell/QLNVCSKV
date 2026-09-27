import React from 'react';
import { AppConfig } from '../types';
import { 
  ShieldAlert, 
  Settings, 
  Printer, 
  RefreshCw, 
  CheckCircle2, 
  FileSpreadsheet 
} from 'lucide-react';

interface HeaderProps {
  config: AppConfig;
  onOpenSettings: () => void;
  onOpenReport: () => void;
  onSync: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenSettings,
  onOpenReport,
  onSync,
  isSyncing
}) => {
  return (
    <header className="bg-gradient-to-r from-red-700 via-red-800 to-amber-900 text-white shadow-lg sticky top-0 z-40 border-b border-red-600/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Unit & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-yellow-400 text-red-900 flex items-center justify-center shadow-md font-black shrink-0 border-2 border-yellow-300">
            <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-yellow-300 drop-shadow-xs">
                {config.unitName || 'CÔNG AN PHƯỜNG HÀNG BÀI'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/80 text-yellow-200 border border-yellow-400/30 font-bold">
                Đề Án 06 / BCA
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-white leading-tight">
              CỔNG QUẢN LÝ & THEO DÕI TIẾN ĐỘ NHIỆM VỤ CÔNG TÁC
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center">
          
          {/* Live sync / refresh button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
              isSyncing 
                ? 'bg-amber-600/50 text-amber-100 cursor-not-allowed'
                : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
            }`}
            title="Làm mới hoặc đồng bộ Google Sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-yellow-300' : ''}`} />
            <span>{isSyncing ? 'Đang tải...' : 'Làm mới'}</span>
          </button>

          {/* Print report */}
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition shadow-xs"
            title="In / Xuất báo cáo PDF"
          >
            <Printer className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden sm:inline">Báo Cáo</span>
          </button>

          {/* Settings / Data management */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-yellow-400 hover:bg-yellow-300 text-red-950 shadow-md transition font-black"
            title="Cài đặt & Quản lý dữ liệu"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cài Đặt</span>
          </button>

        </div>

      </div>
    </header>
  );
};
