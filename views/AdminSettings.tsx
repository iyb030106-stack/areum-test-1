
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminSettings: React.FC = () => {
  const navigate = useNavigate();

  const settingsGroups = [
    {
      title: '학원 정보 설정',
      items: [
        { label: '학원명 및 로고 변경', icon: 'storefront' },
        { label: '운영 시간 설정', icon: 'schedule' },
        { label: '연락처 및 위치 정보', icon: 'location_on' },
      ]
    },
    {
      title: '사용자 및 권한',
      items: [
        { label: '관리자 계정 관리', icon: 'admin_panel_settings' },
        { label: '직원 직책/권한 설정', icon: 'manage_accounts' },
        { label: '초대 코드 생성', icon: 'key' },
      ]
    },
    {
      title: '시스템 알림',
      items: [
        { label: '푸시 알림 설정', icon: 'notifications_active' },
        { label: '자동 업무 할당 규칙', icon: 'auto_mode' },
      ]
    }
  ];

  return (
    <div className="pb-32 min-h-screen">
      <header className="sticky top-0 z-20 bg-white/40 backdrop-blur-xl border-b border-white/40 px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-primary p-2 active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-black tracking-tight text-slate-900">시스템 설정</h1>
      </header>

      <main className="px-6 py-8 space-y-10">
        {settingsGroups.map((group, i) => (
          <section key={i}>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{group.title}</h2>
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              {group.items.map((item, j) => (
                <button 
                  key={j}
                  className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors border-b last:border-b-0 border-slate-50"
                >
                  <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </div>
                  <span className="flex-1 text-left text-sm font-bold text-slate-700">{item.label}</span>
                  <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                </button>
              ))}
            </div>
          </section>
        ))}

        <div className="pt-4">
          <button className="w-full p-5 rounded-2xl bg-red-50 text-red-600 font-bold text-sm active:scale-95 transition-all">
            데이터 초기화 및 로그아웃
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
