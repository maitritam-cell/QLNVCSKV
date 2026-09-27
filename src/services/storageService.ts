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
  AppConfig 
} from '../types';
import { 
  INITIAL_STAFF, 
  INITIAL_CONFIG, 
  INITIAL_HKCCH, 
  INITIAL_MATUY, 
  INITIAL_DCTTP, 
  INITIAL_DATDAI 
} from './mockData';

const KEYS = {
  STAFF: 'nhiemvu_staff_v2',
  CONFIG: 'nhiemvu_config_v2',
  HKCCH: 'nhiemvu_hkcch_v2',
  MATUY: 'nhiemvu_matuy_v2',
  DCTTP: 'nhiemvu_dcttp_v2',
  DATDAI: 'nhiemvu_datdai_v2'
};

export class StorageService {
  // Config
  static getConfig(): AppConfig {
    const raw = localStorage.getItem(KEYS.CONFIG);
    if (!raw) {
      this.saveConfig(INITIAL_CONFIG);
      return INITIAL_CONFIG;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CONFIG;
    }
  }

  static saveConfig(config: AppConfig): void {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
  }

  // Staff
  static getStaffList(): Staff[] {
    const raw = localStorage.getItem(KEYS.STAFF);
    if (!raw) {
      this.saveStaffList(INITIAL_STAFF);
      return INITIAL_STAFF;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STAFF;
    }
  }

  static saveStaffList(staff: Staff[]): void {
    localStorage.setItem(KEYS.STAFF, JSON.stringify(staff));
  }

  // HKCCH
  static getHKCCHList(): HKCCHRecord[] {
    const raw = localStorage.getItem(KEYS.HKCCH);
    if (!raw) {
      this.saveHKCCHList(INITIAL_HKCCH);
      return INITIAL_HKCCH;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_HKCCH;
    }
  }

  static saveHKCCHList(list: HKCCHRecord[]): void {
    localStorage.setItem(KEYS.HKCCH, JSON.stringify(list));
  }

  // Ma Tuy
  static getMaTuyList(): MaTuyRecord[] {
    const raw = localStorage.getItem(KEYS.MATUY);
    if (!raw) {
      this.saveMaTuyList(INITIAL_MATUY);
      return INITIAL_MATUY;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_MATUY;
    }
  }

  static saveMaTuyList(list: MaTuyRecord[]): void {
    localStorage.setItem(KEYS.MATUY, JSON.stringify(list));
  }

  // DCTTP
  static getDCTTPList(): DCTTPRecord[] {
    const raw = localStorage.getItem(KEYS.DCTTP);
    if (!raw) {
      this.saveDCTTPList(INITIAL_DCTTP);
      return INITIAL_DCTTP;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DCTTP;
    }
  }

  static saveDCTTPList(list: DCTTPRecord[]): void {
    localStorage.setItem(KEYS.DCTTP, JSON.stringify(list));
  }

  // Dat Dai
  static getDatDaiList(): DatDaiRecord[] {
    const raw = localStorage.getItem(KEYS.DATDAI);
    if (!raw) {
      this.saveDatDaiList(INITIAL_DATDAI);
      return INITIAL_DATDAI;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DATDAI;
    }
  }

  static saveDatDaiList(list: DatDaiRecord[]): void {
    localStorage.setItem(KEYS.DATDAI, JSON.stringify(list));
  }

  // Generic Update for simple status
  static updateSimpleTask(task: 'hkcch' | 'matuy', stt: number, isDone: boolean, note?: string): void {
    const dateStr = new Date().toLocaleDateString('vi-VN');
    if (task === 'hkcch') {
      const list = this.getHKCCHList();
      const updated = list.map(item => {
        if (item.stt === stt) {
          return {
            ...item,
            isDone,
            updatedAt: isDone ? (item.updatedAt || dateStr) : undefined,
            note: note !== undefined ? note : item.note
          };
        }
        return item;
      });
      this.saveHKCCHList(updated);
    } else if (task === 'matuy') {
      const list = this.getMaTuyList();
      const updated = list.map(item => {
        if (item.stt === stt) {
          return {
            ...item,
            isDone,
            ketQuaTest: isDone ? (item.ketQuaTest || 'Âm tính') : undefined,
            updatedAt: isDone ? (item.updatedAt || dateStr) : undefined,
            note: note !== undefined ? note : item.note
          };
        }
        return item;
      });
      this.saveMaTuyList(updated);
    }
  }

  // Update DCTTP count
  static updateDCTTP(stt: number, count: number, note?: string): void {
    const dateStr = new Date().toLocaleDateString('vi-VN');
    const list = this.getDCTTPList();
    const updated = list.map(item => {
      if (item.stt === stt) {
        const isDone = count >= item.tongNhanKhau;
        return {
          ...item,
          soLuongDaDieuChinh: count,
          isDone,
          updatedAt: isDone ? (item.updatedAt || dateStr) : item.updatedAt,
          note: note !== undefined ? note : item.note
        };
      }
      return item;
    });
    this.saveDCTTPList(updated);
  }

  // Update Dat Dai
  static updateDatDai(
    stt: number,
    payload: {
      type: 'cccd' | 'wrong' | 'noinfo';
      cccd?: string;
      dob?: string;
      wrongDetail?: string;
      noInfoReason?: string;
    }
  ): void {
    const dateStr = new Date().toLocaleDateString('vi-VN');
    const list = this.getDatDaiList();
    const updated = list.map(item => {
      if (item.stt === stt) {
        let statusText = '';
        let status: 'cccd_updated' | 'wrong_info' | 'no_info' = 'cccd_updated';

        if (payload.type === 'cccd') {
          status = 'cccd_updated';
          statusText = `Cập nhật CCCD: ${payload.cccd || ''}`;
        } else if (payload.type === 'wrong') {
          status = 'wrong_info';
          statusText = `Sai thông tin: ${payload.wrongDetail || ''}`;
        } else if (payload.type === 'noinfo') {
          status = 'no_info';
          statusText = `Không có TT: ${payload.noInfoReason || ''}`;
        }

        return {
          ...item,
          status,
          statusText,
          cccd: payload.cccd,
          dob: payload.dob,
          wrongDetail: payload.wrongDetail,
          noInfoReason: payload.noInfoReason,
          isDone: true,
          updatedAt: dateStr
        };
      }
      return item;
    });
    this.saveDatDaiList(updated);
  }

  // Task Stats Calculation
  static getTaskStats(taskType: TaskType, staffId?: string): TaskStats {
    if (taskType === 'hkcch') {
      const list = this.getHKCCHList().filter(r => !staffId || r.canBoId === staffId);
      const total = list.length;
      const done = list.filter(r => r.isDone).length;
      const remain = total - done;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      return { total, done, remain, percent };
    }

    if (taskType === 'matuy') {
      const list = this.getMaTuyList().filter(r => !staffId || r.canBoId === staffId);
      const total = list.length;
      const done = list.filter(r => r.isDone).length;
      const remain = total - done;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      return { total, done, remain, percent };
    }

    if (taskType === 'dcttp') {
      const list = this.getDCTTPList().filter(r => !staffId || r.canBoId === staffId);
      const total = list.reduce((sum, item) => sum + item.tongNhanKhau, 0);
      const done = list.reduce((sum, item) => sum + item.soLuongDaDieuChinh, 0);
      const remain = Math.max(0, total - done);
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      return { total, done, remain, percent };
    }

    if (taskType === 'datdai') {
      const list = this.getDatDaiList().filter(r => !staffId || r.canBoId === staffId);
      const total = list.length;
      const done = list.filter(r => r.isDone).length;
      const remain = total - done;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      return { total, done, remain, percent };
    }

    return { total: 0, done: 0, remain: 0, percent: 0 };
  }

  static getAllDashboardStats(): AllDashboardStats {
    return {
      hkcch: this.getTaskStats('hkcch'),
      matuy: this.getTaskStats('matuy'),
      dcttp: this.getTaskStats('dcttp'),
      datdai: this.getTaskStats('datdai')
    };
  }

  static getStaffStatsForTask(taskType: TaskType): StaffTaskStats[] {
    const staffList = this.getStaffList();
    return staffList.map(s => {
      const stats = this.getTaskStats(taskType, s.id);
      return {
        staffId: s.id,
        staffName: `${s.rank ? s.rank + ' ' : ''}${s.name}`,
        total: stats.total,
        done: stats.done,
        remain: stats.remain,
        percent: stats.percent
      };
    });
  }

  // Reset all to default mock data
  static resetAllToDefault(): void {
    localStorage.removeItem(KEYS.STAFF);
    localStorage.removeItem(KEYS.CONFIG);
    localStorage.removeItem(KEYS.HKCCH);
    localStorage.removeItem(KEYS.MATUY);
    localStorage.removeItem(KEYS.DCTTP);
    localStorage.removeItem(KEYS.DATDAI);
    this.saveConfig(INITIAL_CONFIG);
    this.saveStaffList(INITIAL_STAFF);
    this.saveHKCCHList(INITIAL_HKCCH);
    this.saveMaTuyList(INITIAL_MATUY);
    this.saveDCTTPList(INITIAL_DCTTP);
    this.saveDatDaiList(INITIAL_DATDAI);
  }

  // Export CSV
  static exportToCSV(taskType: TaskType): string {
    if (taskType === 'hkcch') {
      const list = this.getHKCCHList();
      let csv = 'STT,Ho Va Ten,So Ho So,To Dan Pho,Can Bo Phuc Trach,Trang Thai,Ngay Cap Nhat,Ghi Chu\n';
      list.forEach(r => {
        csv += `"${r.stt}","${r.hoTen}","${r.soHoSo}","${r.toDanPho}","${r.canBoId}","${r.isDone ? 'Đã thực hiện' : 'Chưa thực hiện'}","${r.updatedAt || ''}","${r.note || ''}"\n`;
      });
      return csv;
    }

    if (taskType === 'matuy') {
      const list = this.getMaTuyList();
      let csv = 'STT,Ho Va Ten,Nam Sinh,CMND,To Dan Pho,Can Bo Phuc Trach,Ket Qua Test,Trang Thai,Ngay Cap Nhat,Ghi Chu\n';
      list.forEach(r => {
        csv += `"${r.stt}","${r.hoTen}","${r.namSinh}","${r.soCMND || ''}","${r.toDanPho}","${r.canBoId}","${r.ketQuaTest || ''}","${r.isDone ? 'Đã test' : 'Chưa test'}","${r.updatedAt || ''}","${r.note || ''}"\n`;
      });
      return csv;
    }

    if (taskType === 'dcttp') {
      const list = this.getDCTTPList();
      let csv = 'STT,Ten Khu Dan Cu,Tong Nhan Khau,Da Dieu Chinh,To Dan Pho,Can Bo Phuc Trach,Trang Thai,Ngay Cap Nhat,Ghi Chu\n';
      list.forEach(r => {
        csv += `"${r.stt}","${r.hoTen}","${r.tongNhanKhau}","${r.soLuongDaDieuChinh}","${r.toDanPho}","${r.canBoId}","${r.isDone ? 'Đã xong' : 'Đang làm'}","${r.updatedAt || ''}","${r.note || ''}"\n`;
      });
      return csv;
    }

    if (taskType === 'datdai') {
      const list = this.getDatDaiList();
      let csv = 'STT,Chu Ho,CMND Goc,Nam Sinh,Dia Chi,To Dan Pho,Can Bo Phuc Trach,Ket Qua Lam Sach,CCCD,Ngay Sinh,Trang Thai,Ngay Cap Nhat\n';
      list.forEach(r => {
        csv += `"${r.stt}","${r.chuHo}","${r.cmnd}","${r.namSinh}","${r.diaChi}","${r.toDanPho}","${r.canBoId}","${r.statusText || ''}","${r.cccd || ''}","${r.dob || ''}","${r.isDone ? 'Đã làm' : 'Chưa làm'}","${r.updatedAt || ''}"\n`;
      });
      return csv;
    }

    return '';
  }

  // Google Apps Script Live Sync test
  static async testGasConnection(url: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'action=ping', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        return { success: true, message: 'Kết nối Google Apps Script Web App thành công!' };
      }
      return { success: false, message: `Máy chủ phản hồi mã lỗi HTTP ${res.status}` };
    } catch (err: any) {
      return { success: false, message: `Lỗi kết nối: ${err.message || 'Không thể truy cập URL'}` };
    }
  }
}
