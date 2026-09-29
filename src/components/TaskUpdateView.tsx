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
import { TASK_CONFIG, getTaskCategories, getResidentialGroups } from '../data/storage';
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
  Bookmark,
  Building,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
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
  onOpenExcelModal?: () => void;
  onOpenResidentialModal?: () => void;
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
  onOpenManageCategories,
  onOpenExcelModal,
  onOpenResidentialModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'pending'>('all');
  const [selectedToDanPho, setSelectedToDanPho] = useState<string>('');

  const taskCategories = getTaskCategories();
  const taskConfig = TASK_CONFIG[currentTask];
  const residentialGroups = getResidentialGroups();

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

  // Helper match for To Dan Pho
  const checkToDanPhoMatch = (itemTo: string) => {
    if (!selectedToDanPho) return true;
    const a = itemTo.trim().toLowerCase().replace(/tổ\s*dân\s*phố\s*/i, 'tổ ');
    const b = selectedToDanPho.trim().toLowerCase().replace(/tổ\s*dân\s*phố\s*/i, 'tổ ');
    return a === b || itemTo === selectedToDanPho || a.includes(b) || b.includes(a);
  };

  // Base unfiltered lists for current task (before status filter)
  const baseHkcch = hkcchList.filter((item) => {
    const matchStaff = !selectedStaffId || item.canBoId === selectedStaffId;
    const matchTo = checkToDanPhoMatch(item.toDanPho);
    const matchSearch =
      !searchTerm ||
      item.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.soHoSo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.toDanPho.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStaff && matchTo && matchSearch;
  });

  const baseMatuy = matuyList.filter((item) => {
    const matchStaff = !selectedStaffId || item.canBoId === selectedStaffId;
    const matchTo = checkToDanPhoMatch(item.toDanPho);
    const matchSearch =
      !searchTerm ||
      item.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.namSinh.includes(searchTerm) ||
      (item.soCMND && item.soCMND.includes(searchTerm)) ||
      item.toDanPho.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStaff && matchTo && matchSearch;
  });

  const baseDcttp = dcttpList.filter((item) => {
    const matchStaff = !selectedStaffId || item.canBoId === selectedStaffId;
    const matchTo = checkToDanPhoMatch(item.toDanPho);
    const matchSearch =
      !searchTerm ||
      item.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.tongNhanKhau).includes(searchTerm) ||
      item.toDanPho.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStaff && matchTo && matchSearch;
  });

  const baseDatdai = datdaiList.filter((item) => {
    const matchStaff = !selectedStaffId || item.canBoId === selectedStaffId;
    const matchTo = checkToDanPhoMatch(item.toDanPho);
    const matchSearch =
      !searchTerm ||
      item.chuHo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cmnd.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cccd && item.cccd.includes(searchTerm)) ||
      item.diaChi.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStaff && matchTo && matchSearch;
  });

  const baseGeneric = (genericTasksList || []).filter((item) => {
    if (item.taskType !== currentTask) return false;
    const matchStaff = !selectedStaffId || item.canBoId === selectedStaffId;
    const matchTo = checkToDanPhoMatch(item.toDanPho);
    const matchSearch =
      !searchTerm ||
      item.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.toDanPho.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.canBoName && item.canBoName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.soHoSo && item.soHoSo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.info1 && item.info1.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStaff && matchTo && matchSearch;
  });

  // Calculate real-time counts for current task
  let totalCount = 0;
  let doneCount = 0;
  let pendingCount = 0;

  if (currentTask === 'hkcch') {
    totalCount = baseHkcch.length;
    doneCount = baseHkcch.filter((r) => r.isDone).length;
    pendingCount = totalCount - doneCount;
  } else if (currentTask === 'matuy') {
    totalCount = baseMatuy.length;
    doneCount = baseMatuy.filter((r) => r.isDone || (r.ketQuaTest && r.ketQuaTest !== 'Chưa test')).length;
    pendingCount = totalCount - doneCount;
  } else if (currentTask === 'dcttp') {
    totalCount = baseDcttp.length;
    doneCount = baseDcttp.filter((r) => r.isDone || (r.soLuongDaDieuChinh >= r.tongNhanKhau && r.tongNhanKhau > 0)).length;
    pendingCount = totalCount - doneCount;
  } else if (currentTask === 'datdai') {
    totalCount = baseDatdai.length;
    doneCount = baseDatdai.filter((r) => r.isDone || r.status !== 'pending').length;
    pendingCount = totalCount - doneCount;
  } else {
    totalCount = baseGeneric.length;
    doneCount = baseGeneric.filter((r) => r.isDone).length;
    pendingCount = totalCount - doneCount;
  }

  // Filtered lists with status applied
  const filteredHkcch = baseHkcch.filter((item) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'done') return item.isDone;
    return !item.isDone;
  });

  const filteredMatuy = baseMatuy.filter((item) => {
    const isFinished = item.isDone || (item.ketQuaTest && item.ketQuaTest !== 'Chưa test');
    if (statusFilter === 'all') return true;
    if (statusFilter === 'done') return isFinished;
    return !isFinished;
  });

  const filteredDcttp = baseDcttp.filter((item) => {
    const isFinished = item.isDone || (item.soLuongDaDieuChinh >= item.tongNhanKhau && item.tongNhanKhau > 0);
    if (statusFilter === 'all') return true;
    if (statusFilter === 'done') return isFinished;
    return !isFinished;
  });

  const filteredDatdai = baseDatdai.filter((item) => {
    const isFinished = item.isDone || item.status !== 'pending';
    if (statusFilter === 'all') return true;
    if (statusFilter === 'done') return isFinished;
    return !isFinished;
  });

  const filteredGeneric = baseGeneric.filter((item) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'done') return item.isDone;
    return !item.isDone;
  });

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
            {onOpenResidentialModal && (
              <button
                type="button"
                id="btn-open-residential-top"
                onClick={onOpenResidentialModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/90 hover:bg-blue-800 text-blue-200 border border-blue-700/60 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                title="Quản lý danh sách Tổ dân phố (Thêm mới, đổi tên, xóa, gán cán bộ)"
              >
                <Building className="w-3.5 h-3.5 text-blue-300" />
                <span className="hidden sm:inline">Quản lý</span>
                <span>Tổ Dân Phố ({residentialGroups.length})</span>
              </button>
            )}

            {onOpenExcelModal && (
              <button
                type="button"
                id="btn-open-excel-task-top"
                onClick={onOpenExcelModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 border border-emerald-700 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                title="Nhập / Xuất Excel chỉ tiêu theo từng Tổ dân phố"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Excel</span>
                <span>Tổ Dân Phố</span>
              </button>
            )}

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

      {/* 3. STEP 3: SEARCH & FILTERS (STATUS & TỔ DÂN PHỐ) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Top filter row: Search + Tổ Dân Phố Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="input-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Tìm kiếm tên, số hồ sơ, CCCD, địa chỉ trong ${taskConfig.shortTitle}...`}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden font-medium transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter by Tổ dân phố */}
          <div className="relative w-full sm:w-60 shrink-0">
            <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <select
              id="select-todanpho"
              value={selectedToDanPho}
              onChange={(e) => setSelectedToDanPho(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-hidden text-slate-800 transition"
            >
              <option value="">-- Tất cả Tổ dân phố --</option>
              {residentialGroups.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name} {g.code ? `(${g.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* STATUS FILTER BUTTONS (PROMINENT TABS) */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-red-600" />
            <span>Lọc theo trạng thái thực hiện:</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-xl w-full sm:w-auto">
            {/* Tất cả */}
            <button
              type="button"
              id="filter-all"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-300/80 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>Tất cả</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalCount}
              </span>
            </button>

            {/* Đã hoàn thành */}
            <button
              type="button"
              id="filter-done"
              onClick={() => setStatusFilter('done')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                statusFilter === 'done'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500 scale-[1.02]'
                  : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã hoàn thành</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                statusFilter === 'done' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {doneCount}
              </span>
            </button>

            {/* Chưa hoàn thành */}
            <button
              type="button"
              id="filter-pending"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-red-700 text-white shadow-sm ring-1 ring-red-600 scale-[1.02]'
                  : 'text-red-700 hover:text-red-900 hover:bg-red-50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Chưa hoàn thành</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                statusFilter === 'pending' ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800'
              }`}>
                {pendingCount}
              </span>
            </button>
          </div>
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
