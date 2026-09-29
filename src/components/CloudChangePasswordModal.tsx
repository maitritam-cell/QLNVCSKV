import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface CloudChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordChanged: (message: string) => void;
}

export const CloudChangePasswordModal: React.FC<CloudChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onPasswordChanged
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);

    // The password must be changed against the authenticated Supabase session.
    // It is intentionally not copied to localStorage or nv_profiles.
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      setLoading(false);
      setError('Phiên đăng nhập Cloud đã hết hạn. Vui lòng đăng nhập lại trước khi đổi mật khẩu.');
      return;
    }

    const { data: updatedData, error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    setLoading(false);

    if (updateError || !updatedData.user) {
      setError(updateError?.message || 'Không thể cập nhật mật khẩu Cloud.');
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    onPasswordChanged('Đã thay đổi mật khẩu Cloud trên máy chủ. Xóa dữ liệu web sẽ không làm mật khẩu quay về mặc định ✓');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-red-900 to-amber-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-300" />
            <h3 className="font-black text-sm sm:text-base">ĐỔI MẬT KHẨU CLOUD</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
            <b>Bảo mật:</b> mật khẩu được Supabase Auth quản lý, không lưu trong hồ sơ ứng dụng.
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu mới</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 8 ký tự"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:border-red-500 outline-none"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:border-red-500 outline-none"
              required
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-black text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Đang lưu...' : 'Lưu mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
