
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ChatMessage, UserRole } from '../types';
import { getAIResponse } from '../services/geminiService';


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

    // 초기 메시지 생성기
    const getInitialMessage = (role: UserRole): ChatMessage => ({
        role: 'model',
        content: role === 'admin'
            ? `안녕하세요! 만나서 정말 반가워요. 😊\n\n📋 원장님이나 선생님께서 생각하시는 학원 운영 방침이나 수업 노하우를 자유롭게 적어주세요.\n✅ '출결 관리', '상담 방법' 같은 운영 지침이나 '영어 문법 지도법', '수학 오답 정리' 같은 수업 방식 모두 좋아요.\n💡 내용을 알려주시면 제가 카테고리별로 깔끔하게 정리하고 시스템에 맞게 구조화해 드릴게요!\n\n어떤 내용을 먼저 도와드릴까요? ✨`
            : '안녕하세요! 매뉴얼에 대해 궁금한 점이 있으신가요? 제가 대신 찾아드릴게요.',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    });


    // 로컬 스토리지에서 초기 데이터 로드
    useEffect(() => {
        const adminSaved = localStorage.getItem('chat_history_admin');
        const staffSaved = localStorage.getItem('chat_history_staff');

        setMessagesMap({
            admin: adminSaved ? JSON.parse(adminSaved) : [getInitialMessage('admin')],
            staff: staffSaved ? JSON.parse(staffSaved) : [getInitialMessage('staff')]
        });
    }, []);

    const sendMessage = async (text: string, role: UserRole, manualContext: string = "") => {
        const timestamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        const userMsg: ChatMessage = { role: 'user', content: text, timestamp };

        setMessagesMap(prev => {
            const newMsgs = [...(prev[role] || []), userMsg];
            localStorage.setItem(`chat_history_${role}`, JSON.stringify(newMsgs));
            return { ...prev, [role]: newMsgs };
        });

        setIsLoading(true);
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const history = (messagesMap[role] || []).slice(-5).map(m => ({ role: m.role, content: m.content }));
            const response = await getAIResponse(text, history, role, manualContext, controller.signal);

            const modelMsg: ChatMessage = {
                role: 'model',
                content: response || "답변을 드릴 수 없습니다.",
                timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
            };

            setMessagesMap(prev => {
                const newMsgs = [...(prev[role] || []), modelMsg];
                localStorage.setItem(`chat_history_${role}`, JSON.stringify(newMsgs));
                return { ...prev, [role]: newMsgs };
            });
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('AI 요청이 중단되었습니다.');
                return;
            }
            const errorMsg: ChatMessage = {
                role: 'model',
                content: "오류가 발생했습니다: " + err.message,
                timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
            };
            setMessagesMap(prev => ({ ...prev, [role]: [...(prev[role] || []), errorMsg] }));
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
        const resetMsg = getInitialMessage(role);
        localStorage.setItem(`chat_history_${role}`, JSON.stringify([resetMsg]));
        setMessagesMap(prev => ({ ...prev, [role]: [resetMsg] }));
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

