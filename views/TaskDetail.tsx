
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { getManualItem, deleteManualItem, ManualItem, toggleScrapManual, checkIsScrapped } from '../services/manualService';
import { FirestoreUser } from '../services/authService';
import { auth } from '../services/firebase';

interface TaskDetailProps {
  role?: UserRole;
  currentUser: FirestoreUser;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ role, currentUser }) => {
  const { catId, taskId } = useParams<{ catId: string; taskId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ManualItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScrapped, setIsScrapped] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    getManualItem(taskId).then((data) => {
      setItem(data);
      setLoading(false);
    });

    // 스크랩 상태 확인
    if (currentUser?.uid && taskId) {
      checkIsScrapped(currentUser.uid, taskId).then(setIsScrapped);
    }
  }, [taskId, currentUser?.uid]);

  const handleDelete = async () => {
    if (!taskId) return;
    if (window.confirm('정말로 이 매뉴얼을 삭제하시겠습니까?')) {
      await deleteManualItem(taskId);
      navigate(`/manuals/${catId}`);
    }
  };

  const handleAskAI = () => {
    if (!item) return;
    const contextPrompt = `'${item.title}' 매뉴얼의 단계를 수행하던 중 도움이 필요합니다. 특히 "${item.steps?.[0] || item.description}" 부분에 대해 더 자세히 설명해 주세요.`;
    navigate('/', { state: { prompt: contextPrompt } });
  };

  const handleScrap = async () => {
    if (!currentUser?.uid || !taskId) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    const newStatus = await toggleScrapManual(currentUser.uid, taskId);
    setIsScrapped(newStatus);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-8 text-center">
        <span className="material-symbols-outlined text-slate-200 text-6xl">search_off</span>
        <p className="text-slate-400 font-bold text-sm">매뉴얼을 찾을 수 없습니다.</p>
        <button onClick={() => navigate(-1)} className="text-primary font-bold text-sm">
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32 min-h-screen relative">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 bg-white/40 dark:bg-background-dark/40 backdrop-blur-xl border-b border-white/40 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-primary p-2 active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="text-sm font-black text-slate-500 tracking-tight truncate max-w-[160px]">
          {item.title}
        </span>
        {role === 'admin' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/manuals/${catId}/${item.id}/edit`)}
              className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary active:scale-95 transition-all"
              title="수정"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="size-9 rounded-full bg-red-50 flex items-center justify-center text-red-500 active:scale-95 transition-all"
              title="삭제"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        ) : role === 'staff' ? (
          <button
            onClick={handleScrap}
            className={`size-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${isScrapped
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
              : 'bg-amber-50 text-amber-500'
              }`}
            title={isScrapped ? '스크랩 취소' : '스크랩'}
          >
            <span className={`material-symbols-outlined text-[20px] ${isScrapped ? 'fill-1' : ''}`}>bookmark</span>
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* 제목/메타 */}
      <div className="px-6 pb-2 pt-6 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
            {item.subCategory || '매뉴얼'}
          </span>
        </div>
        <h1 className="text-slate-900 dark:text-white tracking-tight text-2xl font-extrabold leading-tight">
          {item.title}
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">{item.description}</p>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[12px] font-bold">
            <span className="material-symbols-outlined text-[14px]">history</span>
            <span>최종 업데이트: {item.updatedAt ? item.updatedAt.toDate().toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }) : '정보 없음'}</span>
          </div>
        </div>
      </div>

      {/* 단계별 가이드 */}
      <div className="px-6 pb-6 pt-4 relative z-10">
        <h3 className="text-slate-900 dark:text-white text-[18px] font-bold leading-tight tracking-tight mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">checklist</span>
          단계별 가이드
        </h3>
        {item.steps && item.steps.length > 0 ? (
          <ul className="space-y-2">
            {item.steps.map((text, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-white/55 backdrop-blur-md dark:bg-slate-800/55 border border-white/40 dark:border-slate-800 shadow-sm"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                    {i + 1}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-[13px] font-medium leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400 text-sm font-medium py-4">등록된 단계가 없습니다.</p>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 pb-20 pt-1 flex flex-col gap-3 relative z-10">
        <button
          onClick={handleAskAI}
          className="w-full bg-white/55 backdrop-blur-md text-slate-800 dark:text-white py-3 px-5 rounded-xl font-black text-[13.5px] flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-slate-400 text-[18px]">chat_bubble</span>
          AI에게 도움 요청
        </button>
      </div>
    </div>
  );
};

export default TaskDetail;
