import React, { useEffect, useState } from 'react';
import { UserAccount, UserRole } from '../types';
import { isCloudReady, getStaffList } from '../data/storage';
import { supabase } from '../lib/supabase';
import { createCloudAccount, updateCloudAccount, deactivateCloudAccount, sendCloudPasswordReset } from '../services/cloudAuth';
import {
  getUserAccounts,
  addCustomAccount,
  updateUserAccount,
  deleteUserAccount,
  resetAccountPassword
} from '../data/storage';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Lock,
  User,
  Phone,
  Mail,
  Award,
  AlertCircle
} from 'lucide-react';

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountsUpdated?: () => void;
  currentUserId?: string;
}

export const AccountManagementModal: React.FC<AccountManagementModalProps> = ({
  isOpen,
  onClose,
  onAccountsUpdated,
  currentUserId
}) => {
  const [accounts, setAccounts] = useState<UserAccount[]>(() => getUserAccounts());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123');
  const [name, setName] = useState('');
  const [rank, setRank] = useState('Trung tá');
  const [title, setTitle] = useState('Chỉ huy - Quản trị viên');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cloudMode, setCloudMode] = useState(false);
  const [cloudStaffId, setCloudStaffId] = useState('');

  if (!isOpen) return null;

  const refreshAccounts = async () => {
    if (isCloudReady()) {
      setCloudMode(true);
      const { data, error } = await supabase.from('nv_profiles').select('*').order('role').order('full_name');
      if (!error && data) {
        setAccounts(data.map((row: any) => ({
          id: row.id, username: row.username, email: row.email || undefined, password: '',
          role: row.role, name: row.full_name, rank: row.rank, title: row.title, phone: row.phone,
          staffId: row.staff_id || undefined, assignedAreas: row.assigned_areas || []
        })));
      }
    } else {
      setCloudMode(false);
      setAccounts(getUserAccounts());
    }
    if (onAccountsUpdated) onAccountsUpdated();
  };

  useEffect(() => {
    if (isOpen) void refreshAccounts();
  }, [isOpen]);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setUsername('');
    setEmail('');
    setPassword('123');
    setName('');
    setRank('Trung tá');
    setTitle('Chỉ huy - Quản trị viên');
    setPhone('');
    setRole('admin');
    setCloudStaffId('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (acc: UserAccount) => {
    setEditingAccount(acc);
    setUsername(acc.username);
    setEmail(acc.email || '');
    setPassword(acc.password);
    setName(acc.name);
    setRank(acc.rank || 'Trung tá');
    setTitle(acc.title || 'Quản trị viên');
    setPhone(acc.phone || '');
    setRole(acc.role);
    setCloudStaffId(acc.staffId || '');
    setIsAddOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim()) {
      alert('Vui lòng điền đầy đủ Tên đăng nhập và Họ tên!');
      return;
    }

    if (editingAccount) {
      updateUserAccount({
        ...editingAccount,
        username: username.trim(),
        email: email.trim() || undefined,
        password: password.trim() || '123',
        name: name.trim(),
        rank: rank.trim(),
        title: title.trim(),
        phone: phone.trim(),
        role
      });
      setSuccessMsg(`Đã cập nhật thông tin tài khoản: ${name}`);
    } else {
      addCustomAccount({
        username: username.trim(),
        email: email.trim() || undefined,
        password: password.trim() || '123',
        name: name.trim(),
        rank: rank.trim(),
        title: title.trim(),
        phone: phone.trim(),
        role,
        assignedAreas: ['Toàn địa bàn']
      });
      setSuccessMsg(`Đã tạo tài khoản quản trị mới: ${name}`);
    }

    setIsAddOpen(false);
    refreshAccounts();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleResetPassword = (acc: UserAccount) => {
    if (confirm(`Đặt lại mật khẩu của tài khoản "${acc.name}" về mặc định "123"?`)) {
      resetAccountPassword(acc.id, '123');
      refreshAccounts();
      setSuccessMsg(`Đã đặt lại mật khẩu của ${acc.name} về "123"`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleDelete = (acc: UserAccount) => {
    if (acc.username === 'maitritam' || acc.email === 'maitritam@gmail.com') {
      alert('Không thể xóa tài khoản Quản trị viên chính!');
      return;
    }
    if (acc.id === currentUserId) {
      alert('Không thể xóa tài khoản đang đăng nhập!');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${acc.name}" (${acc.username})?`)) {
      deleteUserAccount(acc.id);
      refreshAccounts();
      setSuccessMsg(`Đã xóa tài khoản: ${acc.name}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const adminList = accounts.filter((a) => a.role === 'admin');
  const officerList = accounts.filter((a) => a.role === 'officer');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN HỆ THỐNG</span>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                  BCH / ADMIN
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Cổng phân quyền cán bộ, cấp phát mật khẩu và khởi tạo tài khoản quản trị
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between py-3 shrink-0">
          <div className="text-xs text-slate-400">
            Tổng cộng: <b className="text-amber-300">{accounts.length}</b> tài khoản ({adminList.length} Ban Chỉ huy, {officerList.length} Cán bộ CSKV)
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tạo Tài Khoản Quản Trị / Cán Bộ Mới</span>
          </button>
        </div>

        {/* Form Modal (Add / Edit) */}
        {isAddOpen && (
          <form
            onSubmit={handleSave}
            className="p-4 mb-4 bg-slate-950/90 rounded-2xl border border-amber-500/40 space-y-3 shrink-0 text-xs"
          >
            <div className="font-bold text-amber-300 flex items-center justify-between">
              <span>{editingAccount ? 'Chỉnh Sửa Tài Khoản' : 'Khởi Tạo Tài Khoản Quản Trị / Cán Bộ'}</span>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕ Hủy
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Họ và tên cán bộ / chỉ huy *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Mai Trí Tâm"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tên đăng nhập (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="VD: maitritam"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Email (nếu có)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VD: maitritam@gmail.com"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mật khẩu khởi tạo
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mặc định: 123"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Cấp bậc & Chức vụ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    placeholder="Trung tá, Đại úy..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Chỉ huy trưởng..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Số điện thoại & Vai trò
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0988.xxx.xxx"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-400 focus:outline-none font-mono"
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-400 focus:outline-none font-bold text-amber-300"
                  >
                    <option value="admin">Quản trị (Admin)</option>
                    <option value="officer">Cán bộ (CSKV)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {editingAccount ? (
                <button
                  type="button"
                  onClick={() => {
                    handleDelete(editingAccount);
                    setIsAddOpen(false);
                  }}
                  className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg font-bold flex items-center gap-1.5 transition text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Xóa Tài Khoản Này</span>
                </button>
              ) : <div />}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg shadow"
                >
                  {editingAccount ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Accounts List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* 1. Admins */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Tài Khoản Ban Chỉ Huy & Quản Trị Viên ({adminList.length})</span>
            </div>

            {adminList.map((acc) => {
              const isPrimary = acc.username === 'maitritam' || acc.email === 'maitritam@gmail.com';
              return (
                <div
                  key={acc.id}
                  className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPrimary
                      ? 'bg-gradient-to-r from-red-950/80 via-amber-950/60 to-slate-900 border-amber-400 shadow-md'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                      isPrimary ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300' : 'bg-red-800 text-white'
                    }`}>
                      BCH
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-white">
                          {acc.rank} {acc.name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.2 rounded font-black ${
                          isPrimary ? 'bg-amber-400 text-slate-950' : 'bg-red-600 text-white'
                        }`}>
                          {isPrimary ? 'TÀI KHOẢN CỦA BẠN' : 'QUẢN TRỊ'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{acc.title}</span>
                        <span>•</span>
                        <span className="font-mono text-amber-300 font-bold">User: {acc.username}</span>
                        {acc.email && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-blue-300">{acc.email}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-mono text-slate-400">MK: {acc.password}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      title="Đặt lại mật khẩu về 123"
                      onClick={() => handleResetPassword(acc)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Reset MK</span>
                    </button>
                    <button
                      type="button"
                      title="Sửa thông tin"
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!isPrimary && (
                      <button
                        type="button"
                        title="Xóa tài khoản"
                        onClick={() => handleDelete(acc)}
                        className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-400 hover:text-red-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Officers */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-400" />
              <span>Tài Khoản Cán Bộ Cảnh Sát Khu Vực ({officerList.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {officerList.map((acc) => (
                <div
                  key={acc.id}
                  className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white truncate">
                      {acc.rank} {acc.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      User: <code className="text-amber-300 font-mono">{acc.username}</code> | MK: <code className="text-slate-300 font-mono">{acc.password}</code>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {acc.assignedAreas?.join(', ') || 'Chưa gán tổ'} • {acc.phone}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Đặt lại mật khẩu về 123"
                      onClick={() => handleResetPassword(acc)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold"
                    >
                      Reset MK
                    </button>
                    <button
                      type="button"
                      title="Sửa thông tin"
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      title="Xóa tài khoản này"
                      onClick={() => handleDelete(acc)}
                      className="p-1 rounded bg-red-950/80 hover:bg-red-900 text-red-400 hover:text-red-200 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div>
            * Mật khẩu mặc định hệ thống cho tài khoản mới hoặc sau khi reset: <b className="text-amber-300 font-mono">123</b>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
