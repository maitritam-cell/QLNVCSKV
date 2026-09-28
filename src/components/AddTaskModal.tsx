import React, { useEffect, useState } from 'react';
import { X, PlusCircle, AlertCircle } from 'lucide-react';
import { TaskType, Staff } from '../types';
import { TASK_CONFIG, getTaskCategories, getResidentialGroups } from '../data/storage';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  currentTaskType: TaskType;
  onAddTask: (taskType: TaskType, recordData: any) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  staffList,
  currentTaskType,
  onAddTask
}) => {
  const [selectedTask, setSelectedTask] = useState<TaskType>(currentTaskType);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
  const residentialGroups = getResidentialGroups();
  const residentialGroupSignature = residentialGroups.map((g) => `${g.id}:${g.name}`).join('|');

  const [hoTen, setHoTen] = useState('');
  const [toDanPho, setToDanPho] = useState<string>(residentialGroups[0]?.name || '');
  const [info1, setInfo1] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Specific to Dat dai / Matuy
  const [cmnd, setCmnd] = useState('');
  const [namSinh, setNamSinh] = useState('');
  const [diaChi, setDiaChi] = useState('');

  const categories = getTaskCategories();

  useEffect(() => {
    if (!isOpen) return;
    setToDanPho((current) =>
      residentialGroups.some((g) => g.name === current)
        ? current
        : (residentialGroups[0]?.name || '')
    );
  }, [isOpen, residentialGroupSignature]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
    const staffName = selectedStaff ? selectedStaff.name : 'Cán bộ phụ trách';

    if (!toDanPho.trim()) {
      setError('Vui lòng chọn Tổ dân phố từ danh sách quản lý');
      return;
    }

    if (selectedTask === 'hkcch') {
      if (!hoTen.trim()) {
        setError('Vui lòng nhập họ và tên chủ hộ');
        return;
      }
      onAddTask('hkcch', {
        hoTen: hoTen.trim(),
        info1: info1.trim() || `HS-${Date.now().toString().slice(-4)}`,
        toDanPho: toDanPho.trim(),
        staffId: selectedStaffId,
        staffName,
        isDone: false,
        note: '',
      });
    } else if (selectedTask === 'matuy') {
      if (!hoTen.trim()) {
        setError('Vui lòng nhập họ và tên đối tượng');
        return;
      }
      onAddTask('matuy', {
        hoTen: hoTen.trim(),
        namSinh: namSinh.trim() || '1995',
        cmnd: cmnd.trim() || '',
        info1: info1.trim() || 'Diện quản lý theo dõi',
        toDanPho: toDanPho.trim(),
        staffId: selectedStaffId,
        staffName,
        isDone: false,
      });
    } else if (selectedTask === 'dcttp') {
      const targetCount = parseInt(info1, 10) || 50;
      onAddTask('dcttp', {
        hoTen: toDanPho.trim(),
        info1: targetCount,
        toDanPho: toDanPho.trim(),
        staffId: selectedStaffId,
        staffName,
        isDone: false,
      });
    } else if (selectedTask === 'datdai') {
      if (!hoTen.trim()) {
        setError('Vui lòng nhập họ và tên chủ hộ');
        return;
      }
      onAddTask('datdai', {
        chuHo: hoTen.trim(),
        cmnd: cmnd.trim() || '012345678',
        namSinh: namSinh.trim() || '1980',
        diaChi: diaChi.trim() || 'Tổ dân phố 1',
        toDanPho: toDanPho.trim(),
        staffId: selectedStaffId,
        staffName,
        isDone: false,
      });
    } else {
      // Custom task category
      if (!hoTen.trim()) {
        setError('Vui lòng nhập họ tên hoặc tiêu đề mục tiêu');
        return;
      }
      onAddTask(selectedTask, {
        hoTen: hoTen.trim(),
        info1: info1.trim() || '',
        toDanPho: toDanPho.trim(),
        staffId: selectedStaffId,
        staffName,
        isDone: false,
        note: ''
      });
    }

    // Reset fields & close
    setHoTen('');
    setInfo1('');
    setCmnd('');
    setNamSinh('');
    setDiaChi('');
    setToDanPho('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-800 to-amber-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-300" />
            <h3 className="font-extrabold text-base tracking-tight">THÊM BẢN GHI CHỈ TIÊU MỚI</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-5 mt-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Select Task Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Loại chỉ tiêu nhiệm vụ:
            </label>
            <select
              id="select-modal-task"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value as TaskType)}
              className="w-full p-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-hidden"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title} ({cat.shortTitle})
                </option>
              ))}
            </select>
          </div>

          {/* Select Assigned Officer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Cán bộ phụ trách địa bàn:
            </label>
            <select
              id="select-modal-staff"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-hidden"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.rank || 'Cán bộ'})
                </option>
              ))}
            </select>
          </div>

          {/* Tổ dân phố is selected from the administrator-managed master list */}
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tổ dân phố / Địa bàn:
            </label>
            <select
              id="select-modal-residential-group"
              required
              value={toDanPho}
              onChange={(e) => setToDanPho(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-hidden"
            >
              <option value="">-- Chọn Tổ dân phố --</option>
              {residentialGroups.map((group) => (
                <option key={group.id} value={group.name}>
                  {group.name}{group.code ? ` (${group.code})` : ''}
                </option>
              ))}
            </select>
            {residentialGroups.length === 0 && (
              <p className="mt-1 text-[11px] text-red-600 font-semibold">
                Chưa có Tổ dân phố. Quản trị viên cần tạo danh sách Tổ dân phố trước.
              </p>
            )}
          </div>

          {/* Dynamic Inputs depending on task */}
          {selectedTask === 'hkcch' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ tên chủ hộ cũ (hoặc đại diện hộ):
                </label>
                <input
                  type="text"
                  required
                  value={hoTen}
                  onChange={(e) => setHoTen(e.target.value)}
                  placeholder="VD: Nguyễn Văn Minh"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số hồ sơ quản lý:
                  </label>
                  <input
                    type="text"
                    value={info1}
                    onChange={(e) => setInfo1(e.target.value)}
                    placeholder="VD: HS-2024-0099"
                    className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

              </div>
            </div>
          )}

          {selectedTask === 'matuy' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ tên đối tượng:
                </label>
                <input
                  type="text"
                  required
                  value={hoTen}
                  onChange={(e) => setHoTen(e.target.value)}
                  placeholder="VD: Lê Quốc Toàn"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Năm sinh:
                  </label>
                  <input
                    type="text"
                    value={namSinh}
                    onChange={(e) => setNamSinh(e.target.value)}
                    placeholder="VD: 1997"
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số CMND / CCCD:
                  </label>
                  <input
                    type="text"
                    value={cmnd}
                    onChange={(e) => setCmnd(e.target.value)}
                    placeholder="VD: 012345678"
                    className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Diện quản lý / Hồ sơ:
                  </label>
                  <input
                    type="text"
                    value={info1}
                    onChange={(e) => setInfo1(e.target.value)}
                    placeholder="VD: Đối tượng nghi vấn / MT-34"
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

              </div>
            </div>
          )}

          {selectedTask === 'dcttp' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chỉ tiêu nhân khẩu cần điều chỉnh:
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={info1}
                  onChange={(e) => setInfo1(e.target.value)}
                  placeholder="VD: 120"
                  className="w-full p-2.5 text-xs font-bold font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {selectedTask === 'datdai' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ tên chủ hộ / người đứng tên:
                </label>
                <input
                  type="text"
                  required
                  value={hoTen}
                  onChange={(e) => setHoTen(e.target.value)}
                  placeholder="VD: Hoàng Văn Hưng"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số CMND 9 số cũ:
                  </label>
                  <input
                    type="text"
                    value={cmnd}
                    onChange={(e) => setCmnd(e.target.value)}
                    placeholder="VD: 012398765"
                    className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Năm sinh:
                  </label>
                  <input
                    type="text"
                    value={namSinh}
                    onChange={(e) => setNamSinh(e.target.value)}
                    placeholder="VD: 1978"
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa chỉ thửa đất / nơi cư trú:
                </label>
                <input
                  type="text"
                  value={diaChi}
                  onChange={(e) => setDiaChi(e.target.value)}
                  placeholder="VD: Số 42 Đường Trần Phú, TDP 2"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              id="btn-modal-submit-add"
              className="px-5 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-md transition active:scale-95"
            >
              Thêm bản ghi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
