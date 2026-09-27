import React, { useState } from 'react';
import { DCTTPRecord } from '../types';
import { MapPin, User, Edit3, Trash2 } from 'lucide-react';

interface DcttpCardProps {
  record: DCTTPRecord;
  onUpdateCount: (stt: number, count: number) => void;
  onDelete: (stt: number) => void;
}

export const DcttpCard: React.FC<DcttpCardProps> = ({
  record,
  onUpdateCount,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [countInput, setCountInput] = useState(record.soLuongDaDieuChinh);

  const total = Number(record.tongNhanKhau) || 0;
  const done = Number(record.soLuongDaDieuChinh) || 0;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  const handleSave = () => {
    onUpdateCount(record.stt, countInput);
    setIsEditing(false);
  };

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 shadow-xs ${
        record.isDone
          ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span
            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
              record.isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {record.stt}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                {record.hoTen}
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                {record.toDanPho}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
              <span className="flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{record.canBoName || record.canBoId}</span>
              </span>
              <span>
                Tiến độ: <strong className="text-blue-700 font-bold">{done}</strong> / {total} nhân khẩu ({pct}%)
              </span>
              {record.updatedAt && (
                <span className="text-[11px] text-slate-400">
                  Cập nhật: {record.updatedAt}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-md bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  pct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Editing state */}
            {isEditing && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 flex-wrap">
                <label className="text-xs font-bold text-slate-700">Số nhân khẩu đã điều chỉnh:</label>
                <input
                  type="number"
                  min="0"
                  max={total}
                  value={countInput}
                  onChange={(e) => setCountInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-24 px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg text-center font-mono"
                />
                <span className="text-xs text-slate-500">/ {total}</span>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Cập nhật số lượng</span>
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
