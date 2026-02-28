
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ChatMessage, UserRole } from '../types';
import { getAIResponseStream } from '../services/geminiService';


interface ChatContextType {
    messagesMap: Record<string, ChatMessage[]>;
    isLoading: boolean;
    sendMessage: (text: string, role: UserRole, context?: string) => Promise<void>;
    stopMessage: () => void;
    resetChat: (role: UserRole) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used within ChatProvider");
    return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // 로컬 스토리지에서 초기 데이터 로드
    useEffect(() => {
        const adminSaved = localStorage.getItem('chat_history_admin');
        const staffSaved = localStorage.getItem('chat_history_staff');

        const parse = (saved: string | null): ChatMessage[] => {
            if (!saved) return [];
            const parsed: ChatMessage[] = JSON.parse(saved);
            // 이전 세션의 초기 AI 인사 메시지만 있으면 빈 배열로 마이그레이션
            if (parsed.length === 1 && parsed[0].role === 'model') return [];
            return parsed;
        };

        setMessagesMap({
            admin: parse(adminSaved),
            staff: parse(staffSaved)
        });
    }, []);

    const sendMessage = async (text: string, role: UserRole, manualContext: string = "") => {
        const timestamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        const userMsg: ChatMessage = { role: 'user', content: text, timestamp };

        // 1. 사용자 메시지 추가
        let baseMessages: ChatMessage[] = [];
        setMessagesMap(prev => {
            const newMsgs = [...(prev[role] || []), userMsg];
            baseMessages = newMsgs;
            localStorage.setItem(`chat_history_${role}`, JSON.stringify(newMsgs));
            return { ...prev, [role]: newMsgs };
        });

        // 2. 빈 AI 메시지 placeholder 추가 (스트리밍으로 채워짐)
        const modelTimestamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        const placeholderMsg: ChatMessage = { role: 'model', content: '', timestamp: modelTimestamp };

        setMessagesMap(prev => {
            const withPlaceholder = [...(prev[role] || []), placeholderMsg];
            return { ...prev, [role]: withPlaceholder };
        });

        setIsLoading(true);
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const history = (baseMessages).slice(-6).map(m => ({ role: m.role, content: m.content }));

            // 3. 스트리밍: 청크가 올 때마다 마지막 메시지 content를 누적 업데이트
            await getAIResponseStream(
                text,
                history,
                role,
                manualContext,
                (chunk: string) => {
                    setMessagesMap(prev => {
                        const msgs = [...(prev[role] || [])];
                        if (msgs.length === 0) return prev;
                        const lastIdx = msgs.length - 1;
                        // 마지막 메시지가 model 메시지인 경우에만 업데이트
                        if (msgs[lastIdx].role === 'model') {
                            msgs[lastIdx] = {
                                ...msgs[lastIdx],
                                content: msgs[lastIdx].content + chunk
                            };
                        }
                        return { ...prev, [role]: msgs };
                    });
                },
                controller.signal
            );

            // 4. 완료 후 로컬스토리지 저장
            setMessagesMap(prev => {
                const finalMsgs = prev[role] || [];
                localStorage.setItem(`chat_history_${role}`, JSON.stringify(finalMsgs));
                return prev;
            });

        } catch (err: any) {
            if (err.name === 'AbortError') {
                // 중단 시 지금까지 쌓인 내용 저장
                setMessagesMap(prev => {
                    const msgs = prev[role] || [];
                    if (msgs.length > 0 && msgs[msgs.length - 1].role === 'model' && !msgs[msgs.length - 1].content) {
                        // 내용 없으면 placeholder 제거
                        const trimmed = msgs.slice(0, -1);
                        localStorage.setItem(`chat_history_${role}`, JSON.stringify(trimmed));
                        return { ...prev, [role]: trimmed };
                    }
                    localStorage.setItem(`chat_history_${role}`, JSON.stringify(msgs));
                    return prev;
                });
                return;
            }

            // 오류 메시지로 placeholder 교체
            setMessagesMap(prev => {
                const msgs = [...(prev[role] || [])];
                const lastIdx = msgs.length - 1;
                if (msgs[lastIdx]?.role === 'model') {
                    msgs[lastIdx] = {
                        ...msgs[lastIdx],
                        content: "오류가 발생했습니다: " + err.message
                    };
                }
                localStorage.setItem(`chat_history_${role}`, JSON.stringify(msgs));
                return { ...prev, [role]: msgs };
            });
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const stopMessage = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
        }
    };

    const resetChat = (role: UserRole) => {
        stopMessage();
        localStorage.setItem(`chat_history_${role}`, JSON.stringify([]));
        setMessagesMap(prev => ({ ...prev, [role]: [] }));
    };

    return (
        <ChatContext.Provider value={{
            messagesMap,
            isLoading,
            sendMessage,
            stopMessage,
            resetChat
        }}>
            {children}
        </ChatContext.Provider>
    );
};
