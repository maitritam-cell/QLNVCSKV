import React, { useMemo, useState } from 'react';
import { InformationPost } from '../types';
import {
  BookOpen,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Pin,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Check
} from 'lucide-react';
import {
  addInformationPost,
  deleteInformationPost,
  getInformationPosts,
  getTaskCategories,
  updateInformationPost
} from '../data/storage';

interface InformationLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  currentUserName?: string;
}

export const InformationLibraryModal: React.FC<InformationLibraryModalProps> = ({
  isOpen,
  onClose,
  isAdmin = false,
  currentUserName
}) => {
  const [posts, setPosts] = useState<InformationPost[]>(() => getInformationPosts());
  const [search, setSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<InformationPost | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hướng dẫn');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [taskType, setTaskType] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const categories = getTaskCategories();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...posts]
      .filter((post) => !taskFilter || post.taskType === taskFilter)
      .filter((post) =>
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q)
      )
      .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, search, taskFilter]);

  if (!isOpen) return null;

  const refresh = () => setPosts(getInformationPosts());

  const resetForm = () => {
    setEditing(null);
    setTitle('');
    setCategory('Hướng dẫn');
    setContent('');
    setLink('');
    setTaskType('');
    setIsPinned(false);
    setIsFormOpen(false);
  };

  const openEdit = (post: InformationPost) => {
    setEditing(post);
    setTitle(post.title);
    setCategory(post.category);
    setContent(post.content);
    setLink(post.link || '');
    setTaskType(post.taskType || '');
    setIsPinned(Boolean(post.isPinned));
    setIsFormOpen(true);
  };

  const savePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề thông tin/tài liệu.');
      return;
    }
    if (!content.trim() && !link.trim()) {
      alert('Vui lòng nhập nội dung hoặc đường dẫn tài liệu.');
      return;
    }

    const payload = {
      title: title.trim(),
      category: category.trim() || 'Thông tin',
      content: content.trim(),
      link: link.trim(),
      taskType: taskType || undefined,
      isPinned,
      createdBy: currentUserName || 'Quản trị viên'
    };

    if (editing) {
      updateInformationPost({ ...editing, ...payload });
    } else {
      addInformationPost(payload);
    }
    refresh();
    resetForm();
  };

  const removePost = (post: InformationPost) => {
    if (!window.confirm(`Xóa bài “${post.title}”? Cán bộ sẽ không còn thấy bài này.`)) return;
    deleteInformationPost(post.id);
    refresh();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200">
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-900 to-red-950 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-base sm:text-lg truncate">THÔNG TIN & TÀI LIỆU NGHIÊN CỨU</h2>
              <p className="text-[11px] text-amber-200/90">Thông báo, hướng dẫn, văn bản và liên kết phục vụ cán bộ nghiên cứu</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(92vh-78px)]">
          <div className="flex flex-col lg:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm thông tin, tài liệu..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              />
            </div>
            <select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold"
            >
              <option value="">Tất cả nhiệm vụ</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.title}</option>
              ))}
            </select>
            {isAdmin && (
              <button
                type="button"
                onClick={() => { resetForm(); setIsFormOpen(true); }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Đăng thông tin / tài liệu
              </button>
            )}
          </div>

          {isFormOpen && isAdmin && (
            <form onSubmit={savePost} className="mb-5 p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900">{editing ? 'Sửa bài đăng' : 'Đăng thông tin / tài liệu mới'}</h3>
                <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
              </div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề, ví dụ: Hướng dẫn thực hiện nhiệm vụ..." className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold" required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white">
                  <option>Thông báo</option>
                  <option>Hướng dẫn</option>
                  <option>Văn bản</option>
                  <option>Tài liệu nghiên cứu</option>
                  <option>Khác</option>
                </select>
                <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white">
                  <option value="">Áp dụng chung cho cán bộ</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.title}</option>)}
                </select>
              </div>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="Nội dung thông tin / tóm tắt tài liệu..." className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white resize-y" />
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Liên kết tài liệu</label>
                <div className="flex gap-2">
                  <LinkIcon className="w-5 h-5 mt-2 text-slate-400 shrink-0" />
                  <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://drive.google.com/... hoặc liên kết website" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
                <Pin className="w-4 h-4 text-amber-500" /> Ghim lên đầu
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-bold">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-1.5"><Check className="w-4 h-4" /> Lưu bài</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2" />
                <p className="font-semibold">Chưa có thông tin hoặc tài liệu.</p>
              </div>
            ) : filtered.map((post) => (
              <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {post.isPinned && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center gap-1"><Pin className="w-3 h-3" /> GHIM</span>}
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{post.category}</span>
                      {post.taskType && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{categories.find((c) => c.id === post.taskType)?.shortTitle || post.taskType}</span>}
                    </div>
                    <h3 className="font-black text-slate-900">{post.title}</h3>
                    <div className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{post.content}</div>
                    <div className="mt-2 text-[10px] text-slate-400">{new Date(post.createdAt).toLocaleString('vi-VN')} {post.createdBy ? `• ${post.createdBy}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {post.link && (
                      <a href={post.link} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100" title="Mở tài liệu">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {isAdmin && (
                      <>
                        <button type="button" onClick={() => openEdit(post)} className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200" title="Sửa"><Edit2 className="w-4 h-4" /></button>
                        <button type="button" onClick={() => removePost(post)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
