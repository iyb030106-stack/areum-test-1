
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { FirestoreUser, updateUserProfile, deleteUserAccount } from '../services/authService';
import { subscribeToUserChats, deleteChatRoomForUser, ChatRoom as ChatRoomType } from '../services/chatService';
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

  // Firestore 멤버 목록 실시간 구독
  const [members, setMembers] = useState<FirestoreUser[]>([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ uid: d.id, ...d.data() })) as FirestoreUser[];
      setMembers(list);
    });
    return unsubscribe;
  }, []);

  // Firestore 채팅 목록 실시간 구독
  const [activeChats, setActiveChats] = useState<ChatRoomType[]>([]);
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = subscribeToUserChats(currentUser.uid, (chats) => {
      setActiveChats(chats);
    });
    return unsubscribe;
  }, [currentUser?.uid]);

  const handleDeleteChat = async (chatId: string, memberName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`${memberName}님과의 채팅을 목록에서 삭제할까요?\n상대방의 채팅창에는 영향을 주지 않습니다.`)) {
      await deleteChatRoomForUser(chatId, currentUser.uid);
    }
  };

  const getMemberFromChat = (chat: ChatRoomType) => {
    const otherUid = chat.participants.find(uid => uid !== currentUser.uid);
    return members.find(m => m.uid === otherUid);
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  // Firestore에서 내가 쓴 공지사항 실시간 구독
  const [myNotices, setMyNotices] = useState<Announcement[]>([]);
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, 'announcements'),
      where('authorId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setMyNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Announcement[]);
    });
    return unsub;
  }, [currentUser?.uid]);

  // Firestore에서 내가 편집한 매뉴얼 실시간 구독
  const [myManuals, setMyManuals] = useState<ManualItem[]>([]);
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeToMyManuals(currentUser.uid, setMyManuals);
    return unsub;
  }, [currentUser?.uid]);

  // Firestore에서 내가 스크랩한 매뉴얼 실시간 구독
  const [scrappedManuals, setScrappedManuals] = useState<ManualItem[]>([]);
  useEffect(() => {
    if (!currentUser?.uid || role !== 'staff') return;
    const unsub = subscribeToScrappedManuals(currentUser.uid, setScrappedManuals);
    return unsub;
  }, [currentUser?.uid, role]);
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
      <header className="sticky top-0 z-20 flex items-center bg-white/55 dark:bg-background-dark/55 backdrop-blur-xl px-4 pt-14 pb-4 border-b border-white/40 justify-center">
        <h2 className="text-slate-900 dark:text-white text-lg font-bold">마이페이지</h2>
      </header>

      {/* 프로필 카드 */}
      <div className="px-5 pt-6 pb-2">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-indigo-600 rounded-[2.5rem] p-6 shadow-2xl shadow-primary/20">
          {/* 배경 장식 */}
          <div className="absolute -top-8 -right-8 size-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-4 size-24 bg-white/5 rounded-full" />

          <div className="relative flex items-center gap-5">
            {/* 아바타 */}
            <div className={`relative size-[60px] rounded-[1.5rem] ${currentUser.avatarColor || 'bg-white/20'} flex items-center justify-center shrink-0 shadow-lg border-2 border-white/30 overflow-hidden`}>
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span className={`text-2xl font-black ${currentUser.avatarTextColor || 'text-white'}`}>
                  {currentUser.initial || currentUser.name?.[0] || '?'}
                </span>
              )}
            </div>

            {/* 이름/직책 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[11px] font-black text-white/60 uppercase tracking-widest">
                  {role === 'admin' ? '관리자' : '직원'}
                </p>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="bg-white/20 hover:bg-white/30 text-white text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors"
                >
                  수정
                </button>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {currentUser.name}님 👋
              </h2>
              <p className="text-[11px] text-white/70 font-bold mt-0.5">
                {currentUser.position}{currentUser.subject ? ` · ${currentUser.subject}` : ''}
              </p>
            </div>

            {/* 로그아웃 */}
            <button
              onClick={handleLogoutClick}
              className="shrink-0 flex items-center gap-1 bg-white/15 hover:bg-white/25 border border-white/20 px-3 py-2 rounded-xl transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-white text-[16px]">logout</span>
              <span className="text-white text-[10px] font-black">로그아웃</span>
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

        {/* 채팅 섹션 */}
        <section className="space-y-4">
          <div className="flex items-center gap-4 px-1">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">채팅</h3>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
          </div>

          {activeChats.length > 0 ? (
            <div className="bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] overflow-hidden border border-white/40 dark:border-slate-700 shadow-sm divide-y divide-slate-100/60 dark:divide-slate-700/60">
              {activeChats.map(chat => {
                const otherMember = getMemberFromChat(chat);
                if (!otherMember) return null;
                return (
                  <div key={chat.id} className="flex items-center hover:bg-white/40 transition-all">
                    <button
                      onClick={() => navigate(`/chat/${otherMember.uid}`)}
                      className="flex-1 flex items-center gap-3 px-5 py-4 text-left active:scale-[0.98] transition-all"
                    >
                      <div className={`size-11 rounded-2xl ${otherMember.avatarColor} flex items-center justify-center shrink-0 overflow-hidden`}>
                        {otherMember.avatarUrl ? (
                          <img src={otherMember.avatarUrl} alt={otherMember.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className={`text-sm font-black ${otherMember.avatarTextColor}`}>{otherMember.initial}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 dark:text-white">{otherMember.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{chat.lastMessage}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold shrink-0">{formatTime(chat.lastMessageTime)}</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, otherMember.name, e)}
                      className="px-3 py-4 text-slate-300 hover:text-red-400 transition-colors shrink-0"
                      title="채팅방 삭제"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] p-8 border border-white/40 dark:border-slate-700 shadow-sm text-center">
              <span className="material-symbols-outlined text-3xl text-slate-300 mb-2 block">chat_bubble_outline</span>
              <p className="text-xs font-bold text-slate-400">아직 시작된 대화가 없어요</p>
              <p className="text-[10px] text-slate-300 font-medium mt-1">멤버를 눌러 채팅을 시작하세요</p>
            </div>
          )}
        </section>

        {/* Members Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-4 px-1">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">Members</h3>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            <span className="text-[10px] font-black text-slate-400">{members.length}명</span>
          </div>

          {/* 관리자 */}
          <div className="bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] p-5 border border-white/40 dark:border-slate-700 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-indigo-400">admin_panel_settings</span>
              관리자
            </p>
            <div className="space-y-1">
              {members.filter(m => m.role === 'admin').map(member => (
                <button
                  key={member.uid}
                  onClick={() => member.uid !== currentUser.uid && navigate(`/chat/${member.uid}`)}
                  className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all ${member.uid === currentUser.uid ? 'cursor-default opacity-80' : 'hover:bg-white/60 active:scale-[0.98]'}`}
                >
                  <div className={`size-10 rounded-2xl ${member.avatarColor} flex items-center justify-center shrink-0 overflow-hidden`}>
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-sm font-black ${member.avatarTextColor}`}>{member.initial}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-black text-slate-800 dark:text-white">
                      {member.name} {member.uid === currentUser.uid && <span className="text-[9px] text-primary font-bold">(나)</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold">{member.position}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-indigo-50 text-indigo-500 uppercase tracking-wider">관리자</span>
                    {member.uid !== currentUser.uid && <span className="material-symbols-outlined text-slate-300 text-[16px]">chat_bubble_outline</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 직원 */}
          <div className="bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] p-5 border border-white/40 dark:border-slate-700 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-blue-400">badge</span>
              직원
            </p>
            <div className="space-y-1">
              {members.filter(m => m.role === 'staff').map(member => (
                <button
                  key={member.uid}
                  onClick={() => member.uid !== currentUser.uid && navigate(`/chat/${member.uid}`)}
                  className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all ${member.uid === currentUser.uid ? 'cursor-default opacity-80' : 'hover:bg-white/60 active:scale-[0.98]'}`}
                >
                  <div className={`size-10 rounded-2xl ${member.avatarColor} flex items-center justify-center shrink-0 overflow-hidden`}>
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-sm font-black ${member.avatarTextColor}`}>{member.initial}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-black text-slate-800 dark:text-white">
                      {member.name} {member.uid === currentUser.uid && <span className="text-[9px] text-primary font-bold">(나)</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold truncate">
                      {member.position}{member.subject ? ` · ${member.subject}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-blue-50 text-blue-500 uppercase tracking-wider">직원</span>
                    {member.uid !== currentUser.uid && <span className="material-symbols-outlined text-slate-300 text-[16px]">chat_bubble_outline</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-6 px-1">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">Academy Info</h3>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
          </div>
          <div className="space-y-4">
            {/* 학원 기본 정보 */}
            <div className="p-6 bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] border border-white/40 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-4 mb-5">
                <div className="bg-white shadow-inner size-14 rounded-3xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-slate-600">school</span>
                </div>
                <div>
                  <p className="font-black text-sm text-slate-900 dark:text-white leading-tight">학원 식별 정보</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Academy Identification</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/55 dark:bg-slate-900/55 p-3 rounded-xl border border-white/20">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">ACA 학원번호</span>
                  <span className="text-xs font-black text-primary tracking-tight">ACA-2024-0815</span>
                </div>
              </div>
            </div>

            {/* 네트워크 및 기기 정보 */}
            <div className="p-6 bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] border border-white/40 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-4 mb-5">
                <div className="bg-white shadow-inner size-14 rounded-3xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-slate-600">settings_input_component</span>
                </div>
                <div>
                  <p className="font-black text-sm text-slate-900 dark:text-white leading-tight">네트워크 및 기기 설정</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Network & Devices</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/55 dark:bg-slate-900/55 p-3 rounded-xl border border-white/20">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Wi-Fi</span>
                    <span className="text-[9px] text-slate-400 font-bold">SSID: School_Guest</span>
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">wifi-pass-99!</span>
                </div>
                <div className="flex justify-between items-center bg-white/55 dark:bg-slate-900/55 p-3 rounded-xl border border-white/20">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">프린트 연결 번호</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">#4409</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Delete Account Section */}
        <section className="pt-4 pb-10 px-1">
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-center gap-3 p-5 rounded-[2rem] bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-500 font-black active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-red-500">person_remove</span>
            탈퇴하기
          </button>
          <div className="flex flex-col items-center gap-1 mt-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-50">Areum Edu Partners</p>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em] opacity-40">System Version 1.2.0</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StoreInfo;
