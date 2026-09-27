import React, { useState } from 'react';
import { DatDaiRecord } from '../types';
import { MapPin, User, Trash2, Edit3, CheckCircle2 } from 'lucide-react';

interface DatdaiCardProps {
  record: DatDaiRecord;
  onUpdateRecord: (stt: number, data: Partial<DatDaiRecord>) => void;
  onDelete: (stt: number) => void;
}

export const DatdaiCard: React.FC<DatdaiCardProps> = ({
  record,
  onUpdateRecord,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formType, setFormType] = useState<'cccd' | 'wrong' | 'noinfo'>('cccd');
  const [cccdInput, setCccdInput] = useState(record.cccd || '');
  const [dobInput, setDobInput] = useState(record.dob || '');
  const [wrongDetailInput, setWrongDetailInput] = useState(record.wrongDetail || '');
  const [noInfoReasonInput, setNoInfoReasonInput] = useState(record.noInfoReason || 'Chết');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (formType === 'cccd') {
      if (!cccdInput.trim()) {
        alert('Vui lòng nhập số CCCD 12 số');
        return;
      }
      onUpdateRecord(record.stt, {
        status: 'cccd_updated',
        cccd: cccdInput.trim(),
        dob: dobInput.trim(),
        statusText: `Đã cập nhật CCCD: ${cccdInput.trim()}`
      });
    } else if (formType === 'wrong') {
      if (!wrongDetailInput.trim()) {
        alert('Vui lòng nhập chi tiết sai thông tin');
        return;
      }
      onUpdateRecord(record.stt, {
        status: 'wrong_info',
        wrongDetail: wrongDetailInput.trim(),
        statusText: `Sai TT: ${wrongDetailInput.trim()}`
      });
    } else if (formType === 'noinfo') {
      onUpdateRecord(record.stt, {
        status: 'no_info',
        noInfoReason: noInfoReasonInput,
        statusText: `Không có TT: ${noInfoReasonInput}`
      });
    }

    setIsEditing(false);
  };

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 shadow-xs ${
        record.isDone
          ? 'bg-purple-50/40 border-purple-300 ring-1 ring-purple-400/20'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span
            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
              record.isDone ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {record.stt}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                {record.chuHo}
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                SN {record.namSinh}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-mono">
                CMND gốc: {record.cmnd}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {record.toDanPho}
              </span>
            </div>

            <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
              <span className="text-slate-400">Địa chỉ:</span>
              <span className="font-medium">{record.diaChi}</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
              <span className="flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{record.canBoName || record.canBoId}</span>
              </span>
              {record.updatedAt && (
                <span className="text-[11px] text-slate-400">
                  Cập nhật: {record.updatedAt}
                </span>
              )}
            </div>

            {/* Status tag */}
            <div className="mt-2">
              {record.isDone ? (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    record.status === 'cccd_updated'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : record.status === 'wrong_info'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-current" />
                  <span>{record.statusText || 'Đã xử lý làm sạch'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
                  Chưa làm sạch thông tin
                </span>
              )}
            </div>

            {/* Editing form */}
            {isEditing && (
              <form onSubmit={handleSave} className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Hình thức làm sạch dữ liệu:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormType('cccd')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                        formType === 'cccd'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      1. Có CCCD
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('wrong')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                        formType === 'wrong'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      2. Sai TT
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('noinfo')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                        formType === 'noinfo'
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      3. Không TT
                    </button>
                  </div>
                </div>

                {formType === 'cccd' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Số CCCD chuẩn (12 số):
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={12}
                        value={cccdInput}
                        onChange={(e) => setCccdInput(e.target.value)}
                        placeholder="VD: 001075012345"
                        className="w-full px-2.5 py-1 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Ngày sinh (dd/mm/yyyy):
                      </label>
                      <input
                        type="text"
                        value={dobInput}
                        onChange={(e) => setDobInput(e.target.value)}
                        placeholder="VD: 15/04/1975"
                        className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                )}

                {formType === 'wrong' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Chi tiết thông tin bị sai:
                    </label>
                    <input
                      type="text"
                      required
                      value={wrongDetailInput}
                      onChange={(e) => setWrongDetailInput(e.target.value)}
                      placeholder="VD: Sai năm sinh 1989, sai tên đệm trên sổ bìa đỏ..."
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                )}

                {formType === 'noinfo' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Lý do không có thông tin:
                    </label>
                    <select
                      value={noInfoReasonInput}
                      onChange={(e) => setNoInfoReasonInput(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Chết">Chết</option>
                      <option value="Không tìm thấy trên CSDL">Không tìm thấy trên CSDL Dân cư</option>
                      <option value="Chuyển đi nơi khác không rõ địa chỉ">Chuyển đi nơi khác không rõ địa chỉ</option>
                      <option value="Đã bán/chuyển nhượng quyền sử dụng đất">Đã bán/chuyển nhượng quyền sử dụng đất</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-3.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    Lưu kết quả
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-600" />
            <span>{record.isDone ? 'Sửa thông tin' : 'Làm sạch'}</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(record.stt)}
            title="Xóa bản ghi"
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
