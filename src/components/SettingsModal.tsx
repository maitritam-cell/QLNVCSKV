import React, { useState } from 'react';
import { AppConfig } from '../types';
import { StorageService } from '../services/storageService';
import { 
  Settings, 
  Database, 
  RotateCcw, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Link 
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSaveConfig: (config: AppConfig) => void;
  onResetData: () => void;
  onImportData: (data: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetData,
  onImportData
}) => {
  const [unitName, setUnitName] = useState(config.unitName || '');
  const [subUnitName, setSubUnitName] = useState(config.subUnitName || '');
  const [apiUrl, setApiUrl] = useState(config.apiUrl || '');
  const [useLiveGoogleSheet, setUseLiveGoogleSheet] = useState(config.useLiveGoogleSheet || false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      unitName: unitName.trim(),
      subUnitName: subUnitName.trim(),
      apiUrl: apiUrl.trim(),
      useLiveGoogleSheet
    });
    onClose();
  };

  const handleExportBackup = () => {
    const backupData = {
      version: 2,
      exportDate: new Date().toISOString(),
      config: StorageService.getConfig(),
      staff: StorageService.getStaffList(),
      hkcch: StorageService.getHKCCHList(),
      matuy: StorageService.getMaTuyList(),
      dcttp: StorageService.getDCTTPList(),
      datdai: StorageService.getDatDaiList()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nhiem_vu_cong_an_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (window.confirm('Khôi phục dữ liệu từ tệp này sẽ ghi đè dữ liệu hiện tại. Bạn có chắc chắn không?')) {
          onImportData(json);
          onClose();
        }
      } catch {
        alert('Tệp dữ liệu không hợp lệ!');
      }
    };
    reader.readAsText(file);
  };

  const handleTestConnection = async () => {
    if (!apiUrl.trim()) {
      setTestResult({ status: 'error', message: 'Vui lòng nhập URL Google Apps Script Web App' });
      return;
    }
    setTestResult({ status: 'testing' });
    const res = await StorageService.testGasConnection(apiUrl.trim());
    if (res.success) {
      setTestResult({ status: 'success', message: res.message });
    } else {
      setTestResult({ status: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Cài Đặt Hệ Thống & Cơ Sở Dữ Liệu</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          {/* Unit info */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              1. Thông tin đơn vị công tác
            </h4>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Tên đơn vị công an (In trên tiêu đề & Báo cáo):</label>
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="CÔNG AN PHƯỜNG HÀNG BÀI - TP. HÀ NỘI"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Tên tổ công tác / Đội công tác:</label>
              <input
                type="text"
                value={subUnitName}
                onChange={(e) => setSubUnitName(e.target.value)}
                placeholder="TỔ CÔNG TÁC ĐỀ ÁN 06 & QUẢN LÝ HÀNH CHÍNH"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium"
              />
            </div>
          </div>

          {/* Google Sheets API Integration */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>2. Kết nối Google Sheets (Apps Script Web App)</span>
            </h4>
            
            <div>
              <label className="font-bold text-slate-600 block mb-1">URL triển khai Google Apps Script (exec):</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testResult.status === 'testing'}
                  className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold whitespace-nowrap"
                >
                  {testResult.status === 'testing' ? 'Đang test...' : 'Kiểm tra'}
                </button>
              </div>
            </div>

            {testResult.status !== 'idle' && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                testResult.status === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {testResult.status === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Data Backup & Restore */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              3. Sao lưu & Phục hồi dữ liệu
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Sao lưu JSON</span>
              </button>

              <label className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Khôi phục JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset to Factory Defaults */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('CẢNH BÁO: Thao tác này sẽ xóa toàn bộ thay đổi và nạp lại dữ liệu mẫu gốc ban đầu. Bạn có chắc không?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục dữ liệu mẫu ban đầu</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
            >
              Lưu Cài Đặt
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
