
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import {
  subscribeToAnnouncements,
  deleteAnnouncement,
  formatTimeAgo,
  Announcement,
  subscribeToNoticeCategories,
  NoticeCategory,
  initializeNoticeCategoriesIfNeeded,
  createNoticeCategory,
  updateNoticeCategory,
  deleteNoticeCategory
} from '../services/announcementService';
import { useAcademy } from '../contexts/AcademyContext';

interface AnnouncementsProps {
  role?: UserRole;
}

const INITIAL_NOTICE_CATEGORIES = [
  '수업 운영',
  '일정 · 행사',
  '평가 · 테스트',
  '학생 관리',
  '행정 · 운영',
  '시설 · 시스템',
  '기타'
];

const Announcements: React.FC<AnnouncementsProps> = ({ role }) => {
  const navigate = useNavigate();
  const { academyId, academyName } = useAcademy();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<NoticeCategory[]>([]);
  const [activeFilter, setActiveFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // 카테고리 관리 상태
  const [isManaging, setIsManaging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (!academyId) return;
    const unsubAnn = subscribeToAnnouncements(academyId, setAnnouncements);
    const unsubCat = subscribeToNoticeCategories(academyId, setCategories);

    if (role === 'admin') {
      initializeNoticeCategoriesIfNeeded(academyId, INITIAL_NOTICE_CATEGORIES);
    }

    return () => {
      unsubAnn();
      unsubCat();
    };
  }, [role, academyId]);

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

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !academyId) return;
    await createNoticeCategory(academyId, newCatName.trim(), categories.length);
    setNewCatName('');
  };

  const handleUpdateCategory = async (id: string) => {
    if (!newCatName.trim()) return;
    await updateNoticeCategory(id, newCatName.trim());
    setEditingId(null);
    setNewCatName('');
  };

  const handleStartEdit = (cat: NoticeCategory) => {
    setEditingId(cat.id);
    setNewCatName(cat.name);
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('이 카테고리를 삭제할까요?\n관련 공지사항의 필터링이 불가능해질 수 있습니다.')) {
      await deleteNoticeCategory(id);
    }
  };

  return (
    <div className="pb-32 min-h-screen relative">
      <header className="sticky top-0 z-20 bg-white/55 dark:bg-slate-900/55 backdrop-blur-xl border-b border-white/40 dark:border-slate-800 shadow-sm">
        <div className="px-6 pt-14 pb-2 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-primary dark:text-white text-2xl font-black tracking-tighter leading-none">HAEMA</h1>
              {academyName && academyName !== 'HAEMA' && (
                <span className="text-[10px] font-black text-slate-400 tracking-wider">{academyName}</span>
              )}
            </div>
            <p className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mt-1.5">공지 사항</p>
          </div>
          <div className="flex gap-2">
            {role === 'admin' && (
              <>
                <button
                  onClick={() => setIsManaging(!isManaging)}
                  className={`size-10 rounded-full flex items-center justify-center border transition-all active:scale-90 ${isManaging ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white/45 backdrop-blur-md border-white/40 text-slate-400'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">{isManaging ? 'check' : 'settings'}</span>
                </button>
                <button
                  onClick={() => navigate('/announcements/new')}
                  className="size-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[24px]">add</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-6 mb-4">
          <div className="relative flex items-center bg-white/55 dark:bg-slate-800/55 rounded-2xl border border-white/40 dark:border-slate-700 px-4 py-3 shadow-sm transition-all focus-within:ring-4 focus-within:ring-primary/5">
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

        <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 pb-4 items-center">
          <button
            onClick={() => { setActiveFilter('전체'); setIsManaging(false); }}
            className={`px-5 py-2.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border shrink-0 ${activeFilter === '전체' && !isManaging
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
              : 'bg-white/55 dark:bg-slate-800/55 text-slate-400 border-white/40 dark:border-slate-700'
              }`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <div key={cat.id} className="shrink-0">
              {isManaging ? (
                /* 관리 모드: 인라인 수정·삭제 버튼 */
                <div className="flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap bg-white/55 dark:bg-slate-800/55 text-slate-500 border border-white/40 dark:border-slate-700">
                  <span>{cat.name}</span>
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="ml-1 size-5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center active:scale-90 transition-all hover:bg-slate-300"
                  >
                    <span className="material-symbols-outlined text-[12px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="size-5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center active:scale-90 transition-all hover:bg-red-100 hover:text-red-500"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </div>
              ) : (
                /* 일반 모드: 필터 버튼 */
                <button
                  onClick={() => { setActiveFilter(cat.name); setIsManaging(false); }}
                  className={`px-5 py-2.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border ${activeFilter === cat.name && !isManaging
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-white/55 dark:bg-slate-800/55 text-slate-400 border-white/40 dark:border-slate-700'
                    }`}
                >
                  {cat.name}
                </button>
              )}
            </div>
          ))}
          {isManaging && (
            <div className="flex gap-2 items-center pl-2 shrink-0">
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
              <div className="flex bg-white/45 backdrop-blur-md border border-white/40 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/10">
                <input
                  type="text"
                  placeholder="새 탭 이름"
                  className="w-24 bg-transparent border-none text-[10px] font-bold px-3 py-1.5 focus:ring-0"
                  value={editingId ? '' : newCatName}
                  onChange={(e) => !editingId && setNewCatName(e.target.value)}
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-primary text-white px-3 text-[10px] font-black active:opacity-80"
                >
                  추가
                </button>
              </div>
            </div>
          )}
        </div>

      </header>

      <main className="px-6 pt-8 space-y-6 relative z-10">
        {isManaging && editingId && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl space-y-3 animate-slide-up">
            <h4 className="text-[10px] font-black uppercase text-slate-400">카테고리 수정</h4>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-bold px-4 py-2"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <button
                onClick={() => handleUpdateCategory(editingId)}
                className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-primary/20"
              >
                변경
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="bg-slate-100 dark:bg-slate-700 text-slate-400 px-4 py-2 rounded-xl text-xs font-black"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {filteredUpdates.length > 0 ? (
          filteredUpdates.map((update) => (
            <div
              key={update.id}
              onClick={() => navigate(`/announcements/${update.id}`)}
              className={`group relative overflow-hidden p-4 bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[1.75rem] border transition-all shadow-sm active:scale-[0.98] cursor-pointer hover:border-primary/20 ${update.isImportant
                ? 'border-l-4 border-l-primary/30 border-white/40 dark:border-slate-700'
                : 'border-white/40 dark:border-slate-700'
                }`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-lg leading-none ${update.isImportant ? 'bg-red-50 text-red-600' : 'bg-slate-100/70 text-slate-500'
                    }`}
                >
                  {update.isImportant ? '중요' : update.category}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  {formatTimeAgo(update.createdAt)}
                </span>

                {role === 'admin' && (
                  <button
                    onClick={(e) => handleDelete(update.id, e)}
                    className="ml-auto text-slate-300 hover:text-red-400 transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete_outline</span>
                  </button>
                )}
              </div>

              <h3 className="text-sm font-black mb-1 text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                {update.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-tight line-clamp-1 opacity-70">
                {update.description}
              </p>

              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-slate-400">
                <span className="text-[9px] font-black">{update.authorPosition || '관리자'} · {update.authorName}</span>
                <span className="material-symbols-outlined text-[16px] group-hover:text-primary group-hover:translate-x-1 transition-all">
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
