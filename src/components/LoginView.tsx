import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  HelpCircle,
  Cloud,
  CheckCircle2,
  KeyRound,
  X
} from 'lucide-react';
import {
  completePendingCloudAdmin,
  getCloudSession,
  loginWithCloudIdentifier,
  signUpFirstCloudAdmin
} from '../services/cloudAuth';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const [setupToken, setSetupToken] = useState('');
  const [setupUsername, setSetupUsername] = useState('maitritam');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupName, setSetupName] = useState('');
  const [setupRank, setSetupRank] = useState('Trung tá');
  const [setupTitle, setSetupTitle] = useState('Chỉ huy trưởng - Quản trị hệ thống');
  const [setupPhone, setSetupPhone] = useState('');
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [setupPending, setSetupPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await loginWithCloudIdentifier(identifier, password);
    setLoading(false);

    if (res.success && res.user) {
      onLoginSuccess(res.user);
      return;
    }

    setError(res.error || 'Đăng nhập không thành công.');
  };

  const openSetup = () => {
    setError(null);
    setSetupMessage(null);
    setSetupPending(false);
    setShowSetup(true);
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupMessage(null);
    setError(null);

    if (!setupToken.trim()) {
      setSetupMessage('Vui lòng nhập mã khởi tạo Cloud.');
      return;
    }
    if (!setupEmail.trim()) {
      setSetupMessage('Vui lòng nhập email quản trị.');
      return;
    }
    if (setupPassword.length < 8) {
      setSetupMessage('Mật khẩu quản trị Cloud phải có ít nhất 8 ký tự.');
      return;
    }
    if (!setupName.trim()) {
      setSetupMessage('Vui lòng nhập họ tên quản trị.');
      return;
    }

    setLoading(true);
    const result = await signUpFirstCloudAdmin({
      token: setupToken.trim(),
      username: setupUsername.trim(),
      email: setupEmail.trim(),
      password: setupPassword,
      name: setupName.trim(),
      rank: setupRank.trim(),
      title: setupTitle.trim(),
      phone: setupPhone.trim()
    });
    setLoading(false);

    if (result.success && result.user) {
      setShowSetup(false);
      onLoginSuccess(result.user);
      return;
    }

    if (result.success && result.pending) {
      setSetupPending(true);
      setSetupMessage(result.message || 'Đã tạo tài khoản. Hãy xác nhận email, sau đó bấm Hoàn tất khởi tạo.');
      return;
    }

    setSetupMessage(result.error || 'Không thể khởi tạo quản trị Cloud.');
  };

  const handleCompleteSetup = async () => {
    setSetupMessage(null);
    setLoading(true);
    const session = await getCloudSession();
    if (!session) {
      setLoading(false);
      setSetupMessage('Chưa có phiên Supabase Auth. Hãy xác nhận email trước, rồi bấm lại.');
      return;
    }

    const result = await completePendingCloudAdmin({
      token: setupToken.trim(),
      username: setupUsername.trim(),
      name: setupName.trim(),
      rank: setupRank.trim(),
      title: setupTitle.trim(),
      phone: setupPhone.trim()
    });
    setLoading(false);

    if (result.success && result.user) {
      setShowSetup(false);
      onLoginSuccess(result.user);
      return;
    }
    setSetupMessage(result.error || 'Không thể hoàn tất hồ sơ quản trị Cloud.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 flex flex-col justify-between text-slate-100 antialiased p-3 sm:p-6">
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-amber-300">
              CÔNG AN PHƯỜNG / XÃ • ĐỀ ÁN 06/BCA
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Cloud className="w-3 h-3 text-emerald-400" />
              Dữ liệu tập trung trên Supabase
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PWAInstallButton variant="navbar" />
          <button
            type="button"
            onClick={openSetup}
            className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/10 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Khởi tạo Cloud</span>
          </button>
        </div>
      </div>

      <OfflineIndicator />

      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-slate-900/95 backdrop-blur-md rounded-3xl border border-red-500/30 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-900 px-6 py-5 text-center border-b border-amber-500/30">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/20 border-2 border-amber-300/50 flex items-center justify-center mb-3 shadow-lg">
              <ShieldCheck className="w-10 h-10 text-amber-300" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
              ĐĂNG NHẬP HỆ THỐNG
            </h2>
            <p className="text-xs text-amber-200/90 font-medium mt-1">
              Cổng Quản Lý Nhiệm Vụ Công Tác • Cloud Database
            </p>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/80 border border-red-600/50 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Tên đăng nhập / Email / Số điện thoại
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nhập tài khoản Cloud"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400">
                <span>Mật khẩu mặc định: <b className="text-amber-300">123</b></span>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('maitritam');
                    setPassword('123');
                  }}
                  className="text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  Điền tài khoản Mai Trí Tâm
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-red-700 via-red-600 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="animate-pulse">Đang xác thực hệ thống...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>ĐĂNG NHẬP</span>
                </>
              )}
            </button>
          </form>

          <div className="px-6 pb-6">
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/40 text-[11px] text-emerald-200">
              <div className="font-bold flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5" />
                Dữ liệu dùng chung
              </div>
              <p className="mt-1 text-emerald-300/80">
                Nhiệm vụ, cán bộ, Tổ dân phố, tài liệu và báo cáo được lưu trên cơ sở dữ liệu trung tâm.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto text-center py-2 text-[11px] text-slate-400 border-t border-white/5">
        Cổng Quản Lý Nhiệm Vụ • Xác thực Supabase Auth • Phân quyền theo hồ sơ Cloud
      </div>

      {showSetup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-black text-white">KHỞI TẠO QUẢN TRỊ CLOUD</h3>
                  <p className="text-[10px] text-slate-400">Chỉ dùng một lần cho hệ thống mới</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowSetup(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 p-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs space-y-1">
              <div className="font-black text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Bạn không cần mã này để sử dụng phần mềm!</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Mã khởi tạo (Setup Token) chỉ dành cho kỹ thuật viên khi thiết lập máy chủ mới. Bạn chỉ cần bấm <b>Đóng</b> cửa sổ này và đăng nhập trực tiếp ở màn hình chính bằng tài khoản <b>maitritam</b> (mật khẩu mặc định: <b>123</b>).
              </p>
            </div>

            {setupMessage && (
              <div className="mt-3 p-3 rounded-xl bg-red-950/50 border border-red-600/40 text-red-200 text-xs flex items-start gap-2">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{setupMessage}</span>
              </div>
            )}

            <form onSubmit={handleSetup} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Mã khởi tạo Cloud *</label>
                <input
                  value={setupToken}
                  onChange={(e) => setSetupToken(e.target.value)}
                  placeholder="Nhập mã khởi tạo được cấp riêng"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={setupUsername} onChange={(e) => setSetupUsername(e.target.value)} placeholder="Tên đăng nhập" className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white" required />
                <input type="email" value={setupEmail} onChange={(e) => setSetupEmail(e.target.value)} placeholder="Email quản trị" className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white" required />
              </div>
              <input type="password" value={setupPassword} onChange={(e) => setSetupPassword(e.target.value)} placeholder="Mật khẩu Cloud (ít nhất 8 ký tự)" className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white" required />
              <input value={setupName} onChange={(e) => setSetupName(e.target.value)} placeholder="Họ và tên quản trị" className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white" required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={setupRank} onChange={(e) => setSetupRank(e.target.value)} placeholder="Cấp bậc" className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white" />
                <input value={setupPhone} onChange={(e) => setSetupPhone(e.target.value)} placeholder="Số điện thoại" className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white" />
              </div>
              <input value={setupTitle} onChange={(e) => setSetupTitle(e.target.value)} placeholder="Chức vụ" className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white" />

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                {setupPending && (
                  <button type="button" onClick={handleCompleteSetup} disabled={loading} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                    <CheckCircle2 className="w-4 h-4" /> Hoàn tất khởi tạo
                  </button>
                )}
                <button type="button" onClick={() => setShowSetup(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold">Đóng</button>
                <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black disabled:opacity-50">
                  {loading ? 'Đang khởi tạo...' : 'Tạo quản trị Cloud'}
                </button>
              </div>
            </form>

            <div className="mt-3 text-[10px] text-slate-500">
              Lưu ý: không dùng mã khởi tạo cho người khác. Mật khẩu chỉ được Supabase Auth lưu dưới dạng bảo mật.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
