
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface CompletedTask {
  id: string;
  title: string;
  time: string;
  date: string;
}

const CompletedTasks: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const recentlyCompleted = (location.state as any)?.completedTask;
  
  const [completedList, setCompletedList] = useState<CompletedTask[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cafe_harmony_completed_tasks');
    if (saved) {
      setCompletedList(JSON.parse(saved));
    }
  }, []);

  const handleReset = () => {
    if (confirm('오늘의 완료 기록을 초기화하시겠습니까?')) {
      localStorage.removeItem('cafe_harmony_completed_tasks');
      setCompletedList([]);
    }
  };

  return (
    <div className="pb-32 bg-background-light dark:bg-background-dark min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/tasks')} className="text-primary p-2 active:scale-95"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-lg font-bold">완료된 업무</h1>
        <button onClick={handleReset} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-2">초기화</button>
      </header>

      <main className="px-4 py-6 space-y-4">
        {recentlyCompleted && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-4 rounded-xl flex items-center gap-3 animate-slide-up">
            <span className="material-symbols-outlined text-green-500 fill-1">check_circle</span>
            <div>
              <p className="text-sm font-bold text-green-700 dark:text-green-300">방금 완료됨</p>
              <p className="text-xs text-green-600 dark:text-green-400">{recentlyCompleted}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">오늘 완료한 업무 ({completedList.length})</h2>
          
          {completedList.length > 0 ? (
            completedList.map((item) => (
              <div 
                key={item.id}
                className="flex items-center gap-4 bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 opacity-80"
              >
                <span className="material-symbols-outlined text-green-500">check_circle</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-500 line-through">{item.title}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{item.time} 완료</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
               <span className="material-symbols-outlined text-slate-200 text-5xl mb-3">history</span>
               <p className="text-slate-400 text-xs font-black">아직 완료된 업무 기록이 없습니다</p>
            </div>
          )}
        </div>

        <div className="pt-8 text-center">
          <button 
            onClick={() => navigate('/tasks')}
            className="text-primary text-sm font-bold flex items-center justify-center gap-1 mx-auto hover:underline"
          >
            <span className="material-symbols-outlined text-sm">assignment</span>
            남은 업무 보러 가기
          </button>
        </div>
      </main>
    </div>
  );
};

export default CompletedTasks;
