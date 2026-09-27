import React, { useState } from 'react';
import { TaskCategoryConfig } from '../types';
import {
  getTaskCategories,
  saveTaskCategories,
  addTaskCategory,
  deleteTaskCategory,
  DEFAULT_TASK_CATEGORIES
} from '../data/storage';
import {
  X,
  Plus,
  Trash2,
  ListFilter,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';

interface ManageTaskCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated: () => void;
}

const COLOR_OPTIONS = [
  { id: 'blue', label: 'Xanh dương', bg: 'bg-blue-600', ring: 'ring-blue-400' },
  { id: 'amber', label: 'Vàng cam', bg: 'bg-amber-600', ring: 'ring-amber-400' },
  { id: 'emerald', label: 'Xanh lục', bg: 'bg-emerald-600', ring: 'ring-emerald-400' },
  { id: 'purple', label: 'Tím đậm', bg: 'bg-purple-600', ring: 'ring-purple-400' },
  { id: 'rose', label: 'Đỏ hồng', bg: 'bg-rose-600', ring: 'ring-rose-400' },
  { id: 'cyan', label: 'Xanh ngọc', bg: 'bg-cyan-600', ring: 'ring-cyan-400' }
];

export const ManageTaskCategoriesModal: React.FC<ManageTaskCategoriesModalProps> = ({
  isOpen,
  onClose,
  onCategoriesUpdated
}) => {
  const [categories, setCategories] = useState<TaskCategoryConfig[]>(() => getTaskCategories());
  const [isAdding, setIsAdding] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<TaskCategoryConfig | null>(null);

  // New Category Form State
  const [title, setTitle] = useState('');
  const [shortTitle, setShortTitle] = useState('');
  const [unit, setUnit] = useState('mục');
  const [badge, setBadge] = useState('Chỉ tiêu mới');
  const [color, setColor] = useState('blue');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshList = () => {
    const list = getTaskCategories();
    setCategories(list);
    onCategoriesUpdated();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Vui lòng nhập tên đầy đủ của chỉ tiêu nhiệm vụ');
      return;
    }

    if (!shortTitle.trim()) {
      setError('Vui lòng nhập tên viết tắt');
      return;
    }

    addTaskCategory({
      title: title.trim(),
      shortTitle: shortTitle.trim(),
      unit: unit.trim() || 'hồ sơ',
      badge: badge.trim() || 'Chỉ tiêu',
      color,
      isCustom: true
    });

    // Reset form
    setTitle('');
    setShortTitle('');
    setUnit('mục');
    setBadge('Chỉ tiêu mới');
    setColor('blue');
    setIsAdding(false);
    refreshList();

    setSuccessMsg('Đã thêm chỉ tiêu nhiệm vụ mới thành công!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    deleteTaskCategory(categoryToDelete.id);
    setCategoryToDelete(null);
    refreshList();
    setSuccessMsg(`Đã xóa chỉ tiêu "${categoryToDelete.title}" khỏi hệ thống!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleRestoreDefaults = () => {
    saveTaskCategories(DEFAULT_TASK_CATEGORIES);
    refreshList();
    setSuccessMsg('Đã khôi phục 4 chỉ tiêu công tác mặc định!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>QUẢN LÝ DANH MỤC CHỈ TIÊU NHIỆM VỤ</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Thêm chỉ tiêu nhiệm vụ mới hoặc xóa bỏ các chỉ tiêu không còn theo dõi
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

        {/* Success or Error alert */}
        {successMsg && (
          <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Top actions bar */}
        <div className="flex items-center justify-between py-3 shrink-0">
          <div className="text-xs text-slate-400">
            Hiện có: <b className="text-amber-300">{categories.length}</b> chỉ tiêu nhiệm vụ
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
              title="Khôi phục danh mục 4 chỉ tiêu mặc định"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Khôi phục mặc định</span>
            </button>
            <button
              type="button"
              id="btn-open-add-category"
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Chỉ Tiêu Mới</span>
            </button>
          </div>
        </div>

        {/* Add Form */}
        {isAdding && (
          <form
            onSubmit={handleCreate}
            className="p-4 mb-4 bg-slate-950/90 rounded-2xl border border-amber-500/40 space-y-3 shrink-0 text-xs"
          >
            <div className="font-bold text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Khởi Tạo Chỉ Tiêu Nhiệm Vụ Mới</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2 bg-red-950 border border-red-600/50 text-red-200 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Tên đầy đủ của chỉ tiêu nhiệm vụ *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Vận động thu hồi vũ khí, VLN, CCHT"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-400 focus:outline-hidden font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tên viết tắt *
                </label>
                <input
                  type="text"
                  required
                  value={shortTitle}
                  onChange={(e) => setShortTitle(e.target.value)}
                  placeholder="VD: Thu hồi VK"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Đơn vị tính
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="VD: khẩu / vụ / người / hộ"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Huy hiệu / Phân loại
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="VD: Chỉ tiêu 5, Đề án 06..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Màu sắc đại diện:
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
                      color === c.id
                        ? `${c.bg} text-white ring-2 ${c.ring} shadow-md`
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                id="btn-submit-add-category"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg shadow-md"
              >
                Lưu & Thêm Chỉ Tiêu
              </button>
            </div>
          </form>
        )}

        {/* Delete Confirmation In-Modal Alert */}
        {categoryToDelete && (
          <div className="p-4 mb-4 bg-red-950/90 rounded-2xl border border-red-500 text-xs shrink-0 animate-in zoom-in-95">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-red-200 text-sm">
                  Xác nhận xóa chỉ tiêu: "{categoryToDelete.title}"?
                </div>
                <p className="text-red-300/80 mt-1 leading-relaxed">
                  Chỉ tiêu này sẽ bị gỡ bỏ khỏi thanh chọn nhiệm vụ và báo cáo thống kê. Dữ liệu liên quan đến chỉ tiêu này cũng sẽ bị xóa.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-black shadow-md"
                  >
                    Xác nhận xóa vĩnh viễn
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-amber-300 shrink-0">
                  {idx + 1}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs sm:text-sm text-white">
                      {cat.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-black bg-slate-800 text-amber-300 border border-slate-700">
                      {cat.shortTitle}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                      {cat.badge}
                    </span>
                    {cat.isCustom && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Chỉ tiêu tự tạo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Đơn vị tính: <strong className="text-slate-200">{cat.unit}</strong> • Mã hệ thống: <code className="text-slate-400 font-mono">{cat.id}</code>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="shrink-0 flex items-center gap-1.5">
                <button
                  type="button"
                  title="Xóa chỉ tiêu này"
                  onClick={() => setCategoryToDelete(cat)}
                  className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-900/80 text-red-400 hover:text-red-200 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>* Các chỉ tiêu sau khi thêm/xóa sẽ tự động cập nhật vào toàn bộ hệ thống.</span>
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
