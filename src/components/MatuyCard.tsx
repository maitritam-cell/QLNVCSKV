import React, { useState } from 'react';
import { MaTuyRecord } from '../types';
import { Activity, User, MapPin, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface MatuyCardProps {
  record: MaTuyRecord;
  onUpdateTest: (
    stt: number,
    isDone: boolean,
    ketQuaTest?: 'Âm tính' | 'Dương tính' | 'Chưa test',
    note?: string
  ) => void;
  onDelete: (stt: number) => void;
}

export const MatuyCard: React.FC<MatuyCardProps> = ({
  record,
  onUpdateTest,
  onDelete
}) => {
  const [selectedResult, setSelectedResult] = useState<'Âm tính' | 'Dương tính' | 'Chưa test'>(
    record.ketQuaTest || 'Chưa test'
  );
  const [noteText, setNoteText] = useState(record.note || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    const isDone = selectedResult === 'Âm tính' || selectedResult === 'Dương tính';
    onUpdateTest(record.stt, isDone, selectedResult, noteText);
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
              record.isDone ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {record.stt}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                {record.hoTen}
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                SN {record.namSinh}
              </span>
              {record.soCMND && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono">
                  CMND: {record.soCMND}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {record.toDanPho}
              </span>
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

            {/* Test result status badge */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {record.isDone ? (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    record.ketQuaTest === 'Dương tính'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {record.ketQuaTest === 'Dương tính' ? (
                    <AlertCircle className="w-3 h-3 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  )}
                  <span>Đã Test: {record.ketQuaTest || 'Âm tính'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
                  <span>Chưa xét nghiệm</span>
                </span>
              )}

              {record.note && (
                <span className="text-xs text-slate-500 italic">({record.note})</span>
              )}
            </div>

            {/* In-place editor if open */}
            {isEditing && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700">Kết quả:</label>
                  <select
                    value={selectedResult}
                    onChange={(e) => setSelectedResult(e.target.value as any)}
                    className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Âm tính">Âm tính (-)</option>
                    <option value="Dương tính">Dương tính (+)</option>
                    <option value="Chưa test">Chưa xét nghiệm</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Ghi chú hồ sơ / diện quản lý..."
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
                  >
                    Lưu kết quả
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1"
          >
            <Activity className="w-3.5 h-3.5 text-amber-700" />
            <span>Cập nhật Test</span>
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
