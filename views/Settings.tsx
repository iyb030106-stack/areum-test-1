
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

interface SettingsProps {
  role?: UserRole;
  onLogout?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ role, onLogout }) => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      if (onLogout) onLogout();
      navigate('/login');
    }
  };

  const adminSettingsGroups = [
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

  const staffSettingsGroups = [
    {
      title: '알림 설정',
      items: [
        { label: '푸시 알림 수신 설정', icon: 'notifications_active' },
      ]
    },
    {
      title: '내 활동 설정',
      items: [
        { label: '스크랩 관리 히스토리', icon: 'bookmark' },
        { label: '내 정보 공개 범위', icon: 'visibility' },
      ]
    }
  ];

  const groups = role === 'admin' ? adminSettingsGroups : staffSettingsGroups;

  return (
    <div className="pb-32 min-h-screen relative z-10">
      <header className="sticky top-0 z-20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-b border-white/40 dark:border-slate-800 px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 p-2 active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">환경 설정</h1>
      </header>

      <main className="px-6 py-8 space-y-10">
        {groups.map((group, i) => (
          <section key={i}>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{group.title}</h2>
            <div className="bg-white/50 backdrop-blur-md dark:bg-slate-800/50 rounded-[2rem] border border-white/60 dark:border-slate-700 shadow-sm overflow-hidden">
              {group.items.map((item, j) => (
                <button 
                  key={j}
                  className="w-full flex items-center gap-4 p-5 hover:bg-white/40 transition-colors border-b last:border-b-0 border-white/20"
                >
                  <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-white">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </div>
                  <span className="flex-1 text-left text-sm font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                  <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                </button>
              ))}
            </div>
          </section>
        ))}

        <div className="pt-6 space-y-4">
          <button 
            onClick={handleLogoutClick}
            className="w-full p-5 rounded-[1.75rem] bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-slate-700 flex items-center justify-center gap-2 text-red-500 dark:text-red-400 font-black text-sm active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined">logout</span>
            로그아웃
          </button>
          
          {role === 'admin' && (
            <button className="w-full p-4 text-[11px] text-slate-300 dark:text-slate-600 font-bold underline underline-offset-4 active:text-slate-400 transition-all">
              데이터 초기화 및 캐시 삭제
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
