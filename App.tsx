
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { getUserData, FirestoreUser, logoutUser } from './services/authService';

import Layout from './components/Layout';
import Home from './views/Home';
import SubjectManuals from './views/SubjectManuals';
import AIGuide from './views/AIGuide';
import StoreInfo from './views/StoreInfo';
import ManualCategory from './views/ManualCategory';
import TaskDetail from './views/TaskDetail';
import Announcements from './views/Announcements';
import AnnouncementDetail from './views/AnnouncementDetail';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import AdminStaff from './views/AdminStaff';
import AdminSettings from './views/AdminSettings';
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
  <div className="animate-splash-fade-out relative flex min-h-screen w-full max-w-md mx-auto flex-col items-center justify-center overflow-hidden bg-[#141414]">
    {/* 배경 ripple 효과 */}
    <div className="absolute size-80 rounded-full border border-white/5 animate-ripple" style={{ animationDelay: '0s' }} />
    <div className="absolute size-80 rounded-full border border-white/5 animate-ripple" style={{ animationDelay: '0.8s' }} />
    <div className="absolute size-80 rounded-full border border-white/5 animate-ripple" style={{ animationDelay: '1.6s' }} />

    {/* 배경 블롭 */}
    <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[40%] bg-slate-700/20 rounded-full blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-slate-600/15 rounded-full blur-[100px]" />

    {/* 로고 영역 */}
    <div className="flex flex-col items-center gap-8 z-10">
      {/* 해마 아이콘 */}
      <div className="relative">
        <div className="absolute inset-0 bg-white/5 rounded-[3rem] blur-2xl scale-110" />
        <div className="relative size-36 bg-white/8 backdrop-blur-xl rounded-[3rem] flex items-center justify-center border border-white/10 shadow-2xl animate-float">
          <img src="/haema_logo.png" alt="HAEMA" className="size-24 object-contain drop-shadow-2xl" />
        </div>
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
        <div className="h-full bg-gradient-to-r from-white/20 via-white to-white/20 rounded-full animate-bar-fill relative overflow-hidden">
          <div className="absolute inset-y-0 w-8 bg-white/60 blur-sm animate-shimmer" />
        </div>
      </div>
      <p className="mt-4 text-center text-[10px] font-bold text-white/25 uppercase tracking-widest animate-splash-text" style={{ animationDelay: '0.7s', opacity: 0 }}>
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
            <Route path="/subject-manuals" element={<SubjectManuals role={role} />} />
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

            {role === 'admin' && (
              <>
                <Route path="/admin/staff" element={<AdminStaff />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
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
