
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  subscribeToAllManuals,
  ManualItem,
  subscribeToCategories,
  ManualCategory,
  createManualCategory,
  updateManualCategory,
  deleteManualCategory
} from '../services/manualService';
import { UserRole } from '../types';
import { useAcademy } from '../contexts/AcademyContext';

interface SubjectManualsProps {
  role?: UserRole;
}

const CATEGORY_ICONS = [
  'folder', 'fact_check', 'print', 'settings_suggest', 'analytics', 'face',
  'Aa', 'auto_stories', 'menu_book', 'edit_note', 'spellcheck',
  'school', 'assignment', 'campaign', 'groups', 'payments', 'security',
  'language', 'translate', 'draw', 'biotech'
];

const SubjectManuals: React.FC<SubjectManualsProps> = ({ role }) => {
  const navigate = useNavigate();
  const { academyId, academyName } = useAcademy();
  const [searchQuery, setSearchQuery] = useState('');
  const [allManuals, setAllManuals] = useState<ManualItem[]>([]);
  const [categories, setCategories] = useState<ManualCategory[]>([]);

  // 관리자 카테고리 관리 상태
  const [isManaging, setIsManaging] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('folder');

  useEffect(() => {
    if (!academyId) return;
    const unsubDocs = subscribeToAllManuals(academyId, setAllManuals);
    const unsubCats = subscribeToCategories(academyId, setCategories);
    return () => {
      unsubDocs();
      unsubCats();
    };
  }, [academyId]);

  const subjectCategories = categories.filter(c => c.type === 'subject');
  const MANUAL_CATEGORIES_FOR_FILTER = categories; // 검색 필터용

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allManuals.filter(item =>
      (item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)) &&
      MANUAL_CATEGORIES_FOR_FILTER.find(c => c.id === item.categoryId)?.type === 'subject'
    );
  }, [searchQuery, allManuals, MANUAL_CATEGORIES_FOR_FILTER]);

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !academyId) return;
    await createManualCategory({
      name: newCatName,
      icon: newCatIcon,
      type: 'subject',
      academyId,
      order: subjectCategories.length,
      colorClass: 'text-emerald-500/80',
      bgClass: 'bg-emerald-50/50'
    });
    setNewCatName('');
    setNewCatIcon('folder');
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
    setNewCatIcon('folder');
  };

  const handleStartEdit = (cat: ManualCategory) => {
    setEditingCatId(cat.id);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon);
    // 스크롤 이동이 필요할 수 있으나 생략
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
          <div className="flex items-baseline gap-2">
            <h1 className="text-primary dark:text-white text-2xl font-black tracking-tighter leading-none">HAEMA</h1>
            {academyName && academyName !== 'HAEMA' && (
              <span className="text-[10px] font-black text-slate-400 tracking-wider">{academyName}</span>
            )}
          </div>
          <p className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mt-1.5">운영 노하우</p>
        </div>
      </header>

      <main className="px-6 space-y-10 relative z-10">
        <div className="relative">
          <div className={`flex items-center bg-white/55 backdrop-blur-xl dark:bg-slate-900/55 rounded-[1.75rem] border transition-all duration-300 shadow-xl shadow-slate-100/5 ${searchQuery ? 'border-primary ring-4 ring-primary/5' : 'border-white/60 dark:border-slate-800'}`}>
            <span className="material-symbols-outlined pl-5 text-slate-300">search</span>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4.5 px-3 font-bold dark:text-white"
              placeholder="과목 가이드를 검색하세요"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {searchQuery ? (
          <div className="bg-white/70 backdrop-blur-xl dark:bg-slate-900/70 rounded-[2.5rem] p-7 shadow-2xl border border-white/40 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">수업 검색 결과 ({filteredItems.length})</span>
              <button onClick={() => setSearchQuery('')} className="text-xs font-bold text-primary">닫기</button>
            </div>
            <div className="space-y-4">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <div key={item.id} onClick={() => navigate(`/manuals/${item.categoryId}/${item.id}`)} className="flex items-center gap-4 p-4 rounded-2xl bg-white/55 dark:bg-slate-800/55 hover:bg-white/70 hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-white/60">
                    <div className="size-11 rounded-xl bg-white/70 dark:bg-slate-700 shadow-sm flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-black text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-500 font-bold truncate mt-0.5 opacity-70">{item.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-10 text-slate-400 text-xs font-bold">일치하는 정보가 없습니다</p>
              )}
            </div>
          </div>
        ) : (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-8 px-1">
              <div className="flex items-center gap-4 flex-1">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">과목별 매뉴얼</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
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
              <div className="mb-8 p-6 rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50 border border-slate-100 animate-slide-up space-y-6">
                <div className="flex items-center gap-3 px-1">
                  <span className="size-2 bg-emerald-500 rounded-full"></span>
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                    {editingCatId ? '과목 카테고리 수정' : '새 과목 카테고리 추가'}
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary border border-slate-100 shrink-0">
                      {newCatIcon === 'Aa' ? (
                        <span className="text-lg font-black">{newCatIcon}</span>
                      ) : (
                        <span className="material-symbols-outlined text-2xl">{newCatIcon}</span>
                      )}
                    </div>
                    <input
                      className="flex-1 rounded-2xl border-slate-100 bg-slate-50 text-sm font-bold px-5 py-3 focus:ring-4 focus:ring-primary/5 transition-all"
                      placeholder="과목명 (예: Speaking)"
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
                          className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${newCatIcon === iconName ? 'bg-primary text-white scale-110 shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                          {iconName === 'Aa' ? (
                            <span className="text-sm font-black">{iconName}</span>
                          ) : (
                            <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={editingCatId ? () => handleUpdateCategory(editingCatId) : handleAddCategory}
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
                        className="px-6 bg-slate-100 text-slate-400 py-3.5 rounded-2xl text-xs font-black active:scale-95 transition-all"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              {subjectCategories.map((cat) => (
                <div key={cat.id} className="relative group">
                  <div
                    onClick={() => !isManaging && navigate(`/manuals/${cat.id}`)}
                    className={`h-full bg-white/55 backdrop-blur-md dark:bg-slate-900/55 p-6 rounded-[2.5rem] border border-white/40 shadow-sm transition-all flex flex-col items-center text-center gap-4 ${isManaging ? 'opacity-50 grayscale' : 'hover:shadow-xl cursor-pointer active:scale-95'}`}
                  >
                    <div className={`size-14 rounded-full bg-primary/5 dark:bg-primary/20 flex flex-col items-center justify-center shadow-inner`}>
                      {cat.icon === 'Aa' ? (
                        <span className={`text-primary/80 dark:text-primary-light text-xl font-black`}>Aa</span>
                      ) : (
                        <span className={`material-symbols-outlined text-primary/80 dark:text-primary-light text-3xl`}>{cat.icon}</span>
                      )}
                    </div>
                    {editingCatId === cat.id ? (
                      <span className="text-[10px] font-black text-primary animate-pulse">편집 중...</span>
                    ) : (
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{cat.name}</span>
                    )}
                  </div>

                  {isManaging && role === 'admin' && (
                    <div className="absolute -top-2 -right-2 flex gap-1 z-20">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="size-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg active:scale-90"
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
        )}
      </main>
    </div >
  );
};

export default SubjectManuals;
