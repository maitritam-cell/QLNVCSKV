import { 
  HKCCHRecord, 
  MaTuyRecord, 
  DCTTPRecord, 
  DatDaiRecord, 
  Staff, 
  TaskInfo, 
  AppConfig 
} from '../types';

export const TASK_LIST: TaskInfo[] = [
  {
    id: 'hkcch',
    title: 'Hộ Không Có Chủ Hộ (HKCCH)',
    shortName: 'HKCCH',
    badge: 'Đề án 06',
    icon: 'Home',
    description: 'Rà soát, bổ sung và xác định chủ hộ cho các trường hợp hộ gia đình chưa có chủ hộ trên địa bàn',
    unit: 'Hộ',
    color: 'blue'
  },
  {
    id: 'matuy',
    title: 'Test Đối Tượng Ma Túy',
    shortName: 'Test Ma Túy',
    badge: 'Nghiệp vụ CSĐT',
    icon: 'TestTube',
    description: 'Lập danh sách, xét nghiệm test nhanh chất ma túy định kỳ đối với các đối tượng thuộc diện quản lý',
    unit: 'Đối tượng',
    color: 'amber'
  },
  {
    id: 'dcttp',
    title: 'Điều Chỉnh Tổ Dân Phố (ĐCTTP)',
    shortName: 'ĐC Tổ Dân Phố',
    badge: 'QLHC & Dân cư',
    icon: 'Users',
    description: 'Điều chỉnh, chuẩn hóa thông tin ranh giới Tổ dân phố theo địa giới hành chính mới',
    unit: 'Nhân khẩu',
    color: 'emerald'
  },
  {
    id: 'datdai',
    title: 'Làm Sạch Dữ Liệu Đất Đai',
    shortName: 'Làm sạch Đất đai',
    badge: 'Đề án 06 - Lần 4',
    icon: 'LandPlot',
    description: 'Đối soát số CMND/CCCD chủ sử dụng đất với Cơ sở dữ liệu quốc gia về dân cư',
    unit: 'Thửa đất',
    color: 'purple'
  }
];

export const INITIAL_STAFF: Staff[] = [
  { id: 'CB01', name: 'Nguyễn Văn Hùng', rank: 'Đại úy', phone: '0912.345.678', assignedAreas: ['Tổ 1', 'Tổ 2', 'Tổ 3'], avatarBg: 'bg-blue-600' },
  { id: 'CB02', name: 'Trần Thị Mai', rank: 'Thượng úy', phone: '0988.112.233', assignedAreas: ['Tổ 4', 'Tổ 5'], avatarBg: 'bg-emerald-600' },
  { id: 'CB03', name: 'Lê Minh Tuấn', rank: 'Thiếu tá', phone: '0903.456.789', assignedAreas: ['Tổ 6', 'Tổ 7', 'Tổ 8'], avatarBg: 'bg-purple-600' },
  { id: 'CB04', name: 'Phạm Đức Long', rank: 'Đại úy', phone: '0977.654.321', assignedAreas: ['Tổ 9', 'Tổ 10'], avatarBg: 'bg-amber-600' },
  { id: 'CB05', name: 'Hoàng Quốc Việt', rank: 'Trung úy', phone: '0966.889.900', assignedAreas: ['Tổ 11', 'Tổ 12'], avatarBg: 'bg-rose-600' },
  { id: 'CB06', name: 'Đặng Ngọc Ánh', rank: 'Thượng úy', phone: '0933.221.144', assignedAreas: ['Tổ 13', 'Tổ 14', 'Tổ 15'], avatarBg: 'bg-indigo-600' }
];

export const INITIAL_CONFIG: AppConfig = {
  apiUrl: '',
  useLiveGoogleSheet: false,
  unitName: 'CÔNG AN PHƯỜNG HÀNG BÀI - TP. HÀ NỘI',
  subUnitName: 'TỔ CÔNG TÁC ĐỀ ÁN 06 & QUẢN LÝ HÀNH CHÍNH',
  autoSyncIntervalMinutes: 5
};

export const INITIAL_HKCCH: HKCCHRecord[] = [
  { stt: 1, hoTen: 'Nguyễn Văn An', soHoSo: 'HS-2024-001', toDanPho: 'Tổ 1', canBoId: 'CB01', isDone: true, updatedAt: '15/10/2024' },
  { stt: 2, hoTen: 'Trần Thị Bích', soHoSo: 'HS-2024-002', toDanPho: 'Tổ 2', canBoId: 'CB01', isDone: false, note: 'Đang liên hệ thân nhân' },
  { stt: 3, hoTen: 'Lê Hoàng Cường', soHoSo: 'HS-2024-003', toDanPho: 'Tổ 4', canBoId: 'CB02', isDone: true, updatedAt: '18/10/2024' },
  { stt: 4, hoTen: 'Phạm Minh Dũng', soHoSo: 'HS-2024-004', toDanPho: 'Tổ 5', canBoId: 'CB02', isDone: false },
  { stt: 5, hoTen: 'Hoàng Thị Em', soHoSo: 'HS-2024-005', toDanPho: 'Tổ 6', canBoId: 'CB03', isDone: true, updatedAt: '20/10/2024' },
  { stt: 6, hoTen: 'Vũ Quốc Phong', soHoSo: 'HS-2024-006', toDanPho: 'Tổ 7', canBoId: 'CB03', isDone: false, note: 'Đi làm ăn xa' },
  { stt: 7, hoTen: 'Bùi Tuyết Giao', soHoSo: 'HS-2024-007', toDanPho: 'Tổ 9', canBoId: 'CB04', isDone: true, updatedAt: '22/10/2024' },
  { stt: 8, hoTen: 'Đỗ Hữu Hạnh', soHoSo: 'HS-2024-008', toDanPho: 'Tổ 10', canBoId: 'CB04', isDone: false },
  { stt: 9, hoTen: 'Ngô Thanh Sơn', soHoSo: 'HS-2024-009', toDanPho: 'Tổ 11', canBoId: 'CB05', isDone: true, updatedAt: '25/10/2024' },
  { stt: 10, hoTen: 'Lý Kiều Oanh', soHoSo: 'HS-2024-010', toDanPho: 'Tổ 13', canBoId: 'CB06', isDone: false }
];

export const INITIAL_MATUY: MaTuyRecord[] = [
  { stt: 1, hoTen: 'Trần Văn Tùng', namSinh: '1992', soCMND: '012345678', toDanPho: 'Tổ 1', canBoId: 'CB01', isDone: true, ketQuaTest: 'Âm tính', updatedAt: '12/10/2024' },
  { stt: 2, hoTen: 'Lê Bá Quân', namSinh: '1988', soCMND: '012345679', toDanPho: 'Tổ 2', canBoId: 'CB01', isDone: true, ketQuaTest: 'Âm tính', updatedAt: '14/10/2024' },
  { stt: 3, hoTen: 'Nguyễn Thành Long', namSinh: '1995', soCMND: '012345680', toDanPho: 'Tổ 4', canBoId: 'CB02', isDone: false },
  { stt: 4, hoTen: 'Phạm Văn Nam', namSinh: '1990', soCMND: '012345681', toDanPho: 'Tổ 5', canBoId: 'CB02', isDone: true, ketQuaTest: 'Âm tính', updatedAt: '19/10/2024' },
  { stt: 5, hoTen: 'Vũ Đức Thịnh', namSinh: '1985', soCMND: '012345682', toDanPho: 'Tổ 6', canBoId: 'CB03', isDone: false, note: 'Hẹn đầu tuần sau' },
  { stt: 6, hoTen: 'Hoàng Xuân Bách', namSinh: '1993', soCMND: '012345683', toDanPho: 'Tổ 8', canBoId: 'CB03', isDone: true, ketQuaTest: 'Âm tính', updatedAt: '21/10/2024' },
  { stt: 7, hoTen: 'Đặng Tuấn Anh', namSinh: '1998', soCMND: '012345684', toDanPho: 'Tổ 9', canBoId: 'CB04', isDone: false },
  { stt: 8, hoTen: 'Bùi Hữu Tài', namSinh: '1989', soCMND: '012345685', toDanPho: 'Tổ 10', canBoId: 'CB04', isDone: true, ketQuaTest: 'Âm tính', updatedAt: '23/10/2024' },
  { stt: 9, hoTen: 'Đỗ Trọng Hiếu', namSinh: '1996', soCMND: '012345686', toDanPho: 'Tổ 12', canBoId: 'CB05', isDone: false },
  { stt: 10, hoTen: 'Dương Văn Kiên', namSinh: '1991', soCMND: '012345687', toDanPho: 'Tổ 14', canBoId: 'CB06', isDone: true, ketQuaTest: 'Âm tính', updatedAt: '26/10/2024' }
];

export const INITIAL_DCTTP: DCTTPRecord[] = [
  { stt: 1, hoTen: 'Khu dân cư A - Tổ 1', tongNhanKhau: 150, soLuongDaDieuChinh: 150, toDanPho: 'Tổ 1', canBoId: 'CB01', isDone: true, updatedAt: '10/10/2024' },
  { stt: 2, hoTen: 'Cụm dân cư số 2 - Phố Huế', tongNhanKhau: 220, soLuongDaDieuChinh: 140, toDanPho: 'Tổ 2', canBoId: 'CB01', isDone: false },
  { stt: 3, hoTen: 'Tập thể Dệt May - Tổ 4', tongNhanKhau: 180, soLuongDaDieuChinh: 180, toDanPho: 'Tổ 4', canBoId: 'CB02', isDone: true, updatedAt: '15/10/2024' },
  { stt: 4, hoTen: 'Khu vực Ngõ Trạm - Tổ 5', tongNhanKhau: 310, soLuongDaDieuChinh: 210, toDanPho: 'Tổ 5', canBoId: 'CB02', isDone: false },
  { stt: 5, hoTen: 'Chung cư 25 Lạc Trung - Tổ 6', tongNhanKhau: 450, soLuongDaDieuChinh: 450, toDanPho: 'Tổ 6', canBoId: 'CB03', isDone: true, updatedAt: '18/10/2024' },
  { stt: 6, hoTen: 'Tổ dân phố số 7 mở rộng', tongNhanKhau: 190, soLuongDaDieuChinh: 95, toDanPho: 'Tổ 7', canBoId: 'CB03', isDone: false },
  { stt: 7, hoTen: 'Cụm dân cư B - Tổ 9', tongNhanKhau: 160, soLuongDaDieuChinh: 160, toDanPho: 'Tổ 9', canBoId: 'CB04', isDone: true, updatedAt: '22/10/2024' },
  { stt: 8, hoTen: 'Khu dân cư Chợ Hôm - Tổ 10', tongNhanKhau: 280, soLuongDaDieuChinh: 120, toDanPho: 'Tổ 10', canBoId: 'CB04', isDone: false },
  { stt: 9, hoTen: 'Khu tập thể Cơ khí - Tổ 11', tongNhanKhau: 140, soLuongDaDieuChinh: 140, toDanPho: 'Tổ 11', canBoId: 'CB05', isDone: true, updatedAt: '24/10/2024' },
  { stt: 10, hoTen: 'Khu dân cư Kim Ngưu - Tổ 13', tongNhanKhau: 210, soLuongDaDieuChinh: 150, toDanPho: 'Tổ 13', canBoId: 'CB06', isDone: false }
];

export const INITIAL_DATDAI: DatDaiRecord[] = [
  { stt: 1, chuHo: 'Nguyễn Văn Minh', cmnd: '010123456', namSinh: '1965', diaChi: 'Số 12 Phố Huế', toDanPho: 'Tổ 1', canBoId: 'CB01', status: 'cccd_updated', statusText: 'Cập nhật CCCD: 001065001234', cccd: '001065001234', dob: '12/04/1965', isDone: true, updatedAt: '11/10/2024' },
  { stt: 2, chuHo: 'Trần Thị Thu', cmnd: '010123457', namSinh: '1970', diaChi: 'Số 34 Hàng Bài', toDanPho: 'Tổ 2', canBoId: 'CB01', status: 'wrong_info', statusText: 'Sai thông tin: Tên đệm sổ đỏ ghi Trần Ngọc Thu', wrongDetail: 'Sai tên đệm sổ đỏ ghi Trần Ngọc Thu', isDone: true, updatedAt: '13/10/2024' },
  { stt: 3, chuHo: 'Lê Văn Sơn', cmnd: '010123458', namSinh: '1958', diaChi: 'Số 56 Bà Triệu', toDanPho: 'Tổ 4', canBoId: 'CB02', status: 'no_info', statusText: 'Không có TT: Chết', noInfoReason: 'Chết', isDone: true, updatedAt: '15/10/2024' },
  { stt: 4, chuHo: 'Phạm Thị Lan', cmnd: '010123459', namSinh: '1980', diaChi: 'Số 78 Trần Hưng Đạo', toDanPho: 'Tổ 5', canBoId: 'CB02', status: 'pending', isDone: false },
  { stt: 5, chuHo: 'Hoàng Văn Thắng', cmnd: '010123460', namSinh: '1975', diaChi: 'Số 90 Lý Thường Kiệt', toDanPho: 'Tổ 6', canBoId: 'CB03', status: 'cccd_updated', statusText: 'Cập nhật CCCD: 001075005678', cccd: '001075005678', dob: '25/08/1975', isDone: true, updatedAt: '19/10/2024' },
  { stt: 6, chuHo: 'Vũ Thị Mai', cmnd: '010123461', namSinh: '1982', diaChi: 'Số 102 Ngô Thì Nhậm', toDanPho: 'Tổ 7', canBoId: 'CB03', status: 'pending', isDone: false },
  { stt: 7, chuHo: 'Đỗ Văn Hậu', cmnd: '010123462', namSinh: '1968', diaChi: 'Số 114 Lê Thánh Tông', toDanPho: 'Tổ 9', canBoId: 'CB04', status: 'cccd_updated', statusText: 'Cập nhật CCCD: 001068009988', cccd: '001068009988', dob: '01/01/1968', isDone: true, updatedAt: '22/10/2024' },
  { stt: 8, chuHo: 'Bùi Thị Hà', cmnd: '010123463', namSinh: '1977', diaChi: 'Số 126 Phan Chu Trinh', toDanPho: 'Tổ 10', canBoId: 'CB04', status: 'pending', isDone: false },
  { stt: 9, chuHo: 'Ngô Văn Tấn', cmnd: '010123464', namSinh: '1962', diaChi: 'Số 138 Hàn Thuyên', toDanPho: 'Tổ 11', canBoId: 'CB05', status: 'wrong_info', statusText: 'Sai năm sinh trên sổ cấp năm 1999', wrongDetail: 'Sai năm sinh trên sổ cấp năm 1999', isDone: true, updatedAt: '24/10/2024' },
  { stt: 10, chuHo: 'Đinh Thị Cúc', cmnd: '010123465', namSinh: '1979', diaChi: 'Số 150 Lò Đúc', toDanPho: 'Tổ 13', canBoId: 'CB06', status: 'pending', isDone: false }
];
