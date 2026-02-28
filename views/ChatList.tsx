
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { FirestoreUser } from '../services/authService';
import { subscribeToUserChats, deleteChatRoomForUser, ChatRoom as ChatRoomType } from '../services/chatService';

interface ChatListProps {
    currentUser: FirestoreUser;
}

const ChatList: React.FC<ChatListProps> = ({ currentUser }) => {
    const navigate = useNavigate();
    const [members, setMembers] = useState<FirestoreUser[]>([]);
    const [activeChats, setActiveChats] = useState<ChatRoomType[]>([]);
    const [viewMode, setViewMode] = useState<'chats' | 'members'>('chats');

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const list = snapshot.docs.map(d => ({ uid: d.id, ...d.data() })) as FirestoreUser[];
            setMembers(list);
        });
        return unsubscribe;
    }, []);

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

    return (
        <div className="pb-32 min-h-screen relative">
            <header className="sticky top-0 z-20 bg-white/55 dark:bg-slate-900/55 backdrop-blur-xl px-6 pt-14 pb-4 border-b border-white/40 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">채팅</h2>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('chats')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${viewMode === 'chats' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}
                        >
                            채팅방
                        </button>
                        <button
                            onClick={() => setViewMode('members')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${viewMode === 'members' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}
                        >
                            멤버
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-5 pt-6 space-y-6">
                {viewMode === 'chats' ? (
                    <section className="space-y-4">
                        {activeChats.filter(chat => getMemberFromChat(chat)).length > 0 ? (
                            <div className="bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] overflow-hidden border border-white/40 dark:border-slate-700 shadow-sm divide-y divide-slate-100/60 dark:divide-slate-700/60">
                                {activeChats
                                    .filter(chat => getMemberFromChat(chat))
                                    .map(chat => {
                                        const otherMember = getMemberFromChat(chat)!;
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
                            <div className="text-center py-20 opacity-40">
                                <span className="material-symbols-outlined text-4xl mb-2">chat_bubble_outline</span>
                                <p className="text-xs font-black">아직 시작된 대화가 없습니다</p>
                                <button
                                    onClick={() => setViewMode('members')}
                                    className="mt-4 text-[11px] font-black text-primary underline"
                                >
                                    멤버 목록에서 대호 시작하기
                                </button>
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="space-y-8 animate-fade-in">
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
                                        className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all group ${member.uid === currentUser.uid ? 'cursor-default opacity-80' : 'hover:bg-white/60 active:scale-[0.98]'}`}
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
                                            {member.uid !== currentUser.uid && (
                                                <span className="material-symbols-outlined text-slate-300 text-[16px] group-hover:text-primary transition-colors">
                                                    chat_bubble_outline
                                                </span>
                                            )}
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
                                        className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all group ${member.uid === currentUser.uid ? 'cursor-default opacity-80' : 'hover:bg-white/60 active:scale-[0.98]'}`}
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
                                            {member.uid !== currentUser.uid && (
                                                <span className="material-symbols-outlined text-slate-300 text-[16px] group-hover:text-primary transition-colors">
                                                    chat_bubble_outline
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default ChatList;
