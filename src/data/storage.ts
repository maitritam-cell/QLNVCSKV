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
  AppConfig,
  UserAccount,
  UserRole,
  TaskCategoryConfig,
  GenericTaskRecord
} from '../types';
import {
  INITIAL_STAFF,
  INITIAL_HKCCH,
  INITIAL_MATUY,
  INITIAL_DCTTP,
  INITIAL_DATDAI
} from './initialData';

export const STORAGE_KEYS = {
  STAFF: 'nhiemvu_staff_list_v1',
  HKCCH: 'nhiemvu_hkcch_list_v1',
  MATUY: 'nhiemvu_matuy_list_v1',
  DCTTP: 'nhiemvu_dcttp_list_v1',
  DATDAI: 'nhiemvu_datdai_list_v1',
  CONFIG: 'nhiemvu_app_config_v1',
  ACCOUNTS: 'nhiemvu_user_accounts_v1',
  CURRENT_USER: 'nhiemvu_current_user_v1',
  DELETED_ACCOUNTS: 'nhiemvu_deleted_accounts_v1',
  TASK_CATEGORIES: 'nhiemvu_task_categories_v2',
  GENERIC_TASKS: 'nhiemvu_generic_tasks_v2'
};

export const DEFAULT_TASK_CATEGORIES: TaskCategoryConfig[] = [
  {
    id: 'hkcch',
    title: 'Hộ Không Có Chủ Hộ (HKCCH)',
    shortTitle: 'HKCCH',
    unit: 'hộ',
    badge: 'Chỉ tiêu 1',
    color: 'blue'
  },
  {
    id: 'matuy',
    title: 'Xét Nghiệm Đối Tượng Ma Túy',
    shortTitle: 'Ma túy',
    unit: 'đối tượng',
    badge: 'Chỉ tiêu 2',
    color: 'amber'
  },
  {
    id: 'dcttp',
    title: 'Điều Chỉnh Tổ Dân Phố (ĐCTTP)',
    shortTitle: 'ĐCTTP',
    unit: 'nhân khẩu',
    badge: 'Chỉ tiêu 3',
    color: 'emerald'
  },
  {
    id: 'datdai',
    title: 'Làm Sạch Dữ Liệu Đất Đai (Lần 4)',
    shortTitle: 'Đất đai (L4)',
    unit: 'thửa / chủ hộ',
    badge: 'Chỉ tiêu 4',
    color: 'purple'
  }
];

export function getTaskCategories(): TaskCategoryConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASK_CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TASK_CATEGORIES, JSON.stringify(DEFAULT_TASK_CATEGORIES));
      return DEFAULT_TASK_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TASK_CATEGORIES;
  } catch {
    return DEFAULT_TASK_CATEGORIES;
  }
}

export function saveTaskCategories(list: TaskCategoryConfig[]): void {
  localStorage.setItem(STORAGE_KEYS.TASK_CATEGORIES, JSON.stringify(list));
}

export function addTaskCategory(data: Omit<TaskCategoryConfig, 'id'>): TaskCategoryConfig {
  const categories = getTaskCategories();
  const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newCat: TaskCategoryConfig = {
    ...data,
    id,
    isCustom: true
  };
  categories.push(newCat);
  saveTaskCategories(categories);
  return newCat;
}

export function deleteTaskCategory(id: string): void {
  const current = getTaskCategories();
  const filtered = current.filter((c) => c.id !== id);
  saveTaskCategories(filtered);

  // If generic tasks exist for this category, remove them
  const genericList = getGenericTasksList();
  const remaining = genericList.filter((item) => item.taskType !== id);
  saveGenericTasksList(remaining);
}

export function updateTaskCategory(cat: TaskCategoryConfig): boolean {
  const categories = getTaskCategories();
  const idx = categories.findIndex((c) => c.id === cat.id);
  if (idx === -1) return false;
  categories[idx] = { ...cat };
  saveTaskCategories(categories);
  return true;
}

export function getGenericTasksList(): GenericTaskRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GENERIC_TASKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGenericTasksList(list: GenericTaskRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.GENERIC_TASKS, JSON.stringify(list));
}

export const TASK_CONFIG: Record<
  string,
  { title: string; shortTitle: string; unit: string; badge: string; color: string; id?: string; isCustom?: boolean }
> = new Proxy(
  {},
  {
    get(_target, prop: string) {
      const categories = getTaskCategories();
      const found = categories.find((c) => c.id === prop);
      if (found) return found;
      return {
        id: prop,
        title: prop,
        shortTitle: prop,
        unit: 'mục',
        badge: 'Chỉ tiêu',
        color: 'slate'
      };
    }
  }
);

export function getStaffList(): Staff[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_STAFF;
  }
}

export function saveStaffList(list: Staff[]): void {
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(list));
}

export function getHkcchList(): HKCCHRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HKCCH);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.HKCCH, JSON.stringify(INITIAL_HKCCH));
      return INITIAL_HKCCH;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_HKCCH;
  }
}

export function saveHkcchList(list: HKCCHRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.HKCCH, JSON.stringify(list));
}

export function getMatuyList(): MaTuyRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATUY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MATUY, JSON.stringify(INITIAL_MATUY));
      return INITIAL_MATUY;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MATUY;
  }
}

export function saveMatuyList(list: MaTuyRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.MATUY, JSON.stringify(list));
}

export function getDcttpList(): DCTTPRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DCTTP);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DCTTP, JSON.stringify(INITIAL_DCTTP));
      return INITIAL_DCTTP;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DCTTP;
  }
}

export function saveDcttpList(list: DCTTPRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.DCTTP, JSON.stringify(list));
}

export function getDatdaiList(): DatDaiRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DATDAI);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DATDAI, JSON.stringify(INITIAL_DATDAI));
      return INITIAL_DATDAI;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DATDAI;
  }
}

export function saveDatdaiList(list: DatDaiRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.DATDAI, JSON.stringify(list));
}

export function getConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) {
      const defaultCfg: AppConfig = {
        apiUrl: '',
        useLiveGoogleSheet: false,
        unitName: 'CÔNG AN PHƯỜNG / XÃ',
        subUnitName: 'TỔ CẢNH SÁT KHU VỰC & PHÒNG CHỐNG TỘI PHẠM',
        autoSyncIntervalMinutes: 5,
        lastSyncTime: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(defaultCfg));
      return defaultCfg;
    }
    return JSON.parse(raw);
  } catch {
    return {
      apiUrl: '',
      useLiveGoogleSheet: false,
      unitName: 'CÔNG AN PHƯỜNG / XÃ',
      subUnitName: 'TỔ CẢNH SÁT KHU VỰC & PHÒNG CHỐNG TỘI PHẠM',
      autoSyncIntervalMinutes: 5
    };
  }
}

export function saveConfig(cfg: AppConfig): void {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(cfg));
}

export function calculateTaskStats(taskType: TaskType, staffIdFilter?: string): TaskStats {
  if (taskType === 'hkcch') {
    const list = getHkcchList().filter((r) => !staffIdFilter || r.canBoId === staffIdFilter);
    const total = list.length;
    const done = list.filter((r) => r.isDone).length;
    const remain = total - done;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, remain, percent };
  }

  if (taskType === 'matuy') {
    const list = getMatuyList().filter((r) => !staffIdFilter || r.canBoId === staffIdFilter);
    const total = list.length;
    const done = list.filter((r) => r.isDone).length;
    const remain = total - done;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, remain, percent };
  }

  if (taskType === 'dcttp') {
    const list = getDcttpList().filter((r) => !staffIdFilter || r.canBoId === staffIdFilter);
    const total = list.reduce((sum, item) => sum + (Number(item.tongNhanKhau) || 0), 0);
    const done = list.reduce((sum, item) => sum + (Number(item.soLuongDaDieuChinh) || 0), 0);
    const remain = Math.max(0, total - done);
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, remain, percent };
  }

  if (taskType === 'datdai') {
    const list = getDatdaiList().filter((r) => !staffIdFilter || r.canBoId === staffIdFilter);
    const total = list.length;
    const done = list.filter((r) => r.isDone).length;
    const remain = total - done;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, remain, percent };
  }

  // Support for custom / generic task categories
  const genericList = getGenericTasksList().filter(
    (r) => r.taskType === taskType && (!staffIdFilter || r.canBoId === staffIdFilter)
  );
  const total = genericList.length;
  const done = genericList.filter((r) => r.isDone).length;
  const remain = total - done;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, remain, percent };
}

export function getAllDashboardStats(): AllDashboardStats {
  const categories = getTaskCategories();
  const res: AllDashboardStats = {
    hkcch: calculateTaskStats('hkcch'),
    matuy: calculateTaskStats('matuy'),
    dcttp: calculateTaskStats('dcttp'),
    datdai: calculateTaskStats('datdai')
  };
  categories.forEach((cat) => {
    res[cat.id] = calculateTaskStats(cat.id);
  });
  return res;
}

export function getStaffStatsForTask(taskType: TaskType): StaffTaskStats[] {
  const staffList = getStaffList();
  return staffList.map((staff) => {
    const st = calculateTaskStats(taskType, staff.id);
    return {
      staffId: staff.id,
      staffName: staff.name,
      total: st.total,
      done: st.done,
      remain: st.remain,
      percent: st.percent
    };
  });
}

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'user_admin_maitritam',
    username: 'maitritam',
    email: 'maitritam@gmail.com',
    password: '123',
    role: 'admin',
    name: 'Mai Trí Tâm',
    rank: 'Trung tá',
    title: 'Chỉ huy trưởng - Quản trị hệ thống',
    phone: '0989.888.999',
    assignedAreas: ['Toàn địa bàn']
  },
  {
    id: 'user_admin',
    username: 'admin',
    email: 'admin@congandiaphuong.gov.vn',
    password: '123',
    role: 'admin',
    name: 'Lê Văn Minh',
    rank: 'Trung tá',
    title: 'Trưởng Công an Phường',
    phone: '0912.000.999',
    assignedAreas: ['Toàn địa bàn']
  },
  {
    id: 'user_cb_hung',
    username: 'cb_hung',
    password: '123',
    role: 'officer',
    staffId: 'cb_hung',
    name: 'Nguyễn Văn Hùng',
    rank: 'Đại úy',
    title: 'Cảnh sát khu vực',
    phone: '0988.123.456',
    assignedAreas: ['Tổ 1', 'Tổ 2']
  },
  {
    id: 'user_cb_long',
    username: 'cb_long',
    password: '123',
    role: 'officer',
    staffId: 'cb_long',
    name: 'Trần Đình Long',
    rank: 'Thượng úy',
    title: 'Cảnh sát khu vực',
    phone: '0977.234.567',
    assignedAreas: ['Tổ 3', 'Tổ 4']
  },
  {
    id: 'user_cb_nam',
    username: 'cb_nam',
    password: '123',
    role: 'officer',
    staffId: 'cb_nam',
    name: 'Lê Hoàng Nam',
    rank: 'Trung úy',
    title: 'Cảnh sát khu vực',
    phone: '0912.345.678',
    assignedAreas: ['Tổ 5', 'Tổ 6']
  },
  {
    id: 'user_cb_duc',
    username: 'cb_duc',
    password: '123',
    role: 'officer',
    staffId: 'cb_duc',
    name: 'Phạm Minh Đức',
    rank: 'Thiếu tá',
    title: 'Cảnh sát khu vực',
    phone: '0903.456.789',
    assignedAreas: ['Tổ 7']
  },
  {
    id: 'user_cb_bao',
    username: 'cb_bao',
    password: '123',
    role: 'officer',
    staffId: 'cb_bao',
    name: 'Vũ Quốc Bảo',
    rank: 'Đại úy',
    title: 'Cảnh sát khu vực',
    phone: '0936.567.890',
    assignedAreas: ['Tổ 8']
  },
  {
    id: 'user_cb_mai',
    username: 'cb_mai',
    password: '123',
    role: 'officer',
    staffId: 'cb_mai',
    name: 'Hoàng Thị Mai',
    rank: 'Thượng úy',
    title: 'Cảnh sát khu vực',
    phone: '0966.678.901',
    assignedAreas: ['Tổ 9', 'Tổ 10']
  }
];

export function getUserAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    let accounts: UserAccount[] = raw ? JSON.parse(raw) : [...INITIAL_USER_ACCOUNTS];

    // Ensure the primary requested admin account 'maitritam' (Mai Trí Tâm) is always present!
    const hasMaiTriTam = accounts.some(
      (a) =>
        a.username.toLowerCase() === 'maitritam' ||
        (a.email && a.email.toLowerCase() === 'maitritam@gmail.com') ||
        a.id === 'user_admin_maitritam'
    );

    if (!hasMaiTriTam) {
      accounts.unshift({
        id: 'user_admin_maitritam',
        username: 'maitritam',
        email: 'maitritam@gmail.com',
        password: '123',
        role: 'admin',
        name: 'Mai Trí Tâm',
        rank: 'Trung tá',
        title: 'Chỉ huy trưởng - Quản trị hệ thống',
        phone: '0989.888.999',
        assignedAreas: ['Toàn địa bàn']
      });
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    }

    return accounts;
  } catch {
    return INITIAL_USER_ACCOUNTS;
  }
}

export function saveUserAccounts(accounts: UserAccount[]): void {
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserAccount | null): void {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } else {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// Clean phone or username helper for matching
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[\s.-]/g, '');
}

export function authenticateUser(
  identifier: string,
  pass: string
): { success: boolean; user?: UserAccount; error?: string } {
  const accounts = getUserAccounts();
  const rawId = identifier.trim().toLowerCase();
  const cleanId = normalizeText(identifier);
  const cleanPass = pass.trim();

  if (!rawId) {
    return { success: false, error: 'Vui lòng nhập tên đăng nhập, email hoặc số điện thoại' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Vui lòng nhập mật khẩu' };
  }

  const user = accounts.find((acc) => {
    const usernameMatch =
      acc.username.toLowerCase() === rawId ||
      normalizeText(acc.username) === cleanId;
    const emailMatch =
      Boolean(acc.email && (acc.email.toLowerCase() === rawId || normalizeText(acc.email) === cleanId));
    const phoneMatch =
      acc.phone.toLowerCase() === rawId ||
      normalizeText(acc.phone) === cleanId;
    const idMatch =
      acc.id.toLowerCase() === rawId ||
      cleanId === acc.id.toLowerCase();
    const staffIdMatch =
      Boolean(acc.staffId && (acc.staffId.toLowerCase() === rawId || normalizeText(acc.staffId) === cleanId));

    return usernameMatch || emailMatch || phoneMatch || idMatch || staffIdMatch;
  });

  if (!user) {
    return {
      success: false,
      error: `Không tìm thấy tài khoản "${identifier}". Vui lòng kiểm tra lại tên đăng nhập, email hoặc số điện thoại.`
    };
  }

  // Accept password: matched stored password OR default password '123' / '123456'
  const isPassValid =
    user.password === cleanPass ||
    (cleanPass === '123' && (user.password === '123456' || user.password === '123')) ||
    (cleanPass === '123456' && (user.password === '123456' || user.password === '123'));

  if (!isPassValid) {
    return {
      success: false,
      error: 'Mật khẩu không chính xác. Mật khẩu mặc định hệ thống là: 123 hoặc 123456'
    };
  }

  // Save current active user
  setCurrentUser(user);
  return { success: true, user };
}

export function changeUserPassword(userId: string, newPass: string): boolean {
  try {
    const accounts = getUserAccounts();
    const updated = accounts.map((acc) =>
      acc.id === userId ? { ...acc, password: newPass } : acc
    );
    saveUserAccounts(updated);
    const curr = getCurrentUser();
    if (curr && curr.id === userId) {
      setCurrentUser({ ...curr, password: newPass });
    }
    return true;
  } catch {
    return false;
  }
}

export function getDeletedAccountIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_ACCOUNTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDeletedAccountId(id: string): void {
  try {
    const list = getDeletedAccountIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(STORAGE_KEYS.DELETED_ACCOUNTS, JSON.stringify(list));
    }
  } catch {
    // Ignore
  }
}

export function syncStaffToAccounts(staffList: Staff[]): void {
  const accounts = getUserAccounts();
  const deletedIds = new Set(getDeletedAccountIds());
  const existingStaffIds = new Set(accounts.filter((a) => a.staffId).map((a) => a.staffId));

  let modified = false;
  const newAccounts = [...accounts];

  staffList.forEach((staff) => {
    // If user previously deleted this account, do not auto-recreate
    if (deletedIds.has(`user_${staff.id}`) || deletedIds.has(staff.id)) {
      return;
    }

    if (!existingStaffIds.has(staff.id)) {
      modified = true;
      newAccounts.push({
        id: `user_${staff.id}`,
        username: staff.id,
        password: '123',
        role: 'officer',
        staffId: staff.id,
        name: staff.name.replace(/^Đ\/c\s*/i, ''),
        rank: staff.rank,
        title: 'Cảnh sát khu vực',
        phone: staff.phone,
        assignedAreas: staff.assignedAreas
      });
    } else {
      // Update details
      const idx = newAccounts.findIndex((a) => a.staffId === staff.id);
      if (idx !== -1) {
        newAccounts[idx] = {
          ...newAccounts[idx],
          name: staff.name.replace(/^Đ\/c\s*/i, ''),
          rank: staff.rank,
          phone: staff.phone,
          assignedAreas: staff.assignedAreas
        };
        modified = true;
      }
    }
  });

  if (modified) {
    saveUserAccounts(newAccounts);
  }
}

export function addCustomAccount(data: Omit<UserAccount, 'id'>): UserAccount {
  const accounts = getUserAccounts();
  const newAccount: UserAccount = {
    ...data,
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    password: data.password || '123'
  };
  accounts.push(newAccount);
  saveUserAccounts(accounts);
  return newAccount;
}

export function updateUserAccount(account: UserAccount): boolean {
  try {
    const accounts = getUserAccounts();
    const idx = accounts.findIndex((a) => a.id === account.id);
    if (idx === -1) return false;
    accounts[idx] = { ...account };
    saveUserAccounts(accounts);
    const curr = getCurrentUser();
    if (curr && curr.id === account.id) {
      setCurrentUser(accounts[idx]);
    }
    return true;
  } catch {
    return false;
  }
}

export function deleteUserAccount(userId: string): boolean {
  try {
    const accounts = getUserAccounts();
    const target = accounts.find((a) => a.id === userId);
    const filtered = accounts.filter((a) => a.id !== userId);
    saveUserAccounts(filtered);

    // Save to deleted list so syncStaffToAccounts won't resurrect it
    saveDeletedAccountId(userId);
    if (target?.staffId) {
      saveDeletedAccountId(target.staffId);
      saveDeletedAccountId(`user_${target.staffId}`);
    }
    if (target?.username) {
      saveDeletedAccountId(target.username);
    }

    // If currently logged-in user is being deleted, log out
    const curr = getCurrentUser();
    if (curr && curr.id === userId) {
      logoutUser();
    }

    return true;
  } catch {
    return false;
  }
}

export function resetAccountPassword(userId: string, defaultPassword = '123'): boolean {
  return changeUserPassword(userId, defaultPassword);
}

export function resetAllDataToDefault(): void {
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
  localStorage.setItem(STORAGE_KEYS.HKCCH, JSON.stringify(INITIAL_HKCCH));
  localStorage.setItem(STORAGE_KEYS.MATUY, JSON.stringify(INITIAL_MATUY));
  localStorage.setItem(STORAGE_KEYS.DCTTP, JSON.stringify(INITIAL_DCTTP));
  localStorage.setItem(STORAGE_KEYS.DATDAI, JSON.stringify(INITIAL_DATDAI));
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_USER_ACCOUNTS));
  localStorage.removeItem(STORAGE_KEYS.DELETED_ACCOUNTS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

