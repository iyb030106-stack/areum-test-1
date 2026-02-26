
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getChatId, sendMessage, subscribeToMessages, deleteChatRoomForUser, ChatMessage } from '../services/chatService';
import { FirestoreUser } from '../services/authService';

interface ChatRoomProps {
    currentUser: FirestoreUser;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ currentUser }) => {
    const { memberId } = useParams<{ memberId: string }>();
    const navigate = useNavigate();
    const [otherUser, setOtherUser] = useState<FirestoreUser | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const chatId = memberId ? getChatId(currentUser.uid, memberId) : '';

    // 상대방 유저 정보 실시간 구독
    useEffect(() => {
        if (!memberId) return;
        const unsubscribe = onSnapshot(doc(db, 'users', memberId), (snap) => {
            if (snap.exists()) {
                setOtherUser({ uid: snap.id, ...snap.data() } as FirestoreUser);
            }
        });
        return unsubscribe;
    }, [memberId]);

    // 실시간 메시지 구독
    useEffect(() => {
        if (!chatId) return;
        const unsubscribe = subscribeToMessages(chatId, (msgs) => {
            setMessages(msgs);
        });
        return unsubscribe;
    }, [chatId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 메뉴 외부 클릭 닫기
    useEffect(() => {
        if (!showMenu) return;
        const handler = () => setShowMenu(false);
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, [showMenu]);

    const handleSend = async () => {
        if (!input.trim() || !memberId || !otherUser) return;
        const text = input.trim();
        setInput('');
        await sendMessage(chatId, currentUser.uid, currentUser.name, memberId, text);
    };

    const formatTime = (ts: any) => {
        if (!ts) return '';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    };

    if (!otherUser) {
        return (
            <div className="flex flex-col items-center justify-center fixed inset-0 bg-white dark:bg-slate-950 z-[100]">
                <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#F5F8FF] dark:bg-slate-950 max-w-md mx-auto h-[100dvh]">
            {/* 헤더 */}
            <header className="shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/50 dark:border-slate-800 px-4 py-3 flex items-center gap-3 z-20">
                <button
                    onClick={() => navigate(-1)}
                    className="size-10 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-base font-black text-slate-900 dark:text-white truncate">{otherUser.name}</h2>
                    <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1.5">
                        <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50"></span>
                        현재 활동 중
                    </p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="size-10 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 transition-colors"
                >
                    <span className="material-symbols-outlined">more_vert</span>
                </button>

                {/* 메뉴 팝오버 */}
                {showMenu && (
                    <div className="absolute top-full right-4 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in py-1">
                        <button
                            onClick={() => {
                                if (window.confirm('채팅방을 나갈까요?\n대화 목록에서만 사라지며, 상대방이 메시지를 보내면 다시 나타납니다.')) {
                                    deleteChatRoomForUser(chatId, currentUser.uid).then(() => navigate('/mypage'));
                                }
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            채팅방 삭제
                        </button>
                    </div>
                )}
            </header>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 no-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <div className={`size-20 rounded-3xl ${otherUser.avatarColor} flex items-center justify-center mb-4 shadow-xl`}>
                            {otherUser.avatarUrl ? (
                                <img src={otherUser.avatarUrl} alt={otherUser.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className={`text-2xl font-black ${otherUser.avatarTextColor}`}>{otherUser.initial}</span>
                            )}
                        </div>
                        <p className="text-sm font-black text-slate-800 dark:text-white mt-1">{otherUser.name}</p>
                        <p className="text-[11px] text-slate-300 font-medium mt-3">메시지를 보내 대화를 시작해보세요</p>
                    </div>
                )}

                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.uid;
                    const isSame = idx > 0 && messages[idx - 1].senderId === msg.senderId;

                    return (
                        <div
                            key={msg.id}
                            className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isSame ? 'mt-0.5' : 'mt-5'}`}
                        >
                            {!isMe && (
                                <div className={`size-8 rounded-xl ${otherUser.avatarColor} flex items-center justify-center shrink-0 overflow-hidden ${isSame ? 'opacity-0 pointer-events-none' : ''}`}>
                                    {otherUser.avatarUrl ? (
                                        <img src={otherUser.avatarUrl} alt={otherUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className={`text-xs font-black ${otherUser.avatarTextColor}`}>{otherUser.initial}</span>
                                    )}
                                </div>
                            )}
                            <div className={`flex flex-col max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && !isSame && (
                                    <p className="text-[10px] font-black text-slate-500 mb-1 ml-1">{otherUser.name}</p>
                                )}
                                <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                                    <span className="text-[9px] text-slate-400 font-bold mb-0.5 shrink-0">{formatTime(msg.timestamp)}</span>
                                    <div className={`px-4 py-2.5 text-sm font-medium leading-relaxed break-words ${isMe
                                        ? 'bg-primary text-white rounded-2xl rounded-br-sm shadow-lg shadow-primary/20'
                                        : 'bg-white/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-white/60 dark:border-slate-700 rounded-2xl rounded-bl-sm shadow-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {isTyping && (
                    <div className="flex items-end gap-2 mt-5">
                        <div className={`size-8 rounded-xl ${otherUser.avatarColor} flex items-center justify-center shrink-0 overflow-hidden`}>
                            {otherUser.avatarUrl ? (
                                <img src={otherUser.avatarUrl} alt={otherUser.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className={`text-xs font-black ${otherUser.avatarTextColor}`}>{otherUser.initial}</span>
                            )}
                        </div>
                        <div className="bg-white/90 border border-white/60 rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-sm">
                            <div className="flex gap-1 items-center h-4">
                                <span className="size-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="size-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="size-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} className="h-4 shrink-0" />
            </div>

            {/* 입력창 */}
            <div className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100/60 dark:border-slate-800 px-4 py-3 pb-[calc(14px+env(safe-area-inset-bottom))] flex items-center gap-3 z-30">
                <div className="flex-1 flex items-center bg-slate-100/80 dark:bg-slate-800 rounded-2xl px-4 py-2.5 gap-2 border border-slate-200/60 dark:border-slate-700 group focus-within:border-primary/50 transition-all shadow-inner">
                    <input
                        ref={inputRef}
                        className="flex-1 bg-transparent text-sm font-bold text-slate-800 dark:text-white outline-none placeholder:text-slate-400 py-0.5"
                        placeholder="메시지를 입력하세요..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    />
                    {input && (
                        <button onClick={() => setInput('')} className="text-slate-400 hover:text-red-400 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                        </button>
                    )}
                </div>
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="size-10 rounded-2xl bg-primary flex items-center justify-center text-white active:scale-90 transition-all disabled:opacity-30 shadow-lg shadow-primary/25 shrink-0"
                >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
            </div>
        </div>
    );
};

export default ChatRoom;
