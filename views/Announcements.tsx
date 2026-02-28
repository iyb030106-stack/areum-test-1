
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { subscribeToAnnouncements, deleteAnnouncement, formatTimeAgo, Announcement } from '../services/announcementService';

interface AnnouncementsProps {
  role?: UserRole;
}

const Announcements: React.FC<AnnouncementsProps> = ({ role }) => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeFilter, setActiveFilter] = useState<'전체' | '필독' | '일반'>('전체');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements(setAnnouncements);
    return unsubscribe;
  }, []);

  const filteredUpdates = useMemo(() => {
    let list = announcements;
    if (activeFilter !== '전체') {
      list = list.filter((u) => u.category === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.title.toLowerCase().includes(q) ||
          u.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [announcements, activeFilter, searchQuery]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 공지사항을 삭제할까요?')) {
      await deleteAnnouncement(id);
    }
  };

  const categories = ['전체', '필독'];

  return (
    <div className="pb-32 min-h-screen relative">
      <header className="sticky top-0 z-20 bg-white/55 dark:bg-slate-900/55 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <div className="px-6 pt-14 pb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="size-2 bg-primary rounded-full animate-pulse shadow-sm shadow-primary/50"></span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academy Bulletin</p>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">공지사항</h1>
            {role === 'admin' && (
              <button
                onClick={() => navigate('/announcements/new')}
                className="size-5 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/10 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[12px]">add</span>
              </button>
            )}
          </div>
        </div>

        <div className="px-6 mb-4">
          <div className="relative flex items-center bg-white/55 dark:bg-slate-800/55 rounded-2xl border border-white/40 dark:border-slate-700 px-4 py-3">
            <span className="material-symbols-outlined text-slate-300 text-xl mr-2">search</span>
            <input
              type="text"
              className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full dark:text-white p-0"
              placeholder="공지 내용을 검색하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 pb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat as any)}
              className={`px-5 py-2.5 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all border ${activeFilter === cat
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                : 'bg-white/55 dark:bg-slate-800/55 text-slate-400 border-white/40 dark:border-slate-700'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 pt-8 space-y-6 relative z-10">
        {/* Q&A 배너 */}
        <div
          onClick={() => navigate('/faq')}
          className="group relative overflow-hidden px-5 py-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl shadow-lg shadow-indigo-200/20 cursor-pointer active:scale-[0.98] transition-all"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[60px] text-white">quiz</span>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h4 className="text-white font-black text-[15px] mb-0.5 flex items-center gap-2">
                업무가 궁금하신가요?
              </h4>
              <p className="text-white/80 text-[10px] font-bold">신입/기존 보직자용 자주 묻는 질문(Q&A)</p>
            </div>
            <span className="material-symbols-outlined text-white/50 group-hover:text-white transition-colors">arrow_forward</span>
          </div>
        </div>

        {filteredUpdates.length > 0 ? (
          filteredUpdates.map((update) => (
            <div
              key={update.id}
              onClick={() => navigate(`/announcements/${update.id}`)}
              className={`group relative overflow-hidden p-3.5 bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-2xl border transition-all shadow-sm active:scale-[0.98] cursor-pointer hover:border-primary/20 ${update.isImportant
                ? 'border-l-4 border-l-primary/30 border-white/40 dark:border-slate-700'
                : 'border-white/40 dark:border-slate-700'
                }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className={`text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${update.category === '필독'
                    ? 'bg-red-100/50 text-red-600'
                    : 'bg-slate-100/50 text-slate-600'
                    }`}
                >
                  {update.category}
                </span>
                <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">
                  {formatTimeAgo(update.createdAt)}
                </span>

                {role === 'admin' && (
                  <button
                    onClick={(e) => handleDelete(update.id, e)}
                    className="ml-auto text-slate-300 hover:text-red-400 transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">delete_outline</span>
                  </button>
                )}
              </div>

              <h3 className="text-[13px] font-black mb-0 text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                {update.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-tight line-clamp-1 opacity-80">
                {update.description}
              </p>

              <div className="mt-2.5 pt-2.5 border-t border-white/20 dark:border-slate-700/50 flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400">{update.authorPosition || '관리자'}</span>
                <span className="material-symbols-outlined text-slate-300 text-[14px] group-hover:text-primary group-hover:translate-x-1 transition-all">
                  arrow_forward
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined text-slate-200 text-6xl mb-4">search_off</span>
            <p className="text-slate-400 text-sm font-black italic">
              {announcements.length === 0 ? '아직 작성된 공지가 없습니다' : '검색 결과가 없습니다'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Announcements;
