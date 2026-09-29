import React, { useState, useEffect } from 'react';
import { X, PlusCircle, AlertCircle, Building, Check, Sparkles, Settings } from 'lucide-react';
import { TaskType, Staff, ResidentialGroup } from '../types';
import { getTaskCategories, getResidentialGroups, findOfficerForResidentialGroup } from '../data/storage';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  currentTaskType: TaskType;
  onAddTask: (taskType: TaskType, recordData: any) => void;
  onOpenResidentialGroupManager?: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  staffList,
  currentTaskType,
  onAddTask,
  onOpenResidentialGroupManager
}) => {
  const [selectedTask, setSelectedTask] = useState<TaskType>(currentTaskType);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
  const [hoTen, setHoTen] = useState('');
  const [toDanPho, setToDanPho] = useState('');
  const [customToDanPho, setCustomToDanPho] = useState('');
  const [isCustomTdp, setIsCustomTdp] = useState(false);
  const [info1, setInfo1] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [autoAssignedNote, setAutoAssignedNote] = useState<string | null>(null);

  // Specific to Dat dai / Matuy
  const [cmnd, setCmnd] = useState('');
  const [namSinh, setNamSinh] = useState('');
  const [diaChi, setDiaChi] = useState('');

  const categories = getTaskCategories();
  const residentialGroups: ResidentialGroup[] = getResidentialGroups();

  useEffect(() => {
    if (isOpen) {
      setSelectedTask(currentTaskType);
      if (residentialGroups.length > 0 && !toDanPho) {
        const initialGroup = residentialGroups[0].name;
        setToDanPho(initialGroup);
        const officer = findOfficerForResidentialGroup(initialGroup);
        if (officer) {
          setSelectedStaffId(officer.id);
          setAutoAssignedNote(`Đã tự động chọn cán bộ phụ trách: ${officer.rank} ${officer.name}`);
        } else if (staffList[0]) {
          setSelectedStaffId(staffList[0].id);
        }
      }
    }
  }, [isOpen, currentTaskType]);

  if (!isOpen) return null;

  const handleResidentialGroupChange = (value: string) => {
    if (value === '__custom__') {
      setIsCustomTdp(true);
      setAutoAssignedNote(null);
      return;
    }

    setIsCustomTdp(false);
    setToDanPho(value);

    // If task is 'dcttp', pre-fill the name field with this residential group!
    if (selectedTask === 'dcttp') {
      setHoTen(value);
      const foundGroup = residentialGroups.find((g) => g.name === value);
      if (foundGroup && foundGroup.populationCount) {
        setInfo1(String(foundGroup.populationCount));
      }
    }

    // Auto find officer responsible for this group
    const officer = findOfficerForResidentialGroup(value);
    if (officer) {
      setSelectedStaffId(officer.id);
      setAutoAssignedNote(`Đã gán tự động cho ${officer.rank} ${officer.name} phụ trách địa bàn`);
    } else {
      setAutoAssignedNote(null);
    }
  };

  const effectiveToDanPho = isCustomTdp ? customToDanPho.trim() : toDanPho;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
    const staffName = selectedStaff ? `${selectedStaff.rank} ${selectedStaff.name}` : 'Cán bộ phụ trách';
    const finalTdp = effectiveToDanPho || 'Tổ dân phố 1';

    if (selectedTask === 'hkcch') {
      if (!hoTen.trim()) {
        setError('Vui lòng nhập họ và tên chủ hộ');
        return;
      }
      onAddTask('hkcch', {
        hoTen: hoTen.trim(),
        info1: info1.trim() || `HS-${Date.now().toString().slice(-4)}`,
        toDanPho: finalTdp,
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
        toDanPho: finalTdp,
        staffId: selectedStaffId,
        staffName,
        isDone: false,
      });
    } else if (selectedTask === 'dcttp') {
      const areaName = hoTen.trim() || finalTdp;
      if (!areaName) {
        setError('Vui lòng chọn hoặc nhập tên Tổ dân phố / Khu vực');
        return;
      }
      const targetCount = parseInt(info1, 10) || 50;
      onAddTask('dcttp', {
        hoTen: areaName,
        info1: targetCount,
        toDanPho: finalTdp,
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
        diaChi: diaChi.trim() || finalTdp,
        toDanPho: finalTdp,
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
        toDanPho: finalTdp,
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
    setIsCustomTdp(false);
    setCustomToDanPho('');
    setAutoAssignedNote(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-800 to-amber-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-300" />
            <h3 className="font-extrabold text-base tracking-tight">THÊM BẢN GHI CHỈ TIÊU MỚI</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-red-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
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
              onChange={(e) => {
                const newTask = e.target.value as TaskType;
                setSelectedTask(newTask);
                if (newTask === 'dcttp' && toDanPho) {
                  setHoTen(toDanPho);
                }
              }}
              className="w-full p-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-hidden"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title} ({cat.shortTitle})
                </option>
              ))}
            </select>
          </div>

          {/* Select Residential Group (Tổ dân phố) */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-red-600" />
                Tổ dân phố / Địa bàn:
              </label>
              {onOpenResidentialGroupManager && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenResidentialGroupManager();
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  Quản lý danh sách Tổ
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <select
                id="select-modal-tdp"
                value={isCustomTdp ? '__custom__' : toDanPho}
                onChange={(e) => handleResidentialGroupChange(e.target.value)}
                className="w-full p-2.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-hidden shadow-xs"
              >
                {residentialGroups.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name} {g.code ? `(${g.code})` : ''} - {g.householdCount || 0} hộ
                  </option>
                ))}
                <option value="__custom__">➕ Khác (Tự nhập tên Tổ mới...)</option>
              </select>

              {isCustomTdp && (
                <div className="pt-1">
                  <input
                    type="text"
                    required
                    value={customToDanPho}
                    onChange={(e) => setCustomToDanPho(e.target.value)}
                    placeholder="Nhập tên Tổ dân phố mới..."
                    className="w-full p-2.5 text-xs border border-amber-300 bg-amber-50/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-semibold"
                  />
                  <p className="text-[10px] text-amber-700 mt-1">
                    * Mẹo: Quản trị viên có thể vào phần <b>Quản lý Tổ dân phố</b> để thêm cố định vào danh mục.
                  </p>
                </div>
              )}
            </div>

            {autoAssignedNote && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{autoAssignedNote}</span>
              </div>
            )}
          </div>

          {/* Select Assigned Officer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Cán bộ phụ trách thực hiện:
            </label>
            <select
              id="select-modal-staff"
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                setAutoAssignedNote(null);
              }}
              className="w-full p-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-hidden"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.rank || 'Cán bộ'} {s.name} {s.assignedAreas?.length ? `(${s.assignedAreas.join(', ')})` : ''}
                </option>
              ))}
            </select>
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
          )}

          {selectedTask === 'dcttp' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Tổ dân phố / Khu vực cần điều chỉnh:
                </label>
                <input
                  type="text"
                  required
                  value={hoTen}
                  onChange={(e) => setHoTen(e.target.value)}
                  placeholder="VD: Tổ dân phố 1"
                  className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50"
                />
              </div>

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
                  placeholder="VD: Số 42 Đường Trần Phú"
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
