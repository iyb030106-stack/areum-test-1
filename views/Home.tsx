
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MANUAL_CATEGORIES } from '../constants';
import { HaemaIcon } from '../components/Layout';
import { UserRole } from '../types';
import {
  subscribeToAllManuals,
  ManualItem,
  subscribeToCategories,
  ManualCategory,
  createManualCategory,
  updateManualCategory,
  deleteManualCategory
} from '../services/manualService';
import { subscribeToNotifications, Notification, formatNotificationTime } from '../services/notificationService';

interface HomeProps {
  role?: UserRole;
}

const CATEGORY_ICONS = [
  'folder', 'fact_check', 'print', 'settings_suggest', 'analytics', 'face',
  'Aa', 'auto_stories', 'menu_book', 'edit_note', 'spellcheck',
  'school', 'assignment', 'campaign', 'groups', 'payments', 'security',
  'construction', 'verified_user', 'monitoring', 'inventory'
];

const Home: React.FC<HomeProps> = ({ role }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [allManuals, setAllManuals] = useState<ManualItem[]>([]);
  const [categories, setCategories] = useState<ManualCategory[]>([]);

  // 관리자 카테고리 관리 상태
  const [isManaging, setIsManaging] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('folder');

  // 알림 드로어 상태
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastReadNoti, setLastReadNoti] = useState<number>(() => {
    const saved = localStorage.getItem('lastReadNotiTime');
    return saved ? parseInt(saved, 10) : 0;
  });

  const hasUnread = useMemo(() => {
    if (notifications.length === 0) return false;
    const latestNotiTime = notifications[0].createdAt?.toDate().getTime() || 0;
    return latestNotiTime > lastReadNoti;
  }, [notifications, lastReadNoti]);

  const handleOpenNoti = () => {
    setIsNotiOpen(true);
    const now = Date.now();
    setLastReadNoti(now);
    localStorage.setItem('lastReadNotiTime', now.toString());
  };

  useEffect(() => {
    const unsubDocs = subscribeToAllManuals(setAllManuals);
    const unsubCats = subscribeToCategories(setCategories);
    const unsubNotis = subscribeToNotifications(setNotifications);
    return () => {
      unsubDocs();
      unsubCats();
      unsubNotis();
    };
  }, []);

  const adminCategories = categories.filter(c => c.type === 'admin');


  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allManuals.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  }, [searchQuery, allManuals]);

  const handleAddCategory = async (type: 'admin' | 'subject' = 'admin') => {
    if (!newCatName.trim()) return;
    await createManualCategory({
      name: newCatName,
      icon: newCatIcon,
      type,
      order: type === 'admin' ? adminCategories.length : categories.filter(c => c.type === 'subject').length,
      colorClass: type === 'admin' ? 'text-slate-500/80' : 'text-emerald-500/80',
      bgClass: type === 'admin' ? 'bg-slate-50/50' : 'bg-emerald-50/50'
    });
    setNewCatName('');
    setIsManaging(false);
  };

  const handleUpdateCategory = async (id: string) => {
    if (!newCatName.trim()) return;
    await updateManualCategory(id, {
      name: newCatName,
      icon: newCatIcon
    });
    setEditingCatId(null);
    setNewCatName('');
  };

  const handleStartEdit = (cat: ManualCategory) => {
    setEditingCatId(cat.id);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon);
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('이 카테고리와 포함된 모든 매뉴얼이 삭제됩니다. 계속하시겠습니까?')) {
      await deleteManualCategory(id);
    }
  };


  return (
    <div className="pb-40 min-h-screen relative">

      <header className="px-6 pt-14 pb-2 flex items-center justify-between relative z-10">
        <div>
          <h1 className="text-primary dark:text-white text-2xl font-black tracking-tighter leading-none">HAEMA</h1>
          <p className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mt-1.5">운영 매뉴얼</p>
        </div>
        <button
          onClick={handleOpenNoti}
          className="size-10 rounded-full bg-white/45 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/40 hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all active:scale-90 relative"
        >
          <span className="material-symbols-outlined text-[20px] fill-1">notifications</span>
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 size-2 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-bounce" />
          )}
        </button>
      </header>

      <main className="px-6 pt-8 space-y-10 relative z-10">
        {/* 검색창 */}
        <div className="relative">
          <div className={`flex items-center bg-white/55 backdrop-blur-xl dark:bg-slate-900/55 rounded-[1.75rem] border transition-all duration-300 shadow-xl shadow-slate-200/5 ${searchQuery ? 'border-primary ring-4 ring-primary/5' : 'border-white/60 dark:border-slate-800'}`}>
            <span className="material-symbols-outlined pl-5 text-slate-300">search</span>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4.5 px-3 font-bold dark:text-white"
              placeholder="필요한 정보를 검색하세요"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {searchQuery ? (
          <div className="bg-white/70 backdrop-blur-xl dark:bg-slate-900/70 rounded-[2.5rem] p-7 shadow-2xl border border-white/40 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">검색 결과 ({filteredItems.length})</span>
              <button onClick={() => setSearchQuery('')} className="text-xs font-bold text-primary">닫기</button>
            </div>
            <div className="space-y-4">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <div key={item.id} onClick={() => navigate(`/manuals/${item.categoryId}/${item.id}`)} className="flex items-center gap-4 p-4 rounded-2xl bg-white/55 dark:bg-slate-800/55 hover:bg-white/70 hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-white/60">
                    <div className="size-11 rounded-xl bg-white/70 dark:bg-slate-700 shadow-sm flex items-center justify-center text-primary/80 shrink-0">
                      <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-black text-slate-800 dark:text-white">{item.title}</p>
                        {item.hasRecentUpdate && (
                          <span className="px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600/80 text-[9px] font-black uppercase tracking-tighter animate-pulse">UPDATED</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold truncate mt-0.5 opacity-80">{item.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-10 text-slate-400 text-xs font-bold">일치하는 정보가 없습니다</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in">
            {/* 운영 매뉴얼 섹션 */}
            <section>
              <div className="flex items-center justify-between mb-8 px-1">
                <div className="flex items-center gap-4 flex-1">
                  <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">현장 운영 매뉴얼</h2>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 opacity-50"></div>
                </div>
                {role === 'admin' && (
                  <button
                    onClick={() => {
                      setIsManaging(!isManaging);
                      setEditingCatId(null);
                      setNewCatName('');
                      setNewCatIcon('folder');
                    }}
                    className={`ml-4 size-9 rounded-full flex items-center justify-center transition-all ${isManaging ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-400 hover:text-primary'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{isManaging ? 'check' : 'settings'}</span>
                  </button>
                )}
              </div>

              {isManaging && role === 'admin' && (
                <div className="mb-8 p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-xl shadow-slate-100 border border-slate-100 dark:border-slate-800 animate-slide-up space-y-6">
                  <div className="flex items-center gap-3 px-1">
                    <span className="size-2 bg-primary rounded-full"></span>
                    <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                      {editingCatId ? '카테고리 수정' : '새 운영 카테고리 추가'}
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shrink-0">
                        <span className="material-symbols-outlined text-2xl">{newCatIcon}</span>
                      </div>
                      <input
                        className="flex-1 rounded-2xl border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold px-5 py-3 focus:ring-4 focus:ring-primary/5 transition-all text-slate-900 dark:text-white"
                        placeholder="카테고리명 (예: 소모품 관리)"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase tracking-tighter">아이콘 선택</label>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                        {CATEGORY_ICONS.map(iconName => (
                          <button
                            key={iconName}
                            onClick={() => setNewCatIcon(iconName)}
                            className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${newCatIcon === iconName ? 'bg-primary text-white scale-110 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                          >
                            <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={editingCatId ? () => handleUpdateCategory(editingCatId) : () => handleAddCategory('admin')}
                        className="flex-1 bg-primary text-white py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
                      >
                        {editingCatId ? '변경사항 저장' : '카테고리 추가'}
                      </button>
                      {editingCatId && (
                        <button
                          onClick={() => {
                            setEditingCatId(null);
                            setNewCatName('');
                            setNewCatIcon('folder');
                          }}
                          className="px-6 bg-slate-100 dark:bg-slate-800 text-slate-400 py-3.5 rounded-2xl text-xs font-black active:scale-95 transition-all"
                        >
                          취소
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5 pb-10">
                {adminCategories.map((cat) => (
                  <div key={cat.id} className="relative group">
                    <div
                      onClick={() => !isManaging && navigate(`/manuals/${cat.id}`)}
                      className={`h-full bg-white/55 backdrop-blur-md dark:bg-slate-900/55 p-6 rounded-[2.5rem] border border-white/40 dark:border-slate-800 shadow-sm transition-all flex flex-col items-center text-center gap-4 ${isManaging ? 'opacity-50 grayscale' : 'hover:shadow-xl cursor-pointer active:scale-95'}`}
                    >
                      <div className={`size-14 rounded-3xl ${cat.bgClass} flex items-center justify-center shadow-inner`}>
                        {cat.icon === 'Aa' ? (
                          <span className={`${cat.colorClass} text-xl font-black`}>Aa</span>
                        ) : (
                          <span className={`material-symbols-outlined ${cat.colorClass} text-3xl`}>{cat.icon}</span>
                        )}
                      </div>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{cat.name}</span>
                    </div>

                    {isManaging && role === 'admin' && (
                      <div className="absolute -top-2 -right-2 flex gap-1 z-20">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="size-8 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-lg active:scale-90"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="size-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* 알림 모달 */}
      <div className={`fixed inset-0 z-[200] transition-all duration-300 ${isNotiOpen ? 'visible' : 'invisible'}`}>
        <div
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isNotiOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsNotiOpen(false)}
        />
        <div className={`absolute bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-slate-900 rounded-t-[3rem] shadow-2xl transition-transform duration-500 ease-out transform ${isNotiOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="h-full flex flex-col">
            <div className="flex justify-center py-4">
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            </div>
            <header className="px-8 pb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">최근 업데이트</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">새로운 소식을 확인하세요</p>
              </div>
              <button onClick={() => setIsNotiOpen(false)} className="size-11 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-20 space-y-4">
              {notifications.length > 0 ? (
                notifications.map((noti) => (
                  <div key={noti.id} onClick={() => {
                    setIsNotiOpen(false);
                    if (noti.type === 'announcement') navigate(`/announcements/${noti.targetId}`);
                    else if (noti.type === 'manual') navigate(`/manuals/${noti.categoryId}/${noti.targetId}`);
                  }} className="p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-transparent active:bg-primary/5 active:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg leading-none ${noti.type === 'announcement' ? 'bg-violet-100 text-violet-600' : 'bg-teal-100 text-teal-600'}`}>
                        {noti.type === 'announcement' ? '공지' : '매뉴얼'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formatNotificationTime(noti.createdAt)}</span>
                    </div>
                    <h4 className="text-[15px] font-black text-slate-800 dark:text-white group-active:text-primary transition-colors leading-tight">{noti.title}</h4>
                    <p className="text-[11px] text-slate-400 font-bold mt-2 flex items-center gap-1.5">
                      <span className="size-1 bg-slate-300 rounded-full"></span>
                      {noti.authorName}님이 {noti.action === 'created' ? '게시함' : '수정함'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
                  <span className="material-symbols-outlined text-4xl mb-4">notifications_off</span>
                  <p className="text-sm font-black text-slate-900 dark:text-white">새로운 알림이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
