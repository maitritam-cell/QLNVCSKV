import React, { useState, useEffect, useCallback } from 'react';
import {
  TaskType,
  Staff,
  HKCCHRecord,
  MaTuyRecord,
  DCTTPRecord,
  DatDaiRecord,
  TaskStats,
  StaffTaskStats,
  AllDashboardStats,
  UserAccount,
  GenericTaskRecord
} from './types';
import {
  getStaffList,
  getHkcchList,
  getMatuyList,
  getDcttpList,
  getDatdaiList,
  saveStaffList,
  saveHkcchList,
  saveMatuyList,
  saveDcttpList,
  saveDatdaiList,
  calculateTaskStats,
  getAllDashboardStats,
  getStaffStatsForTask,
  TASK_CONFIG,
  getCurrentUser,
  setCurrentUser,
  logoutUser,
  syncStaffToAccounts,
  deleteUserAccount,
  getGenericTasksList,
  saveGenericTasksList,
  getTaskCategories
} from './data/storage';
import { Navbar } from './components/Navbar';
import { TaskUpdateView } from './components/TaskUpdateView';
import { DashboardView } from './components/DashboardView';
import { StaffManagementView } from './components/StaffManagementView';
import { AddTaskModal } from './components/AddTaskModal';
import { DataManagementModal } from './components/DataManagementModal';
import { LoginView } from './components/LoginView';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { AccountManagementModal } from './components/AccountManagementModal';
import { ManageTaskCategoriesModal } from './components/ManageTaskCategoriesModal';
import { ResidentialGroupModal } from './components/ResidentialGroupModal';
import { ExcelImportExportModal } from './components/ExcelImportExportModal';
import { ShieldCheck, Check, Trash2, AlertTriangle } from 'lucide-react';

export function App() {
  // Authentication & session state (Strict Login - No trial/guest mode)
  const [currentUser, setCurrentUserState] = useState<UserAccount | null>(() => getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isResidentialModalOpen, setIsResidentialModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const [currentTab, setCurrentTab] = useState<'update' | 'dashboard' | 'staff'>('update');
  const [currentTask, setCurrentTask] = useState<TaskType>('hkcch');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    const user = getCurrentUser();
    return user?.staffId || '';
  });

  // Data lists
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [hkcchList, setHkcchList] = useState<HKCCHRecord[]>([]);
  const [matuyList, setMatuyList] = useState<MaTuyRecord[]>([]);
  const [dcttpList, setDcttpList] = useState<DCTTPRecord[]>([]);
  const [datdaiList, setDatdaiList] = useState<DatDaiRecord[]>([]);
  const [genericTasksList, setGenericTasksList] = useState<GenericTaskRecord[]>([]);

  // In-app Delete Confirmation Modal
  const [recordToDelete, setRecordToDelete] = useState<{
    taskType: TaskType;
    stt: number;
    title: string;
  } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Load all initial data from local storage
  const loadAllData = useCallback(() => {
    setIsRefreshing(true);
    const loadedStaff = getStaffList();
    setStaffList(loadedStaff);
    syncStaffToAccounts(loadedStaff);
    setHkcchList(getHkcchList());
    setMatuyList(getMatuyList());
    setDcttpList(getDcttpList());
    setDatdaiList(getDatdaiList());
    setGenericTasksList(getGenericTasksList());
    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleCategoriesUpdated = () => {
    const categories = getTaskCategories();
    if (categories.length > 0 && !categories.some((cat) => cat.id === currentTask)) {
      setCurrentTask(categories[0].id);
    }
    loadAllData();
  };

  // Auth handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUserState(user);
    setIsLoginModalOpen(false);
    if (user.staffId) {
      setSelectedStaffId(user.staffId);
    } else {
      setSelectedStaffId('');
    }
    showToast(`Đăng nhập thành công: ${user.rank} ${user.name} ✓`);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUserState(null);
    setIsLoginModalOpen(false);
    showToast('Đã đăng xuất khỏi hệ thống');
  };

  // Calculations
  const currentTaskStats: TaskStats = calculateTaskStats(currentTask, selectedStaffId || undefined);
  const allDashboardStats: AllDashboardStats = getAllDashboardStats();

  const staffStatsByTask: Record<TaskType, StaffTaskStats[]> = {
    hkcch: getStaffStatsForTask('hkcch'),
    matuy: getStaffStatsForTask('matuy'),
    dcttp: getStaffStatsForTask('dcttp'),
    datdai: getStaffStatsForTask('datdai')
  };

  // --- STAFF MANAGEMENT HANDLERS ---
  const handleAddStaff = (newStaff: Staff) => {
    const updated = [...staffList, newStaff];
    setStaffList(updated);
    saveStaffList(updated);
    syncStaffToAccounts(updated);
    showToast(`Đã thêm cán bộ ${newStaff.rank} ${newStaff.name} ✓`);
  };

  const handleUpdateStaff = (updatedStaff: Staff) => {
    const updated = staffList.map((s) => (s.id === updatedStaff.id ? updatedStaff : s));
    setStaffList(updated);
    saveStaffList(updated);
    syncStaffToAccounts(updated);

    // Also update display name in all task records
    const newName = `${updatedStaff.rank} ${updatedStaff.name}`;
    const newHk = hkcchList.map((r) =>
      r.canBoId === updatedStaff.id ? { ...r, canBoName: newName } : r
    );
    setHkcchList(newHk);
    saveHkcchList(newHk);


    const newMt = matuyList.map((r) =>
      r.canBoId === updatedStaff.id ? { ...r, canBoName: newName } : r
    );
    setMatuyList(newMt);
    saveMatuyList(newMt);

    const newDc = dcttpList.map((r) =>
      r.canBoId === updatedStaff.id ? { ...r, canBoName: newName } : r
    );
    setDcttpList(newDc);
    saveDcttpList(newDc);

    const newDd = datdaiList.map((r) =>
      r.canBoId === updatedStaff.id ? { ...r, canBoName: newName } : r
    );
    setDatdaiList(newDd);
    saveDatdaiList(newDd);

    showToast(`Đã cập nhật thông tin đồng chí ${updatedStaff.name} ✓`);
  };

  const handleDeleteStaff = (staffId: string) => {
    const updated = staffList.filter((s) => s.id !== staffId);
    setStaffList(updated);
    saveStaffList(updated);
    deleteUserAccount(`user_${staffId}`);
    deleteUserAccount(staffId);
    showToast('Đã xóa cán bộ và tài khoản liên kết khỏi hệ thống!');
  };

  // Reassign tasks from one officer to another
  const handleReassignTasks = (
    fromStaffId: string,
    toStaffId: string,
    taskType: 'all' | TaskType
  ) => {
    const targetStaff = staffList.find((s) => s.id === toStaffId);
    const toName = targetStaff ? `${targetStaff.rank} ${targetStaff.name}` : toStaffId;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

    let countChanged = 0;

    if (taskType === 'all' || taskType === 'hkcch') {
      const updated = hkcchList.map((r) => {
        if (r.canBoId === fromStaffId) {
          countChanged++;
          return { ...r, canBoId: toStaffId, canBoName: toName, updatedAt: timestamp };
        }
        return r;
      });
      setHkcchList(updated);
      saveHkcchList(updated);
    }

    if (taskType === 'all' || taskType === 'matuy') {
      const updated = matuyList.map((r) => {
        if (r.canBoId === fromStaffId) {
          countChanged++;
          return { ...r, canBoId: toStaffId, canBoName: toName, updatedAt: timestamp };
        }
        return r;
      });
      setMatuyList(updated);
      saveMatuyList(updated);
    }

    if (taskType === 'all' || taskType === 'dcttp') {
      const updated = dcttpList.map((r) => {
        if (r.canBoId === fromStaffId) {
          countChanged++;
          return { ...r, canBoId: toStaffId, canBoName: toName, updatedAt: timestamp };
        }
        return r;
      });
      setDcttpList(updated);
      saveDcttpList(updated);
    }

    if (taskType === 'all' || taskType === 'datdai') {
      const updated = datdaiList.map((r) => {
        if (r.canBoId === fromStaffId) {
          countChanged++;
          return { ...r, canBoId: toStaffId, canBoName: toName, updatedAt: timestamp };
        }
        return r;
      });
      setDatdaiList(updated);
      saveDatdaiList(updated);
    }

    showToast(`Đã chuyển giao ${countChanged} chỉ tiêu nhiệm vụ sang đồng chí ${targetStaff?.name} ✓`);
  };

  // --- TASK RECORD UPDATES ---
  // Updates for HKCCH
  const handleUpdateHkcch = (stt: number, isDone: boolean, note?: string) => {
    const updated = hkcchList.map((item) => {
      if (item.stt === stt) {
        return {
          ...item,
          isDone,
          note: note !== undefined ? note : item.note,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
      }
      return item;
    });
    setHkcchList(updated);
    saveHkcchList(updated);
    showToast(isDone ? 'Đã đánh dấu Đã thực hiện ✓' : 'Đã chuyển về Chưa thực hiện');
  };

  // Updates for Ma tuy
  const handleUpdateMatuy = (
    stt: number,
    isDone: boolean,
    ketQuaTest?: 'Âm tính' | 'Dương tính' | 'Chưa test',
    note?: string
  ) => {
    const updated = matuyList.map((item) => {
      if (item.stt === stt) {
        return {
          ...item,
          isDone,
          ketQuaTest: ketQuaTest !== undefined ? ketQuaTest : item.ketQuaTest,
          note: note !== undefined ? note : item.note,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
      }
      return item;
    });
    setMatuyList(updated);
    saveMatuyList(updated);
    showToast('Đã lưu kết quả xét nghiệm ma túy ✓');
  };

  // Updates for DCTTP
  const handleUpdateDcttp = (stt: number, count: number) => {
    const updated = dcttpList.map((item) => {
      if (item.stt === stt) {
        const target = Number(item.tongNhanKhau) || 0;
        const isDone = count >= target && target > 0;
        return {
          ...item,
          soLuongDaDieuChinh: count,
          isDone,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
      }
      return item;
    });
    setDcttpList(updated);
    saveDcttpList(updated);
    showToast('Đã cập nhật số lượng điều chỉnh Tổ dân phố ✓');
  };

  // Updates for Dat dai
  const handleUpdateDatdai = (stt: number, data: Partial<DatDaiRecord>) => {
    const updated = datdaiList.map((item) => {
      if (item.stt === stt) {
        return {
          ...item,
          ...data,
          isDone: true,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
      }
      return item;
    });
    setDatdaiList(updated);
    saveDatdaiList(updated);
    showToast('Đã lưu thông tin làm sạch dữ liệu đất đai ✓');
  };

  // In-app Delete a record (No window.confirm to avoid iframe issues)
  const handleDeleteRecord = (taskType: TaskType, stt: number, recordTitle?: string) => {
    setRecordToDelete({
      taskType,
      stt,
      title: recordTitle || `Chỉ tiêu #${stt}`
    });
  };

  const executeDeleteRecord = (taskType: TaskType, stt: number) => {
    if (taskType === 'hkcch') {
      const updated = hkcchList.filter((item) => item.stt !== stt);
      setHkcchList(updated);
      saveHkcchList(updated);
    } else if (taskType === 'matuy') {
      const updated = matuyList.filter((item) => item.stt !== stt);
      setMatuyList(updated);
      saveMatuyList(updated);
    } else if (taskType === 'dcttp') {
      const updated = dcttpList.filter((item) => item.stt !== stt);
      setDcttpList(updated);
      saveDcttpList(updated);
    } else if (taskType === 'datdai') {
      const updated = datdaiList.filter((item) => item.stt !== stt);
      setDatdaiList(updated);
      saveDatdaiList(updated);
    } else {
      const updated = genericTasksList.filter(
        (item) => !(item.taskType === taskType && item.stt === stt)
      );
      setGenericTasksList(updated);
      saveGenericTasksList(updated);
    }
    showToast('Đã xóa chỉ tiêu thành công ✓');
  };

  const handleUpdateGenericTask = (stt: number, isDone: boolean, note?: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updated = genericTasksList.map((item) => {
      if (item.stt === stt && item.taskType === currentTask) {
        return {
          ...item,
          isDone,
          note: note !== undefined ? note : item.note,
          updatedAt: timestamp
        };
      }
      return item;
    });
    setGenericTasksList(updated);
    saveGenericTasksList(updated);
    showToast(isDone ? 'Đã đánh dấu hoàn thành chỉ tiêu ✓' : 'Đã chuyển về chưa hoàn thành');
  };

  // Add a new task record
  const handleAddTask = (taskType: TaskType, recordData: any) => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

    if (taskType === 'hkcch') {
      const nextStt = hkcchList.length > 0 ? Math.max(...hkcchList.map((r) => r.stt)) + 1 : 1;
      const newRec: HKCCHRecord = {
        stt: nextStt,
        hoTen: recordData.hoTen,
        soHoSo: recordData.info1 || `HS-${Date.now().toString().slice(-4)}`,
        toDanPho: recordData.toDanPho,
        canBoId: recordData.staffId,
        canBoName: recordData.staffName,
        isDone: false,
        note: recordData.note || '',
        updatedAt: timestamp
      };
      const updated = [newRec, ...hkcchList];
      setHkcchList(updated);
      saveHkcchList(updated);
    } else if (taskType === 'matuy') {
      const nextStt = matuyList.length > 0 ? Math.max(...matuyList.map((r) => r.stt)) + 1 : 1;
      const newRec: MaTuyRecord = {
        stt: nextStt,
        hoTen: recordData.hoTen,
        namSinh: recordData.namSinh || '1995',
        soCMND: recordData.cmnd || '',
        toDanPho: recordData.toDanPho,
        canBoId: recordData.staffId,
        canBoName: recordData.staffName,
        isDone: false,
        ketQuaTest: 'Chưa test',
        note: recordData.info1 || '',
        updatedAt: timestamp
      };
      const updated = [newRec, ...matuyList];
      setMatuyList(updated);
      saveMatuyList(updated);
    } else if (taskType === 'dcttp') {
      const nextStt = dcttpList.length > 0 ? Math.max(...dcttpList.map((r) => r.stt)) + 1 : 1;
      const targetCount = Number(recordData.info1) || 50;
      const newRec: DCTTPRecord = {
        stt: nextStt,
        hoTen: recordData.hoTen,
        tongNhanKhau: targetCount,
        soLuongDaDieuChinh: 0,
        toDanPho: recordData.toDanPho || recordData.hoTen,
        canBoId: recordData.staffId,
        canBoName: recordData.staffName,
        isDone: false,
        updatedAt: timestamp
      };
      const updated = [newRec, ...dcttpList];
      setDcttpList(updated);
      saveDcttpList(updated);
    } else if (taskType === 'datdai') {
      const nextStt = datdaiList.length > 0 ? Math.max(...datdaiList.map((r) => r.stt)) + 1 : 1;
      const newRec: DatDaiRecord = {
        stt: nextStt,
        chuHo: recordData.chuHo,
        cmnd: recordData.cmnd || '',
        namSinh: recordData.namSinh || '1980',
        diaChi: recordData.diaChi || '',
        toDanPho: recordData.toDanPho || 'Tổ dân phố 1',
        canBoId: recordData.staffId,
        canBoName: recordData.staffName,
        status: 'pending',
        isDone: false,
        updatedAt: timestamp
      };
      const updated = [newRec, ...datdaiList];
      setDatdaiList(updated);
      saveDatdaiList(updated);
    } else {
      // Custom task category
      const nextStt = genericTasksList.length > 0 ? Math.max(...genericTasksList.map((r) => r.stt)) + 1 : 1;
      const newRec: GenericTaskRecord = {
        stt: nextStt,
        taskType,
        hoTen: recordData.hoTen,
        soHoSo: recordData.info1 || `CT-${Date.now().toString().slice(-4)}`,
        toDanPho: recordData.toDanPho || 'Tổ dân phố 1',
        canBoId: recordData.staffId,
        canBoName: recordData.staffName,
        isDone: false,
        note: recordData.note || '',
        info1: recordData.info1,
        updatedAt: timestamp
      };
      const updated = [newRec, ...genericTasksList];
      setGenericTasksList(updated);
      saveGenericTasksList(updated);
    }

    setCurrentTask(taskType);
    setSelectedStaffId(recordData.staffId || '');
    showToast(`Đã thêm chỉ tiêu ${TASK_CONFIG[taskType]?.shortTitle || taskType} thành công ✓`);
  };

  // Drilldown from Dashboard into specific task and officer
  const handleSelectTaskAndStaff = (task: TaskType, staffId: string) => {
    setCurrentTask(task);
    setSelectedStaffId(staffId);
    setCurrentTab('update');
  };

  // If user is not authenticated, show the official Police Login Portal (Strict login, no guest mode)
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-red-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold animate-in slide-in-from-bottom duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header / Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onRefreshData={loadAllData}
        isRefreshing={isRefreshing}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAccountManagement={() => setIsAccountModalOpen(true)}
        onOpenResidentialGroupManagement={
          currentUser?.role === 'admin'
            ? () => setIsResidentialModalOpen(true)
            : undefined
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {currentTab === 'update' && (
          <TaskUpdateView
            currentTask={currentTask}
            onSelectTask={setCurrentTask}
            staffList={staffList}
            selectedStaffId={selectedStaffId}
            onSelectStaff={setSelectedStaffId}
            stats={currentTaskStats}
            hkcchList={hkcchList}
            matuyList={matuyList}
            dcttpList={dcttpList}
            datdaiList={datdaiList}
            genericTasksList={genericTasksList}
            currentUser={currentUser}
            onUpdateHkcch={handleUpdateHkcch}
            onUpdateMatuy={handleUpdateMatuy}
            onUpdateDcttp={handleUpdateDcttp}
            onUpdateDatdai={handleUpdateDatdai}
            onUpdateGenericTask={handleUpdateGenericTask}
            onDeleteRecord={handleDeleteRecord}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
            onOpenExcelModal={() => setIsExcelModalOpen(true)}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            statsAll={allDashboardStats}
            staffList={staffList}
            staffStatsByTask={staffStatsByTask}
            onRefresh={loadAllData}
            onSelectTaskAndStaff={handleSelectTaskAndStaff}
            isRefreshing={isRefreshing}
          />
        )}

        {currentTab === 'staff' && (
          <StaffManagementView
            staffList={staffList}
            hkcchList={hkcchList}
            matuyList={matuyList}
            dcttpList={dcttpList}
            datdaiList={datdaiList}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onDeleteStaff={handleDeleteStaff}
            onAddTaskToStaff={handleAddTask}
            onReassignTasks={handleReassignTasks}
            onNavigateToTaskView={handleSelectTaskAndStaff}
            onOpenAccountManagement={() => setIsAccountModalOpen(true)}
            onOpenResidentialGroupModal={
              currentUser?.role === 'admin'
                ? () => setIsResidentialModalOpen(true)
                : undefined
            }
            onOpenExcelModal={() => setIsExcelModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        staffList={staffList}
        currentTaskType={currentTask}
        onAddTask={handleAddTask}
      />

      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onDataChanged={loadAllData}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onOpenResidentialModal={
          currentUser?.role === 'admin'
            ? () => setIsResidentialModalOpen(true)
            : undefined
        }
      />

      <ExcelImportExportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        staffList={staffList}
        onDataChanged={loadAllData}
      />

      {/* Task Categories Management Modal */}
      <ManageTaskCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        onCategoriesUpdated={handleCategoriesUpdated}
      />

      {currentUser && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          currentUser={currentUser}
          onPasswordChanged={(msg) => showToast(msg)}
        />
      )}

      {/* Account Management Modal (Admin only) */}
      <AccountManagementModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onAccountsUpdated={loadAllData}
        currentUserId={currentUser?.id}
      />

      {/* Residential Group Management Modal (Admin only) */}
      <ResidentialGroupModal
        isOpen={isResidentialModalOpen && currentUser?.role === 'admin'}
        onClose={() => setIsResidentialModalOpen(false)}
        staffList={staffList}
        onDataUpdated={loadAllData}
      />

      {/* In-App Delete Task Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 text-slate-100 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-600/50 flex items-center justify-center text-red-400 mx-auto mb-3 shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-white">Xác Nhận Xóa Chỉ Tiêu</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Bạn có chắc chắn muốn xóa bản ghi chỉ tiêu{' '}
              <b className="text-white">"{recordToDelete.title}"</b> (STT #{recordToDelete.stt})?
            </p>
            <p className="text-[11px] text-red-400/80 mt-1">
              Dữ liệu sau khi xóa sẽ được cập nhật trừ đi khỏi chỉ tiêu của cán bộ.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  executeDeleteRecord(recordToDelete.taskType, recordToDelete.stt);
                  setRecordToDelete(null);
                }}
                className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-lg shadow-red-900/50 transition active:scale-95"
              >
                Xóa Chỉ Tiêu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch Account / Login Overlay Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-center items-center p-3 overflow-y-auto">
          <div className="relative w-full max-w-lg">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-2 right-2 z-50 text-white/80 hover:text-white bg-slate-800/80 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition"
            >
              ✕
            </button>
            <LoginView
              onLoginSuccess={(user) => {
                handleLoginSuccess(user);
                setIsLoginModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <ShieldCheck className="w-4 h-4 text-red-700" />
            <span>Hệ Thống Quản Lý Nhiệm Vụ Công Tác Công An</span>
          </div>
          <div className="text-[11px] text-slate-400">
            HKCCH • Test Ma Túy • ĐCTTP • Làm Sạch Dữ Liệu Đất Đai (Lần 4)
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
