
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademy } from '../contexts/AcademyContext';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { academyName } = useAcademy();

  const stats = [
    { label: '오늘의 출근', value: '12/14', icon: 'groups', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '미결 업무', value: '5', icon: 'pending_actions', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: '신규 공지', value: '2', icon: 'campaign', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '매뉴얼 조회', value: '128', icon: 'visibility', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const quickActions = [
    { title: '공지사항 작성', icon: 'add_comment', path: '/admin/announcements/new', color: 'bg-slate-900' },
    { title: '매뉴얼 관리', icon: 'edit_document', path: '/admin/manuals', color: 'bg-primary' },
    { title: '직원 근태 관리', icon: 'person_search', path: '/admin/staff', color: 'bg-emerald-600' },
    { title: '시스템 설정', icon: 'settings', path: '/admin/settings', color: 'bg-slate-400' },
  ];

  return (
    <div className="pb-32 min-h-screen">
      <header className="px-6 pt-14 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div
              onClick={() => navigate('/')}
              className="flex items-baseline gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <h1 className="text-slate-900 dark:text-white text-2xl font-black tracking-tighter leading-none">HAEMA</h1>
              {academyName && academyName !== 'HAEMA' && (
                <span className="text-[13px] font-bold text-slate-400 dark:text-slate-500 tracking-tight font-display uppercase">{academyName}</span>
              )}
            </div>
            <p className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mt-1.5 leading-none">Admin Console</p>
          </div>
          <div className="size-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl shadow-slate-900/10">
            <span className="material-symbols-outlined text-white text-2xl">admin_panel_settings</span>
          </div>
        </div>
        <p className="text-[12px] font-bold text-slate-400 leading-relaxed">학원 운영 현황을 실시간으로 관리하고 파악하세요.</p>
      </header>

      <main className="px-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className={`size-10 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                <span className="material-symbols-outlined text-xl">{stat.icon}</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm active:scale-95 transition-all"
              >
                <div className={`size-14 rounded-3xl ${action.color} text-white flex items-center justify-center shadow-lg`}>
                  <span className="material-symbols-outlined text-2xl">{action.icon}</span>
                </div>
                <span className="text-sm font-black text-slate-800 tracking-tight">{action.title}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Activity</h2>
            <button className="text-xs font-bold text-primary">전체보기</button>
          </div>
          <div className="space-y-6">
            {[
              { user: '김강사', action: '성적표 업로드 가이드 조회', time: '5분 전' },
              { user: '이매니저', action: '신규 공지사항 게시', time: '1시간 전' },
              { user: '박강사', action: '단어 테스트 채점 완료', time: '2시간 전' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    <span className="text-primary">{item.user}</span>님이 {item.action}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
