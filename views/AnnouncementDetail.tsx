
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { STORE_UPDATES, MANUAL_ITEMS } from '../constants';

interface AnnouncementDetailProps {
  role?: string;
}

const AnnouncementDetail: React.FC<AnnouncementDetailProps> = ({ role }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const announcement = STORE_UPDATES.find(u => u.id === id);

  if (!announcement) return <div className="p-8 text-center font-bold">공지를 찾을 수 없습니다.</div>;

  return (
    <div className="pb-32 min-h-screen relative">
      {/* Admin Controls Overlay */}
      {role === 'admin' && (
        <div className="fixed top-24 right-6 z-50 flex flex-col gap-3">
          <button 
            onClick={() => navigate(`/announcements/${id}/edit`)}
            className="size-12 rounded-full bg-white/40 backdrop-blur-md shadow-xl border border-white/40 flex items-center justify-center text-primary active:scale-95 transition-all"
            title="수정"
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button 
            onClick={() => {
              if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
                alert('삭제되었습니다. (데모 버전)');
                navigate('/announcements');
              }
            }}
            className="size-12 rounded-full bg-white/40 backdrop-blur-md shadow-xl border border-white/40 flex items-center justify-center text-red-500 active:scale-95 transition-all"
            title="삭제"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      )}

      <header className="sticky top-0 z-20 bg-white/40 dark:bg-background-dark/40 backdrop-blur-xl border-b border-white/40 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-primary p-2 active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">공지 상세내용</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-7 py-10 space-y-8 animate-fade-in relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
              announcement.category === '필독' ? 'bg-red-100/50 text-red-600' :
              announcement.category === '매뉴얼' ? 'bg-blue-100/50 text-blue-600' :
              announcement.category === '일정' ? 'bg-emerald-100/50 text-emerald-600' :
              'bg-slate-100/50 text-slate-600'
            }`}>
              {announcement.category}
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{announcement.timeAgo} 작성됨</span>
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-6">
            {announcement.title}
          </h2>
          
          <div className="h-px w-full bg-white/20 dark:bg-slate-800 mb-8"></div>
          
          <div className="text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
            {announcement.description}
            {"\n\n"}관련하여 궁금하신 사항은 행정실로 문의 부탁드립니다.{"\n\n"}감사합니다.
          </div>

          {announcement.relatedManualId && (
            <button 
              onClick={() => {
                // We need to find the categoryId for the manual item to navigate correctly
                // In a real app we'd have a helper or the ID would be enough
                // For now, we'll just try to navigate if we can find it in MANUAL_ITEMS
                const item = MANUAL_ITEMS.find(i => i.id === announcement.relatedManualId);
                if (item) {
                  navigate(`/manuals/${item.categoryId}/${item.id}`);
                }
              }}
              className="mt-8 flex items-center gap-3 w-full p-5 rounded-2xl bg-primary/5 border border-primary/20 text-primary font-bold active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">menu_book</span>
              <div className="flex-1 text-left">
                <p className="text-xs opacity-70">관련 매뉴얼 바로가기</p>
                <p className="text-sm">매뉴얼 확인하기</p>
              </div>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          )}
        </div>

        <button 
          onClick={() => navigate(-1)}
          className="w-full bg-white/60 backdrop-blur-md text-slate-900 py-5 rounded-[2rem] border border-white/40 font-black text-sm active:scale-95 transition-all shadow-sm mt-12"
        >
          목록으로 돌아가기
        </button>
      </main>
    </div>
  );
};

export default AnnouncementDetail;
