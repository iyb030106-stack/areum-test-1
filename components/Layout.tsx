
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

interface HaemaIconProps {
  className?: string;
  color?: string;
}

/**
 * 원장님이 제공해주신 실제 해마 이미지 캐릭터 아이콘
 */
export const HaemaIcon = ({ className = "" }: HaemaIconProps) => (
  <img
    src="/haema_logo.png"
    alt="Haema Logo"
    className={`${className} object-contain haema-flip`}
  />
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
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-slate-50 dark:bg-slate-950 shadow-2xl overflow-hidden border-x border-slate-100 dark:border-slate-800 font-display">
      {/* Grayscale Blobs - Global Background */}
      <div className="absolute top-[-5%] left-[-10%] w-[80%] h-[40%] bg-slate-200/40 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[15%] right-[-15%] w-[70%] h-[35%] bg-slate-100/40 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[25%] left-[-5%] w-[60%] h-[30%] bg-slate-200/30 rounded-full blur-[110px] pointer-events-none z-0"></div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
        {children}
      </div>

      <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100/50 dark:border-slate-800/50 px-4 pb-8 pt-3 z-50 transition-all duration-300 ${location.pathname.startsWith('/chat/') ? 'translate-y-[calc(100%+3rem)] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div className="flex items-end justify-between">
          <NavLink to="/" end className={({ isActive }) => `flex-1 flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary' : 'text-slate-400 opacity-50'}`}>
            <span className={`material-symbols-outlined text-[26px] ${location.pathname === '/' ? 'fill-1' : ''}`}>home</span>
            <span className="text-[10px] font-black tracking-tighter">홈</span>
          </NavLink>

          <NavLink to="/home" className={({ isActive }) => `flex-1 flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary' : 'text-slate-400 opacity-50'}`}>
            <span className={`material-symbols-outlined text-[26px] ${location.pathname === '/home' ? 'fill-1' : ''}`}>grid_view</span>
            <span className="text-[10px] font-black tracking-tighter">매뉴얼</span>
          </NavLink>

          <NavLink to="/announcements" className={({ isActive }) => `flex-1 flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary' : 'text-slate-400 opacity-50'}`}>
            <span className={`material-symbols-outlined text-[26px] ${location.pathname === '/announcements' ? 'fill-1' : ''}`}>campaign</span>
            <span className="text-[10px] font-black tracking-tighter">공지 사항</span>
          </NavLink>

          <NavLink to="/faq" className={({ isActive }) => `flex-1 flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary' : 'text-slate-400 opacity-50'}`}>
            <span className={`material-symbols-outlined text-[26px] ${location.pathname === '/faq' ? 'fill-1' : ''}`}>quiz</span>
            <span className="text-[10px] font-black tracking-tighter">Q&A</span>
          </NavLink>


          <NavLink to="/mypage" className={({ isActive }) => `flex-1 flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary' : 'text-slate-400 opacity-50'}`}>
            <span className={`material-symbols-outlined text-[26px] ${location.pathname === '/mypage' ? 'fill-1' : ''}`}>person</span>
            <span className="text-[10px] font-black tracking-tighter">내 정보</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
