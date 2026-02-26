
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { FirestoreUser } from '../services/authService';
import { subscribeToUserChats, deleteChatRoom, ChatRoom as ChatRoomType } from '../services/chatService';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Announcement, formatTimeAgo } from '../services/announcementService';
import { subscribeToMyManuals, ManualItem } from '../services/manualService';

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
    if (window.confirm(`${memberName}님과의 채팅방을 삭제할까요?`)) {
      await deleteChatRoom(chatId);
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


  return (
    <div className="pb-32 min-h-screen relative">
      <header className="sticky top-0 z-20 flex items-center bg-white/55 dark:bg-background-dark/55 backdrop-blur-xl px-4 pt-14 pb-4 border-b border-white/40 justify-center">
        <h2 className="text-slate-900 dark:text-white text-lg font-bold">마이페이지</h2>
      </header>

      <main className="px-5 pt-8 space-y-10 relative z-10">
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
                <p className="text-center py-4 text-[11px] text-slate-400 font-bold">저장된 매뉴얼이 없습니다.</p>
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
                      <div className={`size-11 rounded-2xl ${otherMember.avatarColor} flex items-center justify-center shrink-0`}>
                        <span className={`text-sm font-black ${otherMember.avatarTextColor}`}>{otherMember.initial}</span>
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
                  <div className={`size-10 rounded-2xl ${member.avatarColor} flex items-center justify-center shrink-0`}>
                    <span className={`text-sm font-black ${member.avatarTextColor}`}>{member.initial}</span>
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
                  <div className={`size-10 rounded-2xl ${member.avatarColor} flex items-center justify-center shrink-0`}>
                    <span className={`text-sm font-black ${member.avatarTextColor}`}>{member.initial}</span>
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

        {/* Logout Section */}
        <section className="pt-4 pb-10">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-3 p-5 rounded-[2rem] bg-white/55 backdrop-blur-md border border-white/40 text-slate-900 font-black active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-slate-900">logout</span>
            로그아웃
          </button>
          <p className="text-center text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-widest opacity-50">Flowy v1.0.0</p>
        </section>
      </main>
    </div>
  );
};

export default StoreInfo;
