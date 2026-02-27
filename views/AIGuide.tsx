
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatMessage, UserRole, ManualCategory, ManualItem } from '../types';
import { FlowyIcon } from '../components/Layout';
import {
  subscribeToAllManuals,
  subscribeToCategories,
  createManualCategory,
  createManualItem,
} from '../services/manualService';
import { useChat } from '../contexts/ChatContext';

interface AIGuideProps {
  role: UserRole;
}

const AIGuide: React.FC<AIGuideProps> = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPrompt = (location.state as any)?.prompt || '';
  const [input, setInput] = useState('');
  const [categories, setCategories] = useState<ManualCategory[]>([]);
  const [manuals, setManuals] = useState<ManualItem[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messagesMap, isLoading, sendMessage, stopMessage, resetChat } = useChat();
  const messages = messagesMap[role] || [];

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
    if (initialPrompt && messages.length <= 1) {
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

    setInput('');
    const context = role === 'staff'
      ? getManualContext()
      : `현재 등록된 카테고리 목록: ${categories.map(c => `${c.name}(${c.type})`).join(', ')}`;

    await sendMessage(textToSend, role, context);
  };

  // 대화 초기화 함수 
  const handleReset = () => {
    if (window.confirm('지금까지의 대화 내역을 모두 지우고 새로 시작할까요?')) {
      resetChat(role);
    }
  };

  // AI 제안 내용을 실제 시스템에 적용
  const handleApplyStructure = async (jsonStr: string) => {
    if (isApplying) return;
    try {
      setIsApplying(true);
      const data = JSON.parse(jsonStr);
      if (data.requestType !== 'STRUCTURE_MANUAL') {
        alert('올바른 매뉴얼 데이터 형식이 아닙니다.');
        return;
      }

      if (data.groups && Array.isArray(data.groups)) {
        for (let i = 0; i < data.groups.length; i++) {
          const group = data.groups[i];

          // 중복 카테고리 체크
          const existingCat = categories.find(
            c => c.name === group.category.name && c.type === group.category.type
          );

          let catId;
          if (existingCat) {
            catId = existingCat.id;
          } else {
            catId = await createManualCategory({
              ...group.category,
              order: categories.length + i,
              colorClass: group.category.type === 'admin' ? 'text-slate-500/80' : 'text-primary/80',
              bgClass: group.category.type === 'admin' ? 'bg-slate-50/50' : 'bg-primary/5'
            });
          }

          for (const item of group.items) {
            await createManualItem({
              ...item,
              categoryId: catId,
              subCategory: group.category.name,
              timeEstimate: item.timeEstimate || '10분',
              level: item.level || 'Beginner',
              lastEditedBy: 'AI_ASSISTANT',
              lastEditedByName: 'Flowy AI'
            });
          }
        }
        alert(`✅ 매뉴얼이 시스템에 성공적으로 반영되었습니다!`);
      } else {
        alert('시스템에 적용할 수 있는 데이터 구조를 찾을 수 없습니다.');
      }
    } catch (err: any) {
      console.error('Apply Structure Error:', err);
      alert('매뉴얼 적용 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsApplying(false);
    }
  };


  // 메시지에서 JSON 코드 블록 추출 (더 유연하게)
  const extractJson = (content: string) => {
    // 1. ```json 블록 찾기
    const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) return jsonBlockMatch[1].trim();

    // 2. 그냥 ``` 블록 찾기
    const genericBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/);
    if (genericBlockMatch) {
      const text = genericBlockMatch[1].trim();
      if (text.startsWith('{') && text.endsWith('}')) return text;
    }

    // 3. 문장 속에 포함된 { } 찾기 (가장 큰 범위)
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const potentialJson = content.substring(firstBrace, lastBrace + 1);
      try {
        JSON.parse(potentialJson);
        return potentialJson;
      } catch (e) {
        return null;
      }
    }

    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] overflow-hidden relative font-display">
      <header className="flex items-center gap-5 bg-white/55 backdrop-blur-xl dark:bg-background-dark/55 px-7 pt-14 pb-5 border-b border-white/40 shrink-0 shadow-sm z-10 transition-all">
        <div className={`flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-white shadow-inner ${role === 'admin' ? 'text-emerald-500' : 'text-primary'}`}>
          <FlowyIcon className="size-7" />
        </div>
        <div className="flex flex-col flex-1">
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            {role === 'admin' ? '관리자 AI 비서' : 'Flowy AI 가이드'}
          </h2>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ${role === 'admin' ? 'text-emerald-500' : 'text-primary'}`}>
            {role === 'admin' ? 'Manual Architect Mode' : 'Knowledge Bank Mode'}
          </span>
        </div>
        <button
          onClick={handleReset}
          className="size-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
          title="대화 초기화"
        >
          <span className="material-symbols-outlined">restart_alt</span>
        </button>
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
                        disabled={isApplying}
                        className={`w-full py-3 ${isApplying ? 'bg-slate-400' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-xl text-[12px] font-black transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2`}
                      >
                        {isApplying && <div className="size-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                        {isApplying ? '시스템 적용 중...' : '시스템에 즉시 적용하기'}
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
          {isLoading ? (
            <button
              onClick={stopMessage}
              className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-red-500 text-white shadow-xl shadow-red-500/20 active:scale-95 shrink-0 transition-all"
              title="중단하기"
            >
              <span className="material-symbols-outlined text-2xl animate-pulse">stop</span>
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className={`flex h-14 w-14 items-center justify-center rounded-[1.5rem] text-white disabled:opacity-50 active:scale-95 shadow-2xl shrink-0 ${role === 'admin' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-primary shadow-primary/30'}`}
            >
              <span className="material-symbols-outlined text-2xl">send</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIGuide;
