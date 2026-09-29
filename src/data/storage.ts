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
  GenericTaskRecord,
  InformationPost,
  ResidentialGroup
} from '../types';
import {
  INITIAL_STAFF,
  INITIAL_HKCCH,
  INITIAL_MATUY,
  INITIAL_DCTTP,
  INITIAL_DATDAI
} from './initialData';
import {
  cloudCache,
  isCloudReady,
  initializeCloudStorage as initializeCloudStorageRemote,
  persistStaff,
  persistResidentialGroups,
  persistTaskCategories,
  persistTaskList,
  persistInformationPosts,
  persistGenericTasks,
  persistSetting,
  migrateLocalDataToCloud as migrateLocalDataToCloudRemote
} from './cloudStorage';

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
  GENERIC_TASKS: 'nhiemvu_generic_tasks_v2',
  RESIDENTIAL_GROUPS: 'nhiemvu_residential_groups_v1'
};

export const DEFAULT_RESIDENTIAL_GROUPS: ResidentialGroup[] = [
  { id: 'tdp_1', name: 'Tổ 1', code: 'TDP01', assignedStaffIds: ['cb_hung'], householdCount: 220, populationCount: 850, note: 'Khu dân cư A' },
  { id: 'tdp_2', name: 'Tổ 2', code: 'TDP02', assignedStaffIds: ['cb_hung'], householdCount: 195, populationCount: 780, note: 'Khu tập thể B' },
  { id: 'tdp_3', name: 'Tổ 3', code: 'TDP03', assignedStaffIds: ['cb_long'], householdCount: 260, populationCount: 990, note: 'Khu phố trung tâm' },
  { id: 'tdp_4', name: 'Tổ 4', code: 'TDP04', assignedStaffIds: ['cb_long'], householdCount: 180, populationCount: 710, note: 'Khu tập thể quân đội' },
  { id: 'tdp_5', name: 'Tổ 5', code: 'TDP05', assignedStaffIds: ['cb_nam'], householdCount: 210, populationCount: 820, note: 'Mặt phố chính' },
  { id: 'tdp_6', name: 'Tổ 6', code: 'TDP06', assignedStaffIds: ['cb_nam'], householdCount: 240, populationCount: 930, note: 'Khu dân cư mới' },
  { id: 'tdp_7', name: 'Tổ 7', code: 'TDP07', assignedStaffIds: ['cb_duc'], householdCount: 205, populationCount: 800, note: 'Khu tập thể nhà máy' },
  { id: 'tdp_8', name: 'Tổ 8', code: 'TDP08', assignedStaffIds: ['cb_bao'], householdCount: 230, populationCount: 890, note: 'Ven hồ' },
  { id: 'tdp_9', name: 'Tổ 9', code: 'TDP09', assignedStaffIds: ['cb_mai'], householdCount: 190, populationCount: 750, note: 'Chợ trung tâm' },
  { id: 'tdp_10', name: 'Tổ 10', code: 'TDP10', assignedStaffIds: ['cb_mai'], householdCount: 215, populationCount: 840, note: 'Khu bờ kè' }
];

export function getResidentialGroups(): ResidentialGroup[] {
  if (isCloudReady()) return cloudCache.residentialGroups;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESIDENTIAL_GROUPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.RESIDENTIAL_GROUPS, JSON.stringify(DEFAULT_RESIDENTIAL_GROUPS));
      return DEFAULT_RESIDENTIAL_GROUPS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_RESIDENTIAL_GROUPS;
  } catch {
    return DEFAULT_RESIDENTIAL_GROUPS;
  }
}

export function saveResidentialGroups(groups: ResidentialGroup[]): void {
  if (isCloudReady()) {
    void persistResidentialGroups(groups);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.RESIDENTIAL_GROUPS, JSON.stringify(groups));
}

export function addResidentialGroup(data: Omit<ResidentialGroup, 'id'>): ResidentialGroup {
  const list = getResidentialGroups();
  const id = `tdp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newGroup: ResidentialGroup = {
    ...data,
    id
  };
  list.push(newGroup);
  saveResidentialGroups(list);
  return newGroup;
}

function normalizeResidentialGroupName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/tổ\s*dân\s*phố/gi, 'tổ')
    .replace(/\s+/g, ' ');
}

function isSameResidentialGroupName(a: string, b: string): boolean {
  return normalizeResidentialGroupName(a) === normalizeResidentialGroupName(b);
}

/**
 * Update staff assignments and existing task records when an administrator
 * changes the name of a Tổ dân phố.
 */
function renameResidentialGroupReferences(oldName: string, newName: string): void {
  const updateAreaName = (value: string): string =>
    value && isSameResidentialGroupName(value, oldName) ? newName : value;

  const staffList = getStaffList();
  const updatedStaff = staffList.map((staff) => ({
    ...staff,
    assignedAreas: (staff.assignedAreas || []).map(updateAreaName)
  }));
  saveStaffList(updatedStaff);
  syncStaffToAccounts(updatedStaff);

  const currentUser = getCurrentUser();
  if (currentUser?.staffId) {
    const currentStaff = updatedStaff.find((staff) => staff.id === currentUser.staffId);
    if (currentStaff) {
      setCurrentUser({
        ...currentUser,
        assignedAreas: currentStaff.assignedAreas,
        name: currentStaff.name,
        rank: currentStaff.rank,
        phone: currentStaff.phone
      });
    }
  }

  saveHkcchList(getHkcchList().map((item) => ({
    ...item,
    toDanPho: updateAreaName(item.toDanPho)
  })));

  saveMatuyList(getMatuyList().map((item) => ({
    ...item,
    toDanPho: updateAreaName(item.toDanPho)
  })));

  saveDcttpList(getDcttpList().map((item) => ({
    ...item,
    toDanPho: updateAreaName(item.toDanPho)
  })));

  saveDatdaiList(getDatdaiList().map((item) => ({
    ...item,
    toDanPho: updateAreaName(item.toDanPho)
  })));

  saveGenericTasksList(getGenericTasksList().map((item) => ({
    ...item,
    toDanPho: updateAreaName(item.toDanPho)
  })));
}

export function updateResidentialGroup(group: ResidentialGroup): boolean {
  const list = getResidentialGroups();
  const idx = list.findIndex((g) => g.id === group.id);
  if (idx === -1) return false;

  const oldGroup = list[idx];
  list[idx] = { ...group };
  saveResidentialGroups(list);

  if (oldGroup.name !== group.name) {
    renameResidentialGroupReferences(oldGroup.name, group.name);
  }

  return true;
}

export function deleteResidentialGroup(id: string): void {
  const list = getResidentialGroups();
  const group = list.find((g) => g.id === id);
  const filtered = list.filter((g) => g.id !== id);
  saveResidentialGroups(filtered);

  // Remove the deleted Tổ dân phố from staff area assignments.
  // Existing task records remain untouched to preserve historical data.
  if (group) {
    const staffList = getStaffList();
    const updatedStaff = staffList.map((staff) => ({
      ...staff,
      assignedAreas: (staff.assignedAreas || []).filter(
        (area) => !isSameResidentialGroupName(area, group.name)
      )
    }));
    saveStaffList(updatedStaff);
    syncStaffToAccounts(updatedStaff);

    const currentUser = getCurrentUser();
    if (currentUser?.staffId) {
      const currentStaff = updatedStaff.find((staff) => staff.id === currentUser.staffId);
      if (currentStaff) {
        setCurrentUser({
          ...currentUser,
          assignedAreas: currentStaff.assignedAreas,
          name: currentStaff.name,
          rank: currentStaff.rank,
          phone: currentStaff.phone
        });
      }
    }
  }
}

/**
 * Finds the staff officer responsible for a given residential group name (e.g. 'Tổ 1' or 'Tổ dân phố 1')
 */
export function findOfficerForResidentialGroup(groupName: string): Staff | undefined {
  if (!groupName) return undefined;
  const raw = groupName.trim();
  const normalized = raw.toLowerCase().replace(/tổ\s*dân\s*phố\s*/i, 'tổ ').trim();
  const staffList = getStaffList();

  // Try exact match or normalized match on assignedAreas
  for (const staff of staffList) {
    if (!staff.assignedAreas || staff.assignedAreas.length === 0) continue;
    for (const area of staff.assignedAreas) {
      const areaNorm = area.trim().toLowerCase().replace(/tổ\s*dân\s*phố\s*/i, 'tổ ').trim();
      if (areaNorm === normalized || raw === area || normalized.includes(areaNorm) || areaNorm.includes(normalized)) {
        return staff;
      }
    }
  }

  // Also check residential group table
  const groups = getResidentialGroups();
  const foundGroup = groups.find((g) => {
    const gNorm = g.name.trim().toLowerCase().replace(/tổ\s*dân\s*phố\s*/i, 'tổ ').trim();
    return gNorm === normalized || g.name === raw || gNorm.includes(normalized) || normalized.includes(gNorm);
  });
  if (foundGroup && foundGroup.assignedStaffIds && foundGroup.assignedStaffIds.length > 0) {
    const sId = foundGroup.assignedStaffIds[0];
    return staffList.find((s) => s.id === sId);
  }

  return undefined;
}

/**
 * Reassigns all existing records in database according to the currently assigned officer of their Tổ dân phố
 */
export function reclassifyAllRecordsByResidentialGroup(): {
  reassignedHkcch: number;
  reassignedMatuy: number;
  reassignedDcttp: number;
  reassignedDatdai: number;
  reassignedGeneric: number;
  total: number;
} {
  let reassignedHkcch = 0;
  let reassignedMatuy = 0;
  let reassignedDcttp = 0;
  let reassignedDatdai = 0;
  let reassignedGeneric = 0;

  // 1. HKCCH
  const hkList = getHkcchList();
  const updatedHk = hkList.map((item) => {
    const officer = findOfficerForResidentialGroup(item.toDanPho);
    if (officer && officer.id !== item.canBoId) {
      reassignedHkcch++;
      return {
        ...item,
        canBoId: officer.id,
        canBoName: `${officer.rank} ${officer.name}`
      };
    }
    return item;
  });
  if (reassignedHkcch > 0) saveHkcchList(updatedHk);

  // 2. Matuy
  const mtList = getMatuyList();
  const updatedMt = mtList.map((item) => {
    const officer = findOfficerForResidentialGroup(item.toDanPho);
    if (officer && officer.id !== item.canBoId) {
      reassignedMatuy++;
      return {
        ...item,
        canBoId: officer.id,
        canBoName: `${officer.rank} ${officer.name}`
      };
    }
    return item;
  });
  if (reassignedMatuy > 0) saveMatuyList(updatedMt);

  // 3. DCTTP
  const dcList = getDcttpList();
  const updatedDc = dcList.map((item) => {
    const officer = findOfficerForResidentialGroup(item.toDanPho);
    if (officer && officer.id !== item.canBoId) {
      reassignedDcttp++;
      return {
        ...item,
        canBoId: officer.id,
        canBoName: `${officer.rank} ${officer.name}`
      };
    }
    return item;
  });
  if (reassignedDcttp > 0) saveDcttpList(updatedDc);

  // 4. Datdai
  const ddList = getDatdaiList();
  const updatedDd = ddList.map((item) => {
    const officer = findOfficerForResidentialGroup(item.toDanPho);
    if (officer && officer.id !== item.canBoId) {
      reassignedDatdai++;
      return {
        ...item,
        canBoId: officer.id,
        canBoName: `${officer.rank} ${officer.name}`
      };
    }
    return item;
  });
  if (reassignedDatdai > 0) saveDatdaiList(updatedDd);

  // 5. Generic
  const gnList = getGenericTasksList();
  const updatedGn = gnList.map((item) => {
    const officer = findOfficerForResidentialGroup(item.toDanPho);
    if (officer && officer.id !== item.canBoId) {
      reassignedGeneric++;
      return {
        ...item,
        canBoId: officer.id,
        canBoName: `${officer.rank} ${officer.name}`
      };
    }
    return item;
  });
  if (reassignedGeneric > 0) saveGenericTasksList(updatedGn);

  const total = reassignedHkcch + reassignedMatuy + reassignedDcttp + reassignedDatdai + reassignedGeneric;
  return {
    reassignedHkcch,
    reassignedMatuy,
    reassignedDcttp,
    reassignedDatdai,
    reassignedGeneric,
    total
  };
}

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
  if (isCloudReady()) return cloudCache.taskCategories;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASK_CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TASK_CATEGORIES, JSON.stringify(DEFAULT_TASK_CATEGORIES));
      return DEFAULT_TASK_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_TASK_CATEGORIES;
  } catch {
    return DEFAULT_TASK_CATEGORIES;
  }
}

export function saveTaskCategories(list: TaskCategoryConfig[]): void {
  if (isCloudReady()) {
    void persistTaskCategories(list);
    return;
  }
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

  // Remove records belonging to the deleted category, including built-in categories.
  if (id === 'hkcch') {
    saveHkcchList([]);
  } else if (id === 'matuy') {
    saveMatuyList([]);
  } else if (id === 'dcttp') {
    saveDcttpList([]);
  } else if (id === 'datdai') {
    saveDatdaiList([]);
  }

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

const INFORMATION_POSTS_KEY = 'qlnv_informational_posts';

export function getInformationPosts(): InformationPost[] {
  if (isCloudReady()) return cloudCache.informationPosts;
  try {
    const raw = localStorage.getItem(INFORMATION_POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveInformationPosts(list: InformationPost[]): void {
  if (isCloudReady()) {
    void persistInformationPosts(list);
    return;
  }
  localStorage.setItem(INFORMATION_POSTS_KEY, JSON.stringify(list));
}

export function addInformationPost(data: Omit<InformationPost, 'id' | 'createdAt' | 'updatedAt'>): InformationPost {
  const now = new Date().toISOString();
  const post: InformationPost = {
    ...data,
    id: `info_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now
  };
  saveInformationPosts([post, ...getInformationPosts()]);
  return post;
}

export function updateInformationPost(post: InformationPost): boolean {
  const list = getInformationPosts();
  const index = list.findIndex((item) => item.id === post.id);
  if (index < 0) return false;
  list[index] = { ...post, updatedAt: new Date().toISOString() };
  saveInformationPosts(list);
  return true;
}

export function deleteInformationPost(id: string): void {
  saveInformationPosts(getInformationPosts().filter((item) => item.id !== id));
}

export function getGenericTasksList(): GenericTaskRecord[] {
  if (isCloudReady()) return cloudCache.genericTasks;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GENERIC_TASKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGenericTasksList(list: GenericTaskRecord[]): void {
  if (isCloudReady()) {
    void persistGenericTasks(list);
    return;
  }
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
  if (isCloudReady()) return cloudCache.staff;
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
  if (isCloudReady()) {
    void persistStaff(list);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(list));
}

export function getHkcchList(): HKCCHRecord[] {
  if (isCloudReady()) return cloudCache.hkcch;
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
  if (isCloudReady()) {
    cloudCache.hkcch = list;
    void persistTaskList('hkcch', list);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.HKCCH, JSON.stringify(list));
}

export function getMatuyList(): MaTuyRecord[] {
  if (isCloudReady()) return cloudCache.matuy;
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
  if (isCloudReady()) {
    cloudCache.matuy = list;
    void persistTaskList('matuy', list);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.MATUY, JSON.stringify(list));
}

export function getDcttpList(): DCTTPRecord[] {
  if (isCloudReady()) return cloudCache.dcttp;
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
  if (isCloudReady()) {
    cloudCache.dcttp = list;
    void persistTaskList('dcttp', list);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.DCTTP, JSON.stringify(list));
}

export function getDatdaiList(): DatDaiRecord[] {
  if (isCloudReady()) return cloudCache.datdai;
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
  if (isCloudReady()) {
    cloudCache.datdai = list;
    void persistTaskList('datdai', list);
    return;
  }
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
  // Legacy localStorage accounts are no longer an authentication source.
  // Cloud/Supabase Auth is the only active login mechanism.
  // Keep this getter only for backward-compatible code paths; never recreate
  // default accounts after the browser/site data has been cleared.
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
  // This legacy function is retained only for compatibility with older modules.
  // Active application login uses Supabase Auth via loginWithCloudIdentifier.
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

  const isPassValid = user.password === cleanPass;

  if (!isPassValid) {
    return {
      success: false,
      error: 'Mật khẩu không chính xác.'
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
  if (isCloudReady()) {
    saveStaffList(INITIAL_STAFF);
    saveResidentialGroups(DEFAULT_RESIDENTIAL_GROUPS);
    saveTaskCategories(DEFAULT_TASK_CATEGORIES);
    saveHkcchList(INITIAL_HKCCH);
    saveMatuyList(INITIAL_MATUY);
    saveDcttpList(INITIAL_DCTTP);
    saveDatdaiList(INITIAL_DATDAI);
    saveGenericTasksList([]);
    saveInformationPosts([]);
    return;
  }

  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
  localStorage.setItem(STORAGE_KEYS.HKCCH, JSON.stringify(INITIAL_HKCCH));
  localStorage.setItem(STORAGE_KEYS.MATUY, JSON.stringify(INITIAL_MATUY));
  localStorage.setItem(STORAGE_KEYS.DCTTP, JSON.stringify(INITIAL_DCTTP));
  localStorage.setItem(STORAGE_KEYS.DATDAI, JSON.stringify(INITIAL_DATDAI));
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_USER_ACCOUNTS));
  localStorage.removeItem(STORAGE_KEYS.DELETED_ACCOUNTS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}



export async function initializeCloudStorage(): Promise<boolean> {
  return initializeCloudStorageRemote();
}

export async function migrateLocalDataToCloud(): Promise<{ ok: boolean; message: string }> {
  if (!isCloudReady()) {
    const initialized = await initializeCloudStorageRemote();
    if (!initialized) return { ok: false, message: 'Chưa đăng nhập Supabase nên chưa thể chuyển dữ liệu.' };
  }
  return migrateLocalDataToCloudRemote();
}
