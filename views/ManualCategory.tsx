
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { subscribeToManuals, ManualItem, subscribeToCategories, ManualCategory as IManualCategory } from '../services/manualService';

interface ManualCategoryProps {
  role?: UserRole;
}

const ManualCategory: React.FC<ManualCategoryProps> = ({ role }) => {
  const { catId } = useParams<{ catId: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<ManualItem[]>([]);
  const [categories, setCategories] = useState<IManualCategory[]>([]);
  const category = categories.find((c) => c.id === catId);

  useEffect(() => {
    let unsubDocs: (() => void) | undefined;
    let unsubCats: (() => void) | undefined;

    if (catId) {
      unsubDocs = subscribeToManuals(catId, setItems);
      unsubCats = subscribeToCategories(setCategories);
    }

    return () => {
      if (unsubDocs) unsubDocs();
      if (unsubCats) unsubCats();
    };
  }, [catId]);

  // 소분류별 그룹핑
  const groupedItems = items.reduce((acc, item) => {
    const key = item.subCategory || '기타';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ManualItem[]>);

  if (!category) return <div className="p-10 text-center font-bold">카테고리를 찾을 수 없습니다.</div>;

  return (
    <div className="pb-32 min-h-screen relative">
      <header className="sticky top-0 z-20 bg-white/55 dark:bg-background-dark/55 backdrop-blur-xl border-b border-white/40 px-4 pt-14 pb-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-primary p-2 active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{category.name}</h1>
        {role === 'admin' ? (
          <button
            onClick={() => navigate(`/manuals/${catId}/new`)}
            className="text-primary p-2 active:scale-95"
          >
            <span className="material-symbols-outlined">add_circle</span>
          </button>
        ) : (
          <div className="w-10"></div>
        )}
      </header>

      <main className="px-6 py-8 space-y-10 relative z-10">
        {Object.entries(groupedItems).length > 0 ? (
          Object.entries(groupedItems).map(([subCat, subItems]) => (
            <section key={subCat} className="animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                  {subCat}
                </span>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
              </div>
              <div className="space-y-3">
                {(subItems as ManualItem[]).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/manuals/${catId}/${item.id}`)}
                    className="flex items-center gap-4 bg-white/55 backdrop-blur-md dark:bg-slate-800/55 p-5 rounded-2xl shadow-sm border border-white/40 dark:border-slate-700 active:scale-95 cursor-pointer hover:border-primary/30 transition-all"
                  >
                    <div className="size-11 rounded-xl bg-white/70 dark:bg-slate-900 text-primary/80 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">{item.icon || 'description'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-white truncate">{item.title}</p>
                      <p className="text-xs text-slate-400 font-medium line-clamp-1 mt-0.5 opacity-80">
                        {item.description}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined text-slate-200 text-6xl mb-4">description</span>
            <p className="text-slate-400 text-sm font-black italic">
              {role === 'admin' ? '+ 버튼으로 첫 매뉴얼을 작성해보세요' : '작성된 매뉴얼이 없습니다'}
            </p>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-[2rem] border-2 border-primary/20 bg-white/55 backdrop-blur-md dark:bg-slate-800/55 p-5 active:scale-95 group transition-all hover:bg-primary/5"
        >
          <span className="material-symbols-outlined text-primary fill-1">chat</span>
          <span className="text-base font-black text-primary">도움이 더 필요한가요?</span>
        </button>
      </main>
    </div>
  );
};

export default ManualCategory;
