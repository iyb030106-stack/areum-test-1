
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAIResponse } from '../services/geminiService';
import { ChatMessage, UserRole } from '../types';
import { FlowyIcon } from '../components/Layout';
import {
  subscribeToAllManuals,
  subscribeToCategories,
  createManualCategory,
  createManualItem,
  ManualCategory,
  ManualItem
} from '../services/manualService';

interface AIGuideProps {
  role: UserRole;
}

const AIGuide: React.FC<AIGuideProps> = ({ role }) => {
  const location = useLocation();
  const initialPrompt = (location.state as any)?.prompt || '';

  // 로컬 스토리지에서 이전 대화 기록 불러오기 (초기값 설정)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`chat_history_${role}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        role: 'model',
        content: role === 'admin'
          ? '안녕하세요 원장님! 정리되지 않은 매뉴얼 내용을 적어주시면 제가 체계적으로 정리해서 시스템에 등록해 드릴게요.'
          : '안녕하세요! 매뉴얼에 대해 궁금한 점이 있으신가요? 제가 대신 찾아드릴게요.',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<ManualCategory[]>([]);
  const [manuals, setManuals] = useState<ManualItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 대화 내용이 바뀔 때마다 로컬 스토리지에 자동 저장
  useEffect(() => {
    localStorage.setItem(`chat_history_${role}`, JSON.stringify(messages));
  }, [messages, role]);

  useEffect(() => {
    const unsubCats = subscribeToCategories(setCategories);
    const unsubItems = subscribeToAllManuals(setManuals);
    return () => {
      unsubCats();
      unsubItems();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt && messages.length === 1) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  // 매뉴얼 데이터를 AI가 읽기 쉬운 텍스트 컨텍스트로 변환
  const getManualContext = () => {
    let context = "";
    categories.forEach(cat => {
      context += `\n[카테고리: ${cat.name} (${cat.type === 'admin' ? '운영' : '수업'})]\n`;
      const catItems = manuals.filter(m => m.categoryId === cat.id);
      catItems.forEach(item => {
        context += `- ${item.title}: ${item.description}\n  단계: ${item.steps.join(' > ')}\n`;
      });
    });
    return context;
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;
    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));
      const context = role === 'staff' ? getManualContext() : "";
      const response = await getAIResponse(textToSend, history, role, context);

      setMessages((prev) => [...prev, {
        role: 'model',
        content: response || "답변을 생성할 수 없습니다.",
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        role: 'model',
        content: err.message || "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // AI 제안 내용을 실제 시스템에 적용
  const handleApplyStructure = async (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.requestType !== 'STRUCTURE_MANUAL') return;

      setIsLoading(true);

      // 1. 카테고리 생성 (기존에 있나 확인은 일단 생략하고 새로 생성)
      const catId = await createManualCategory({
        ...data.category,
        order: categories.length,
        colorClass: 'text-primary/80',
        bgClass: 'bg-primary/5'
      });

      // 2. 항목들 생성
      for (const item of data.items) {
        await createManualItem({
          ...item,
          categoryId: catId,
          subCategory: 'AI 추천 섹션',
          lastEditedBy: 'AI_ASSISTANT',
          lastEditedByName: 'Flowy AI'
        });
      }

      setMessages(prev => [...prev, {
        role: 'model',
        content: `✅ 성공적으로 '${data.category.name}' 카테고리와 ${data.items.length}개의 매뉴얼 항목을 등록했습니다! 이제 메뉴에서 확인하실 수 있습니다.`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (err) {
      alert('적용 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 메시지에서 JSON 코드 블록 추출
  const extractJson = (content: string) => {
    const match = content.match(/```json\n([\s\S]*?)\n```/);
    return match ? match[1] : null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] overflow-hidden relative font-display">
      <header className="flex items-center gap-5 bg-white/55 backdrop-blur-xl dark:bg-background-dark/55 px-7 pt-14 pb-5 border-b border-white/40 shrink-0 shadow-sm z-10 transition-all">
        <div className={`flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-white shadow-inner ${role === 'admin' ? 'text-emerald-500' : 'text-primary'}`}>
          <FlowyIcon className="size-7" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            {role === 'admin' ? '관리자 AI 비서' : 'Flowy AI 가이드'}
          </h2>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ${role === 'admin' ? 'text-emerald-500' : 'text-primary'}`}>
            {role === 'admin' ? 'Manual Architect Mode' : 'Knowledge Bank Mode'}
          </span>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-16 relative z-10">
        {messages.map((msg, idx) => {
          const jsonContent = msg.role === 'model' ? extractJson(msg.content) : null;
          const displayContent = msg.content.replace(/```json\n[\s\S]*?\n```/, '').trim();

          return (
            <div key={idx} className={`flex items-start gap-3.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <div className={`h-9 w-9 rounded-xl bg-white shadow-inner flex items-center justify-center shrink-0 ${role === 'admin' ? 'text-emerald-500' : 'text-primary'}`}>
                  <FlowyIcon className="size-6" />
                </div>
              )}
              <div className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end max-w-[85%]' : 'items-start max-w-[85%]'}`}>
                <div className={`rounded-[1.75rem] px-6 py-4.5 shadow-sm text-[14px] leading-relaxed tracking-normal whitespace-pre-wrap ${msg.role === 'user'
                  ? 'rounded-tr-none bg-primary text-white shadow-xl shadow-primary/20 font-bold'
                  : 'rounded-tl-none bg-white/80 backdrop-blur-md dark:bg-slate-800/70 text-slate-800 dark:text-white border border-white/40 dark:border-slate-700 font-medium'
                  }`}>
                  {displayContent}

                  {jsonContent && (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400 text-sm">auto_awesome</span>
                        <span className="text-[11px] font-black text-emerald-400 uppercase">매뉴얼 구조화됨</span>
                      </div>
                      <p className="text-[12px] font-medium opacity-80 leading-snug">
                        AI가 입력하신 내용을 분석하여 시스템 구성을 마쳤습니다.
                      </p>
                      <button
                        onClick={() => handleApplyStructure(jsonContent)}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[12px] font-black transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                      >
                        시스템에 즉시 적용하기
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-black text-slate-400 px-2 opacity-50 uppercase tracking-tighter">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex gap-3 items-center px-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-primary/30 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce delay-150"></div>
            </div>
            <span className="text-[11px] text-primary/40 font-black italic uppercase tracking-widest">Flowy is Thinking...</span>
          </div>
        )}
      </main>

      <div className="bg-white/55 dark:bg-background-dark/55 backdrop-blur-2xl px-6 py-6 border-t border-white/40 shrink-0 shadow-2xl relative z-20">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              className={`w-full rounded-[1.5rem] border-none bg-white/55 dark:bg-slate-800/55 px-6 py-4.5 text-sm font-bold focus:ring-4 dark:text-white placeholder:text-slate-300 border border-white/40 ${role === 'admin' ? 'focus:ring-emerald-500/10' : 'focus:ring-primary/10'}`}
              placeholder={role === 'admin' ? "매뉴얼 내용을 자유롭게 적어주세요..." : "무엇이 궁금하세요?"}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
          </div>
          <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className={`flex h-14 w-14 items-center justify-center rounded-[1.5rem] text-white disabled:opacity-50 active:scale-95 shadow-2xl shrink-0 ${role === 'admin' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-primary shadow-primary/30'}`}>
            <span className="material-symbols-outlined text-2xl">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIGuide;
