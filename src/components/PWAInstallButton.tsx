import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { DownloadCloud, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'prominent' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'navbar'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGenericGuide, setShowGenericGuide] = useState(false);

  // If already installed and running standalone, do not clutter UI
  if (isInstalled) {
    return null;
  }

  // Handle click
  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        // If dismissed or error, show quick tips
        setShowGenericGuide(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowGenericGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        id="btn-pwa-install-app"
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer active:scale-95 ${
          variant === 'navbar'
            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black border border-amber-300 animate-pulse'
            : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold'
        } ${className}`}
        title="Cài đặt ứng dụng lên màn hình điện thoại hoặc máy tính để dùng ngoại tuyến"
      >
        <Smartphone className="w-3.5 h-3.5 text-slate-950" />
        <span>Cài Ứng Dụng</span>
      </button>

      {/* iOS Safari Guided Install Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-white">
                  Cài Đặt Lên iPhone / iPad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div className="flex-1">
                  Bấm nút <b className="text-white">Chia sẻ</b> (biểu tượng <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> hình vuông mũi tên lên) ở thanh công cụ dưới đáy trình duyệt Safari.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div className="flex-1">
                  Cuộn xuống danh sách tác vụ và chọn <b className="text-white flex items-center gap-1 inline-flex"><PlusSquare className="w-3.5 h-3.5 text-emerald-400" /> Thêm vào MH chính</b> (Add to Home Screen).
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-amber-600/30 text-amber-400 flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div className="flex-1">
                  Bấm <b className="text-white">Thêm</b> (Add) ở góc trên bên phải. Biểu tượng ứng dụng sẽ xuất hiện ngay trên màn hình điện thoại!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              Đã hiểu, đóng lại
            </button>
          </div>
        </div>
      )}

      {/* General Android / Desktop Guide Modal (when prompt cannot auto-fire) */}
      {showGenericGuide && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <DownloadCloud className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-white">
                  Cài Đặt Ứng Dụng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGenericGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-300">
              <p>
                Để cài đặt ứng dụng lên màn hình điện thoại hoặc máy tính:
              </p>
              <ul className="space-y-2 list-disc list-inside bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <li>
                  <b>Trên Android (Chrome/Cốc Cốc):</b> Bấm menu <b>(⋮)</b> ở góc trên bên phải &gt; Chọn <b>"Cài đặt ứng dụng"</b> hoặc <b>"Thêm vào màn hình chính"</b>.
                </li>
                <li>
                  <b>Trên máy tính (Chrome/Edge):</b> Bấm biểu tượng <b>Cài đặt (⊕)</b> ở cuối thanh địa chỉ trình duyệt.
                </li>
                <li>
                  <b>Ưu điểm:</b> Ứng dụng chạy mượt như app cài sẵn, mở toàn màn hình và hoạt động tốt ngay cả khi mất kết nối mạng.
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setShowGenericGuide(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
            >
              Đã hiểu, đóng lại
            </button>
          </div>
        </div>
      )}
    </>
  );
};
