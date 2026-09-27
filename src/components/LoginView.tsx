import React, { useState } from 'react';
import { UserAccount } from '../types';
import { authenticateUser, getUserAccounts } from '../data/storage';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  CheckCircle2,
  Sparkles,
  Award,
  ChevronRight,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  onContinueAsGuest?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onContinueAsGuest
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'quick'>('form');
  const [showHelpModal, setShowHelpModal] = useState(false);

  const availableAccounts = getUserAccounts();
  const adminAccounts = availableAccounts.filter((a) => a.role === 'admin');
  const officerAccounts = availableAccounts.filter((a) => a.role === 'officer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = authenticateUser(identifier, password);
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
      }
    }, 200);
  };

  const handleQuickLogin = (account: UserAccount) => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const res = authenticateUser(account.username, account.password);
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError('Không thể đăng nhập bằng tài khoản này');
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 flex flex-col justify-between text-slate-100 antialiased p-3 sm:p-6">
      {/* Top Banner */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-amber-300">
              CÔNG AN PHƯỜNG / XÃ • ĐỀ ÁN 06/BCA
            </div>
            <div className="text-[10px] text-slate-400">
              Hệ thống xác thực & kiểm soát truy cập nghiệp vụ
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          className="text-xs text-slate-300 hover:text-amber-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/10"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Danh sách tài khoản & Mật khẩu</span>
        </button>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl border border-red-500/30 shadow-2xl shadow-red-950/50 overflow-hidden">
          {/* Header of Modal */}
          <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-900 px-6 py-5 text-center relative border-b border-amber-500/30">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/20 border-2 border-amber-300/50 flex items-center justify-center mb-3 shadow-lg">
              <ShieldCheck className="w-10 h-10 text-amber-300 drop-shadow" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
              ĐĂNG NHẬP HỆ THỐNG
            </h2>
            <p className="text-xs text-amber-200/90 font-medium mt-1">
              Cổng Quản Lý Nhiệm Vụ Công Tác Nghiệp Vụ
            </p>
          </div>

          {/* Tab Selector: Form vs 1-Click Demo */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-950/60 m-4 rounded-xl border border-slate-800">
            <button
              type="button"
              id="btn-tab-form-login"
              onClick={() => {
                setActiveTab('form');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'form'
                  ? 'bg-red-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Nhập Tài Khoản</span>
            </button>
            <button
              type="button"
              id="btn-tab-quick-login"
              onClick={() => {
                setActiveTab('quick');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'quick'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                  : 'text-amber-400 hover:text-amber-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đăng Nhập 1 Chạm</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-5 mb-4 p-3 rounded-xl bg-red-950/80 border border-red-600/50 text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form Tab */}
          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tên đăng nhập / Số điện thoại / Mã CB
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-login-username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="VD: maitritam@gmail.com, maitritam hoặc admin"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-login-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (Mặc định: 123 hoặc 123456)"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400">
                  <span>Mật khẩu mặc định: <b className="text-amber-300">123</b> hoặc <b className="text-amber-300">123456</b></span>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-amber-400 hover:underline"
                  >
                    Xem tài khoản?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-red-700 via-red-600 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block animate-pulse">Đang kiểm tra bảo mật...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>XÁC THỰC & ĐĂNG NHẬP</span>
                  </>
                )}
              </button>

              {/* Quick shortcut preview */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('quick')}
                  className="text-xs text-amber-300 hover:text-amber-200 flex items-center justify-center gap-1 mx-auto underline-offset-4 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hoặc bấm vào đây để chọn nhanh tài khoản thử nghiệm</span>
                </button>
              </div>
            </form>
          )}

          {/* Quick 1-Click Login Tab */}
          {activeTab === 'quick' && (
            <div className="px-5 pb-6 space-y-3">
              <p className="text-xs text-slate-300 mb-2">
                Chọn tài khoản bên dưới để đăng nhập ngay mà không cần gõ mật khẩu:
              </p>

              {/* Admin Accounts List */}
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider pt-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Ban Chỉ huy & Quản trị viên (Toàn quyền):</span>
              </div>

              <div className="space-y-2">
                {adminAccounts.map((admin) => {
                  const isPrimary = admin.username === 'maitritam' || admin.email === 'maitritam@gmail.com';
                  return (
                    <button
                      key={admin.id}
                      type="button"
                      id={`btn-quick-login-${admin.username}`}
                      onClick={() => handleQuickLogin(admin)}
                      className={`w-full text-left p-3 rounded-xl transition group flex items-center justify-between ${
                        isPrimary
                          ? 'bg-gradient-to-r from-red-950 via-amber-950/70 to-slate-900 border-2 border-amber-400 shadow-lg shadow-amber-900/30 hover:border-amber-300'
                          : 'bg-slate-950/80 hover:bg-slate-800 border border-amber-500/50 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg font-black flex items-center justify-center text-xs shadow ${
                          isPrimary ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300/60' : 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                        }`}>
                          BCH
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-amber-300">
                              {admin.rank} {admin.name}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              isPrimary ? 'bg-amber-400 text-slate-950 font-black' : 'bg-red-600 text-white'
                            }`}>
                              {isPrimary ? 'TÀI KHOẢN CỦA BẠN' : 'QUẢN TRỊ'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {admin.title} • {admin.email || admin.username}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  );
                })}
              </div>

              {/* Officers List */}
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2">
                Cán bộ Cảnh sát khu vực (CSKV):
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {officerAccounts.map((officer) => (
                  <button
                    key={officer.id}
                    type="button"
                    id={`btn-quick-login-${officer.username}`}
                    onClick={() => handleQuickLogin(officer)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/50 transition group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-900/60 border border-blue-400/40 text-blue-300 font-bold flex items-center justify-center text-xs">
                        {officer.rank.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                          {officer.rank} {officer.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {officer.assignedAreas?.join(', ') || 'Chưa gán tổ'} • SĐT: {officer.phone}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Continue as Guest Footer */}
          {onContinueAsGuest && (
            <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Chế độ trải nghiệm:</span>
              <button
                type="button"
                id="btn-continue-as-guest"
                onClick={onContinueAsGuest}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Xem nhanh với tư cách Khách</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Security Disclaimer Footer */}
      <div className="max-w-4xl w-full mx-auto text-center py-2 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/5">
        <div>
          Cổng Quản Lý Nhiệm Vụ Nghiệp Vụ CAND • Bảo mật cơ sở dữ liệu nội bộ
        </div>
        <div className="text-slate-500">
          Phiên bản 1.0 • Hỗ trợ Đề án 06 Chính phủ
        </div>
      </div>

      {/* Account Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Danh Sách Tài Khoản & Mật Khẩu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto text-xs text-slate-300 pr-1">
              <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-xl text-amber-200">
                <b>Mật khẩu mặc định:</b> Tất cả các tài khoản đều có mật khẩu mặc định là <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-300 font-mono font-bold">123</code> hoặc <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-300 font-mono font-bold">123456</code>.
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-red-950/70 border border-amber-500/60 rounded-xl space-y-2.5">
                  <div className="font-bold text-amber-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      1. Tài khoản Quản trị & Ban Chỉ huy (Toàn quyền):
                    </span>
                    <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-mono font-bold">ADMIN</span>
                  </div>

                  {adminAccounts.map((admin) => {
                    const isPrimary = admin.username === 'maitritam' || admin.email === 'maitritam@gmail.com';
                    return (
                      <div key={admin.id} className={`p-2.5 rounded-lg border text-[11px] ${
                        isPrimary ? 'bg-amber-500/10 border-amber-400/50' : 'bg-black/30 border-slate-700'
                      }`}>
                        <div className="font-bold text-white flex items-center justify-between">
                          <span className="text-amber-200">
                            {admin.rank} {admin.name} ({admin.title})
                          </span>
                          {isPrimary && (
                            <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">
                              TÀI KHOẢN CỦA BẠN
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 mt-1 space-y-0.5">
                          <div>
                            • Tên đăng nhập / Email: <code className="text-amber-300 font-mono bg-black/40 px-1.5 py-0.5 rounded font-bold">{admin.email || admin.username}</code> hoặc <code className="text-amber-300 font-mono bg-black/40 px-1.5 py-0.5 rounded font-bold">{admin.username}</code>
                          </div>
                          <div>
                            • Mật khẩu: <code className="text-white font-mono bg-black/40 px-1.5 py-0.5 rounded font-bold">{admin.password}</code> (hoặc 123456)
                          </div>
                          <div className="text-slate-400 text-[10px]">
                            • Quyền hạn: Toàn quyền quản trị, giao nhiệm vụ, phân công cán bộ, xuất dữ liệu.
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
                  <div className="font-bold text-blue-300">
                    2. Cán bộ Cảnh sát khu vực (CSKV):
                  </div>
                  {officerAccounts.map((officer) => (
                    <div key={officer.id} className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px]">
                      <div className="font-bold text-white flex justify-between">
                        <span>{officer.rank} {officer.name}</span>
                        <span className="text-slate-400 font-mono">{officer.assignedAreas?.join(', ')}</span>
                      </div>
                      <div className="text-slate-300 mt-0.5">
                        Tên đăng nhập: <code className="text-amber-300 font-mono">{officer.username}</code> hoặc SĐT: <code className="text-amber-300 font-mono">{officer.phone}</code> | Mật khẩu: <code className="text-amber-300 font-mono">123</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Đã hiểu, đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
