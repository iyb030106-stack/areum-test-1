
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { UserRole } from './types';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    return localStorage.getItem('flowy_user_role') as UserRole | null;
  });

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    localStorage.setItem('flowy_user_role', role);
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('flowy_user_role');
  };

  if (!userRole) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout role={userRole} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Home role={userRole} />} />
          <Route path="/subject-manuals" element={<SubjectManuals />} />
          <Route path="/ai" element={<AIGuide />} />
          <Route path="/announcements" element={<Announcements role={userRole} />} />
          <Route path="/announcements/:id" element={<AnnouncementDetail role={userRole} />} />
          <Route path="/announcements/new" element={<AnnouncementEdit />} />
          <Route path="/announcements/:id/edit" element={<AnnouncementEdit />} />
          <Route path="/mypage" element={<StoreInfo role={userRole} onLogout={handleLogout} />} />
          <Route path="/mypage/activity" element={<MyActivityDetail />} />
          <Route path="/manuals/:catId" element={<ManualCategory role={userRole} />} />
          <Route path="/manuals/:catId/new" element={<ManualEdit />} />
          <Route path="/manuals/:catId/:taskId" element={<TaskDetail role={userRole} />} />
          <Route path="/manuals/:catId/:taskId/edit" element={<ManualEdit />} />
          
          {userRole === 'admin' && (
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
