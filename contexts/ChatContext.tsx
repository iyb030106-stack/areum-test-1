
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, UserRole } from '../types';
import { getAIResponseStream } from '../services/geminiService';
import { auth } from '../services/firebase';


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

    // 로컬 스토리지에서 초기 데이터 로드 (현재 사용자/학원 기준)
    const currentUid = auth.currentUser?.uid;
    const historyKey = useCallback((role: string) => {
        return `chat_history_${currentUid}_${role}`;
    }, [currentUid]);

    useEffect(() => {
        if (!currentUid) return;

        const adminSaved = localStorage.getItem(historyKey('admin'));
        const staffSaved = localStorage.getItem(historyKey('staff'));

        const parse = (saved: string | null): ChatMessage[] => {
            if (!saved) return [];
            try {
                const parsed: ChatMessage[] = JSON.parse(saved);
                if (parsed.length === 1 && parsed[0].role === 'model') return [];
                return parsed;
            } catch {
                return [];
            }
        };

        setMessagesMap({
            admin: parse(adminSaved),
            staff: parse(staffSaved)
        });
    }, [currentUid, historyKey]);

    const sendMessage = useCallback(async (text: string, role: UserRole, manualContext: string = "") => {
        const timestamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        const userMsg: ChatMessage = { role: 'user', content: text, timestamp };

        // 1. 사용자 메시지 추가
        let baseMessages: ChatMessage[] = [];
        setMessagesMap(prev => {
            const newMsgs = [...(prev[role] || []), userMsg];
            baseMessages = newMsgs;
            if (currentUid) localStorage.setItem(historyKey(role), JSON.stringify(newMsgs));
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
                if (currentUid) localStorage.setItem(historyKey(role), JSON.stringify(finalMsgs));
                return prev;
            });

        } catch (err: any) {
            if (err.name === 'AbortError') {
                // 중단 시 지금까지 쌓인 내용 저장
                setMessagesMap(prev => {
                    const msgs = prev[role] || [];
                    if (msgs.length > 0 && msgs[msgs.length - 1].role === 'model' && !msgs[msgs.length - 1].content) {
                        const trimmed = msgs.slice(0, -1);
                        if (currentUid) localStorage.setItem(historyKey(role), JSON.stringify(trimmed));
                        return { ...prev, [role]: trimmed };
                    }
                    if (currentUid) localStorage.setItem(historyKey(role), JSON.stringify(msgs));
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
                if (currentUid) localStorage.setItem(historyKey(role), JSON.stringify(msgs));
                return { ...prev, [role]: msgs };
            });
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, []);

    const stopMessage = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
        }
    }, []);

    const resetChat = useCallback((role: UserRole) => {
        stopMessage();
        if (currentUid) localStorage.setItem(historyKey(role), JSON.stringify([]));
        setMessagesMap(prev => ({ ...prev, [role]: [] }));
    }, [stopMessage, currentUid, historyKey]);

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
