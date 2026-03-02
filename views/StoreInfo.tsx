
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { FirestoreUser, updateUserProfile, deleteUserAccount, subscribeToAllUsers } from '../services/authService';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Announcement, formatTimeAgo } from '../services/announcementService';
import { subscribeToMyManuals, ManualItem, subscribeToScrappedManuals } from '../services/manualService';

interface StoreInfoProps {
  role?: UserRole;
  currentUser: FirestoreUser;
  onLogout?: () => void;
}

const StoreInfo: React.FC<StoreInfoProps> = ({ role, currentUser, onLogout }) => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  // Firestore에서 내가 쓴 공지사항 실시간 구독
  const [myNotices, setMyNotices] = useState<Announcement[]>([]);
  useEffect(() => {
    if (!currentUser?.uid || !currentUser.academyId) return;
    const q = query(
      collection(db, 'announcements'),
      where('academyId', '==', currentUser.academyId),
      where('authorId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setMyNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Announcement[]);
    });
    return unsub;
  }, [currentUser?.uid, currentUser?.academyId]);

  // Firestore에서 내가 편집한 매뉴얼 실시간 구독
  const [myManuals, setMyManuals] = useState<ManualItem[]>([]);
  useEffect(() => {
    if (!currentUser?.uid || !currentUser.academyId) return;
    const unsub = subscribeToMyManuals(currentUser.uid, currentUser.academyId, setMyManuals);
    return unsub;
  }, [currentUser?.uid, currentUser?.academyId]);

  // Firestore에서 내가 스크랩한 매뉴얼 실시간 구독
  const [scrappedManuals, setScrappedManuals] = useState<ManualItem[]>([]);
  useEffect(() => {
    if (!currentUser?.uid || role !== 'staff') return;
    const unsub = subscribeToScrappedManuals(currentUser.uid, setScrappedManuals);
    return unsub;
  }, [currentUser?.uid, role]);

  // 전체 사용자 목록 실시간 구독
  const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
  useEffect(() => {
    const unsub = subscribeToAllUsers(currentUser.academyId || '', setAllUsers);
    return unsub;
  }, [currentUser?.academyId]);

  // 다크모드 설정
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
  });

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  // 프로필 편집 상태
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editPosition, setEditPosition] = useState(currentUser?.position || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl || '');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setEditAvatarUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.uid) return;
    try {
      await updateUserProfile(currentUser.uid, {
        name: editName,
        position: editPosition,
        avatarUrl: editAvatarUrl,
      });
      setIsEditingProfile(false);
      alert('프로필이 성공적으로 수정되었습니다.\n새로고침을 하거나 재접속 시 전체 앱에 즉시 적용됩니다.');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('프로필 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser?.uid) return;

    const confirmFirst = window.confirm('정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 다시 로그인할 수 없습니다.');
    if (!confirmFirst) return;

    const confirmSecond = window.confirm('다시 한번 확인합니다. 정말로 계정을 삭제하시겠습니까?');
    if (!confirmSecond) return;

    try {
      await deleteUserAccount(currentUser.uid);
      alert('그동안 이용해주셔서 감사합니다. 계정이 삭제되었습니다.');
      // deleteUserAccount가 성공하면 auth 상태가 변해서 자동으로 메인/로그인으로 이동함
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert('보안을 위해 재로그인이 필요합니다. 로그아웃 후 다시 로그인하여 시도해주세요.');
      } else {
        alert('계정 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="pb-32 min-h-screen relative">

      {/* 헤더 */}
      <header className="sticky top-0 z-20 flex items-center bg-white/55 dark:bg-slate-900/55 backdrop-blur-xl px-4 pt-14 pb-4 border-b border-white/40 dark:border-slate-800 justify-center">
        <h2 className="text-slate-900 dark:text-white text-xl font-black tracking-tight">내 정보</h2>
        <button
          onClick={() => navigate('/settings')}
          className="absolute right-4 bottom-3 size-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 active:scale-90 transition-all z-30 shadow-sm"
        >
          <span className="material-symbols-outlined text-[22px]">
            settings
          </span>
        </button>
      </header>

      {/* 프로필 카드 */}
      <div className="px-5 pt-6 pb-2">
        <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 dark:bg-slate-800/50 dark:border-slate-700">
          <div className="relative flex items-center gap-5">
            {/* 아바타 */}
            <div className={`relative size-[60px] rounded-[1.5rem] ${currentUser.avatarColor || 'bg-slate-100'} flex items-center justify-center shrink-0 shadow-sm border-2 border-white dark:border-slate-700 overflow-hidden`}>
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span className={`text-2xl font-black ${currentUser.avatarTextColor || 'text-slate-400'}`}>
                  {currentUser.initial || currentUser.name?.[0] || '?'}
                </span>
              )}
            </div>

            {/* 이름/직책 */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">
                {(() => {
                  const roleName = role === 'admin' ? '관리자' : '직원';
                  const pos = currentUser.position || '';
                  const label = pos ? pos : roleName;
                  return currentUser.subject ? `${label} · ${currentUser.subject}` : label;
                })()}
              </p>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                {currentUser.name}님
              </h2>
            </div>

            {/* 로그아웃 대신 수정 아이콘 */}
            <button
              onClick={() => setIsEditingProfile(true)}
              className="size-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-lg active:scale-90 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* 프로필 편집 모달 */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center px-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm p-6 shadow-2xl relative animate-slide-up border border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsEditingProfile(false)}
              className="absolute top-4 right-4 text-slate-400 p-2"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">프로필 수정</h3>

            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="relative size-24 rounded-[2rem] overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-slate-200 shadow-sm mb-3">
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-slate-300">person</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/40 py-1 text-center pointer-events-none">
                    <span className="text-white text-[10px] font-bold">변경</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">이름</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">직책</label>
                <input
                  type="text"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              className="w-full mt-6 bg-primary text-white py-4 rounded-xl font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              저장하기
            </button>
          </div>
        </div>
      )}


      <main className="px-5 pt-6 space-y-10 relative z-10">
        {/* My Activity Section (Admin Only) */}
        {role === 'admin' && (
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-1">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">My Activity</h3>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] p-6 border border-white/40 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">campaign</span>
                    내가 쓴 공지사항
                  </h4>
                  <button
                    onClick={() => navigate('/mypage/activity?tab=notices')}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    전체보기
                  </button>
                </div>
                <div className="space-y-3">
                  {myNotices.length > 0 ? (
                    myNotices.slice(0, 3).map(notice => (
                      <div
                        key={notice.id}
                        onClick={() => navigate(`/announcements/${notice.id}`)}
                        className="p-3 bg-white/55 dark:bg-slate-900/55 rounded-xl border border-white/20 flex items-center justify-between active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate flex-1 mr-2">{notice.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{formatTimeAgo(notice.createdAt)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-[11px] text-slate-400 font-bold">아직 작성한 공지사항이 없어요</p>
                  )}
                </div>
              </div>

              <div className="bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] p-6 border border-white/40 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-emerald-500">edit_document</span>
                    최근 편집한 매뉴얼
                  </h4>
                  <button
                    onClick={() => navigate('/mypage/activity?tab=manuals')}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    전체보기
                  </button>
                </div>
                <div className="space-y-3">
                  {myManuals.length > 0 ? (
                    myManuals.slice(0, 3).map(manual => (
                      <div
                        key={manual.id}
                        onClick={() => navigate(`/manuals/${manual.categoryId}/${manual.id}`)}
                        className="p-3 bg-white/55 dark:bg-slate-900/55 rounded-xl border border-white/20 flex items-center justify-between active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate flex-1 mr-2">{manual.title}</span>
                        <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-[11px] text-slate-400 font-bold">아직 편집한 매뉴얼이 없어요</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Scrapped Manuals (Staff Only) */}
        {role === 'staff' && (
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-1">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">My Scraps</h3>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            </div>

            <div className="bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] p-6 border border-white/40 dark:border-slate-700 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-amber-500 fill-1">bookmark</span>
                저장한 매뉴얼
              </h4>
              <div className="space-y-3">
                {scrappedManuals.length > 0 ? (
                  scrappedManuals.slice(0, 5).map(manual => (
                    <div
                      key={manual.id}
                      onClick={() => navigate(`/manuals/${manual.categoryId}/${manual.id}`)}
                      className="p-3 bg-white/55 dark:bg-slate-900/55 rounded-xl border border-white/20 flex items-center justify-between active:scale-95 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="material-symbols-outlined text-amber-500 text-sm">bookmark</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{manual.title}</span>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-[11px] text-slate-400 font-bold">저장된 매뉴얼이 없습니다.</p>
                )}
              </div>
            </div>
          </section>
        )}
        {/* 멘버 목록 섹션 (카카오톡 스타일) */}
        <section className="space-y-1">
          <div className="flex items-center gap-4 px-1 mb-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">Members</h3>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            <span className="text-[10px] font-bold text-slate-300">{allUsers.length}명</span>
          </div>

          {/* 나 먼저 */}
          <div className="flex items-center gap-3.5 px-2 py-3">
            <div className={`relative size-[46px] rounded-[1.2rem] ${currentUser.avatarColor || 'bg-slate-100'} flex items-center justify-center shrink-0 shadow-sm overflow-hidden`}>
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="me" className="w-full h-full object-cover" />
              ) : (
                <span className={`text-lg font-black ${currentUser.avatarTextColor || 'text-slate-400'}`}>{currentUser.initial || currentUser.name?.[0]}</span>
              )}
              <div className="absolute bottom-0 inset-x-0 h-[5px] bg-primary/80" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-slate-900 dark:text-white leading-tight">{currentUser.name} <span className="text-primary text-[10px] font-black">나</span></p>
              <p className="text-[11px] text-slate-400 font-medium">{currentUser.position || (role === 'admin' ? '관리자' : '직원')}</p>
            </div>
          </div>

          {/* 관리자 그룹 */}
          {allUsers.filter(u => u.role === 'admin' && u.uid !== currentUser.uid).length > 0 && (
            <>
              <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 px-2 pt-3 pb-1">
                관리자 {allUsers.filter(u => u.role === 'admin').length}
              </p>
              {allUsers.filter(u => u.role === 'admin' && u.uid !== currentUser.uid).map(user => (
                <div key={user.uid} className="flex items-center gap-3.5 px-2 py-3">
                  <div className={`size-[46px] rounded-[1.2rem] ${user.avatarColor || 'bg-slate-100'} flex items-center justify-center shrink-0 shadow-sm overflow-hidden`}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-lg font-black ${user.avatarTextColor || 'text-slate-400'}`}>{user.initial || user.name?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-900 dark:text-white leading-tight">{user.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{user.position || '관리자'}{user.subject ? ` · ${user.subject}` : ''}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* 직원 그룹 */}
          {allUsers.filter(u => u.role === 'staff').length > 0 && (
            <>
              <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 px-2 pt-3 pb-1">
                직원 {allUsers.filter(u => u.role === 'staff').length}
              </p>
              {allUsers.filter(u => u.role === 'staff' && u.uid !== currentUser.uid).map(user => (
                <div key={user.uid} className="flex items-center gap-3.5 px-2 py-3">
                  <div className={`size-[46px] rounded-[1.2rem] ${user.avatarColor || 'bg-slate-100'} flex items-center justify-center shrink-0 shadow-sm overflow-hidden`}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-lg font-black ${user.avatarTextColor || 'text-slate-400'}`}>{user.initial || user.name?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-900 dark:text-white leading-tight">{user.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{user.position || '직원'}{user.subject ? ` · ${user.subject}` : ''}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </section>
        <section className="pt-4 pb-10 px-1 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-50">Areum Edu Partners</p>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em] opacity-40">System Version 1.2.0</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StoreInfo;
