
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { deleteUserAccount } from '../services/authService';
import { auth } from '../services/firebase';

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

  const handleDeleteAccount = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const confirmFirst = window.confirm('정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 다시 로그인할 수 없습니다.');
    if (!confirmFirst) return;
    const confirmSecond = window.confirm('다시 한번 확인합니다. 정말로 계정을 삭제하시겠습니까?');
    if (!confirmSecond) return;
    try {
      await deleteUserAccount(uid);
      alert('그동안 이용해주셔서 감사합니다. 계정이 삭제되었습니다.');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        alert('보안을 위해 재로그인이 필요합니다. 로그아웃 후 다시 로그인하여 시도해주세요.');
      } else {
        alert('계정 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // label → route panel key 매핑
  const handleItemClick = (panelKey: string) => {
    if (panelKey === 'scrap-history') {
      navigate('/mypage/activity?tab=manuals');
      return;
    }
    navigate(`/settings/${panelKey}`);
  };

  const adminSettingsGroups = [
    {
      title: '학원 정보 설정',
      items: [
        { label: '학원명 및 로고 변경', icon: 'storefront', panelKey: 'academy-info' },
        { label: '운영 시간 설정', icon: 'schedule', panelKey: 'hours' },
        { label: '연락처 및 위치 정보', icon: 'location_on', panelKey: 'contact' },
      ]
    },
    {
      title: '사용자 및 권한',
      items: [
        { label: '관리자 계정 관리', icon: 'admin_panel_settings', panelKey: 'admin-accounts' },
        { label: '직원 관리', icon: 'manage_accounts', panelKey: 'staff-roles' },
        { label: '학원 고유번호 관리', icon: 'key', panelKey: 'invite-code' },
      ]
    },
    {
      title: '시스템 알림',
      items: [
        { label: '푸시 알림 설정', icon: 'notifications_active', panelKey: 'push-notif' },
        { label: '자동 업무 할당 규칙', icon: 'auto_mode', panelKey: 'auto-task' },
      ]
    }
  ];

  const staffSettingsGroups = [
    {
      title: '학원 정보',
      items: [
        { label: '학원 정보 보기', icon: 'info', panelKey: 'academy-info-view' },
      ]
    },
    {
      title: '알림 설정',
      items: [
        { label: '푸시 알림 수신 설정', icon: 'notifications_active', panelKey: 'push-notif' },
      ]
    },
    {
      title: '내 활동 설정',
      items: [
        { label: '스크랩 관리 히스토리', icon: 'bookmark', panelKey: 'scrap-history' },
        { label: '내 정보 공개 범위', icon: 'visibility', panelKey: 'privacy' },
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
                  onClick={() => handleItemClick(item.panelKey)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-white/40 transition-colors border-b last:border-b-0 border-white/20 active:scale-[0.98]"
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

          <button
            onClick={handleDeleteAccount}
            className="w-full p-4 text-[11px] text-slate-300 dark:text-slate-600 font-bold underline underline-offset-4 hover:text-red-400 active:text-red-500 transition-all"
          >
            탈퇴하기
          </button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
