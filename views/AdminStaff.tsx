
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminStaff: React.FC = () => {
  const navigate = useNavigate();

  const staffList = [
    { id: '1', name: '김지수', role: '영어 강사', status: '출근', tasks: '3/5', avatar: 'https://picsum.photos/seed/1/100/100' },
    { id: '2', name: '이민호', role: '수학 강사', status: '출근', tasks: '5/5', avatar: 'https://picsum.photos/seed/2/100/100' },
    { id: '3', name: '박서준', role: '행정 매니저', status: '외근', tasks: '2/4', avatar: 'https://picsum.photos/seed/3/100/100' },
    { id: '4', name: '최유진', role: '영어 강사', status: '휴가', tasks: '0/0', avatar: 'https://picsum.photos/seed/4/100/100' },
  ];

  return (
    <div className="pb-32 min-h-screen">
      <header className="sticky top-0 z-20 bg-white/40 backdrop-blur-xl border-b border-white/40 px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-primary p-2 active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-black tracking-tight text-slate-900">직원 근태 및 업무 관리</h1>
      </header>

      <main className="px-6 py-8 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Staff List ({staffList.length})</h2>
          <button className="flex items-center gap-1 text-xs font-bold text-primary">
            <span className="material-symbols-outlined text-sm">person_add</span>
            직원 초대
          </button>
        </div>

        <div className="space-y-4">
          {staffList.map((staff) => (
            <div key={staff.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="relative">
                <img src={staff.avatar} alt={staff.name} className="size-14 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                <div className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white ${
                  staff.status === '출근' ? 'bg-emerald-500' : 
                  staff.status === '외근' ? 'bg-amber-500' : 'bg-slate-300'
                }`}></div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-black text-slate-900">{staff.name}</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                    staff.status === '출근' ? 'bg-emerald-50 text-emerald-600' : 
                    staff.status === '외근' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {staff.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{staff.role}</p>
                
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${(parseInt(staff.tasks.split('/')[0]) / parseInt(staff.tasks.split('/')[1] || '1')) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{staff.tasks} 완료</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Weekly Performance</h3>
          <div className="flex justify-between items-end h-32 gap-2">
            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-primary/20 rounded-t-lg relative group">
                  <div 
                    className="absolute bottom-0 left-0 w-full bg-primary rounded-t-lg transition-all duration-500" 
                    style={{ height: `${h}%` }}
                  ></div>
                </div>
                <span className="text-[9px] font-bold text-slate-500">
                  {['월', '화', '수', '목', '금', '토', '일'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminStaff;
