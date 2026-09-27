import React, { useState } from 'react';
import {
  Staff,
  TaskType,
  HKCCHRecord,
  MaTuyRecord,
  DCTTPRecord,
  DatDaiRecord
} from '../types';
import { TASK_CONFIG } from '../data/storage';
import {
  UserPlus,
  Trash2,
  Edit2,
  ShieldCheck,
  MapPin,
  Phone,
  X,
  Check,
  PlusCircle,
  ArrowRightLeft,
  Search,
  ExternalLink,
  ClipboardList,
  Home,
  Activity,
  FileCheck,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';

interface StaffManagementViewProps {
  staffList: Staff[];
  hkcchList: HKCCHRecord[];
  matuyList: MaTuyRecord[];
  dcttpList: DCTTPRecord[];
  datdaiList: DatDaiRecord[];
  onAddStaff: (staff: Staff) => void;
  onUpdateStaff: (staff: Staff) => void;
  onDeleteStaff: (id: string) => void;
  onAddTaskToStaff: (taskType: TaskType, recordData: any) => void;
  onReassignTasks: (fromStaffId: string, toStaffId: string, taskType: 'all' | TaskType) => void;
  onNavigateToTaskView: (taskType: TaskType, staffId: string) => void;
  onOpenAccountManagement?: () => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staffList,
  hkcchList,
  matuyList,
  dcttpList,
  datdaiList,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onAddTaskToStaff,
  onReassignTasks,
  onNavigateToTaskView,
  onOpenAccountManagement
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetStaffId, setAssignTargetStaffId] = useState<string>('');

  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);

  // Form states for Staff Add/Edit
  const [staffIdInput, setStaffIdInput] = useState('');
  const [staffNameInput, setStaffNameInput] = useState('');
  const [staffRankInput, setStaffRankInput] = useState('Đại úy');
  const [staffPhoneInput, setStaffPhoneInput] = useState('');
  const [staffAreasInput, setStaffAreasInput] = useState('');
  const [staffAvatarBg, setStaffAvatarBg] = useState('bg-blue-600');

  // Form states for Assign Task Modal
  const [assignTaskType, setAssignTaskType] = useState<TaskType>('hkcch');
  const [assignStaffId, setAssignStaffId] = useState<string>('');
  const [assignArea, setAssignArea] = useState('Tổ 1');
  const [assignName, setAssignName] = useState('');
  const [assignInfo1, setAssignInfo1] = useState('');
  const [assignCmnd, setAssignCmnd] = useState('');
  const [assignNamSinh, setAssignNamSinh] = useState('1990');
  const [assignDiaChi, setAssignDiaChi] = useState('');
  const [assignNote, setAssignNote] = useState('');

  // Form states for Reassign Modal
  const [reassignFromId, setReassignFromId] = useState<string>('');
  const [reassignToId, setReassignToId] = useState<string>('');
  const [reassignTaskType, setReassignTaskType] = useState<'all' | TaskType>('all');

  // Open Add Staff Modal
  const openAddStaffModal = () => {
    setEditingStaff(null);
    const nextNum = staffList.length + 1;
    setStaffIdInput(`CB${String(nextNum).padStart(2, '0')}`);
    setStaffNameInput('');
    setStaffRankInput('Đại úy');
    setStaffPhoneInput('');
    setStaffAreasInput(`Tổ ${nextNum}`);
    setStaffAvatarBg('bg-blue-600');
    setIsStaffModalOpen(true);
  };

  // Open Edit Staff Modal
  const openEditStaffModal = (s: Staff) => {
    setEditingStaff(s);
    setStaffIdInput(s.id);
    setStaffNameInput(s.name);
    setStaffRankInput(s.rank || 'Đại úy');
    setStaffPhoneInput(s.phone || '');
    setStaffAreasInput(s.assignedAreas.join(', '));
    setStaffAvatarBg(s.avatarBg || 'bg-blue-600');
    setIsStaffModalOpen(true);
  };

  // Submit Staff Add/Edit
  const handleStaffFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffNameInput.trim()) {
      alert('Vui lòng nhập họ tên cán bộ!');
      return;
    }

    const areas = staffAreasInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const data: Staff = {
      id: staffIdInput.trim() || `CB${Date.now()}`,
      name: staffNameInput.trim(),
      rank: staffRankInput,
      phone: staffPhoneInput.trim(),
      assignedAreas: areas.length > 0 ? areas : ['Tổ 1'],
      avatarBg: staffAvatarBg
    };

    if (editingStaff) {
      onUpdateStaff(data);
    } else {
      onAddStaff(data);
    }
    setIsStaffModalOpen(false);
  };

  // Handle Delete Staff
  const handleDeleteStaff = (s: Staff) => {
    const hkCount = hkcchList.filter((r) => r.canBoId === s.id).length;
    const mtCount = matuyList.filter((r) => r.canBoId === s.id).length;
    const dcCount = dcttpList.filter((r) => r.canBoId === s.id).length;
    const ddCount = datdaiList.filter((r) => r.canBoId === s.id).length;
    const totalTasks = hkCount + mtCount + dcCount + ddCount;

    if (totalTasks > 0) {
      const msg = `Cán bộ ${s.rank} ${s.name} hiện đang phụ trách ${totalTasks} chỉ tiêu nhiệm vụ (${hkCount} HKCCH, ${mtCount} Ma túy, ${dcCount} ĐCTTP, ${ddCount} Đất đai).\n\nBạn có chắc chắn muốn xóa không? Hãy dùng chức năng "Luân Chuyển Nhiệm Vụ" để chuyển các nhiệm vụ này sang cán bộ khác nếu cần.`;
      if (!window.confirm(msg)) return;
    } else {
      if (!window.confirm(`Xác nhận xóa cán bộ "${s.rank} ${s.name}"?`)) return;
    }

    onDeleteStaff(s.id);
  };

  // Open Assign Modal for specific staff
  const openAssignModalForStaff = (staffId: string) => {
    setAssignTargetStaffId(staffId);
    setAssignStaffId(staffId);
    const staff = staffList.find((s) => s.id === staffId);
    setAssignArea(staff?.assignedAreas[0] || 'Tổ 1');
    setAssignName('');
    setAssignInfo1('');
    setAssignCmnd('');
    setAssignNamSinh('1990');
    setAssignDiaChi('');
    setAssignNote('');
    setIsAssignModalOpen(true);
  };

  // Submit Assign Task
  const handleAssignTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignName.trim() && assignTaskType !== 'datdai') {
      alert('Vui lòng nhập họ tên đối tượng / đại diện!');
      return;
    }

    const assignedStaff = staffList.find((s) => s.id === assignStaffId);
    const staffName = assignedStaff ? `${assignedStaff.rank} ${assignedStaff.name}` : assignStaffId;

    const payload = {
      staffId: assignStaffId,
      staffName,
      toDanPho: assignArea,
      hoTen: assignName.trim(),
      chuHo: assignName.trim(),
      info1: assignInfo1.trim(),
      cmnd: assignCmnd.trim(),
      namSinh: assignNamSinh.trim(),
      diaChi: assignDiaChi.trim(),
      note: assignNote.trim()
    };

    onAddTaskToStaff(assignTaskType, payload);
    setIsAssignModalOpen(false);
  };

  // Submit Reassign Tasks
  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignFromId || !reassignToId) {
      alert('Vui lòng chọn cả cán bộ chuyển giao và cán bộ tiếp nhận!');
      return;
    }
    if (reassignFromId === reassignToId) {
      alert('Cán bộ chuyển giao và tiếp nhận không được trùng nhau!');
      return;
    }

    const fromStaff = staffList.find((s) => s.id === reassignFromId);
    const toStaff = staffList.find((s) => s.id === reassignToId);

    const taskName =
      reassignTaskType === 'all'
        ? 'TẤT CẢ CÁC NHIỆM VỤ'
        : TASK_CONFIG[reassignTaskType].title;

    if (
      window.confirm(
        `Xác nhận chuyển giao ${taskName} từ đồng chí "${fromStaff?.name}" sang đồng chí "${toStaff?.name}"?`
      )
    ) {
      onReassignTasks(reassignFromId, reassignToId, reassignTaskType);
      setIsReassignModalOpen(false);
    }
  };

  // Compute stats for each staff member
  const getStaffStats = (staffId: string) => {
    const hkRecords = hkcchList.filter((r) => r.canBoId === staffId);
    const hkDone = hkRecords.filter((r) => r.isDone).length;
    const hkTotal = hkRecords.length;

    const mtRecords = matuyList.filter((r) => r.canBoId === staffId);
    const mtDone = mtRecords.filter((r) => r.isDone).length;
    const mtTotal = mtRecords.length;

    const dcRecords = dcttpList.filter((r) => r.canBoId === staffId);
    const dcDone = dcRecords.reduce((sum, r) => sum + (Number(r.soLuongDaDieuChinh) || 0), 0);
    const dcTotal = dcRecords.reduce((sum, r) => sum + (Number(r.tongNhanKhau) || 0), 0);

    const ddRecords = datdaiList.filter((r) => r.canBoId === staffId);
    const ddDone = ddRecords.filter((r) => r.isDone).length;
    const ddTotal = ddRecords.length;

    const totalAssignedItems = hkTotal + mtTotal + dcRecords.length + ddTotal;
    const totalDoneItems = hkDone + mtDone + (dcTotal > 0 && dcDone >= dcTotal ? dcRecords.length : 0) + ddDone;
    const overallPercent =
      totalAssignedItems > 0 ? Math.round((totalDoneItems / totalAssignedItems) * 100) : 0;

    return {
      hkDone,
      hkTotal,
      mtDone,
      mtTotal,
      dcDone,
      dcTotal,
      ddDone,
      ddTotal,
      totalAssignedItems,
      totalDoneItems,
      overallPercent
    };
  };

  // Filter staff list
  const filteredStaff = staffList.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      (s.rank && s.rank.toLowerCase().includes(term)) ||
      (s.phone && s.phone.includes(term)) ||
      s.assignedAreas.some((a) => a.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header banner & Action buttons */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-red-100 text-red-800 text-[11px] font-extrabold uppercase">
              Phân Công Nghiệp Vụ
            </span>
            <span className="text-xs text-slate-400 font-mono font-semibold">
              Tổng: {staffList.length} cán bộ
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-700" />
            QUẢN LÝ CÁN BỘ & GIAO NHIỆM VỤ CÔNG TÁC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thêm, chỉnh sửa danh sách cán bộ cảnh sát khu vực, phân công địa bàn và giao chỉ tiêu 4 nhiệm vụ trọng tâm
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {onOpenAccountManagement && (
            <button
              type="button"
              id="btn-open-account-mgmt"
              onClick={onOpenAccountManagement}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Tài Khoản & Phân Quyền</span>
            </button>
          )}

          <button
            type="button"
            id="btn-add-staff-modal"
            onClick={openAddStaffModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Cán Bộ</span>
          </button>

          <button
            type="button"
            id="btn-assign-task-top"
            onClick={() => openAssignModalForStaff(staffList[0]?.id || '')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Giao Việc Mới</span>
          </button>

          <button
            type="button"
            id="btn-reassign-tasks"
            onClick={() => {
              setReassignFromId(staffList[0]?.id || '');
              setReassignToId(staffList[1]?.id || '');
              setIsReassignModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4 text-slate-600" />
            <span>Luân Chuyển Việc</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Overview bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo họ tên cán bộ, cấp bậc, tổ dân phố phụ trách, số điện thoại..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-slate-500 whitespace-nowrap px-2">
          Hiển thị <strong>{filteredStaff.length}</strong> / {staffList.length} cán bộ
        </div>
      </div>

      {/* 3. Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staff) => {
          const stats = getStaffStats(staff.id);

          return (
            <div
              key={staff.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center font-black text-sm shadow-xs ${
                        staff.avatarBg || 'bg-red-800'
                      }`}
                    >
                      {(staff.rank || 'CB').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {staff.id}
                        </span>
                        <span className="text-[11px] font-bold text-red-800 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                          {staff.rank || 'Cán bộ'}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 text-sm mt-0.5 leading-tight">
                        {staff.name}
                      </h3>
                    </div>
                  </div>

                  {/* Actions for Staff */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditStaffModal(staff)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Sửa thông tin cán bộ"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(staff)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Xóa cán bộ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details info */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {staff.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{staff.phone}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {staff.assignedAreas && staff.assignedAreas.length > 0 ? (
                        staff.assignedAreas.map((area) => (
                          <span
                            key={area}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-md border border-slate-200"
                          >
                            {area}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chưa phân công địa bàn</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task Breakdown for this Officer */}
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                    <span>CHỈ TIÊU ĐƯỢC GIAO</span>
                    <span className="text-slate-700 font-mono">
                      Tổng: {stats.totalAssignedItems} mục
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {/* HKCCH */}
                    <button
                      type="button"
                      onClick={() => onNavigateToTaskView('hkcch', staff.id)}
                      className="p-2 rounded-xl bg-blue-50/60 hover:bg-blue-100/70 border border-blue-100 text-left transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-semibold text-slate-700 text-[11px]">HKCCH</span>
                      </div>
                      <strong className="font-mono text-blue-800 text-xs">
                        {stats.hkDone}/{stats.hkTotal}
                      </strong>
                    </button>

                    {/* Ma tuy */}
                    <button
                      type="button"
                      onClick={() => onNavigateToTaskView('matuy', staff.id)}
                      className="p-2 rounded-xl bg-amber-50/60 hover:bg-amber-100/70 border border-amber-100 text-left transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-semibold text-slate-700 text-[11px]">Ma túy</span>
                      </div>
                      <strong className="font-mono text-amber-800 text-xs">
                        {stats.mtDone}/{stats.mtTotal}
                      </strong>
                    </button>

                    {/* DCTTP */}
                    <button
                      type="button"
                      onClick={() => onNavigateToTaskView('dcttp', staff.id)}
                      className="p-2 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-100 text-left transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-700 text-[11px]">ĐCTTP</span>
                      </div>
                      <strong className="font-mono text-emerald-800 text-xs">
                        {stats.dcDone}/{stats.dcTotal}
                      </strong>
                    </button>

                    {/* Dat dai */}
                    <button
                      type="button"
                      onClick={() => onNavigateToTaskView('datdai', staff.id)}
                      className="p-2 rounded-xl bg-purple-50/60 hover:bg-purple-100/70 border border-purple-100 text-left transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="font-semibold text-slate-700 text-[11px]">Đất đai</span>
                      </div>
                      <strong className="font-mono text-purple-800 text-xs">
                        {stats.ddDone}/{stats.ddTotal}
                      </strong>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openAssignModalForStaff(staff.id)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Giao việc mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToTaskView('hkcch', staff.id)}
                  className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                  title="Chuyển đến danh sách việc của cán bộ này"
                >
                  <span>Xem việc</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. MODAL: THÊM / SỬA CÁN BỘ */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-700" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingStaff ? 'Cập Nhật Thông Tin Cán Bộ' : 'Thêm Cán Bộ Phụ Trách Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStaffFormSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mã cán bộ:</label>
                  <input
                    type="text"
                    value={staffIdInput}
                    onChange={(e) => setStaffIdInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold"
                    placeholder="CB01"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Cấp bậc CAND:</label>
                  <select
                    value={staffRankInput}
                    onChange={(e) => setStaffRankInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                  >
                    <option value="Hạ sĩ">Hạ sĩ</option>
                    <option value="Trung sĩ">Trung sĩ</option>
                    <option value="Thượng sĩ">Thượng sĩ</option>
                    <option value="Thiếu úy">Thiếu úy</option>
                    <option value="Trung úy">Trung úy</option>
                    <option value="Thượng úy">Thượng úy</option>
                    <option value="Đại úy">Đại úy</option>
                    <option value="Thiếu tá">Thiếu tá</option>
                    <option value="Trung tá">Trung tá</option>
                    <option value="Thượng tá">Thượng tá</option>
                    <option value="Đại tá">Đại tá</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên cán bộ:</label>
                <input
                  type="text"
                  value={staffNameInput}
                  onChange={(e) => setStaffNameInput(e.target.value)}
                  placeholder="VD: Nguyễn Văn Hùng"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số điện thoại liên lạc:</label>
                <input
                  type="text"
                  value={staffPhoneInput}
                  onChange={(e) => setStaffPhoneInput(e.target.value)}
                  placeholder="VD: 0912.345.678"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Địa bàn / Tổ dân phố phụ trách (cách nhau bởi dấu phẩy):
                </label>
                <input
                  type="text"
                  value={staffAreasInput}
                  onChange={(e) => setStaffAreasInput(e.target.value)}
                  placeholder="VD: Tổ 1, Tổ 2, Tổ 3"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Màu sắc đại diện thẻ:</label>
                <div className="flex items-center gap-2">
                  {[
                    { bg: 'bg-red-800', name: 'Đỏ CAND' },
                    { bg: 'bg-blue-600', name: 'Xanh dương' },
                    { bg: 'bg-emerald-600', name: 'Xanh lá' },
                    { bg: 'bg-purple-600', name: 'Tím' },
                    { bg: 'bg-amber-600', name: 'Cam' },
                    { bg: 'bg-slate-700', name: 'Xám đậm' }
                  ].map((color) => (
                    <button
                      key={color.bg}
                      type="button"
                      onClick={() => setStaffAvatarBg(color.bg)}
                      className={`w-7 h-7 rounded-xl ${color.bg} flex items-center justify-center transition ${
                        staffAvatarBg === color.bg ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'opacity-70'
                      }`}
                      title={color.name}
                    >
                      {staffAvatarBg === color.bg && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingStaff ? 'Lưu Thay Đổi' : 'Thêm Cán Bộ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: GIAO NHIỆM VỤ MỚI CHO CÁN BỘ */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Giao Nhiệm Vụ Mới Cho Cán Bộ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignTaskSubmit} className="space-y-3.5 text-xs">
              {/* Task Type selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Loại nhiệm vụ công tác:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(['hkcch', 'matuy', 'dcttp', 'datdai'] as TaskType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAssignTaskType(t)}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition ${
                        assignTaskType === t
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {TASK_CONFIG[t].shortTitle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Officer & Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giao cho cán bộ:</label>
                  <select
                    value={assignStaffId}
                    onChange={(e) => {
                      setAssignStaffId(e.target.value);
                      const st = staffList.find((s) => s.id === e.target.value);
                      if (st && st.assignedAreas[0]) setAssignArea(st.assignedAreas[0]);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.rank} {s.name} ({s.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Địa bàn / Tổ dân phố:</label>
                  <input
                    type="text"
                    value={assignArea}
                    onChange={(e) => setAssignArea(e.target.value)}
                    placeholder="VD: Tổ 1"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Dynamic inputs according to Task Type */}
              {assignTaskType === 'hkcch' && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Họ tên nhân khẩu đại diện hộ:</label>
                    <input
                      type="text"
                      value={assignName}
                      onChange={(e) => setAssignName(e.target.value)}
                      placeholder="VD: Nguyễn Văn An"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Số hồ sơ / Mã hộ:</label>
                    <input
                      type="text"
                      value={assignInfo1}
                      onChange={(e) => setAssignInfo1(e.target.value)}
                      placeholder="VD: HS-1092"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono"
                    />
                  </div>
                </>
              )}

              {assignTaskType === 'matuy' && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Họ và tên đối tượng:</label>
                    <input
                      type="text"
                      value={assignName}
                      onChange={(e) => setAssignName(e.target.value)}
                      placeholder="VD: Trần Văn Bình"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Năm sinh:</label>
                      <input
                        type="text"
                        value={assignNamSinh}
                        onChange={(e) => setAssignNamSinh(e.target.value)}
                        placeholder="1995"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Số CMND/CCCD:</label>
                      <input
                        type="text"
                        value={assignCmnd}
                        onChange={(e) => setAssignCmnd(e.target.value)}
                        placeholder="001095000123"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {assignTaskType === 'dcttp' && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tên khu vực / Cụm cư dân điều chỉnh:</label>
                    <input
                      type="text"
                      value={assignName}
                      onChange={(e) => setAssignName(e.target.value)}
                      placeholder="VD: Khu tập thể A - Tổ 3"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tổng số nhân khẩu cần điều chỉnh:</label>
                    <input
                      type="number"
                      value={assignInfo1}
                      onChange={(e) => setAssignInfo1(e.target.value)}
                      placeholder="120"
                      min={1}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                      required
                    />
                  </div>
                </>
              )}

              {assignTaskType === 'datdai' && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tên chủ hộ / Người đứng tên đất:</label>
                    <input
                      type="text"
                      value={assignName}
                      onChange={(e) => setAssignName(e.target.value)}
                      placeholder="VD: Lê Thị Lan"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Năm sinh:</label>
                      <input
                        type="text"
                        value={assignNamSinh}
                        onChange={(e) => setAssignNamSinh(e.target.value)}
                        placeholder="1970"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Số CMND gốc:</label>
                      <input
                        type="text"
                        value={assignCmnd}
                        onChange={(e) => setAssignCmnd(e.target.value)}
                        placeholder="010234567"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Địa chỉ thửa đất:</label>
                    <input
                      type="text"
                      value={assignDiaChi}
                      onChange={(e) => setAssignDiaChi(e.target.value)}
                      placeholder="VD: Số 45 Phố Huế"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú giao việc:</label>
                <input
                  type="text"
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="Ghi chú thêm chỉ đạo nghiệp vụ..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Giao Việc</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: LUÂN CHUYỂN / CHUYỂN GIAO NHIỆM VỤ */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Luân Chuyển & Bàn Giao Nhiệm Vụ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReassignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                Chức năng cho phép tự động chuyển các chỉ tiêu công tác từ một cán bộ sang cán bộ khác khi có sự thay đổi hoặc luân chuyển địa bàn công tác.
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Từ cán bộ chuyển giao:</label>
                <select
                  value={reassignFromId}
                  onChange={(e) => setReassignFromId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  required
                >
                  <option value="">-- Chọn cán bộ bàn giao --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.rank} {s.name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Sang cán bộ tiếp nhận:</label>
                <select
                  value={reassignToId}
                  onChange={(e) => setReassignToId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  required
                >
                  <option value="">-- Chọn cán bộ tiếp nhận --</option>
                  {staffList
                    .filter((s) => s.id !== reassignFromId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.rank} {s.name} ({s.id})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Loại nhiệm vụ muốn chuyển giao:</label>
                <select
                  value={reassignTaskType}
                  onChange={(e) => setReassignTaskType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                >
                  <option value="all">⚡ TẤT CẢ các nhiệm vụ</option>
                  <option value="hkcch">1. Hộ không có chủ hộ (HKCCH)</option>
                  <option value="matuy">2. Test đối tượng ma túy</option>
                  <option value="dcttp">3. Điều chỉnh Tổ dân phố (ĐCTTP)</option>
                  <option value="datdai">4. Làm sạch dữ liệu đất đai (Lần 4)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Xác Nhận Chuyển Giao</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
