
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlowyIcon } from '../components/Layout';
import { subscribeToAllManuals, ManualItem } from '../services/manualService';

const QuickHelp: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [allManuals, setAllManuals] = useState<ManualItem[]>([]);

  useEffect(() => {
    const unsub = subscribeToAllManuals(setAllManuals);
    return unsub;
  }, []);

  const categories = [
    { id: 'equipment', name: '멀티미디어 장애', icon: 'settings_alert', color: 'bg-primary/10 text-primary' },
    { id: 'facility', name: '학생 안전/부상', icon: 'medical_services', color: 'bg-red-100 text-red-600' },
    { id: 'billing', name: '수강료 결제 오류', icon: 'payments', color: 'bg-amber-100 text-amber-600' },
    { id: 'service', name: '학부모 불만 대응', icon: 'forum', color: 'bg-purple-100 text-purple-600' }
  ];

  const filteredItems = selectedCatId
    ? allManuals.filter(item => item.categoryId === selectedCatId)
    : [];


  const activeCategoryName = categories.find(c => c.id === selectedCatId)?.name;

  return (
    <div className="pb-40 bg-background-light dark:bg-background-dark min-h-screen">
      <header className="sticky top-0 z-10 flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-4 border-b border-primary/10 transition-all">
        {selectedCatId && (
          <button
            onClick={() => setSelectedCatId(null)}
            className="absolute left-4 text-primary p-1 active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
        <h1 className="w-full text-slate-900 dark:text-white text-lg font-bold flex items-center justify-center gap-2">
          {!selectedCatId && <span className="material-symbols-outlined text-primary fill-1">bolt</span>}
          {selectedCatId ? activeCategoryName : '빠른 도움'}
        </h1>
      </header>

      <main className="px-6 mt-8 space-y-10">
        {!selectedCatId ? (
          <div className="animate-fade-in space-y-12">
            <section>
              <div className="flex items-center gap-4 mb-8 px-1">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">Instant Support</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCatId(cat.id)}
                    className="flex flex-col items-start gap-5 p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] active:scale-95 transition-all shadow-sm hover:shadow-xl hover:border-primary/10 group"
                  >
                    <div className={`p-4 rounded-2xl ${cat.color} shadow-inner group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight text-left">{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <button
                onClick={() => navigate('/ai')}
                className="w-full flex items-center gap-6 p-7 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[3rem] active:scale-[0.98] transition-all shadow-xl shadow-primary/5"
              >
                <div className="p-4 bg-primary rounded-full text-white shadow-lg shadow-primary/20 shrink-0">
                  <FlowyIcon className="size-8" />
                </div>
                <div className="flex flex-col items-start text-left flex-1">
                  <span className="text-base font-black text-slate-900 dark:text-white leading-tight">해결 방법이 복잡한가요?</span>
                  <span className="text-[11px] text-primary font-bold mt-1.5 opacity-80 uppercase tracking-widest">AI 에듀 파트너 문의</span>
                </div>
                <span className="material-symbols-outlined text-primary/30">chevron_right</span>
              </button>
            </section>
          </div>
        ) : (
          <div className="animate-slide-up space-y-4">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">긴급 조치 매뉴얼 {filteredItems.length}개</span>
            </div>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/manuals/${item.categoryId}/${item.id}`)}
                className="flex items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-98 cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">schedule</span> {item.timeEstimate}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">assignment</span> {item.level}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default QuickHelp;
