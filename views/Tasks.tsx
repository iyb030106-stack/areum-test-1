
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface TaskItemProps {
  title: string;
  meta?: string;
  onComplete: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
}

const TaskCard: React.FC<TaskItemProps> = ({ title, meta, onComplete, onDelete, canDelete }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-start gap-5 transition-all hover:border-primary/40 group active:scale-[0.98]`}>
      <div className="pt-0.5">
        <input 
          className="h-6 w-6 rounded-lg border-slate-300 text-primary focus:ring-primary dark:bg-slate-800 dark:border-slate-700 cursor-pointer transition-all" 
          type="checkbox"
          onChange={(e) => {
            if (e.target.checked) {
              setTimeout(() => onComplete(), 300);
            }
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
              {title}
            </p>
            {canDelete && (
              <button 
                onClick={onDelete}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
            )}
          </div>
          {meta && (
            <div className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full bg-slate-300`}></span>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{meta}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState('');

  // 나의 업무 - 로컬 스토리지 연동
  const [personalTasks, setPersonalTasks] = useState<string[]>(() => {
    const saved = localStorage.getItem('edu_harmony_personal_tasks');
    return saved ? JSON.parse(saved) : ['출결 오류 학생 전화하기', '자체 교재 제본 10권'];
  });

  useEffect(() => {
    localStorage.setItem('edu_harmony_personal_tasks', JSON.stringify(personalTasks));
  }, [personalTasks]);

  const handleComplete = (taskName: string) => {
    const savedCompleted = localStorage.getItem('edu_harmony_completed_tasks');
    const completedList = savedCompleted ? JSON.parse(savedCompleted) : [];
    const newEntry = {
      id: Date.now().toString(),
      title: taskName,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('ko-KR')
    };
    localStorage.setItem('edu_harmony_completed_tasks', JSON.stringify([newEntry, ...completedList]));
    setPersonalTasks(prev => prev.filter(t => t !== taskName));
    navigate('/tasks/completed', { state: { completedTask: taskName } });
  };

  const handleDelete = (taskName: string) => {
    if (confirm(`'${taskName}' 업무를 삭제하시겠습니까?`)) {
      setPersonalTasks(prev => prev.filter(t => t !== taskName));
    }
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      setPersonalTasks([...personalTasks, newTask.trim()]);
      setNewTask('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="px-6 py-10 space-y-10 pb-44 bg-[#F8FAFC] dark:bg-background-dark min-h-screen">
      <header className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
             <span className="size-2 bg-blue-500 rounded-full animate-pulse shadow-sm shadow-blue-500/50"></span>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal To-do</p>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">나의 체크리스트</h1>
        </div>

        <button 
          onClick={() => navigate('/tasks/completed')}
          className="flex items-center justify-between w-full p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 bg-blue-500/10 text-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl fill-1">task_alt</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-900 dark:text-white">오늘 완료한 업무</p>
              <p className="text-[10px] text-slate-400 font-bold">처리 완료된 항목 리스트 확인</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300">chevron_right</span>
        </button>
      </header>

      <section>
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">진행 중인 업무</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white text-[10px] font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            업무 등록
          </button>
        </div>

        <div className="space-y-4">
          {personalTasks.length > 0 ? (
            personalTasks.map((t, i) => (
              <TaskCard 
                key={i} 
                title={t} 
                meta="Currently doing"
                onComplete={() => handleComplete(t)}
                onDelete={() => handleDelete(t)}
                canDelete={true}
              />
            ))
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-slate-200 text-6xl mb-4">checklist</span>
              <p className="text-slate-400 text-sm font-black">비어있는 업무가 없습니다</p>
            </div>
          )}
        </div>
      </section>

      {/* 업무 등록 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-2xl relative z-[61] animate-fade-in border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col items-center text-center">
              <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-4xl">edit_square</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">업무 추가</h3>
              <input 
                autoFocus
                className="w-full rounded-xl border-2 border-slate-50 bg-slate-50 px-6 py-5 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none mb-10 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white placeholder:text-slate-300" 
                placeholder="내용을 입력하세요" 
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              />
              <div className="flex gap-4 w-full">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-4.5 rounded-xl font-black text-sm active:scale-95 transition-all">취소</button>
                <button 
                  onClick={handleAddTask}
                  disabled={!newTask.trim()}
                  className="flex-[2] bg-primary text-white py-4.5 rounded-xl font-black text-base shadow-xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  등록하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
