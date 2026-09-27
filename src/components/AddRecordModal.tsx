import React, { useState } from 'react';
import { TaskType, Staff } from '../types';
import { TASK_LIST } from '../services/mockData';
import { Plus, X, Check } from 'lucide-react';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  currentTaskId: TaskType;
  onAddRecord: (type: TaskType, newRecord: any) => void;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  staffList,
  currentTaskId,
  onAddRecord
}) => {
  if (!isOpen) return null;

  const [selectedType, setSelectedType] = useState<TaskType>(currentTaskId);
  const [canBoId, setCanBoId] = useState<string>(staffList[0]?.id || 'CB01');
  const [toDanPho, setToDanPho] = useState('Tổ 1');

  // HKCCH Form
  const [hoTen, setHoTen] = useState('');
  const [soHoSo, setSoHoSo] = useState('');
  const [note, setNote] = useState('');

  // Ma Tuy Form
  const [namSinh, setNamSinh] = useState('1990');
  const [soCMND, setSoCMND] = useState('');

  // DCTTP Form
  const [tenKhuDanCu, setTenKhuDanCu] = useState('');
  const [tongNhanKhau, setTongNhanKhau] = useState(100);

  // Dat Dai Form
  const [chuHo, setChuHo] = useState('');
  const [cmndGoc, setCmndGoc] = useState('');
  const [diaChi, setDiaChi] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const timestamp = Date.now();
    const stt = Math.floor(Math.random() * 9000) + 1000;

    if (selectedType === 'hkcch') {
      if (!hoTen.trim()) {
        alert('Vui lòng nhập họ tên!');
        return;
      }
      onAddRecord('hkcch', {
        stt,
        hoTen: hoTen.trim(),
        soHoSo: soHoSo.trim() || `HS-${timestamp.toString().slice(-4)}`,
        toDanPho,
        canBoId,
        isDone: false,
        note: note.trim() || undefined
      });
    } else if (selectedType === 'matuy') {
      if (!hoTen.trim()) {
        alert('Vui lòng nhập họ tên đối tượng!');
        return;
      }
      onAddRecord('matuy', {
        stt,
        hoTen: hoTen.trim(),
        namSinh: namSinh.trim(),
        soCMND: soCMND.trim() || undefined,
        toDanPho,
        canBoId,
        isDone: false,
        note: note.trim() || undefined
      });
    } else if (selectedType === 'dcttp') {
      if (!tenKhuDanCu.trim()) {
        alert('Vui lòng nhập tên khu dân cư / cụm TDP!');
        return;
      }
      onAddRecord('dcttp', {
        stt,
        hoTen: tenKhuDanCu.trim(),
        tongNhanKhau: Number(tongNhanKhau) || 1,
        soLuongDaDieuChinh: 0,
        toDanPho,
        canBoId,
        isDone: false,
        note: note.trim() || undefined
      });
    } else if (selectedType === 'datdai') {
      if (!chuHo.trim() || !diaChi.trim()) {
        alert('Vui lòng nhập tên chủ hộ và địa chỉ thửa đất!');
        return;
      }
      onAddRecord('datdai', {
        stt,
        chuHo: chuHo.trim(),
        cmnd: cmndGoc.trim() || 'Chưa rõ',
        namSinh: namSinh.trim(),
        diaChi: diaChi.trim(),
        toDanPho,
        canBoId,
        status: 'pending',
        isDone: false
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in my-8">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">Thêm Bản Ghi Nhiệm Vụ Mới</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Select Task Type */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Chọn loại nhiệm vụ:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as TaskType)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
            >
              {TASK_LIST.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          {/* Common Fields: Officer & Zone */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cán bộ phụ trách:</label>
              <select
                value={canBoId}
                onChange={(e) => setCanBoId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium"
              >
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.rank} {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tổ dân phố:</label>
              <input
                type="text"
                value={toDanPho}
                onChange={(e) => setToDanPho(e.target.value)}
                placeholder="VD: Tổ 1"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                required
              />
            </div>
          </div>

          {/* Form HKCCH */}
          {selectedType === 'hkcch' && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên nhân khẩu đại diện:</label>
                <input
                  type="text"
                  value={hoTen}
                  onChange={(e) => setHoTen(e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Số hồ sơ / Mã định danh hộ:</label>
                <input
                  type="text"
                  value={soHoSo}
                  onChange={(e) => setSoHoSo(e.target.value)}
                  placeholder="VD: HS-2024-099"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono"
                />
              </div>
            </>
          )}

          {/* Form Ma Tuy */}
          {selectedType === 'matuy' && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên đối tượng:</label>
                <input
                  type="text"
                  value={hoTen}
                  onChange={(e) => setHoTen(e.target.value)}
                  placeholder="VD: Trần Văn Tùng"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Năm sinh:</label>
                  <input
                    type="text"
                    value={namSinh}
                    onChange={(e) => setNamSinh(e.target.value)}
                    placeholder="1990"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số CMND/CCCD:</label>
                  <input
                    type="text"
                    value={soCMND}
                    onChange={(e) => setSoCMND(e.target.value)}
                    placeholder="012345678"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {/* Form DCTTP */}
          {selectedType === 'dcttp' && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên khu dân cư / Cụm cư dân:</label>
                <input
                  type="text"
                  value={tenKhuDanCu}
                  onChange={(e) => setTenKhuDanCu(e.target.value)}
                  placeholder="VD: Khu dân cư A - Tổ 1"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tổng số nhân khẩu cần điều chỉnh:</label>
                <input
                  type="number"
                  value={tongNhanKhau}
                  onChange={(e) => setTongNhanKhau(Number(e.target.value))}
                  placeholder="150"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                  min={1}
                  required
                />
              </div>
            </>
          )}

          {/* Form Dat Dai */}
          {selectedType === 'datdai' && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên chủ hộ / Người đứng tên đất:</label>
                <input
                  type="text"
                  value={chuHo}
                  onChange={(e) => setChuHo(e.target.value)}
                  placeholder="VD: Nguyễn Văn Minh"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Năm sinh:</label>
                  <input
                    type="text"
                    value={namSinh}
                    onChange={(e) => setNamSinh(e.target.value)}
                    placeholder="1965"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số CMND gốc trong sổ:</label>
                  <input
                    type="text"
                    value={cmndGoc}
                    onChange={(e) => setCmndGoc(e.target.value)}
                    placeholder="010123456"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa chỉ thửa đất:</label>
                <input
                  type="text"
                  value={diaChi}
                  onChange={(e) => setDiaChi(e.target.value)}
                  placeholder="VD: Số 12 Phố Huế"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                  required
                />
              </div>
            </>
          )}

          {/* Ghi chu */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Ghi chú (nếu có):</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Thêm Bản Ghi</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
