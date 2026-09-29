import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ResidentialGroup, Staff } from '../types';
import {
  getResidentialGroups,
  saveResidentialGroups,
  getStaffList,
  saveStaffList,
  syncStaffToAccounts,
  reclassifyAllRecordsByResidentialGroup
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
  Sparkles,
  Info,
  Check,
  ArrowRight
} from 'lucide-react';

interface ResidentialGroupExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  onDataUpdated: () => void;
}

interface ParsedGroupRow {
  stt: number;
  name: string;
  code?: string;
  householdCount?: number;
  populationCount?: number;
  rawOfficer: string;
  matchedStaff: Staff[];
  unmatchedOfficerName?: string;
  note?: string;
  isExisting: boolean;
  existingId?: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeGroupName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/tổ\s*dân\s*phố/gi, 'tổ')
    .replace(/\s+/g, ' ');
}

export const ResidentialGroupExcelModal: React.FC<ResidentialGroupExcelModalProps> = ({
  isOpen,
  onClose,
  staffList,
  onDataUpdated
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedGroupRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [syncStaffAreas, setSyncStaffAreas] = useState<boolean>(true);
  const [reclassifyTasks, setReclassifyTasks] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentGroups = getResidentialGroups();

  // Find staff officer matching string (by ID, full name, normalized name, or phone)
  const matchOfficers = (rawStr: string): { matched: Staff[]; unmatched?: string } => {
    if (!rawStr || !rawStr.trim()) return { matched: [] };

    // Split in case multiple officers are listed (e.g. "Nguyễn Văn Hùng, Trần Văn Nam")
    const parts = rawStr
      .split(/[,;\n\r\t]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    const matchedList: Staff[] = [];
    const unmatchedParts: string[] = [];

    for (const part of parts) {
      const normPart = normalizeText(part);
      const cleanPhone = part.replace(/[^0-9]/g, '');

      const found = staffList.find((st) => {
        if (st.id.toLowerCase() === part.toLowerCase()) return true;
        if (cleanPhone && st.phone && st.phone.replace(/[^0-9]/g, '') === cleanPhone) return true;
        const normName = normalizeText(st.name);
        const normRankName = normalizeText(`${st.rank} ${st.name}`);
        if (normPart === normName || normPart === normRankName) return true;
        if (normPart.length >= 5 && (normName.includes(normPart) || normPart.includes(normName))) return true;
        return false;
      });

      if (found) {
        if (!matchedList.some((m) => m.id === found.id)) {
          matchedList.push(found);
        }
      } else {
        unmatchedParts.push(part);
      }
    }

    return {
      matched: matchedList,
      unmatched: unmatchedParts.length > 0 ? unmatchedParts.join(', ') : undefined
    };
  };

  // Download template Excel file
  const handleDownloadTemplate = () => {
    const sampleStaff1 = staffList[0]?.name || 'Nguyễn Văn Hùng';
    const sampleStaff2 = staffList[1]?.name || staffList[0]?.name || 'Trần Văn Nam';

    const sampleData = [
      {
        'STT': 1,
        'Tên Tổ dân phố': 'Tổ 1',
        'Mã tổ': 'TDP01',
        'Số hộ gia đình': 220,
        'Tổng nhân khẩu': 850,
        'Cán bộ phụ trách': sampleStaff1,
        'Ghi chú địa bàn': 'Khu dân cư A, ven trục đường chính'
      },
      {
        'STT': 2,
        'Tên Tổ dân phố': 'Tổ 2',
        'Mã tổ': 'TDP02',
        'Số hộ gia đình': 195,
        'Tổng nhân khẩu': 780,
        'Cán bộ phụ trách': sampleStaff1,
        'Ghi chú địa bàn': 'Khu tập thể B'
      },
      {
        'STT': 3,
        'Tên Tổ dân phố': 'Tổ 3',
        'Mã tổ': 'TDP03',
        'Số hộ gia đình': 260,
        'Tổng nhân khẩu': 990,
        'Cán bộ phụ trách': sampleStaff2,
        'Ghi chú địa bàn': 'Khu phố trung tâm, các hộ kinh doanh'
      },
      {
        'STT': 4,
        'Tên Tổ dân phố': 'Tổ 4',
        'Mã tổ': 'TDP04',
        'Số hộ gia đình': 180,
        'Tổng nhân khẩu': 710,
        'Cán bộ phụ trách': sampleStaff2,
        'Ghi chú địa bàn': 'Khu tập thể quân đội'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = [
      { wch: 6 },  // STT
      { wch: 18 }, // Tên Tổ
      { wch: 12 }, // Mã tổ
      { wch: 16 }, // Số hộ
      { wch: 16 }, // Tổng nhân khẩu
      { wch: 24 }, // Cán bộ phụ trách
      { wch: 35 }  // Ghi chú
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách Tổ dân phố');
    XLSX.writeFile(wb, 'Mau_Cau_Hinh_To_Dan_Pho.xlsx');
  };

  // Export current residential groups to Excel
  const handleExportCurrent = () => {
    const list = getResidentialGroups();
    const exportData = list.map((g, index) => {
      const officerNames = (g.assignedStaffIds || [])
        .map((id) => {
          const st = staffList.find((s) => s.id === id);
          return st ? `${st.rank} ${st.name}` : id;
        })
        .join(', ');

      return {
        'STT': index + 1,
        'Tên Tổ dân phố': g.name,
        'Mã tổ': g.code || '',
        'Số hộ gia đình': g.householdCount ?? '',
        'Tổng nhân khẩu': g.populationCount ?? '',
        'Cán bộ phụ trách': officerNames,
        'Ghi chú địa bàn': g.note || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 25 },
      { wch: 35 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'To_Dan_Pho');
    XLSX.writeFile(wb, `Danh_Sach_To_Dan_Pho_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Handle uploading file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rawRows.length < 2) {
          setFeedback({ type: 'error', text: 'File Excel không có dữ liệu hợp lệ.' });
          return;
        }

        // Detect header row index
        let headerIdx = -1;
        let nameCol = -1;
        let codeCol = -1;
        let householdCol = -1;
        let popCol = -1;
        let officerCol = -1;
        let noteCol = -1;

        for (let i = 0; i < Math.min(6, rawRows.length); i++) {
          const row = rawRows[i];
          if (!Array.isArray(row)) continue;

          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || '').trim().toLowerCase();
            if (cell.includes('tổ') || cell.includes('tdp') || cell.includes('tên')) {
              nameCol = j;
              headerIdx = i;
            }
            if (cell.includes('mã') || cell.includes('code')) {
              codeCol = j;
            }
            if (cell.includes('hộ') || cell.includes('household')) {
              householdCol = j;
            }
            if (cell.includes('khẩu') || cell.includes('nhân khẩu') || cell.includes('dân số') || cell.includes('population')) {
              popCol = j;
            }
            if (cell.includes('cán bộ') || cell.includes('cskv') || cell.includes('phụ trách') || cell.includes('officer')) {
              officerCol = j;
            }
            if (cell.includes('ghi chú') || cell.includes('địa bàn') || cell.includes('mô tả') || cell.includes('note')) {
              noteCol = j;
            }
          }

          if (nameCol !== -1 && headerIdx !== -1) break;
        }

        // Fallback default columns if headers weren't named exactly
        if (nameCol === -1) nameCol = 1;
        if (headerIdx === -1) headerIdx = 0;

        const currentList = getResidentialGroups();
        const parsed: ParsedGroupRow[] = [];

        for (let r = headerIdx + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || !Array.isArray(row) || row.length === 0) continue;

          const rawName = String(row[nameCol] ?? '').trim();
          if (!rawName) continue;

          // Normalize group name: e.g. "Tổ 1" or "Tổ dân phố 1"
          let groupName = rawName;
          if (!/^(tổ|tdp)/i.test(groupName)) {
            // If just a number like "1", prepend "Tổ "
            if (/^\d+$/.test(groupName)) {
              groupName = `Tổ ${groupName}`;
            }
          }

          const rawCode = codeCol !== -1 ? String(row[codeCol] ?? '').trim() : '';
          const rawHousehold = householdCol !== -1 ? Number(row[householdCol]) : undefined;
          const rawPop = popCol !== -1 ? Number(row[popCol]) : undefined;
          const rawOfficer = officerCol !== -1 ? String(row[officerCol] ?? '').trim() : '';
          const rawNote = noteCol !== -1 ? String(row[noteCol] ?? '').trim() : '';

          const matchResult = matchOfficers(rawOfficer);

          // Check if existing in currentGroups
          const normGroupName = normalizeGroupName(groupName);
          const existing = currentList.find((g) => normalizeGroupName(g.name) === normGroupName);

          parsed.push({
            stt: parsed.length + 1,
            name: groupName,
            code: rawCode || undefined,
            householdCount: isNaN(rawHousehold as number) ? undefined : rawHousehold,
            populationCount: isNaN(rawPop as number) ? undefined : rawPop,
            rawOfficer,
            matchedStaff: matchResult.matched,
            unmatchedOfficerName: matchResult.unmatched,
            note: rawNote || undefined,
            isExisting: Boolean(existing),
            existingId: existing?.id
          });
        }

        if (parsed.length === 0) {
          setFeedback({
            type: 'error',
            text: 'Không đọc được Tổ dân phố nào từ file Excel. Vui lòng kiểm tra lại cấu trúc cột.'
          });
          return;
        }

        setParsedRows(parsed);
        const newCount = parsed.filter((p) => !p.isExisting).length;
        const updateCount = parsed.filter((p) => p.isExisting).length;
        setFeedback({
          type: 'success',
          text: `Đã đọc thành công ${parsed.length} Tổ dân phố (${newCount} Tổ mới, ${updateCount} Tổ cập nhật). Kiểm tra bảng xem trước bên dưới trước khi áp dụng.`
        });
      } catch (err) {
        console.error(err);
        setFeedback({
          type: 'error',
          text: 'Lỗi khi đọc file Excel: ' + (err instanceof Error ? err.message : String(err))
        });
      }
    };

    reader.readAsBinaryString(file);
  };

  // Apply updates to database
  const handleApplyUpdates = () => {
    if (parsedRows.length === 0) return;

    setIsProcessing(true);

    try {
      const currentList = getResidentialGroups();
      let updatedGroups: ResidentialGroup[] = [];

      if (importMode === 'replace') {
        // Replace all
        updatedGroups = parsedRows.map((row) => ({
          id: row.existingId || `tdp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: row.name,
          code: row.code,
          householdCount: row.householdCount,
          populationCount: row.populationCount,
          assignedStaffIds: row.matchedStaff.map((s) => s.id),
          note: row.note
        }));
      } else {
        // Merge & update
        updatedGroups = [...currentList];

        for (const row of parsedRows) {
          const normName = normalizeGroupName(row.name);
          const existingIdx = updatedGroups.findIndex((g) => normalizeGroupName(g.name) === normName);

          const groupData: ResidentialGroup = {
            id: row.existingId || `tdp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: row.name,
            code: row.code ?? (existingIdx !== -1 ? updatedGroups[existingIdx].code : undefined),
            householdCount: row.householdCount ?? (existingIdx !== -1 ? updatedGroups[existingIdx].householdCount : undefined),
            populationCount: row.populationCount ?? (existingIdx !== -1 ? updatedGroups[existingIdx].populationCount : undefined),
            assignedStaffIds: row.matchedStaff.length > 0
              ? row.matchedStaff.map((s) => s.id)
              : existingIdx !== -1
              ? updatedGroups[existingIdx].assignedStaffIds
              : [],
            note: row.note ?? (existingIdx !== -1 ? updatedGroups[existingIdx].note : undefined)
          };

          if (existingIdx !== -1) {
            updatedGroups[existingIdx] = groupData;
          } else {
            updatedGroups.push(groupData);
          }
        }
      }

      // Save groups
      saveResidentialGroups(updatedGroups);

      // Synchronize assignedAreas for staff
      if (syncStaffAreas) {
        const staffListCurrent = getStaffList();
        const updatedStaffList = staffListCurrent.map((staff) => {
          // Find all groups where this staff is assigned
          const staffGroups = updatedGroups
            .filter((g) => (g.assignedStaffIds || []).includes(staff.id))
            .map((g) => g.name);

          // If staff already had areas, merge them or update
          const mergedAreas = Array.from(new Set([...(staff.assignedAreas || []), ...staffGroups]));

          return {
            ...staff,
            assignedAreas: mergedAreas.length > 0 ? mergedAreas : staff.assignedAreas
          };
        });

        saveStaffList(updatedStaffList);
        syncStaffToAccounts(updatedStaffList);
      }

      // Reclassify records by new residential group assignment
      let reclassifyResult: { total: number } | null = null;
      if (reclassifyTasks) {
        reclassifyResult = reclassifyAllRecordsByResidentialGroup();
      }

      onDataUpdated();

      setFeedback({
        type: 'success',
        text: `Đã cập nhật thành công cấu hình ${updatedGroups.length} Tổ dân phố vào hệ thống! ${
          reclassifyResult ? `(Đã tự động phân loại lại ${reclassifyResult.total} chỉ tiêu cho các cán bộ phụ trách).` : ''
        }`
      });

      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setFeedback({
        type: 'error',
        text: 'Có lỗi xảy ra trong quá trình lưu dữ liệu: ' + (err instanceof Error ? err.message : String(err))
      });
    }
  };

  const newCount = parsedRows.filter((p) => !p.isExisting).length;
  const updateCount = parsedRows.filter((p) => p.isExisting).length;

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl text-slate-100 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                CẬP NHẬT CẤU HÌNH TỔ DÂN PHỐ TỪ FILE EXCEL
              </h3>
              <p className="text-[11px] text-slate-400">
                Nhập hàng loạt danh sách Tổ dân phố, số hộ, nhân khẩu và phân công cán bộ CSKV phụ trách
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

        {/* Feedback message */}
        {feedback && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/80 border-red-500/50 text-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* Action buttons: Template & Export */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>Mẫu file Excel cấu hình Tổ dân phố</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Các cột chuẩn: <b>STT, Tên Tổ dân phố, Mã tổ, Số hộ gia đình, Tổng nhân khẩu, Cán bộ phụ trách, Ghi chú</b>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Tải file mẫu Excel chuẩn để điền dữ liệu"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file mẫu Excel</span>
              </button>
              <button
                type="button"
                onClick={handleExportCurrent}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Xuất toàn bộ danh sách Tổ dân phố hiện tại ra file Excel để chỉnh sửa"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất TDP hiện tại</span>
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30">
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-500/40 rounded-xl hover:border-emerald-400 transition bg-slate-950/50 text-center">
              <Upload className="w-8 h-8 text-emerald-400 mb-2" />
              <div className="font-bold text-sm text-white">
                Chọn file Excel cấu hình Tổ dân phố (.xlsx, .xls)
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Kéo thả file vào đây hoặc bấm nút bên dưới để chọn file từ máy tính của bạn
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="input-upload-residential-excel"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{fileName ? `Đổi file: ${fileName}` : 'Chọn file Excel từ máy'}</span>
              </button>
            </div>
          </div>

          {/* Options & Configuration */}
          {parsedRows.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="font-bold text-xs text-amber-300 uppercase tracking-wider">
                Tùy chọn áp dụng cập nhật
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Mode */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phương thức cập nhật:</label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="radio"
                        name="importMode"
                        value="merge"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="text-emerald-500"
                      />
                      <div>
                        <div className="font-bold text-white">Cập nhật & Bổ sung (Khuyên dùng)</div>
                        <div className="text-[10px] text-slate-400">
                          Cập nhật thông tin các Tổ trùng tên, thêm Tổ mới, giữ nguyên các Tổ khác.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-red-500"
                      />
                      <div>
                        <div className="font-bold text-red-300">Ghi đè toàn bộ danh sách</div>
                        <div className="text-[10px] text-slate-400">
                          Thay thế toàn bộ danh sách Tổ hiện có bằng danh sách trong file Excel.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Additional switches */}
                <div className="space-y-2">
                  <label className="block text-slate-300 font-semibold mb-1">Tự động đồng bộ liên kết:</label>

                  <label className="flex items-start gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={syncStaffAreas}
                      onChange={(e) => setSyncStaffAreas(e.target.checked)}
                      className="mt-0.5 text-emerald-500"
                    />
                    <div>
                      <div className="font-bold text-white">Đồng bộ địa bàn vào hồ sơ cán bộ</div>
                      <div className="text-[10px] text-slate-400">
                        Tự động gán Tên Tổ dân phố vào danh sách địa bàn phụ trách của cán bộ tương ứng.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={reclassifyTasks}
                      onChange={(e) => setReclassifyTasks(e.target.checked)}
                      className="mt-0.5 text-blue-500"
                    />
                    <div>
                      <div className="font-bold text-white">Tự động phân loại lại chỉ tiêu theo Tổ</div>
                      <div className="text-[10px] text-slate-400">
                        Quét toàn bộ chỉ tiêu đang có và gán lại cho cán bộ phụ trách mới của từng Tổ.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-slate-300 flex items-center gap-2">
                  <span>Xem trước dữ liệu ({parsedRows.length} Tổ):</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {newCount} Tổ mới
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    {updateCount} Cập nhật
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Cuộn để xem toàn bộ danh sách
                </div>
              </div>

              <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-2xl bg-slate-950/90">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-slate-300 sticky top-0 border-b border-slate-800 z-10">
                    <tr>
                      <th className="py-2 px-3 font-bold w-12 text-center">STT</th>
                      <th className="py-2 px-3 font-bold">Tên Tổ dân phố</th>
                      <th className="py-2 px-3 font-bold">Mã tổ</th>
                      <th className="py-2 px-3 font-bold text-right">Số hộ</th>
                      <th className="py-2 px-3 font-bold text-right">Nhân khẩu</th>
                      <th className="py-2 px-3 font-bold">Cán bộ phụ trách nhận diện</th>
                      <th className="py-2 px-3 font-bold">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {parsedRows.map((row) => (
                      <tr key={row.stt} className="hover:bg-slate-900/60 transition">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {row.stt}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{row.name}</span>
                            {row.isExisting ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                                CẬP NHẬT
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                MỚI
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono text-amber-300 text-[11px]">
                          {row.code || '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-medium">
                          {row.householdCount ? `${row.householdCount} hộ` : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-medium">
                          {row.populationCount ? `${row.populationCount} khẩu` : '—'}
                        </td>
                        <td className="py-2 px-3">
                          {row.matchedStaff.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {row.matchedStaff.map((st) => (
                                <span
                                  key={st.id}
                                  className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold"
                                >
                                  {st.rank} {st.name}
                                </span>
                              ))}
                            </div>
                          ) : row.rawOfficer ? (
                            <span className="text-amber-400 text-[10px] italic">
                              "{row.rawOfficer}" (chưa khớp cán bộ nào)
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px] italic">
                              Chưa có
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                          {row.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
          >
            Đóng
          </button>

          <button
            type="button"
            id="btn-apply-residential-excel"
            onClick={handleApplyUpdates}
            disabled={parsedRows.length === 0 || isProcessing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang cập nhật...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>
                  {parsedRows.length > 0
                    ? `Xác Nhận Cập Nhật ${parsedRows.length} Tổ Dân Phố`
                    : 'Chưa Chọn File Excel'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
