import React, { useEffect, useState } from 'react';
import { TaskType, Staff, StaffTaskStats, AllDashboardStats } from '../types';
import { TASK_CONFIG, getTaskCategories } from '../data/storage';
import {
  Award,
  RefreshCw,
  Home,
  Activity,
  MapPin,
  FileCheck,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface DashboardViewProps {
  statsAll: AllDashboardStats;
  staffList: Staff[];
  staffStatsByTask: Record<TaskType, StaffTaskStats[]>;
  onRefresh: () => void;
  onSelectTaskAndStaff: (task: TaskType, staffId: string) => void;
  isRefreshing?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  statsAll,
  staffList,
  staffStatsByTask,
  onRefresh,
  onSelectTaskAndStaff,
  isRefreshing
}) => {
  const taskCategories = getTaskCategories();
  const activeTaskKeys = taskCategories.map((cat) => cat.id);
  const [selectedTaskTab, setSelectedTaskTab] = useState<TaskType>(() => taskCategories[0]?.id || 'hkcch');

  useEffect(() => {
    if (activeTaskKeys.length === 0) return;
    if (!activeTaskKeys.includes(selectedTaskTab)) {
      setSelectedTaskTab(activeTaskKeys[0]);
    }
  }, [activeTaskKeys.join('|'), selectedTaskTab]);

  // Overall totals only for currently active task categories.
  const overall = activeTaskKeys.reduce(
    (sum, key) => {
      const st = statsAll[key] || { total: 0, done: 0, remain: 0, percent: 0 };
      return {
        total: sum.total + st.total,
        done: sum.done + st.done,
        remain: sum.remain + st.remain
      };
    },
    { total: 0, done: 0, remain: 0 }
  );
  const overallTotal = overall.total;
  const overallDone = overall.done;
  const overallRemain = overall.remain;
  const overallPercent =
    overallTotal > 0 ? Math.round((overallDone / overallTotal) * 100) : 0;

  const currentRankings = staffStatsByTask[selectedTaskTab] || [];
  // Sort descending by completion percentage
  const sortedRankings = [...currentRankings].sort((a, b) => b.percent - a.percent);

  const getTaskIcon = (taskKey: TaskType) => {
    switch (taskKey) {
      case 'hkcch':
        return <Home className="w-5 h-5" />;
      case 'matuy':
        return <Activity className="w-5 h-5" />;
      case 'dcttp':
        return <MapPin className="w-5 h-5" />;
      case 'datdai':
        return <FileCheck className="w-5 h-5" />;
      default:
        return <FileCheck className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. TOP STATS OVERVIEW */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                BÁO CÁO TỔNG QUAN TOÀN DIỆN
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              TIẾN ĐỘ THỰC HIỆN {activeTaskKeys.length} CHỈ TIÊU CÔNG TÁC
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Cập nhật tức thời theo kết quả cán bộ chiến sĩ hoàn thành trên địa bàn
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới số liệu</span>
          </button>
        </div>

        {/* Global summary grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Tổng chỉ tiêu giao
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {overallTotal}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-emerald-500/30">
            <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">
              Tổng đã hoàn thành
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {overallDone}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-red-500/30">
            <span className="text-[10px] font-bold uppercase text-red-400 block mb-1">
              Còn lại cần làm
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-red-400">
              {overallRemain}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-500/30">
            <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">
              Tỷ lệ hoàn thành
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
              {overallPercent}%
            </span>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4 pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
            <span>Tiến độ tổng thể toàn phường / xã</span>
            <span className="font-bold text-amber-300">{overallPercent}% hoàn thành</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                overallPercent >= 80 ? 'bg-emerald-500' : overallPercent >= 50 ? 'bg-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. ACTIVE TASK BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeTaskKeys.map((taskKey) => {
          const cfg = TASK_CONFIG[taskKey];
          const st = statsAll[taskKey];
          const isSelected = selectedTaskTab === taskKey;

          return (
            <div
              key={taskKey}
              onClick={() => setSelectedTaskTab(taskKey)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-white border-red-700 ring-2 ring-red-700/20 shadow-md scale-[1.01]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`p-2 rounded-xl ${
                    isSelected ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {getTaskIcon(taskKey)}
                </span>
                <span className="text-xs font-black font-mono text-slate-800 px-2 py-0.5 rounded-full bg-slate-100">
                  {st.percent}%
                </span>
              </div>

              <h3 className="font-extrabold text-xs text-slate-900 leading-snug line-clamp-1 mb-1">
                {cfg.title}
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">{cfg.badge}</p>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-1 text-center py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Chỉ tiêu</span>
                  <span className="font-bold text-slate-800">{st.total}</span>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-600 font-bold block uppercase">Đã làm</span>
                  <span className="font-bold text-emerald-700">{st.done}</span>
                </div>
                <div>
                  <span className="text-[9px] text-red-500 font-bold block uppercase">Còn lại</span>
                  <span className="font-bold text-red-600">{st.remain}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    st.percent >= 80 ? 'bg-emerald-500' : st.percent >= 50 ? 'bg-amber-400' : 'bg-red-500'
                  }`}
                  style={{ width: `${st.percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. OFFICER RANKINGS & LEADERBOARD FOR SELECTED TASK */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                BẢNG THEO DÕI TIẾN ĐỘ CÁN BỘ THEO NHIỆM VỤ
              </h3>
              <p className="text-xs text-slate-500">
                Đang xem: <strong className="text-red-700">{TASK_CONFIG[selectedTaskTab].title}</strong>
              </p>
            </div>
          </div>

          {/* Quick tab switch */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            {activeTaskKeys.map((tKey) => (
              <button
                key={tKey}
                type="button"
                onClick={() => setSelectedTaskTab(tKey)}
                className={`px-3 py-1 text-xs font-bold rounded-lg whitespace-nowrap transition ${
                  selectedTaskTab === tKey
                    ? 'bg-white text-red-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {TASK_CONFIG[tKey].shortTitle}
              </button>
            ))}
          </div>
        </div>

        {/* Officer ranking table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 bg-slate-50/50">
                <th className="py-2.5 px-3 rounded-l-xl">Hạng</th>
                <th className="py-2.5 px-3">Cán bộ phụ trách</th>
                <th className="py-2.5 px-3 text-center">Chỉ tiêu</th>
                <th className="py-2.5 px-3 text-center">Đã xong</th>
                <th className="py-2.5 px-3 text-center">Còn lại</th>
                <th className="py-2.5 px-3 text-center">Tỷ lệ</th>
                <th className="py-2.5 px-3">Tiến độ</th>
                <th className="py-2.5 px-3 text-right rounded-r-xl">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRankings.map((officer, index) => {
                const staff = staffList.find((s) => s.id === officer.staffId);
                const isTop1 = index === 0;
                const isTop2 = index === 1;
                const isTop3 = index === 2;

                return (
                  <tr key={officer.staffId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                          isTop1
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : isTop2
                            ? 'bg-slate-300 text-slate-800'
                            : isTop3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>
                        <span>{officer.staffName}</span>
                        {staff?.assignedAreas && staff.assignedAreas.length > 0 && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Địa bàn: {staff.assignedAreas.join(', ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {officer.total}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                      {officer.done}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-red-600">
                      {officer.remain}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          officer.percent >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : officer.percent >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {officer.percent}%
                      </span>
                    </td>
                    <td className="py-3 px-3 min-w-[120px]">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            officer.percent >= 80
                              ? 'bg-emerald-500'
                              : officer.percent >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${officer.percent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectTaskAndStaff(selectedTaskTab, officer.staffId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition"
                      >
                        <span>Xem chi tiết</span>
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
