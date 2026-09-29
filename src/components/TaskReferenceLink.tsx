import React from 'react';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';

interface TaskReferenceLinkProps {
  title?: string;
  url?: string;
}

export const TaskReferenceLink: React.FC<TaskReferenceLinkProps> = ({ title, url }) => {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex max-w-full items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition text-[11px] font-bold"
      title={title || 'Mở tài liệu hướng dẫn'}
    >
      <LinkIcon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{title || 'Tài liệu / Link hướng dẫn'}</span>
      <ExternalLink className="w-3 h-3 shrink-0" />
    </a>
  );
};
