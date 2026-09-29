import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  CheckSquare,
  BarChart3,
  Users,
  Database,
  RefreshCw,
  LogOut,
  KeyRound,
  User,
  ChevronDown,
  ShieldAlert,
  ArrowRightLeft,
  Building,
  ExternalLink
} from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  currentTab: 'update' | 'dashboard' | 'staff';
  onSelectTab: (tab: 'update' | 'dashboard' | 'staff') => void;
  onOpenDataModal: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
  currentUser: UserAccount | null;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onOpenLoginModal: () => void;
  onOpenAccountManagement?: () => void;
  onOpenResidentialGroupManagement?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenDataModal,
  onRefreshData,
  isRefreshing,
  currentUser,
  onLogout,
  onOpenChangePassword,
  onOpenLoginModal,
  onOpenAccountManagement,
  onOpenResidentialGroupManagement
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-gradient-to-r from-red-950 via-red-900 to-amber-950 text-white shadow-xl sticky top-0 z-40 border-b border-red-800/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Left: App Logo & Official Title */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-amber-300 drop-shadow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="font-black text-xs sm:text-sm tracking-tight uppercase text-white">
                CỔNG QUẢN LÝ NHIỆM VỤ CÔNG TÁC
              </h1>
              <span className="text-[10px] px-1.5 py-0.2 bg-red-800 border border-amber-400/30 text-amber-200 rounded font-bold">
                ĐỀ ÁN 06
              </span>
            </div>
            <p className="text-[11px] text-amber-200/90 font-medium tracking-wide">
              CÔNG AN PHƯỜNG / XÃ • THEO DÕI CHỈ TIÊU CÔNG TÁC
            </p>
          </div>
        </div>

        {/* Right: Navigation Tabs & User Profile */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 w-full md:w-auto justify-start md:justify-end">
          {/* Update Tab */}
          <button
            type="button"
            id="tab-update-tasks"
            onClick={() => onSelectTab('update')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              currentTab === 'update'
                ? 'bg-white text-red-950 shadow-md scale-[1.02]'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Nhiệm Vụ</span>
          </button>

          {/* Dashboard Tab */}
          <button
            type="button"
            id="tab-dashboard-view"
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              currentTab === 'dashboard'
                ? 'bg-white text-red-950 shadow-md scale-[1.02]'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Báo Cáo</span>
          </button>

          {/* Quick access to the queue-number system */}
          <button
            type="button"
            id="btn-open-bocso-system"
            onClick={() => window.open('https://bocso.capr.click/', '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-100 bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-400/30 shadow-sm transition-all duration-200"
            title="Mở hệ thống Bóc số"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Bóc Số</span>
          </button>

          {/* Staff Management & Task Assignment Tab (Chỉ huy / Toàn quyền or Officer viewing) */}
          <button
            type="button"
            id="tab-staff-management"
            onClick={() => onSelectTab('staff')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              currentTab === 'staff'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02] font-black'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Cán Bộ & Giao Việc</span>
          </button>

          <div className="h-4 w-px bg-white/20 hidden sm:block mx-0.5" />

          {/* Refresh Action */}
          <button
            type="button"
            id="btn-refresh-all-data"
            onClick={onRefreshData}
            title="Làm mới dữ liệu"
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-300' : ''}`} />
          </button>

          {/* Data Backup / Restore Modal Button */}
          <button
            type="button"
            id="btn-open-data-modal"
            onClick={onOpenDataModal}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/30 rounded-xl text-xs font-bold transition"
            title="Sao lưu & Xuất dữ liệu"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dữ liệu</span>
          </button>

          {/* User Profile / Login status */}
          <div className="relative" ref={menuRef}>
            {currentUser ? (
              <div>
                <button
                  type="button"
                  id="btn-user-profile-menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-amber-400/40 text-left transition group cursor-pointer"
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] text-white shadow-xs ${
                    currentUser.role === 'admin' ? 'bg-red-600' : 'bg-blue-600'
                  }`}>
                    {currentUser.role === 'admin' ? 'BCH' : currentUser.rank.charAt(0)}
                  </div>
                  <div className="max-w-[130px] sm:max-w-[170px] truncate">
                    <div className="text-[11px] font-bold text-white leading-tight truncate flex items-center gap-1">
                      <span>{currentUser.rank} {currentUser.name}</span>
                    </div>
                    <div className="text-[10px] text-amber-300/90 truncate leading-tight">
                      {currentUser.role === 'admin' ? 'Ban Chỉ huy' : (currentUser.assignedAreas?.join(', ') || currentUser.title)}
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 bg-gradient-to-r from-red-950 to-slate-900 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                          currentUser.role === 'admin' ? 'bg-red-600' : 'bg-blue-600'
                        }`}>
                          {currentUser.role === 'admin' ? 'BCH' : 'CSKV'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">
                            {currentUser.rank} {currentUser.name}
                          </div>
                          <div className="text-[10px] text-amber-300">
                            {currentUser.title}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-400 space-y-0.5">
                        <div>Tài khoản: <b className="text-white font-mono">{currentUser.username}</b></div>
                        <div>SĐT: <b className="text-white font-mono">{currentUser.phone}</b></div>
                        {currentUser.assignedAreas && currentUser.assignedAreas.length > 0 && (
                          <div>Địa bàn: <b className="text-white">{currentUser.assignedAreas.join(', ')}</b></div>
                        )}
                      </div>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenChangePassword();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2 transition"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>Đổi Mật Khẩu</span>
                      </button>

                      {currentUser.role === 'admin' && onOpenAccountManagement && (
                        <button
                          type="button"
                          id="btn-nav-manage-accounts"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAccountManagement();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-amber-300 hover:text-amber-200 hover:bg-slate-800 rounded-xl flex items-center gap-2 transition font-semibold"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Quản Lý Tài Khoản & Phân Quyền</span>
                        </button>
                      )}

                      {currentUser.role === 'admin' && onOpenResidentialGroupManagement && (
                        <button
                          type="button"
                          id="btn-nav-manage-residential-groups"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenResidentialGroupManagement();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-blue-300 hover:text-blue-200 hover:bg-slate-800 rounded-xl flex items-center gap-2 transition font-semibold"
                        >
                          <Building className="w-3.5 h-3.5 text-blue-400" />
                          <span>Quản Lý Tổ Dân Phố</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenLoginModal();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2 transition"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                        <span>Chuyển Đổi Tài Khoản</span>
                      </button>

                      <div className="h-px bg-slate-800 my-1" />

                      <button
                        type="button"
                        id="btn-logout"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-200 hover:bg-red-950/60 rounded-xl flex items-center gap-2 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng Xuất Khỏi Hệ Thống</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                id="btn-open-login"
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-md transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>ĐĂNG NHẬP</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
