export type TaskType = 'hkcch' | 'matuy' | 'dcttp' | 'datdai' | string;

export interface TaskCategoryConfig {
  id: string;
  title: string;
  shortTitle: string;
  unit: string;
  badge: string;
  color: string;
  isCustom?: boolean;
}

export interface TaskInfo {
  id: TaskType;
  title: string;
  shortName: string;
  badge: string;
  icon: string;
  description: string;
  unit: string;
  color: string;
}

export interface ResidentialGroup {
  id: string;
  name: string;
  code?: string;
  householdCount?: number;
  populationCount?: number;
  assignedStaffIds: string[];
  note?: string;
}

export interface Staff {
  id: string;
  name: string;
  rank: string; // Thượng úy, Đại úy, Thiếu tá...
  phone: string;
  assignedAreas: string[]; // Tổ 1, Tổ 2... (rỗng nếu không phụ trách địa bàn)
  isNoArea?: boolean; // Đánh dấu cán bộ không phụ trách địa bàn
  roleDescription?: string;
  avatarBg?: string;
}

export interface HKCCHRecord {
  stt: number;
  hoTen: string;
  soHoSo: string;
  toDanPho: string;
  canBoId: string;
  canBoName?: string;
  isDone: boolean;
  updatedAt?: string;
  note?: string;
}

export interface MaTuyRecord {
  stt: number;
  hoTen: string;
  namSinh: string;
  soCMND?: string;
  toDanPho: string;
  canBoId: string;
  canBoName?: string;
  isDone: boolean;
  ketQuaTest?: 'Âm tính' | 'Dương tính' | 'Chưa test';
  updatedAt?: string;
  note?: string;
}

export interface DCTTPRecord {
  stt: number;
  hoTen: string;
  tongNhanKhau: number;
  soLuongDaDieuChinh: number;
  toDanPho: string;
  canBoId: string;
  canBoName?: string;
  isDone: boolean;
  updatedAt?: string;
  note?: string;
}

export interface DatDaiRecord {
  stt: number;
  chuHo: string;
  cmnd: string;
  namSinh: string;
  diaChi: string;
  toDanPho: string;
  canBoId: string;
  canBoName?: string;
  status: 'pending' | 'cccd_updated' | 'wrong_info' | 'no_info';
  statusText?: string;
  cccd?: string;
  dob?: string;
  wrongDetail?: string;
  noInfoReason?: string;
  isDone: boolean;
  updatedAt?: string;
}

export interface GenericTaskRecord {
  stt: number;
  taskType: string;
  hoTen: string;
  soHoSo?: string;
  toDanPho: string;
  canBoId: string;
  canBoName?: string;
  isDone: boolean;
  info1?: string;
  info2?: string;
  updatedAt?: string;
  note?: string;
}

export interface TaskStats {
  total: number;
  done: number;
  remain: number;
  percent: number;
}

export interface StaffTaskStats {
  staffId: string;
  staffName: string;
  total: number;
  done: number;
  remain: number;
  percent: number;
}

export interface AllDashboardStats {
  hkcch: TaskStats;
  matuy: TaskStats;
  dcttp: TaskStats;
  datdai: TaskStats;
  [key: string]: TaskStats;
}

export interface AppConfig {
  apiUrl: string;
  useLiveGoogleSheet: boolean;
  unitName: string;
  subUnitName: string;
  autoSyncIntervalMinutes: number;
  lastSyncTime?: string;
}

export type UserRole = 'admin' | 'officer';

export interface UserAccount {
  id: string;
  username: string;
  email?: string;
  password: string;
  role: UserRole;
  name: string;
  rank: string;
  title: string;
  phone: string;
  staffId?: string;
  assignedAreas?: string[];
  isCustomAdmin?: boolean;
}

// Aliases for any backward compatibility
export type HkcchRecord = HKCCHRecord;
export type MatuyRecord = MaTuyRecord;
export type DcttpRecord = DCTTPRecord;
export type DatdaiRecord = DatDaiRecord;

