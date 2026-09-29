import React, { useEffect, useState } from 'react';
import { UserAccount, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { getStaffList, isCloudReady } from '../data/storage';
import {
  createCloudAccount,
  updateCloudAccount,
  deactivateCloudAccount,
  sendCloudPasswordReset
} from '../services/cloudAuth';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  User,
  Mail,
  Users,
  AlertCircle,
  Cloud,
  Ban,
  RefreshCw
} from 'lucide-react';

interface CloudAccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onAccountsUpdated?: () => void;
}

export const CloudAccountManagementModal: React.FC<CloudAccountManagementModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onAccountsUpdated
}) => {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rank, setRank] = useState('Đại úy');
  const [title, setTitle] = useState('Cảnh sát khu vực');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('officer');
  const [staffId, setStaffId] = useState('');

  const loadAccounts = async () => {
    if (!isCloudReady()) return;
    setLoading(true);
    const { data, error } = await supabase.from('nv_profiles').select('*').order('role').order('full_name');
    setLoading(false);

    if (error) {
      setFeedback({ type: 'error', text: error.message || 'Không tải được tài khoản Cloud.' });
      return;
    }

    setAccounts((data || []).map((row: any) => ({
      id: row.id,
      username: row.username,
      email: row.email || undefined,
      password: '',
      role: row.role,
      name: row.full_name,
      rank: row.rank || '',
      title: row.title || '',
      phone: row.phone || '',
      staffId: row.staff_id || undefined,
      assignedAreas: row.assigned_areas || []
    })));
  };

  useEffect(() => {
    if (isOpen) void loadAccounts();
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditing(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setName('');
    setRank('Đại úy');
    setTitle('Cảnh sát khu vực');
    setPhone('');
    setRole('officer');
    setStaffId('');
    setIsFormOpen(false);
  };

  const openAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (account: UserAccount) => {
    setEditing(account);
    setUsername(account.username);
    setEmail(account.email || '');
    setPassword('');
    setName(account.name);
    setRank(account.rank || 'Đại úy');
    setTitle(account.title || 'Cảnh sát khu vực');
    setPhone(account.phone || '');
    setRole(account.role);
    setStaffId(account.staffId || '');
    setIsFormOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    if (!username.trim() || !name.trim() || !email.trim()) {
      setFeedback({ type: 'error', text: 'Vui lòng nhập tên đăng nhập, email và họ tên.' });
      return;
    }

    const selectedStaff = getStaffList().find((staff) => staff.id === staffId);
    const assignedAreas = role === 'officer' ? (selectedStaff?.assignedAreas || []) : ['Toàn địa bàn'];

    setLoading(true);

    if (editing) {
      const result = await updateCloudAccount({
        id: editing.id,
        username: username.trim(),
        email: email.trim(),
        password: '',
        name: name.trim(),
        rank: rank.trim(),
        title: title.trim(),
        phone: phone.trim(),
        role,
        staffId: role === 'officer' ? staffId || undefined : undefined,
        assignedAreas
      });

      setLoading(false);

      if (!result.success) {
        setFeedback({ type: 'error', text: result.error || 'Không thể cập nhật tài khoản.' });
        return;
      }

      setFeedback({ type: 'success', text: 'Đã cập nhật hồ sơ tài khoản Cloud.' });
    } else {
      if (password.length < 8) {
        setLoading(false);
        setFeedback({ type: 'error', text: 'Mật khẩu tài khoản mới phải có ít nhất 8 ký tự.' });
        return;
      }

      if (role === 'officer' && !staffId) {
        setLoading(false);
        setFeedback({ type: 'error', text: 'Hãy gắn tài khoản với một cán bộ CSKV.' });
        return;
      }

      const result = await createCloudAccount({
        username: username.trim(),
        email: email.trim(),
        password,
        name: name.trim(),
        rank: rank.trim(),
        title: title.trim(),
        phone: phone.trim(),
        role,
        staffId: role === 'officer' ? staffId : undefined,
        assignedAreas
      });

      setLoading(false);

      if (!result.success) {
        setFeedback({ type: 'error', text: result.error || 'Không thể tạo tài khoản Cloud.' });
        return;
      }

      setFeedback({
        type: 'success',
        text: result.emailConfirmed
          ? 'Đã tạo tài khoản Cloud và có thể đăng nhập.'
          : 'Đã tạo tài khoản Cloud. Người dùng cần xác nhận email trước khi đăng nhập.'
      });
    }

    setIsFormOpen(false);
    await loadAccounts();
    onAccountsUpdated?.();
  };

  const handleReset = async (account: UserAccount) => {
    if (!account.email) {
      setFeedback({ type: 'error', text: 'Tài khoản chưa có email.' });
      return;
    }

    if (!window.confirm(`Gửi liên kết đặt lại mật khẩu cho ${account.email}?`)) return;

    setLoading(true);
    const result = await sendCloudPasswordReset(account.email);
    setLoading(false);

    setFeedback(
      result.success
        ? { type: 'success', text: `Đã gửi email đặt lại mật khẩu cho ${account.email}.` }
        : { type: 'error', text: result.error || 'Không gửi được email.' }
    );
  };

  const handleDisable = async (account: UserAccount) => {
    if (account.id === currentUserId) {
      setFeedback({ type: 'error', text: 'Không thể vô hiệu hóa tài khoản đang đăng nhập.' });
      return;
    }

    if (!window.confirm(`Vô hiệu hóa tài khoản ${account.name}? Hồ sơ và lịch sử nhiệm vụ vẫn được giữ lại.`)) {
      return;
    }

    setLoading(true);
    const result = await deactivateCloudAccount(account.id);
    setLoading(false);

    if (!result.success) {
      setFeedback({ type: 'error', text: result.error || 'Không thể vô hiệu hóa tài khoản.' });
      return;
    }

    setFeedback({ type: 'success', text: `Đã vô hiệu hóa tài khoản ${account.name}.` });
    await loadAccounts();
    onAccountsUpdated?.();
  };

  const admins = accounts.filter((account) => account.role === 'admin');
  const officers = accounts.filter((account) => account.role === 'officer');

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl text-slate-100">
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-red-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base">QUẢN LÝ TÀI KHOẢN CLOUD</h2>
              <p className="text-[10px] text-slate-400">Supabase Auth • hồ sơ và phân quyền tập trung</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 max-h-[calc(92vh-72px)] overflow-y-auto">
          {feedback && (
            <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-950/60 border border-emerald-600 text-emerald-200' : 'bg-red-950/60 border border-red-600 text-red-200'}`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="text-xs text-slate-400">
              Tổng: <b className="text-white">{accounts.length}</b> tài khoản • {admins.length} quản trị • {officers.length} cán bộ
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void loadAccounts()}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
              </button>
              <button
                type="button"
                onClick={openAdd}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" /> Tạo tài khoản
              </button>
            </div>
          </div>

          {isFormOpen && (
            <form onSubmit={handleSave} className="mb-5 p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-amber-300">{editing ? 'SỬA TÀI KHOẢN CLOUD' : 'TẠO TÀI KHOẢN CLOUD'}</h3>
                <button type="button" onClick={resetForm} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Họ và tên" required className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white" />
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tên đăng nhập" required className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white" />
                {!editing && <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu (ít nhất 8 ký tự)" required className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white" />}
                <input value={rank} onChange={(e) => setRank(e.target.value)} placeholder="Cấp bậc" className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white" />
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chức vụ" className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số điện thoại" className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white" />
                <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold">
                  <option value="officer">Cán bộ / CSKV</option>
                  <option value="admin">Quản trị / Ban chỉ huy</option>
                </select>
              </div>

              {role === 'officer' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Gắn với cán bộ CSKV</label>
                  <select value={staffId} onChange={(e) => setStaffId(e.target.value)} required className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white">
                    <option value="">-- Chọn cán bộ --</option>
                    {getStaffList().map((staff) => (
                      <option key={staff.id} value={staff.id}>{staff.rank} {staff.name} ({staff.id})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Hủy</button>
                <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black">
                  {editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {[{title:'Ban chỉ huy / Quản trị',items:admins,icon:<ShieldCheck className="w-4 h-4 text-amber-400" />},{title:'Cán bộ / CSKV',items:officers,icon:<Users className="w-4 h-4 text-blue-400" />}].map((group) => (
              <section key={group.title}>
                <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  {group.icon}<span>{group.title} ({group.items.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {group.items.map((account) => (
                    <div key={account.id} className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-black text-white text-sm">{account.rank} {account.name}</div>
                          <div className="text-[11px] text-amber-300 font-mono mt-0.5">{account.username}</div>
                          <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                            <span>{account.email || 'Chưa có email'}</span>
                            <span>{account.phone}</span>
                            {account.staffId && <span>CB: {account.staffId}</span>}
                          </div>
                          <div className="mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${account.role === 'admin' ? 'text-amber-300 bg-amber-950/40 border-amber-800' : 'text-blue-300 bg-blue-950/40 border-blue-800'}`}>
                              {account.role === 'admin' ? 'ADMIN' : 'CÁN BỘ'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => openEdit(account)} className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white" title="Sửa"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => void handleReset(account)} className="p-1.5 rounded-lg bg-slate-800 text-amber-300" title="Gửi link reset mật khẩu"><KeyRound className="w-3.5 h-3.5" /></button>
                          {account.id !== currentUserId && (
                            <button type="button" onClick={() => void handleDisable(account)} className="p-1.5 rounded-lg bg-red-950 text-red-300 hover:bg-red-900" title="Vô hiệu hóa">
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-5 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-[11px] text-emerald-200">
            <div className="font-bold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Tài khoản Cloud</div>
            <p className="mt-1 text-emerald-300/80">
              Mật khẩu không được lưu trong hồ sơ ứng dụng. Supabase Auth quản lý xác thực; quản trị viên chỉ quản lý thông tin hồ sơ và phân quyền.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
