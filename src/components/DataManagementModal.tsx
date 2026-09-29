import React, { useState } from 'react';
import { X, Download, Upload, RotateCcw, AlertTriangle, CheckCircle2, FileSpreadsheet, Building, Cloud, ArrowUpFromLine } from 'lucide-react';
import {
  getStaffList,
  getHkcchList,
  getMatuyList,
  getDcttpList,
  getDatdaiList,
  saveHkcchList,
  saveMatuyList,
  saveDcttpList,
  saveDatdaiList,
  resetAllDataToDefault
} from '../data/storage';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
  onOpenExcelModal?: () => void;
  onOpenResidentialModal?: () => void;
  isAdmin?: boolean;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
  onOpenExcelModal,
  onOpenResidentialModal,
  isAdmin = false
}) => {
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  if (!isOpen) return null;

  const handleExportJson = () => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        staff: getStaffList(),
        hkcch: getHkcchList(),
        matuy: getMatuyList(),
        dcttp: getDcttpList(),
        datdai: getDatdaiList(),
      };

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_nhiem_vu_cong_an_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedbackMessage({
        type: 'success',
        text: 'Đã xuất dữ liệu sao lưu JSON thành công!',
      });
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'Lỗi khi xuất dữ liệu',
      });
    }
  };

  const handleMigrateToCloud = async () => {
    if (!isAdmin || isMigrating) return;
    if (!window.confirm('Đồng bộ sạch sẽ toàn bộ dữ liệu trên thiết bị này lên Cloud Firestore? Mọi chỉ tiêu đã xóa trên thiết bị sẽ được xóa triệt để khỏi máy chủ Cloud.')) return;

    setIsMigrating(true);
    try {
      const { syncAllLocalToFirestore } = await import('../services/firestoreSync');
      const result = await syncAllLocalToFirestore();
      setFeedbackMessage({
        type: result.ok ? 'success' : 'error',
        text: result.message
      });
      if (result.ok) {
        onDataChanged();
      }
    } catch (error) {
      console.error(error);
      setFeedbackMessage({
        type: 'error',
        text: 'Không thể đồng bộ dữ liệu lên Cloud Firestore.'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.hkcch && Array.isArray(parsed.hkcch)) saveHkcchList(parsed.hkcch);
        if (parsed.matuy && Array.isArray(parsed.matuy)) saveMatuyList(parsed.matuy);
        if (parsed.dcttp && Array.isArray(parsed.dcttp)) saveDcttpList(parsed.dcttp);
        if (parsed.datdai && Array.isArray(parsed.datdai)) saveDatdaiList(parsed.datdai);

        onDataChanged();
        setFeedbackMessage({
          type: 'success',
          text: 'Đã khôi phục dữ liệu từ tệp sao lưu thành công!',
        });
      } catch {
        setFeedbackMessage({
          type: 'error',
          text: 'Tệp không đúng định dạng JSON hoặc bị lỗi!',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'Bạn có chắc chắn muốn đặt lại tất cả dữ liệu về ban đầu? Mọi thay đổi hiện tại sẽ được thay thế bằng dữ liệu mẫu.'
      )
    ) {
      resetAllDataToDefault();
      onDataChanged();
      setFeedbackMessage({
        type: 'success',
        text: 'Đã đặt lại dữ liệu mẫu thành công!',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="font-extrabold text-base tracking-tight">QUẢN LÝ & SAO LƯU DỮ LIỆU</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {feedbackMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Excel by Residential Group */}
            {onOpenExcelModal && (
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-bold text-emerald-950">Excel Chỉ Tiêu Theo Tổ Dân Phố</h4>
                    <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-800 text-[10px] font-extrabold rounded-md">
                      Tự phân loại
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Nhập/xuất file Excel chỉ tiêu theo từng tổ, tự động gán cán bộ phụ trách
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-open-excel-from-data-modal"
                  onClick={() => {
                    onClose();
                    onOpenExcelModal();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Mở Excel</span>
                </button>
              </div>
            )}

            {/* Residential Groups Management */}
            {onOpenResidentialModal && (
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-blue-700" />
                    <h4 className="text-xs font-bold text-blue-950">Quản Lý Danh Sách Tổ Dân Phố</h4>
                  </div>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Tạo mới, sửa, xóa tổ dân phố và phân công cán bộ quản lý địa bàn
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-open-groups-from-data-modal"
                  onClick={() => {
                    onClose();
                    onOpenResidentialModal();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Quản lý Tổ</span>
                </button>
              </div>
            )}

            {/* Migrate local data to central database */}
            {isAdmin && (
              <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-indigo-950">Đồng bộ sạch sẽ lên Cloud Firestore</h4>
                    <p className="text-[11px] text-indigo-700 mt-0.5">
                      Cập nhật trạng thái mới nhất từ máy này lên Cloud Firestore (xóa vĩnh viễn các chỉ tiêu/nhiệm vụ đã bị xóa trên máy chủ).
                    </p>
                    <p className="text-[10px] text-indigo-600 mt-1 font-semibold">
                      Khuyến nghị: bấm “Xuất file” trước khi chuyển.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="btn-migrate-local-to-cloud"
                    onClick={handleMigrateToCloud}
                    disabled={isMigrating}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-xs shrink-0"
                  >
                    <ArrowUpFromLine className={`w-3.5 h-3.5 ${isMigrating ? 'animate-bounce' : ''}`} />
                    <span>{isMigrating ? 'Đang đồng bộ...' : 'Đồng bộ Firestore'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Export */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Xuất sao lưu (JSON)</h4>
                <p className="text-[11px] text-slate-500">Tải về toàn bộ dữ liệu 4 nhiệm vụ</p>
              </div>
              <button
                type="button"
                id="btn-export-json"
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất file</span>
              </button>
            </div>

            {/* Import */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Nhập khôi phục (JSON)</h4>
                <p className="text-[11px] text-slate-500">Tải tệp sao lưu đã lưu từ trước</p>
              </div>
              <label
                htmlFor="input-import-file"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Chọn file</span>
                <input
                  id="input-import-file"
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset default */}
            <div className="p-3.5 bg-red-50/60 rounded-xl border border-red-200 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-red-900">Khôi phục dữ liệu mẫu</h4>
                <p className="text-[11px] text-red-600">Đặt lại danh sách ban đầu của 4 nhiệm vụ</p>
              </div>
              <button
                type="button"
                id="btn-reset-data"
                onClick={handleResetToDefault}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
