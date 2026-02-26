
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { STORE_UPDATES, MANUAL_ITEMS } from '../constants';
import { UserRole } from '../types';

interface StoreInfoProps {
  role?: UserRole;
  onLogout?: () => void;
}

const StoreInfo: React.FC<StoreInfoProps> = ({ role, onLogout }) => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  // Mock data for "My" content
  const myNotices = STORE_UPDATES.filter(u => u.author === '관리자' || u.author === '나').slice(0, 2);
  const recentlyEditedManuals = MANUAL_ITEMS.filter(i => i.hasRecentUpdate).slice(0, 2);
  
  // Scrapped manuals for staff (mocking with some items)
  const scrappedManuals = role === 'staff' ? MANUAL_ITEMS.slice(0, 3) : [];

  return (
    <div className="pb-32 min-h-screen relative">
      <header className="sticky top-0 z-20 flex items-center bg-white/55 dark:bg-background-dark/55 backdrop-blur-xl px-4 pt-14 pb-4 border-b border-white/40 justify-center">
        <h2 className="text-slate-900 dark:text-white text-lg font-bold">마이페이지</h2>
      </header>

      <main className="px-5 pt-8 space-y-10 relative z-10">
        {/* My Activity Section (Admin Only) */}
        {role === 'admin' && (
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-1">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">My Activity</h3>
               <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] p-6 border border-white/40 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">campaign</span>
                    내가 쓴 공지사항
                  </h4>
                  <button 
                    onClick={() => navigate('/mypage/activity?tab=notices')}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    전체보기
                  </button>
                </div>
                <div className="space-y-3">
                  {myNotices.map(notice => (
                    <div 
                      key={notice.id} 
                      onClick={() => navigate(`/announcements/${notice.id}`)}
                      className="p-3 bg-white/55 dark:bg-slate-900/55 rounded-xl border border-white/20 flex items-center justify-between active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate flex-1 mr-2">{notice.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{notice.timeAgo}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] p-6 border border-white/40 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-emerald-500">edit_document</span>
                    최근 편집한 매뉴얼
                  </h4>
                  <button 
                    onClick={() => navigate('/mypage/activity?tab=manuals')}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    전체보기
                  </button>
                </div>
                <div className="space-y-3">
                  {recentlyEditedManuals.map(manual => (
                    <div 
                      key={manual.id} 
                      onClick={() => navigate(`/manuals/${manual.categoryId}/${manual.id}`)}
                      className="p-3 bg-white/55 dark:bg-slate-900/55 rounded-xl border border-white/20 flex items-center justify-between active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate flex-1 mr-2">{manual.title}</span>
                      <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Scrapped Manuals (Staff Only) */}
        {role === 'staff' && (
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-1">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">My Scraps</h3>
               <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            </div>
            
            <div className="bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] p-6 border border-white/40 dark:border-slate-700 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-amber-500 fill-1">bookmark</span>
                저장한 매뉴얼
              </h4>
              <div className="space-y-3">
                {scrappedManuals.length > 0 ? (
                  scrappedManuals.map(manual => (
                    <div 
                      key={manual.id} 
                      onClick={() => navigate(`/manuals/${manual.categoryId}/${manual.id}`)}
                      className="p-3 bg-white/55 dark:bg-slate-900/55 rounded-xl border border-white/20 flex items-center justify-between active:scale-95 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="material-symbols-outlined text-slate-400 text-sm">{manual.icon}</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{manual.title}</span>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-[11px] text-slate-400 font-bold">저장된 매뉴얼이 없습니다.</p>
                )}
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-4 mb-6 px-1">
             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">Academy Info</h3>
             <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
          </div>
          <div className="space-y-4">
            {/* 학원 기본 정보 */}
            <div className="p-6 bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] border border-white/40 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-4 mb-5">
                <div className="bg-white shadow-inner size-14 rounded-3xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-slate-600">school</span>
                </div>
                <div>
                   <p className="font-black text-sm text-slate-900 dark:text-white leading-tight">학원 식별 정보</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Academy Identification</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/55 dark:bg-slate-900/55 p-3 rounded-xl border border-white/20">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">ACA 학원번호</span>
                  <span className="text-xs font-black text-primary tracking-tight">ACA-2024-0815</span>
                </div>
              </div>
            </div>

            {/* 네트워크 및 기기 정보 */}
            <div className="p-6 bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] border border-white/40 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-4 mb-5">
                <div className="bg-white shadow-inner size-14 rounded-3xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-slate-600">settings_input_component</span>
                </div>
                <div>
                   <p className="font-black text-sm text-slate-900 dark:text-white leading-tight">네트워크 및 기기 설정</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Network & Devices</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/55 dark:bg-slate-900/55 p-3 rounded-xl border border-white/20">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Wi-Fi</span>
                    <span className="text-[9px] text-slate-400 font-bold">SSID: School_Guest</span>
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">wifi-pass-99!</span>
                </div>
                <div className="flex justify-between items-center bg-white/55 dark:bg-slate-900/55 p-3 rounded-xl border border-white/20">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">프린트 연결 번호</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">#4409</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logout Section */}
        <section className="pt-4 pb-10">
          <button 
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-3 p-5 rounded-[2rem] bg-white/55 backdrop-blur-md border border-white/40 text-slate-900 font-black active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-slate-900">logout</span>
            로그아웃
          </button>
          <p className="text-center text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-widest opacity-50">Flowy v1.0.0</p>
        </section>
      </main>
    </div>
  );
};

export default StoreInfo;
