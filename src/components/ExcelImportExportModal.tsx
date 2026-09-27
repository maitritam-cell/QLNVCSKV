import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  TaskType,
  Staff,
  HKCCHRecord,
  MaTuyRecord,
  DCTTPRecord,
  DatDaiRecord,
  GenericTaskRecord
} from '../types';
import {
  getHkcchList,
  saveHkcchList,
  getMatuyList,
  saveMatuyList,
  getDcttpList,
  saveDcttpList,
  getDatdaiList,
  saveDatdaiList,
  getGenericTasksList,
  saveGenericTasksList,
  getTaskCategories,
  getResidentialGroups,
  findOfficerForResidentialGroup,
  TASK_CONFIG
} from '../data/storage';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Users,
  Building,
  RefreshCw,
  FileCheck,
  Sparkles
} from 'lucide-react';

interface ExcelImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  onDataChanged: () => void;
}

interface ParsedRecord {
  stt: number;
  hoTen: string;
  soHoSo: string;
  toDanPho: string;
  namSinh: string;
  diaChi: string;
  isDone: boolean;
  note: string;
  assignedStaff?: Staff;
  taskTypeTarget: TaskType;
}

export const ExcelImportExportModal: React.FC<ExcelImportExportModalProps> = ({
  isOpen,
  onClose,
  staffList,
  onDataChanged
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType>('hkcch');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  // Preview state
  const [parsedRows, setParsedRows] = useState<ParsedRecord[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const categories = getTaskCategories();
  const residentialGroups = getResidentialGroups();

  if (!isOpen) return null;

  // 1. DOWNLOAD SAMPLE EXCEL TEMPLATE
  const handleDownloadSampleTemplate = () => {
    try {
      const sampleData = [
        [
          'STT',
          'Họ và tên',
          'Số hồ sơ / CCCD / CMND',
          'Tổ dân phố',
          'Năm sinh',
          'Địa chỉ',
          'Trạng thái (Đã xong / Chưa xong)',
          'Ghi chú xử lý'
        ],
        [1, 'Nguyễn Văn Mạnh', 'HS-2024-0012', 'Tổ 1', '1982', 'Số 12 Phố Huế', 'Đã xong', 'Đã cử con trai làm chủ hộ'],
        [2, 'Trần Thị Mai', '001095012345', 'Tổ 1', '1995', 'Số 45 Hàng Bài', 'Chưa xong', 'Đang xác minh nơi cư trú'],
        [3, 'Lê Hoàng Long', 'HS-2024-0045', 'Tổ 2', '1978', 'Số 89 Bà Triệu', 'Chưa xong', 'Cần kiểm tra lại CCCD'],
        [4, 'Phạm Đức Hòa', '010234567', 'Tổ 3', '1989', 'Tập thể A - Tổ 3', 'Đã xong', 'Đã xét nghiệm âm tính'],
        [5, 'Vũ Thị Thanh', 'HS-2024-0102', 'Tổ 4', '1992', 'Số 104 Quang Trung', 'Chưa xong', 'Chưa liên hệ được'],
        [6, 'Đỗ Văn Nam', '001198004567', 'Tổ 5', '1998', 'Số 15 Lê Duẩn', 'Đã xong', 'Đã làm sạch dữ liệu đất đai'],
        [7, 'Bùi Thị Hà', 'HS-2024-0156', 'Tổ 6', '1975', 'Số 33 Trần Hưng Đạo', 'Chưa xong', 'Hồ sơ chờ phê duyệt']
      ];

      const ws = XLSX.utils.aoa_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mau_Chi_Tieu_Theo_To');

      // Auto col widths
      ws['!cols'] = [
        { wch: 6 },
        { wch: 22 },
        { wch: 24 },
        { wch: 14 },
        { wch: 10 },
        { wch: 26 },
        { wch: 18 },
        { wch: 32 }
      ];

      XLSX.writeFile(wb, 'Mau_Nhap_Chi_Tieu_Theo_To_Dan_Pho.xlsx');
      setStatusMessage({
        type: 'success',
        text: 'Đã tải xuống file mẫu Excel "Mau_Nhap_Chi_Tieu_Theo_To_Dan_Pho.xlsx" thành công!'
      });
    } catch {
      setStatusMessage({ type: 'error', text: 'Lỗi khi tạo file mẫu Excel!' });
    }
  };

  // 2. PARSE EXCEL FILE AND AUTO CLASSIFY BY TỔ DÂN PHỐ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatusMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawJson || rawJson.length < 2) {
          setStatusMessage({ type: 'error', text: 'File Excel không có dữ liệu hợp lệ (cần ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu).' });
          setIsProcessing(false);
          return;
        }

        const headers: string[] = (rawJson[0] as string[]).map((h) => String(h || '').trim().toLowerCase());

        // Find column indices
        const nameIdx = headers.findIndex((h) => h.includes('họ') || h.includes('tên') || h.includes('chủ hộ') || h.includes('đối tượng'));
        const toIdx = headers.findIndex((h) => h.includes('tổ') || h.includes('địa bàn') || h.includes('khu phố'));
        const docIdx = headers.findIndex((h) => h.includes('hồ sơ') || h.includes('cccd') || h.includes('cmnd') || h.includes('mã'));
        const dobIdx = headers.findIndex((h) => h.includes('sinh') || h.includes('năm'));
        const addrIdx = headers.findIndex((h) => h.includes('địa chỉ') || h.includes('nơi ở') || h.includes('thửa'));
        const statusIdx = headers.findIndex((h) => h.includes('trạng thái') || h.includes('kết quả') || h.includes('hoàn thành'));
        const noteIdx = headers.findIndex((h) => h.includes('ghi chú') || h.includes('xử lý'));

        const parsed: ParsedRecord[] = [];

        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;

          const hoTen = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : String(row[1] || '').trim();
          if (!hoTen) continue;

          const toDanPho = toIdx !== -1 ? String(row[toIdx] || 'Tổ 1').trim() : 'Tổ 1';
          const soHoSo = docIdx !== -1 ? String(row[docIdx] || '').trim() : '';
          const namSinh = dobIdx !== -1 ? String(row[dobIdx] || '1990').trim() : '1990';
          const diaChi = addrIdx !== -1 ? String(row[addrIdx] || '').trim() : '';
          const note = noteIdx !== -1 ? String(row[noteIdx] || '').trim() : '';

          let isDone = false;
          if (statusIdx !== -1) {
            const stVal = String(row[statusIdx] || '').toLowerCase();
            isDone = stVal.includes('xong') || stVal.includes('đạt') || stVal.includes('hoàn thành') || stVal.includes('rồi') || stVal.includes('âm tính');
          }

          // AUTO CLASSIFY RESPONSIBLE OFFICER FROM TỔ DÂN PHỐ
          const assignedOfficer = findOfficerForResidentialGroup(toDanPho);

          parsed.push({
            stt: parsed.length + 1,
            hoTen,
            soHoSo,
            toDanPho,
            namSinh,
            diaChi,
            isDone,
            note,
            assignedStaff: assignedOfficer,
            taskTypeTarget: selectedTaskType
          });
        }

        setParsedRows(parsed);
        setIsProcessing(false);
        setStatusMessage({
          type: 'success',
          text: `Đã phân tích thành công ${parsed.length} dòng dữ liệu từ file "${file.name}". Hệ thống đã tự động gán cán bộ phụ trách theo từng Tổ dân phố!`
        });
      } catch (err: any) {
        setIsProcessing(false);
        setStatusMessage({ type: 'error', text: `Lỗi đọc file Excel: ${err?.message || 'Không thể đọc tệp'}` });
      }
    };
    reader.readAsBinaryString(file);
  };

  // 3. EXECUTE IMPORT INTO DATABASE
  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

    if (selectedTaskType === 'hkcch') {
      const existing = importMode === 'replace' ? [] : getHkcchList();
      let startStt = existing.length > 0 ? Math.max(...existing.map((r) => r.stt)) + 1 : 1;

      const newRecords: HKCCHRecord[] = parsedRows.map((r) => ({
        stt: startStt++,
        hoTen: r.hoTen,
        soHoSo: r.soHoSo || `HS-${Date.now().toString().slice(-4)}`,
        toDanPho: r.toDanPho,
        canBoId: r.assignedStaff?.id || staffList[0]?.id || 'cb_hung',
        canBoName: r.assignedStaff ? `${r.assignedStaff.rank} ${r.assignedStaff.name}` : staffList[0]?.name || 'Cán bộ',
        isDone: r.isDone,
        note: r.note,
        updatedAt: timestamp
      }));

      const final = [...existing, ...newRecords];
      saveHkcchList(final);
    } else if (selectedTaskType === 'matuy') {
      const existing = importMode === 'replace' ? [] : getMatuyList();
      let startStt = existing.length > 0 ? Math.max(...existing.map((r) => r.stt)) + 1 : 1;

      const newRecords: MaTuyRecord[] = parsedRows.map((r) => ({
        stt: startStt++,
        hoTen: r.hoTen,
        namSinh: r.namSinh || '1995',
        soCMND: r.soHoSo,
        toDanPho: r.toDanPho,
        canBoId: r.assignedStaff?.id || staffList[0]?.id || 'cb_hung',
        canBoName: r.assignedStaff ? `${r.assignedStaff.rank} ${r.assignedStaff.name}` : staffList[0]?.name || 'Cán bộ',
        isDone: r.isDone,
        ketQuaTest: r.isDone ? 'Âm tính' : 'Chưa test',
        note: r.note,
        updatedAt: timestamp
      }));

      const final = [...existing, ...newRecords];
      saveMatuyList(final);
    } else if (selectedTaskType === 'dcttp') {
      const existing = importMode === 'replace' ? [] : getDcttpList();
      let startStt = existing.length > 0 ? Math.max(...existing.map((r) => r.stt)) + 1 : 1;

      const newRecords: DCTTPRecord[] = parsedRows.map((r) => ({
        stt: startStt++,
        hoTen: r.hoTen,
        tongNhanKhau: parseInt(r.soHoSo, 10) || 50,
        soLuongDaDieuChinh: r.isDone ? (parseInt(r.soHoSo, 10) || 50) : 0,
        toDanPho: r.toDanPho,
        canBoId: r.assignedStaff?.id || staffList[0]?.id || 'cb_hung',
        canBoName: r.assignedStaff ? `${r.assignedStaff.rank} ${r.assignedStaff.name}` : staffList[0]?.name || 'Cán bộ',
        isDone: r.isDone,
        updatedAt: timestamp,
        note: r.note
      }));

      const final = [...existing, ...newRecords];
      saveDcttpList(final);
    } else if (selectedTaskType === 'datdai') {
      const existing = importMode === 'replace' ? [] : getDatdaiList();
      let startStt = existing.length > 0 ? Math.max(...existing.map((r) => r.stt)) + 1 : 1;

      const newRecords: DatDaiRecord[] = parsedRows.map((r) => ({
        stt: startStt++,
        chuHo: r.hoTen,
        cmnd: r.soHoSo || '010234567',
        namSinh: r.namSinh || '1980',
        diaChi: r.diaChi || r.toDanPho,
        toDanPho: r.toDanPho,
        canBoId: r.assignedStaff?.id || staffList[0]?.id || 'cb_hung',
        canBoName: r.assignedStaff ? `${r.assignedStaff.rank} ${r.assignedStaff.name}` : staffList[0]?.name || 'Cán bộ',
        status: r.isDone ? 'cccd_updated' : 'pending',
        isDone: r.isDone,
        updatedAt: timestamp
      }));

      const final = [...existing, ...newRecords];
      saveDatdaiList(final);
    } else {
      // Custom task
      const existing = importMode === 'replace' ? [] : getGenericTasksList();
      let startStt = existing.length > 0 ? Math.max(...existing.map((r) => r.stt)) + 1 : 1;

      const newRecords: GenericTaskRecord[] = parsedRows.map((r) => ({
        stt: startStt++,
        taskType: selectedTaskType,
        hoTen: r.hoTen,
        soHoSo: r.soHoSo,
        toDanPho: r.toDanPho,
        canBoId: r.assignedStaff?.id || staffList[0]?.id || 'cb_hung',
        canBoName: r.assignedStaff ? `${r.assignedStaff.rank} ${r.assignedStaff.name}` : staffList[0]?.name || 'Cán bộ',
        isDone: r.isDone,
        info1: r.diaChi,
        note: r.note,
        updatedAt: timestamp
      }));

      const final = [...existing, ...newRecords];
      saveGenericTasksList(final);
    }

    onDataChanged();
    setParsedRows([]);
    setFileName('');
    setStatusMessage({
      type: 'success',
      text: `Đã nạp thành công ${parsedRows.length} chỉ tiêu vào mục "${TASK_CONFIG[selectedTaskType]?.title}"! Các cán bộ đã được tự động phân chia chỉ tiêu theo từng Tổ dân phố.`
    });
  };

  // 4. EXPORT SUMMARY EXCEL
  const handleExportSummaryExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Tổng hợp theo Tổ dân phố
      const hkList = getHkcchList();
      const mtList = getMatuyList();
      const dcList = getDcttpList();
      const ddList = getDatdaiList();

      const toData: (string | number)[][] = [
        ['BÁO CÁO TIẾN ĐỘ THỰC HIỆN CHỈ TIÊU THEO TỔ DÂN PHỐ'],
        [`Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`],
        [],
        ['STT', 'Tổ dân phố', 'Cán bộ phụ trách', 'HKCCH (Xong/Tổng)', 'Ma túy (Xong/Tổng)', 'ĐCTTP (Đạt/Tổng)', 'Đất đai (Xong/Tổng)', 'Tỷ lệ chung (%)']
      ];

      residentialGroups.forEach((g, idx) => {
        const staffNames = (g.assignedStaffIds || [])
          .map((id) => {
            const st = staffList.find((s) => s.id === id);
            return st ? `${st.rank} ${st.name}` : id;
          })
          .join(', ') || 'Chưa gán';

        const hkT = hkList.filter((r) => r.toDanPho === g.name || r.toDanPho === `Tổ ${g.name}`);
        const hkD = hkT.filter((r) => r.isDone).length;

        const mtT = mtList.filter((r) => r.toDanPho === g.name || r.toDanPho === `Tổ ${g.name}`);
        const mtD = mtT.filter((r) => r.isDone).length;

        const dcT = dcList.filter((r) => r.toDanPho === g.name || r.toDanPho === `Tổ ${g.name}`);
        const dcTotal = dcT.reduce((s, r) => s + (Number(r.tongNhanKhau) || 0), 0);
        const dcDone = dcT.reduce((s, r) => s + (Number(r.soLuongDaDieuChinh) || 0), 0);

        const ddT = ddList.filter((r) => r.toDanPho === g.name || r.toDanPho === `Tổ ${g.name}`);
        const ddD = ddT.filter((r) => r.isDone).length;

        const allTotal = hkT.length + mtT.length + ddT.length;
        const allDone = hkD + mtD + ddD;
        const pct = allTotal > 0 ? Math.round((allDone / allTotal) * 100) : 0;

        toData.push([
          idx + 1,
          g.name,
          staffNames,
          `${hkD}/${hkT.length}`,
          `${mtD}/${mtT.length}`,
          `${dcDone}/${dcTotal}`,
          `${ddD}/${ddT.length}`,
          `${pct}%`
        ]);
      });

      const wsTo = XLSX.utils.aoa_to_sheet(toData);
      XLSX.utils.book_append_sheet(wb, wsTo, 'Theo_To_Dan_Pho');

      // Sheet 2: Danh sách chi tiết HKCCH
      const detailHk = [
        ['STT', 'Họ và tên', 'Số hồ sơ', 'Tổ dân phố', 'Cán bộ phụ trách', 'Trạng thái', 'Ghi chú', 'Cập nhật'],
        ...hkList.map((r) => [
          r.stt,
          r.hoTen,
          r.soHoSo,
          r.toDanPho,
          r.canBoName || r.canBoId,
          r.isDone ? 'Đã hoàn thành' : 'Chưa hoàn thành',
          r.note || '',
          r.updatedAt || ''
        ])
      ];
      const wsHk = XLSX.utils.aoa_to_sheet(detailHk);
      XLSX.utils.book_append_sheet(wb, wsHk, 'Chi_Tiet_HKCCH');

      XLSX.writeFile(wb, `Bao_Cao_Chi_Tieu_To_Dan_Pho_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setStatusMessage({ type: 'success', text: 'Đã xuất file báo cáo Excel thành công!' });
    } catch {
      setStatusMessage({ type: 'error', text: 'Lỗi khi xuất file báo cáo Excel' });
    }
  };

  // Group summary of parsed rows by officer
  const officerSummaryMap: Record<string, { count: number; officerName: string; toList: Set<string> }> = {};
  parsedRows.forEach((r) => {
    const key = r.assignedStaff ? r.assignedStaff.id : 'unassigned';
    const name = r.assignedStaff ? `${r.assignedStaff.rank} ${r.assignedStaff.name}` : 'Chưa xác định cán bộ';
    if (!officerSummaryMap[key]) {
      officerSummaryMap[key] = { count: 0, officerName: name, toList: new Set() };
    }
    officerSummaryMap[key].count++;
    officerSummaryMap[key].toList.add(r.toDanPho);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>NHẬP / XUẤT EXCEL CHỈ TIÊU THEO TỔ DÂN PHỐ</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700">
                  Tự động phân loại
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Nhập file Excel chỉ tiêu theo từng Tổ dân phố, hệ thống tự động gán cán bộ phụ trách
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Nhập Excel & Tự động phân loại cán bộ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo Excel Tổng Hợp</span>
          </button>
        </div>

        {/* Feedback alert */}
        {statusMessage && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in shrink-0 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/80 border-red-500/50 text-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* TAB CONTENT: IMPORT */}
        {activeTab === 'import' && (
          <div className="flex-1 overflow-y-auto mt-3 space-y-4 pr-1">
            {/* Step 1: Download Sample or Upload */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[11px] font-black">
                    1
                  </span>
                  <span>Tải file mẫu Excel chuẩn theo Tổ dân phố:</span>
                </span>
                <button
                  type="button"
                  onClick={handleDownloadSampleTemplate}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file mẫu (.xlsx)</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                File mẫu bao gồm các cột: <b>Họ và tên</b>, <b>Số hồ sơ / CCCD</b>, <b>Tổ dân phố</b>, <b>Năm sinh</b>, <b>Địa chỉ</b>, <b>Trạng thái</b>. Khi bạn nhập dữ liệu theo từng Tổ, hệ thống sẽ tự động tìm cán bộ phụ trách của Tổ đó để gán việc.
              </p>
            </div>

            {/* Step 2: Upload File & Settings */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[11px] font-black">
                  2
                </span>
                <span>Chọn file Excel chỉ tiêu và cấu hình nhập:</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    Nhập vào loại chỉ tiêu nhiệm vụ:
                  </label>
                  <select
                    value={selectedTaskType}
                    onChange={(e) => setSelectedTaskType(e.target.value as TaskType)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold focus:border-emerald-400 focus:outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.shortTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    Hình thức nhập dữ liệu:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('append')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        importMode === 'append'
                          ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      + Thêm nối tiếp
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        importMode === 'replace'
                          ? 'bg-red-600/30 border-red-400 text-red-200'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      Ghi đè thay thế
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Input */}
              <div className="pt-2">
                <label className="block w-full border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition bg-slate-900/50 hover:bg-slate-900">
                  <Upload className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                  <span className="text-xs font-bold text-white block">
                    {fileName ? `Tệp đã chọn: ${fileName}` : 'Bấm vào đây để chọn file Excel (.xlsx, .xls)'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Hỗ trợ tệp bảng tính Excel có cột "Tổ dân phố"
                  </span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            {/* Step 3: Classification Preview */}
            {parsedRows.length > 0 && (
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-emerald-500/50 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Kết quả tự động phân loại cán bộ ({parsedRows.length} bản ghi):
                    </span>
                  </div>
                  <span className="text-xs font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700 font-bold">
                    {Object.keys(officerSummaryMap).length} cán bộ được gán
                  </span>
                </div>

                {/* Summary by officer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(officerSummaryMap).map(([key, item]) => (
                    <div
                      key={key}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          <span>{item.officerName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Địa bàn: {Array.from(item.toList).join(', ')}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-mono font-black text-xs border border-emerald-800">
                        {item.count} chỉ tiêu
                      </span>
                    </div>
                  ))}
                </div>

                {/* Confirm Import Button */}
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRows([]);
                      setFileName('');
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác Nhận Nạp {parsedRows.length} Chỉ Tiêu Vào Hệ Thống</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: EXPORT */}
        {activeTab === 'export' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
            <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  <span>Xuất Báo Cáo Tổng Hợp Theo Tổ Dân Phố & Cán Bộ</span>
                </h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Tệp Excel xuất ra sẽ tự động tổng hợp toàn bộ các chỉ tiêu theo từng Tổ dân phố (số hộ, số khẩu, cán bộ phụ trách, số lượng hoàn thành, tỷ lệ %) và danh sách chi tiết các hồ sơ.
                </p>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-[11px] text-slate-300">
                <div className="font-bold text-blue-300 uppercase">Các sheet được xuất trong file:</div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span><b>Sheet 1: Theo_To_Dan_Pho</b> - Bảng tổng kết số lượng chỉ tiêu và tiến độ hoàn thành của từng Tổ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span><b>Sheet 2: Chi_Tiet_HKCCH</b> - Danh sách toàn bộ các hộ không có chủ hộ kèm cán bộ và địa bàn</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExportSummaryExcel}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-950 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Xuống Báo Cáo Excel Tổng Hợp (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>* Hệ thống sử dụng quy tắc phân loại dựa trên danh sách Tổ dân phố đã gán cho từng cán bộ.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
