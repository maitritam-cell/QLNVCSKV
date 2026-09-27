import React, { useState } from 'react';
import {
  TaskType,
  Staff,
  HKCCHRecord,
  MaTuyRecord,
  DCTTPRecord,
  DatDaiRecord,
  TaskStats,
  UserAccount,
  GenericTaskRecord
} from '../types';
import { TASK_CONFIG, getTaskCategories } from '../data/storage';
import { HkcchCard } from './HkcchCard';
import { MatuyCard } from './MatuyCard';
import { DcttpCard } from './DcttpCard';
import { DatdaiCard } from './DatdaiCard';
import { GenericTaskCard } from './GenericTaskCard';
import {
  Search,
  User,
  Plus,
  Home,
  Activity,
  MapPin,
  FileCheck,
  CheckCircle,
  Clock,
  X,
  ShieldCheck,
  UserCheck,
  Sliders,
  Bookmark
} from 'lucide-react';

interface TaskUpdateViewProps {
  currentTask: TaskType;
  onSelectTask: (task: TaskType) => void;
  staffList: Staff[];
  selectedStaffId: string;
  onSelectStaff: (staffId: string) => void;
  stats: TaskStats;
  hkcchList: HKCCHRecord[];
  matuyList: MaTuyRecord[];
  dcttpList: DCTTPRecord[];
  datdaiList: DatDaiRecord[];
  genericTasksList?: GenericTaskRecord[];
  currentUser?: UserAccount | null;
  onUpdateHkcch: (stt: number, isDone: boolean, note?: string) => void;
  onUpdateMatuy: (
    stt: number,
    isDone: boolean,
    ketQuaTest?: 'Âm tính' | 'Dương tính' | 'Chưa test',
    note?: string
  ) => void;
  onUpdateDcttp: (stt: number, count: number) => void;
  onUpdateDatdai: (stt: number, data: Partial<DatDaiRecord>) => void;
  onUpdateGenericTask?: (stt: number, isDone: boolean, note?: string) => void;
  onDeleteRecord: (taskType: TaskType, stt: number, recordTitle?: string) => void;
  onOpenAddModal: () => void;
  onOpenManageCategories?: () => void;
}

export const TaskUpdateView: React.FC<TaskUpdateViewProps> = ({
  currentTask,
  onSelectTask,
  staffList,
  selectedStaffId,
  onSelectStaff,
  stats,
  hkcchList,
  matuyList,
  dcttpList,
  datdaiList,
  genericTasksList = [],
  currentUser,
  onUpdateHkcch,
  onUpdateMatuy,
  onUpdateDcttp,
  onUpdateDatdai,
  onUpdateGenericTask,
  onDeleteRecord,
  onOpenAddModal,
  onOpenManageCategories
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'pending'>('all');

  const taskCategories = getTaskCategories();
  const taskConfig = TASK_CONFIG[currentTask];

  const getTaskIcon = (taskKey: TaskType) => {
    switch (taskKey) {
      case 'hkcch':
        return <Home className="w-4 h-4" />;
      case 'matuy':
        return <Activity className="w-4 h-4" />;
      case 'dcttp':
        return <MapPin className="w-4 h-4" />;
      case 'datdai':
        return <FileCheck className="w-4 h-4" />;
      default:
        return <Bookmark className="w-4 h-4" />;
    }
  };

  // Filter HKCCH
  const filteredHkcch = hkcchList.filter((item) => {
    const matchStaff = !selectedStaffId || item.canBoId === selectedStaffId;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'done' && item.isDone) ||
      (statusFilter === 'pending' && !item.isDone);
    const matchSearch =
      !searchTerm ||
      item.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.soHoSo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.toDanPho.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStaff && matchStatus && matchSearch;
  });

  // Filter Matuy
  const filteredMatuy = matuyList.filter((item) => {
    const matchStaff = !selectedStaffId || item.canBoId === selectedStaffId;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'done' && item.isDone) ||
      (statusFilter === 'pending' && !item.isDone);
    const matchSearch =
      !searchTerm ||
      item.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.namSinh.includes(searchTerm) ||
      (item.soCMND && item.soCMND.includes(searchTerm)) ||
      item.toDanPho.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStaff && matchStatus && matchSearch;
  });

  // Filter DCTTP
  const filteredDcttp = dcttpList.filter((item) => {
    const matchStaff = !selectedStaffId || item.canBoId === selectedStaffId;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'done' && item.isDone) ||
      (statusFilter === 'pending' && !item.isDone);
    const matchSearch =
      !searchTerm ||
      item.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.tongNhanKhau).includes(searchTerm) ||
      item.toDanPho.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStaff && matchStatus && matchSearch;
  });

  // Filter Datdai
  const filteredDatdai = datdaiList.filter((item) => {
    const matchStaff = !selectedStaffId || item.canBoId === selectedStaffId;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'done' && item.isDone) ||
      (statusFilter === 'pending' && !item.isDone);
    const matchSearch =
      !searchTerm ||
      item.chuHo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cmnd.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cccd && item.cccd.includes(searchTerm)) ||
      item.diaChi.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStaff && matchStatus && matchSearch;
  });

  // Filter Generic / Custom Tasks
  const filteredGeneric = (genericTasksList || []).filter((item) => {
    if (item.taskType !== currentTask) return false;
    const matchStaff = !selectedStaffId || item.canBoId === selectedStaffId;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'done' && item.isDone) ||
      (statusFilter === 'pending' && !item.isDone);
    const matchSearch =
      !searchTerm ||
      item.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.toDanPho.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.canBoName && item.canBoName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.soHoSo && item.soHoSo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.info1 && item.info1.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStaff && matchStatus && matchSearch;
  });

  const getRecordCount = () => {
    switch (currentTask) {
      case 'hkcch':
        return filteredHkcch.length;
      case 'matuy':
        return filteredMatuy.length;
      case 'dcttp':
        return filteredDcttp.length;
      case 'datdai':
        return filteredDatdai.length;
      default:
        return filteredGeneric.length;
    }
  };

  return (
    <div className="space-y-4">
      {/* Current User Status Banner */}
      {currentUser && (
        <div
          className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs ${
            currentUser.role === 'admin'
              ? 'bg-gradient-to-r from-red-50 to-amber-50 border-amber-200 text-red-950'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                currentUser.role === 'admin'
                  ? 'bg-red-700 text-amber-300'
                  : 'bg-blue-700 text-white'
              }`}
            >
              {currentUser.role === 'admin' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-xs font-black">
                {currentUser.role === 'admin' ? 'BAN CHỈ HUY: ' : 'CÁN BỘ CHIẾN SĨ: '}
                <span>
                  {currentUser.rank} {currentUser.name}
                </span>
                {currentUser.assignedAreas && (
                  <span className="font-semibold text-slate-600 text-[11px] ml-1.5">
                    • Địa bàn: {currentUser.assignedAreas.join(', ')}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                {selectedStaffId
                  ? 'Đang lọc xem hồ sơ của cán bộ được chọn'
                  : 'Đang hiển thị toàn bộ hồ sơ trong đơn vị'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {currentUser.staffId && selectedStaffId !== currentUser.staffId && (
              <button
                type="button"
                onClick={() => onSelectStaff(currentUser.staffId!)}
                className="px-2.5 py-1 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition shadow-xs"
              >
                Chỉ xem nhiệm vụ của tôi
              </button>
            )}
            {selectedStaffId && (
              <button
                type="button"
                onClick={() => onSelectStaff('')}
                className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition"
              >
                Xem toàn phường
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. STEP 1: TASK SELECTION TABS */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center text-[10px]">
              1
            </span>
            <span>CHỌN NHIỆM VỤ CÔNG TÁC</span>
          </span>

          <div className="flex items-center gap-2">
            {onOpenManageCategories && (
              <button
                type="button"
                id="btn-manage-categories-top"
                onClick={onOpenManageCategories}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
                title="Thêm hoặc xóa các loại chỉ tiêu nhiệm vụ"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Quản lý</span>
                <span>Chỉ tiêu ({taskCategories.length})</span>
              </button>
            )}

            <button
              type="button"
              id="btn-add-record-top"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm bản ghi mới</span>
            </button>
          </div>
        </div>

        {/* Dynamic Task Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {taskCategories.map((cat) => {
            const taskKey = cat.id;
            const isSelected = currentTask === taskKey;
            const cfg = TASK_CONFIG[taskKey];

            return (
              <button
                key={taskKey}
                type="button"
                id={`task-tab-${taskKey}`}
                onClick={() => onSelectTask(taskKey)}
                className={`p-3 rounded-xl text-left border transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-red-800 to-red-900 text-white border-red-800 shadow-md scale-[1.01]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`p-1.5 rounded-lg ${
                      isSelected ? 'bg-white/20 text-amber-300' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {getTaskIcon(taskKey)}
                  </span>
                  <span className="font-bold text-xs leading-tight line-clamp-1">{cfg.title}</span>
                </div>
                <div className="text-[11px] opacity-80 mt-1 flex items-center justify-between">
                  <span>{cfg.shortTitle}</span>
                  {isSelected && <span className="font-bold">Đang chọn ✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. STEP 2: OFFICER & PROGRESS BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Officer Selector */}
          <div className="flex-1 w-full md:w-auto">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center text-[10px]">
                2
              </span>
              <span>LỌC THEO CÁN BỘ PHỤ TRÁCH</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                id="select-officer"
                value={selectedStaffId}
                onChange={(e) => onSelectStaff(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-hidden text-slate-800"
              >
                <option value="">-- Tất cả cán bộ trong đơn vị ({staffList.length} đồng chí) --</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rank || 'Cán bộ'}) {s.phone ? `- SĐT: ${s.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-2 w-full md:w-auto text-center shrink-0">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 min-w-[70px]">
              <span className="text-[9px] text-slate-500 font-bold block uppercase">Chỉ tiêu</span>
              <strong className="text-sm font-black text-slate-800 font-mono">{stats.total}</strong>
            </div>

            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100 min-w-[70px]">
              <span className="text-[9px] text-emerald-700 font-bold block uppercase">Đã làm</span>
              <strong className="text-sm font-black text-emerald-700 font-mono">{stats.done}</strong>
            </div>

            <div className="bg-red-50 p-2 rounded-xl border border-red-100 min-w-[70px]">
              <span className="text-[9px] text-red-700 font-bold block uppercase">Còn lại</span>
              <strong className="text-sm font-black text-red-700 font-mono">{stats.remain}</strong>
            </div>

            <div className="bg-amber-50 p-2 rounded-xl border border-amber-100 min-w-[70px]">
              <span className="text-[9px] text-amber-800 font-bold block uppercase">Tiến độ</span>
              <strong className="text-sm font-black text-amber-800 font-mono">{stats.percent}%</strong>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              stats.percent >= 80 ? 'bg-emerald-500' : stats.percent >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${stats.percent}%` }}
          />
        </div>
      </div>

      {/* 3. STEP 3: SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            id="input-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Tìm kiếm tên, số hồ sơ, CCCD, địa bàn trong ${taskConfig.shortTitle}...`}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto shrink-0 justify-center">
          <button
            type="button"
            id="filter-all"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({getRecordCount()})
          </button>

          <button
            type="button"
            id="filter-pending"
            onClick={() => setStatusFilter('pending')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'pending'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chưa làm</span>
          </button>

          <button
            type="button"
            id="filter-done"
            onClick={() => setStatusFilter('done')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'done'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Đã xong</span>
          </button>
        </div>
      </div>

      {/* 4. TASK RECORD LIST */}
      <div className="space-y-3">
        {currentTask === 'hkcch' && (
          <>
            {filteredHkcch.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Không tìm thấy bản ghi HKCCH nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredHkcch.map((record) => (
                <HkcchCard
                  key={record.stt}
                  record={record}
                  onToggleStatus={onUpdateHkcch}
                  onDelete={(stt) => onDeleteRecord('hkcch', stt, record.hoTen)}
                />
              ))
            )}
          </>
        )}

        {currentTask === 'matuy' && (
          <>
            {filteredMatuy.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Không tìm thấy đối tượng ma túy nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredMatuy.map((record) => (
                <MatuyCard
                  key={record.stt}
                  record={record}
                  onUpdateTest={onUpdateMatuy}
                  onDelete={(stt) => onDeleteRecord('matuy', stt, record.hoTen)}
                />
              ))
            )}
          </>
        )}

        {currentTask === 'dcttp' && (
          <>
            {filteredDcttp.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Không tìm thấy địa bàn điều chỉnh Tổ dân phố nào phù hợp.
              </div>
            ) : (
              filteredDcttp.map((record) => (
                <DcttpCard
                  key={record.stt}
                  record={record}
                  onUpdateCount={onUpdateDcttp}
                  onDelete={(stt) => onDeleteRecord('dcttp', stt, record.hoTen)}
                />
              ))
            )}
          </>
        )}

        {currentTask === 'datdai' && (
          <>
            {filteredDatdai.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Không tìm thấy thửa đất / chủ hộ nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredDatdai.map((record) => (
                <DatdaiCard
                  key={record.stt}
                  record={record}
                  onUpdateRecord={onUpdateDatdai}
                  onDelete={(stt) => onDeleteRecord('datdai', stt, record.chuHo)}
                />
              ))
            )}
          </>
        )}

        {/* Custom / Generic Task Categories */}
        {!['hkcch', 'matuy', 'dcttp', 'datdai'].includes(currentTask) && (
          <>
            {filteredGeneric.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Chưa có bản ghi nào cho chỉ tiêu "{taskConfig.title}". Hãy bấm nút "+ Thêm bản ghi mới" ở trên để giao hoặc nhập dữ liệu.
              </div>
            ) : (
              filteredGeneric.map((record) => (
                <GenericTaskCard
                  key={record.stt}
                  record={record}
                  unit={taskConfig.unit}
                  onToggleStatus={(stt, isDone, note) =>
                    onUpdateGenericTask && onUpdateGenericTask(stt, isDone, note)
                  }
                  onDelete={(stt) => onDeleteRecord(currentTask, stt, record.hoTen)}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};
