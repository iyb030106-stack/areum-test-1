
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MANUAL_ITEMS, STORE_UPDATES } from '../constants';
import { UserRole } from '../types';

interface TaskDetailProps {
  role?: UserRole;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ role }) => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const item = MANUAL_ITEMS.find(i => i.id === taskId);

  if (!item) return <div className="p-8 text-center font-bold">매뉴얼을 찾을 수 없습니다.</div>;

  const handleAskAI = () => {
    const contextPrompt = `'${item.title}' 매뉴얼의 단계를 수행하던 중 도움이 필요합니다. 특히 "${item.steps?.[0] || item.description}" 부분에 대해 더 자세히 설명해 주세요.`;
    navigate('/ai', { state: { prompt: contextPrompt } });
  };

  return (
    <div className="pb-32 min-h-screen relative">
      {/* Admin Controls Overlay */}
      {role === 'admin' && (
        <div className="fixed top-24 right-6 z-50 flex flex-col gap-3">
          <button 
            onClick={() => navigate(`/manuals/${item.categoryId}/${item.id}/edit`)}
            className="size-12 rounded-full bg-white/40 backdrop-blur-md shadow-xl border border-white/40 flex items-center justify-center text-primary active:scale-95 transition-all"
            title="수정"
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button 
            onClick={() => {
              if (window.confirm('정말로 이 매뉴얼을 삭제하시겠습니까?')) {
                alert('삭제되었습니다. (데모 버전)');
                navigate(-1);
              }
            }}
            className="size-12 rounded-full bg-white/40 backdrop-blur-md shadow-xl border border-white/40 flex items-center justify-center text-red-500 active:scale-95 transition-all"
            title="삭제"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      )}

      {/* Staff Scrap Button */}
      {role === 'staff' && (
        <div className="fixed top-24 right-6 z-50">
          <button 
            onClick={() => alert('매뉴얼이 스크랩되었습니다. 마이페이지에서 확인하실 수 있습니다.')}
            className="size-12 rounded-full bg-white/40 backdrop-blur-md shadow-xl border border-white/40 flex items-center justify-center text-amber-500 active:scale-95 transition-all"
            title="스크랩"
          >
            <span className="material-symbols-outlined fill-1">bookmark</span>
          </button>
        </div>
      )}

      <div className="px-6 pb-2 pt-14 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">교육 매뉴얼</span>
          {item.hasRecentUpdate && (
            <button 
              onClick={() => {
                const announcement = STORE_UPDATES.find(u => u.relatedManualId === item.id);
                if (announcement) {
                  navigate(`/announcements/${announcement.id}`);
                } else {
                  navigate('/announcements');
                }
              }}
              className="px-2 py-0.5 rounded bg-amber-100 text-amber-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse"
            >
              <span className="material-symbols-outlined text-[10px]">campaign</span>
              최근 변경: {item.lastUpdateText}
            </button>
          )}
        </div>
        <h1 className="text-slate-900 dark:text-white tracking-tight text-2xl font-extrabold leading-tight">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(-1)}
              className="material-symbols-outlined text-primary p-1 -ml-1 hover:bg-primary/5 rounded-lg transition-colors"
            >
              arrow_back
            </button>
            <span>{item.title}</span>
          </div>
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>예상 시간: {item.timeEstimate}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
            <span className="material-symbols-outlined text-sm">bolt</span>
            <span>난이도: {item.level === 'Intermediate' ? '중급' : item.level === 'Beginner' ? '초급' : '고급'}</span>
          </div>
        </div>
      </div>

      <div className="p-6 relative z-10">
        <div 
          className="relative flex items-center justify-center bg-slate-900 aspect-video rounded-xl overflow-hidden shadow-lg" 
          style={{
            backgroundImage: `url("https://picsum.photos/seed/${taskId}/800/450")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/30"></div>
          <button className="relative flex shrink-0 items-center justify-center rounded-full size-16 bg-white/20 backdrop-blur-md text-white border border-white/30 hover:scale-105 transition-transform">
            <span className="material-symbols-outlined !text-4xl fill-1">play_arrow</span>
          </button>
        </div>
      </div>

      <div className="px-6 pb-8 relative z-10">
        <h3 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">checklist</span>
          단계별 가이드
        </h3>
        <ul className="space-y-4">
          {(item.steps || []).map((text, i) => (
            <li key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/55 backdrop-blur-md dark:bg-slate-800/55 border border-white/40 dark:border-slate-800">
              <div className="flex-shrink-0 mt-0.5">
                <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-bold">{i + 1}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed">{text}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-6 pb-32 pt-2 flex flex-col gap-3 relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className="w-full bg-primary text-white py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg active:scale-95"
        >
          완료
          <span className="material-symbols-outlined">check_circle</span>
        </button>
        <button 
          onClick={handleAskAI}
          className="w-full bg-white/55 backdrop-blur-md text-primary py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 border-2 border-primary/30 hover:bg-primary/5 active:scale-95"
        >
          <span className="material-symbols-outlined !text-2xl">chat_bubble</span> 
          AI에게 도움 요청
        </button>
      </div>
    </div>
  );
};

export default TaskDetail;
