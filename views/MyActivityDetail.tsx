
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { STORE_UPDATES, MANUAL_ITEMS } from '../constants';

const MyActivityDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'notices';
  
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const myNotices = STORE_UPDATES.filter(u => u.author === '관리자' || u.author === '나');
  const recentlyEditedManuals = MANUAL_ITEMS.filter(i => i.hasRecentUpdate);

  return (
    <div className="pb-32 min-h-screen relative">
      <header className="sticky top-0 z-20 bg-white/55 backdrop-blur-xl border-b border-white/40 px-4 pt-14 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-primary p-2 active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-black tracking-tight text-slate-900">활동 내역 상세</h1>
      </header>

      <div className="px-6 pt-6">
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
          <button 
            onClick={() => setActiveTab('notices')}
            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'notices' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
          >
            내가 쓴 공지 ({myNotices.length})
          </button>
          <button 
            onClick={() => setActiveTab('manuals')}
            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'manuals' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
          >
            편집한 매뉴얼 ({recentlyEditedManuals.length})
          </button>
        </div>

        <main className="space-y-4 animate-fade-in">
          {activeTab === 'notices' ? (
            myNotices.length > 0 ? (
              myNotices.map(notice => (
                <div 
                  key={notice.id} 
                  onClick={() => navigate(`/announcements/${notice.id}`)}
                  className="p-6 bg-white/55 backdrop-blur-md rounded-[2rem] border border-white/40 shadow-sm active:scale-[0.98] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${
                      notice.category === '필독' ? 'bg-red-100/50 text-red-600' : 'bg-slate-100/50 text-slate-600'
                    }`}>
                      {notice.category}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{notice.timeAgo}</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mb-2 group-hover:text-primary transition-colors">{notice.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 font-medium">{notice.description}</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">arrow_forward</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center">
                <span className="material-symbols-outlined text-slate-200 text-6xl mb-4">campaign</span>
                <p className="text-slate-400 text-sm font-black italic">작성한 공지사항이 없습니다</p>
              </div>
            )
          ) : (
            recentlyEditedManuals.length > 0 ? (
              recentlyEditedManuals.map(manual => (
                <div 
                  key={manual.id} 
                  onClick={() => navigate(`/manuals/${manual.categoryId}/${manual.id}`)}
                  className="flex items-center gap-4 bg-white/55 backdrop-blur-md p-5 rounded-[2rem] shadow-sm border border-white/40 active:scale-[0.98] cursor-pointer group transition-all"
                >
                  <div className="size-14 rounded-2xl bg-white/70 shadow-sm flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-3xl">{manual.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-black text-slate-900 truncate group-hover:text-primary transition-colors">{manual.title}</p>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mt-1">{manual.subCategory}</p>
                    <p className="text-[11px] text-slate-400 font-medium line-clamp-1 mt-1 opacity-80">{manual.description}</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                </div>
              ))
            ) : (
              <div className="py-20 text-center">
                <span className="material-symbols-outlined text-slate-200 text-6xl mb-4">edit_document</span>
                <p className="text-slate-400 text-sm font-black italic">최근 편집한 매뉴얼이 없습니다</p>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
};

export default MyActivityDetail;
