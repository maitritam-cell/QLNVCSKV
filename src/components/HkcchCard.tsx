import React, { useState } from 'react';
import { TaskReferenceLink } from './TaskReferenceLink';
import { HKCCHRecord } from '../types';
import { CheckCircle2, Circle, Edit2, User, MapPin, Trash2 } from 'lucide-react';

interface HkcchCardProps {
  record: HKCCHRecord;
  onToggleStatus: (stt: number, isDone: boolean, note?: string) => void;
  onDelete: (stt: number) => void;
}

export const HkcchCard: React.FC<HkcchCardProps> = ({
  record,
  onToggleStatus,
  onDelete
}) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(record.note || '');

  const handleSaveNote = () => {
    onToggleStatus(record.stt, record.isDone, noteText);
    setIsEditingNote(false);
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
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-mono font-bold">
                {record.soHoSo}
              </span>
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

            <TaskReferenceLink title={record.referenceTitle} url={record.referenceLink} />

            {/* Note display & editing */}
            {isEditingNote ? (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Nhập ghi chú xử lý (VD: cử con trai làm chủ hộ)..."
                  className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingNote(false)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Hủy
                </button>
              </div>
            ) : (
              record.note && (
                <p className="text-xs text-slate-600 mt-1.5 italic bg-white/70 px-2 py-1 rounded-lg border border-slate-100 inline-block">
                  Ghi chú: {record.note}
                </p>
              )
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setIsEditingNote(!isEditingNote)}
            title="Sửa ghi chú"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onToggleStatus(record.stt, !record.isDone, record.note)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 ${
              record.isDone
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {record.isDone ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                <span>Đã thực hiện</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 text-slate-400" />
                <span>Chưa thực hiện</span>
              </>
            )}
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
