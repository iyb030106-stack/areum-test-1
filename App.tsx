
import React, { useState, useEffect } from 'react';
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
import { UserRole } from './types';

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
    <div className="size-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
    <p className="text-slate-400 text-sm font-bold">로딩 중...</p>
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser.uid);
        setCurrentUser(userData);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-200 flex items-start justify-center">
        <div className="w-full max-w-md min-h-screen bg-slate-50 flex items-center justify-center">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-200 dark:bg-slate-900 flex items-start justify-center">
        <div className="w-full max-w-md min-h-screen bg-slate-50 dark:bg-slate-950 shadow-2xl overflow-hidden relative">
          <Router>
            <Routes>
              <Route path="/login" element={<Login onLogin={setCurrentUser} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </div>
      </div>
    );
  }

  const role = currentUser.role as UserRole;

  return (
    <Router>
      <Layout role={role} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Home role={role} />} />
          <Route path="/subject-manuals" element={<SubjectManuals />} />
          <Route path="/ai" element={<AIGuide />} />
          <Route path="/announcements" element={<Announcements role={role} />} />
          <Route path="/announcements/:id" element={<AnnouncementDetail role={role} />} />
          <Route path="/announcements/new" element={<AnnouncementEdit />} />
          <Route path="/announcements/:id/edit" element={<AnnouncementEdit />} />
          <Route path="/mypage" element={<StoreInfo role={role} currentUser={currentUser} onLogout={handleLogout} />} />
          <Route path="/mypage/activity" element={<MyActivityDetail />} />
          <Route path="/chat/:memberId" element={<ChatRoom currentUser={currentUser} />} />
          <Route path="/manuals/:catId" element={<ManualCategory role={role} />} />
          <Route path="/manuals/:catId/new" element={<ManualEdit />} />
          <Route path="/manuals/:catId/:taskId" element={<TaskDetail role={role} />} />
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
  );
};

export default App;
