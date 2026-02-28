
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { getUserData, FirestoreUser, logoutUser } from './services/authService';

import Layout from './components/Layout';
import Home from './views/Home';
import AIGuide from './views/AIGuide';
import StoreInfo from './views/StoreInfo';
import ManualCategory from './views/ManualCategory';
import TaskDetail from './views/TaskDetail';
import Announcements from './views/Announcements';
import AnnouncementDetail from './views/AnnouncementDetail';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import AdminStaff from './views/AdminStaff';
import Settings from './views/Settings';
import ManualEdit from './views/ManualEdit';
import AnnouncementEdit from './views/AnnouncementEdit';
import MyActivityDetail from './views/MyActivityDetail';
import ChatRoom from './views/ChatRoom';
import FAQList from './views/FAQList';
import FAQEdit from './views/FAQEdit';
import ChatList from './views/ChatList';
import { UserRole } from './types';
import { MANUAL_CATEGORIES } from './constants';
import { initializeCategoriesIfNeeded } from './services/manualService';

const SplashScreen = () => (
  <div className="animate-splash-fade-out relative flex min-h-screen w-full max-w-md mx-auto flex-col items-center justify-center overflow-hidden bg-[#010309]">
    {/* 오묘한 다층 그라데이션 레이어 */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(30,58,138,0.15)_0%,transparent_70%)]"></div>
      <div className="absolute top-[-20%] left-[-10%] size-[120%] bg-[radial-gradient(circle_at_20%_20%,rgba(30,58,138,0.1)_0%,transparent_50%)]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] size-[120%] bg-[radial-gradient(circle_at_80%_80%,rgba(88,28,135,0.05)_0%,transparent_50%)]"></div>
    </div>

    {/* 배경 ripple 효과 */}
    <div className="absolute size-80 rounded-full border border-white/5 animate-ripple" style={{ animationDelay: '0s' }} />
    <div className="absolute size-80 rounded-full border border-white/5 animate-ripple" style={{ animationDelay: '0.8s' }} />

    {/* 심해 거품 애니메이션 */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div 
          key={i}
          className="bubble-anim absolute border border-white/20 bg-white/5 rounded-full"
          style={{ 
            width: `${8 + (i * 4)}px`, 
            height: `${8 + (i * 4)}px`,
            left: `${(i * 15) % 100}%`,
            top: '100%',
            animationDelay: `${i * 1.2}s`,
            animationDuration: `${6 + (i % 3) * 2}s, 3s`
          }} 
        />
      ))}
    </div>

    {/* 로고 영역 */}
    <div className="flex flex-col items-center gap-8 z-10">
      {/* 해마 아이콘 (이동 애니메이션과 충돌 방지를 위해 래퍼에서 반전 적용) */}
      <div className="haema-flip">
        <img src="/haema_logo.png" alt="HAEMA" className="size-40 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] animate-float" />
      </div>

      {/* 브랜드 텍스트 */}
      <div className="flex flex-col items-center gap-2">
        <h1 className="animate-splash-text text-4xl font-black tracking-[0.3em] text-white" style={{ animationDelay: '0.2s', opacity: 0 }}>
          HAEMA
        </h1>
        <p className="animate-splash-text text-[11px] font-bold text-white/40 uppercase tracking-[0.4em]" style={{ animationDelay: '0.45s', opacity: 0 }}>
          우리만의 운영 지식 아카이브
        </p>
      </div>
    </div>

    {/* 하단 로딩 바 */}
    <div className="absolute bottom-20 left-12 right-12 z-10">
      <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-white/10 via-white/50 to-white/10 rounded-full animate-bar-fill relative overflow-hidden">
          <div className="absolute inset-y-0 w-8 bg-white/20 blur-sm animate-shimmer" />
        </div>
      </div>
      <p className="mt-4 text-center text-[10px] font-bold text-white/20 uppercase tracking-widest animate-splash-text" style={{ animationDelay: '0.7s', opacity: 0 }}>
        Powered by Areum Edu Partners
      </p>
    </div>
  </div>
);

import { ChatProvider } from './contexts/ChatContext';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [splashDone, setSplashDone] = useState(false);
  const pendingUserDataRef = useRef<FirestoreUser | null>(null);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // 스플래시 최소 표시 시간 (2.4초)
  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 2400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (pendingUserDataRef.current) {
          setCurrentUser(pendingUserDataRef.current);
          pendingUserDataRef.current = null;
        } else {
          const userData = await getUserData(firebaseUser.uid);
          setCurrentUser(userData);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  if (loading || !splashDone) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-start justify-center">
        <SplashScreen />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-200 dark:bg-slate-900 flex items-start justify-center">
        <div className="w-full max-w-md min-h-screen bg-slate-50 dark:bg-slate-950 shadow-2xl overflow-hidden relative">
          <Router>
            <Routes>
              <Route path="/login" element={<Login onLogin={(userData) => { pendingUserDataRef.current = userData; setCurrentUser(userData); }} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </div>
      </div>
    );
  }

  const role = currentUser.role as UserRole;

  return (
    <ChatProvider>
      <Router>
        <Layout role={role} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<AIGuide role={role} />} />
            <Route path="/home" element={<Home role={role} />} />
            <Route path="/subject-manuals" element={<Navigate to="/home" replace />} />
            <Route path="/ai" element={<Navigate to="/" replace />} />
            {/* ... 나머지 라우트들 ... */}
            <Route path="/announcements" element={<Announcements role={role} />} />
            <Route path="/announcements/:id" element={<AnnouncementDetail role={role} />} />
            <Route path="/announcements/new" element={<AnnouncementEdit />} />
            <Route path="/announcements/:id/edit" element={<AnnouncementEdit />} />
            <Route path="/faq" element={<FAQList role={role} />} />
            <Route path="/faq/new" element={<FAQEdit />} />
            <Route path="/faq/:id/edit" element={<FAQEdit />} />
            <Route path="/mypage" element={<StoreInfo role={role} currentUser={currentUser} onLogout={handleLogout} />} />
            <Route path="/mypage/activity" element={<MyActivityDetail />} />
            <Route path="/chat" element={<ChatList currentUser={currentUser} />} />
            <Route path="/chat/:memberId" element={<ChatRoom currentUser={currentUser} />} />
            <Route path="/manuals/:catId" element={<ManualCategory role={role} />} />
            <Route path="/manuals/:catId/new" element={<ManualEdit />} />
            <Route path="/manuals/:catId/:taskId" element={<TaskDetail role={role} currentUser={currentUser} />} />
            <Route path="/manuals/:catId/:taskId/edit" element={<ManualEdit />} />

            <Route path="/settings" element={<Settings role={role} onLogout={handleLogout} />} />

            {role === 'admin' && (
              <>
                <Route path="/admin/staff" element={<AdminStaff />} />
              </>
            )}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ChatProvider>
  );
};

export default App;
