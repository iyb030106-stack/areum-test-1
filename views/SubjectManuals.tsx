
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MANUAL_CATEGORIES } from '../constants';
import { subscribeToAllManuals, ManualItem } from '../services/manualService';

const SubjectManuals: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [allManuals, setAllManuals] = useState<ManualItem[]>([]);

  const subjectCategories = MANUAL_CATEGORIES.filter(c => c.type === 'subject');

  useEffect(() => {
    const unsub = subscribeToAllManuals(setAllManuals);
    return unsub;
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allManuals.filter(item =>
      (item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)) &&
      MANUAL_CATEGORIES.find(c => c.id === item.categoryId)?.type === 'subject'
    );
  }, [searchQuery, allManuals]);


  return (
    <div className="pb-40 min-h-screen relative">
      <header className="px-6 pt-14 pb-10 relative z-10">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="size-2 bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-500/50"></span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Hub</p>
        </div>
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">수업 가이드</h1>
      </header>

      <main className="px-6 space-y-10 relative z-10">
        <div className="relative">
          <div className={`flex items-center bg-white/55 backdrop-blur-xl dark:bg-slate-900/55 rounded-[1.75rem] border transition-all duration-300 shadow-xl shadow-blue-200/10 ${searchQuery ? 'border-primary ring-4 ring-primary/5' : 'border-white/60 dark:border-slate-800'}`}>
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
            <div className="flex items-center gap-4 mb-8 px-1">
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">Subject Manuals</h2>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {subjectCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => navigate(`/manuals/${cat.id}`)}
                  className="bg-white/55 backdrop-blur-md dark:bg-slate-900/55 p-6 rounded-[2.5rem] border border-white/40 shadow-sm hover:shadow-xl transition-all cursor-pointer active:scale-95 flex flex-col items-center text-center gap-4"
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
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default SubjectManuals;
