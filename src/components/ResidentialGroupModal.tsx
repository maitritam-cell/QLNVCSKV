import React, { useState } from 'react';
import { ResidentialGroup, Staff } from '../types';
import {
  getResidentialGroups,
  saveResidentialGroups,
  addResidentialGroup,
  updateResidentialGroup,
  deleteResidentialGroup,
  reclassifyAllRecordsByResidentialGroup
} from '../data/storage';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Building,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Home,
  Check
} from 'lucide-react';

interface ResidentialGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  onDataUpdated: () => void;
}

export const ResidentialGroupModal: React.FC<ResidentialGroupModalProps> = ({
  isOpen,
  onClose,
  staffList,
  onDataUpdated
}) => {
  const [groups, setGroups] = useState<ResidentialGroup[]>(() => getResidentialGroups());
  const [isAdding, setIsAdding] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [householdCount, setHouseholdCount] = useState<string>('');
  const [populationCount, setPopulationCount] = useState<string>('');
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isReclassifying, setIsReclassifying] = useState(false);

  if (!isOpen) return null;

  const refreshList = () => {
    const list = getResidentialGroups();
    setGroups(list);
    onDataUpdated();
  };

  const resetForm = () => {
    setName('');
    setCode('');
    setHouseholdCount('');
    setPopulationCount('');
    setAssignedStaffIds([]);
    setNote('');
    setIsAdding(false);
    setEditingGroupId(null);
  };

  const handleStartEdit = (group: ResidentialGroup) => {
    setEditingGroupId(group.id);
    setName(group.name);
    setCode(group.code || '');
    setHouseholdCount(group.householdCount ? String(group.householdCount) : '');
    setPopulationCount(group.populationCount ? String(group.populationCount) : '');
    setAssignedStaffIds(group.assignedStaffIds || []);
    setNote(group.note || '');
    setIsAdding(true);
  };

  const toggleStaffAssignment = (staffId: string) => {
    setAssignedStaffIds((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên Tổ dân phố' });
      return;
    }

    if (editingGroupId) {
      updateResidentialGroup({
        id: editingGroupId,
        name: name.trim(),
        code: code.trim() || undefined,
        householdCount: householdCount ? Number(householdCount) : undefined,
        populationCount: populationCount ? Number(populationCount) : undefined,
        assignedStaffIds,
        note: note.trim() || undefined
      });
      setMessage({ type: 'success', text: `Đã cập nhật thông tin "${name}" thành công!` });
    } else {
      addResidentialGroup({
        name: name.trim(),
        code: code.trim() || undefined,
        householdCount: householdCount ? Number(householdCount) : undefined,
        populationCount: populationCount ? Number(populationCount) : undefined,
        assignedStaffIds,
        note: note.trim() || undefined
      });
      setMessage({ type: 'success', text: `Đã thêm mới "${name}" thành công!` });
    }

    resetForm();
    refreshList();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = (group: ResidentialGroup) => {
    if (confirm(`Bạn có chắc muốn xóa "${group.name}"? Dữ liệu cán bộ liên kết sẽ được cập nhật.`)) {
      deleteResidentialGroup(group.id);
      refreshList();
      setMessage({ type: 'success', text: `Đã xóa "${group.name}" thành công!` });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleReclassifyAll = () => {
    setIsReclassifying(true);
    setTimeout(() => {
      const res = reclassifyAllRecordsByResidentialGroup();
      setIsReclassifying(false);
      refreshList();
      setMessage({
        type: 'success',
        text: `Đã tự động phân loại lại ${res.total} chỉ tiêu cho các cán bộ phụ trách theo từng Tổ dân phố!`
      });
      setTimeout(() => setMessage(null), 4000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                QUẢN LÝ DANH SÁCH TỔ DÂN PHỐ
              </h3>
              <p className="text-[11px] text-slate-400">
                Tạo mới, chỉnh sửa, gán cán bộ phụ trách và tự động phân loại chỉ tiêu theo địa bàn
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

        {/* Feedback Alert */}
        {message && (
          <div
            className={`mt-3 p-2.5 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in shrink-0 ${
              message.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/80 border-red-500/50 text-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Top actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 shrink-0">
          <div className="text-xs text-slate-400">
            Tổng cộng: <b className="text-amber-300">{groups.length}</b> Tổ dân phố trên địa bàn
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleReclassifyAll}
              disabled={isReclassifying}
              className="px-3 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              title="Tự động quét toàn bộ chỉ tiêu và gán cho cán bộ đang phụ trách Tổ dân phố đó"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isReclassifying ? 'animate-spin' : ''}`} />
              <span>Tự động phân loại chỉ tiêu theo Tổ</span>
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsAdding(!isAdding);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? 'Đóng biểu mẫu' : 'Thêm Tổ Dân Phố Mới'}</span>
            </button>
          </div>
        </div>

        {/* Add / Edit Form */}
        {isAdding && (
          <form
            onSubmit={handleSubmit}
            className="p-4 mb-4 bg-slate-950/90 rounded-2xl border border-blue-500/40 space-y-3 shrink-0 text-xs animate-in fade-in"
          >
            <div className="font-bold text-blue-300 flex items-center justify-between">
              <span>{editingGroupId ? 'Chỉnh Sửa Thông Tin Tổ Dân Phố' : 'Thêm Tổ Dân Phố Mới'}</span>
              <button type="button" onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tên Tổ dân phố * (VD: Tổ 1 hoặc Tổ dân phố 1)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Tổ 1"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-400 focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mã định danh tổ (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="VD: TDP01"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-400 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Số hộ gia đình dự kiến
                </label>
                <input
                  type="number"
                  value={householdCount}
                  onChange={(e) => setHouseholdCount(e.target.value)}
                  placeholder="200"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tổng nhân khẩu
                </label>
                <input
                  type="number"
                  value={populationCount}
                  onChange={(e) => setPopulationCount(e.target.value)}
                  placeholder="850"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            {/* Select Assigned Officers */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Cán bộ phụ trách Tổ này (Có thể chọn 1 hoặc nhiều cán bộ):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                {staffList.map((staff) => {
                  const isChecked = assignedStaffIds.includes(staff.id);
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => toggleStaffAssignment(staff.id)}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between transition ${
                        isChecked
                          ? 'bg-blue-600/30 border-blue-400 text-white font-bold'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <div className="truncate text-xs">
                          {staff.rank} {staff.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{staff.phone}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-blue-500 text-white' : 'border border-slate-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Ghi chú địa bàn:</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Khu chung cư, khu tập thể..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md"
              >
                {editingGroupId ? 'Lưu Thay Đổi' : 'Tạo Tổ Dân Phố'}
              </button>
            </div>
          </form>
        )}

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {groups.map((group, idx) => {
            const assignedStaffNames = (group.assignedStaffIds || [])
              .map((id) => {
                const st = staffList.find((s) => s.id === id);
                return st ? `${st.rank} ${st.name}` : id;
              })
              .filter(Boolean);

            return (
              <div
                key={group.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-blue-950/80 border border-blue-800 flex items-center justify-center font-black text-xs text-blue-300 shrink-0 mt-0.5">
                    {idx + 1}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-white">{group.name}</span>
                      {group.code && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                          {group.code}
                        </span>
                      )}
                      {group.householdCount && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                          <Home className="w-3 h-3 text-slate-400" />
                          <span>{group.householdCount} hộ</span>
                        </span>
                      )}
                      {group.populationCount && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{group.populationCount} khẩu</span>
                        </span>
                      )}
                    </div>

                    {/* Assigned Officers */}
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span>Cán bộ phụ trách:</span>
                      </span>
                      {assignedStaffNames.length > 0 ? (
                        assignedStaffNames.map((name, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800 text-[11px] font-bold"
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-amber-400/90 italic text-[11px]">
                          Chưa phân công cán bộ phụ trách
                        </span>
                      )}
                    </div>

                    {group.note && (
                      <p className="text-[11px] text-slate-400 mt-1 italic">
                        {group.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(group)}
                    title="Chỉnh sửa thông tin tổ"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(group)}
                    title="Xóa tổ dân phố"
                    className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-900/80 text-red-400 hover:text-red-200 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            * Khi nhập Excel hoặc gán chỉ tiêu, hệ thống sẽ tự động phân loại đúng cán bộ phụ trách theo từng Tổ dân phố.
          </span>
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
