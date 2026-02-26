
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

interface FlowyIconProps {
  className?: string;
  color?: string;
}

/**
 * 구름 모양의 Flowy 캐릭터
 * 연블루, 화이트, 연퍼플 그라데이션이 섞인 부드럽고 뚱뚱한 구름 + 정중앙 스마일 얼굴
 */
export const FlowyIcon = ({ className = "" }: FlowyIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="flowyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C7D2FE" />
        <stop offset="50%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E9D5FF" />
      </linearGradient>
    </defs>

    {/* 구름 몸체 (더 뚱뚱하고 둥글둥글한 버전) */}
    <path
      d="M6 19c-3.314 0-6-2.686-6-6s2.686-6 6-6c.188 0 .372.01.553.028C7.684 4.015 10.61 2 14 2c4.418 0 8 3.582 8 8 0 .14-.004.28-.011.419C21.156 10.74 24 13.036 24 16c0 3.314-2.686 6-6 6H6v-3z"
      fill="url(#flowyGradient)"
      transform="translate(0, 0.5)"
    />

    {/* 반짝임 (Sparkle) */}
    <path
      d="M19 5L19.2 5.8L20 6L19.2 6.2L19 7L18.8 6.2L18 6L18.8 5.8L19 5Z"
      fill="white"
      fillOpacity="0.9"
    />

    {/* 얼굴: 눈 (중앙 정렬 조정) */}
    <circle cx="10" cy="12.5" r="0.8" fill="#334155" fillOpacity="0.85" />
    <circle cx="16" cy="12.5" r="0.8" fill="#334155" fillOpacity="0.85" />

    {/* 얼굴: 미소 (중앙 정렬 조정) */}
    <path
      d="M10 15.5C10 15.5 11.5 17 13 17C14.5 17 16 15.5 16 15.5"
      stroke="#334155"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeOpacity="0.85"
    />
  </svg>
);

interface LayoutProps {
  children: React.ReactNode;
  role?: UserRole;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, role, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-[#F5F8FF] dark:bg-slate-950 shadow-2xl overflow-hidden border-x border-slate-100 dark:border-slate-800 font-display">
      {/* Watercolor Blobs - Global Background */}
      <div className="absolute top-[-5%] left-[-10%] w-[80%] h-[40%] bg-blue-300/45 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[15%] right-[-15%] w-[70%] h-[35%] bg-purple-200/45 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[25%] left-[-5%] w-[60%] h-[30%] bg-emerald-100/45 rounded-full blur-[110px] pointer-events-none z-0"></div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
        {children}
      </div>

      <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-slate-100/50 dark:border-slate-800/50 px-6 pb-8 pt-3 z-50 transition-all duration-300 ${location.pathname.startsWith('/chat/') ? 'translate-y-[calc(100%+3rem)] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div className="flex items-end justify-between px-2">
          <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary' : 'text-slate-400 opacity-50'}`}>
            <span className={`material-symbols-outlined text-[26px] ${location.pathname === '/' ? 'fill-1' : ''}`}>grid_view</span>
            <span className="text-[10px] font-black tracking-tighter">운영 안내</span>
          </NavLink>

          <NavLink to="/subject-manuals" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary' : 'text-slate-400 opacity-50'}`}>
            <span className={`material-symbols-outlined text-[26px] ${location.pathname === '/subject-manuals' ? 'fill-1' : ''}`}>menu_book</span>
            <span className="text-[10px] font-black tracking-tighter">수업 안내</span>
          </NavLink>

          <NavLink to="/ai" className="flex flex-col items-center -mt-12 group">
            <div className={`size-16 rounded-[2.25rem] flex items-center justify-center shadow-2xl border-[1.5px] border-slate-200/80 dark:border-slate-700/80 active:scale-95 transition-all ${location.pathname === '/ai' ? 'bg-primary text-white shadow-primary/40' : 'bg-white text-slate-900 shadow-slate-200/50'}`}>
              <FlowyIcon className="size-9" />
            </div>
            <span className={`text-[10px] font-black mt-1.5 tracking-tighter ${location.pathname === '/ai' ? 'text-primary' : 'text-slate-400 opacity-50'}`}>Flowy</span>
          </NavLink>

          <NavLink to="/announcements" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary' : 'text-slate-400 opacity-50'}`}>
            <span className={`material-symbols-outlined text-[26px] ${location.pathname === '/announcements' ? 'fill-1' : ''}`}>campaign</span>
            <span className="text-[10px] font-black tracking-tighter">공지사항</span>
          </NavLink>

          <NavLink to="/mypage" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary' : 'text-slate-400 opacity-50'}`}>
            <span className={`material-symbols-outlined text-[26px] ${location.pathname === '/mypage' ? 'fill-1' : ''}`}>person</span>
            <span className="text-[10px] font-black tracking-tighter">마이페이지</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
