
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatMessage, UserRole, ManualCategory, ManualItem } from '../types';
import { HaemaIcon } from '../components/Layout';
import {
  subscribeToAllManuals,
  subscribeToCategories,
  createManualCategory,
  createManualItem,
  updateManualItem,
  deleteManualItem,
  deleteManualCategory,
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
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
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

  // 매뉴얼 데이터를 AI가 읽기 쉬운 텍스트 컨텍스트로 변환 (ID 포함)
  const getManualContext = () => {
    let context = "";
    categories.forEach(cat => {
      context += `\n[카테고리: ${cat.name} (${cat.type === 'admin' ? '운영' : '수업'}) | 카테고리ID: ${cat.id}]\n`;
      const catItems = manuals.filter(m => m.categoryId === cat.id);
      catItems.forEach(item => {
        context += `- [ID:${item.id}] ${item.title}: ${item.description}\n  단계: ${item.steps.join(' > ')}\n`;
      });
    });
    return context;
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;

    setInput('');
    // 관리자/직원 모두 전체 컨텍스트(ID 포함)를 제공
    const context = getManualContext();
    await sendMessage(textToSend, role, context);
  };

  // 대화 초기화 함수 
  const handleReset = () => {
    if (window.confirm('지금까지의 대화 내역을 모두 지우고 새로 시작할까요?')) {
      resetChat(role);
    }
  };

  // 음성 인식 토글
  const handleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.\nChrome 또는 Edge를 사용해 주세요.');
      return;
    }

    // 이미 듣고 있으면 중단
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        console.error('음성 인식 오류:', event.error);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // AI 제안 내용을 실제 시스템에 적용 (생성 / 수정 / 삭제)
  const handleApplyStructure = async (jsonStr: string) => {
    if (isApplying) return;
    try {
      setIsApplying(true);
      const data = JSON.parse(jsonStr);

      // ── 생성 ──────────────────────────────────
      if (data.requestType === 'STRUCTURE_MANUAL') {
        if (!data.groups || !Array.isArray(data.groups)) {
          alert('시스템에 적용할 수 있는 데이터 구조를 찾을 수 없습니다.');
          return;
        }
        for (let i = 0; i < data.groups.length; i++) {
          const group = data.groups[i];
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
              lastEditedByName: 'Haema AI'
            });
          }
        }
        alert('✅ 매뉴얼이 시스템에 성공적으로 생성되었습니다!');

        // ── 수정 ──────────────────────────────────
      } else if (data.requestType === 'UPDATE_MANUAL') {
        if (!data.items || !Array.isArray(data.items)) {
          alert('수정할 매뉴얼 정보를 찾을 수 없습니다.');
          return;
        }
        for (const item of data.items) {
          if (!item.id) { alert(`ID가 없어 수정할 수 없습니다: ${item.title}`); continue; }
          const { id, ...updateData } = item;
          await updateManualItem(id, {
            ...updateData,
            lastEditedBy: 'AI_ASSISTANT',
            lastEditedByName: 'Haema AI'
          });
        }
        alert(`✅ ${data.items.length}개의 매뉴얼이 성공적으로 수정되었습니다!`);

        // ── 삭제 ──────────────────────────────────
      } else if (data.requestType === 'DELETE_MANUAL') {
        if (!data.items || !Array.isArray(data.items)) {
          alert('삭제할 매뉴얼 정보를 찾을 수 없습니다.');
          return;
        }
        const titles = data.items.map((i: any) => `"${i.title}"`).join(', ');
        const confirmed = window.confirm(`⚠️ 다음 매뉴얼을 삭제합니다:\n${titles}\n\n정말 삭제하시겠습니까?`);
        if (!confirmed) return;
        for (const item of data.items) {
          if (!item.id) { alert(`ID가 없어 삭제할 수 없습니다: ${item.title}`); continue; }
          await deleteManualItem(item.id);
        }
        alert(`🗑️ ${data.items.length}개의 매뉴얼이 삭제되었습니다.`);

        // ── 카테고리 전체 삭제 ─────────────────────────────
      } else if (data.requestType === 'DELETE_CATEGORY') {
        if (!data.categories || !Array.isArray(data.categories)) {
          alert('삭제할 카테고리 정보를 찾을 수 없습니다.');
          return;
        }
        const catNames = data.categories.map((c: any) => `"${c.name}"`).join(', ');
        const confirmed = window.confirm(`⚠️ 다음 카테고리(섹션)를 통째로 삭제합니다:\n${catNames}\n\n⚠️ 해당 카테고리 안의 모든 매뉴얼 항목도 함께 삭제됩니다!\n\n정말 삭제하시겠습니까?`);
        if (!confirmed) return;
        for (const cat of data.categories) {
          if (!cat.id) { alert(`ID가 없어 삭제할 수 없습니다: ${cat.name}`); continue; }
          await deleteManualCategory(cat.id);
        }
        alert(`🗑️ ${data.categories.length}개의 카테고리와 포함된 전체 매뉴얼이 삭제되었습니다.`);

      } else {
        alert('올바른 매뉴얼 데이터 형식이 아닙니다.');
      }
    } catch (err: any) {
      console.error('Apply Structure Error:', err);
      alert('매뉴얼 작업 중 오류가 발생했습니다: ' + err.message);
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

  const renderMessageContent = (content: string) => {
    const textOnly = content.replace(/```json\n[\s\S]*?\n```/, '').trim();
    const parts = textOnly.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700/50 px-1 rounded-sm mx-0.5">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // 메시지가 초기 환영 메시지 1개뿐인지 확인 (랜딩 뷰 표시 여부)
  const isLandingView = messages.length <= 1;

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] overflow-hidden relative font-display bg-white dark:bg-slate-950">

      {/* ── 상단 고정 헤더 (항상 표시) ── */}
      <header className="flex items-center justify-between px-6 pt-14 pb-4 shrink-0 z-10 border-b border-slate-100 dark:border-slate-800">
        {/* 로고 + HAEMA 타이틀 */}
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-[0.875rem] bg-slate-900 dark:bg-white flex items-center justify-center shadow-sm shrink-0">
            <img src="/haema_logo.png" alt="HAEMA" className="size-6 object-contain" />
          </div>
          <span className="text-[18px] font-black tracking-tight text-slate-900 dark:text-white">HAEMA</span>
        </div>

        {/* 오른쪽: 초기화 버튼 */}
        <button
          onClick={handleReset}
          className="size-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90 border border-slate-100 dark:border-slate-700"
          title="대화 초기화"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
        </button>
      </header>

      {/* ── 랜딩 뷰 (대화 없을 때) ── */}
      {isLandingView && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 pb-8">
          {/* 환영 텍스트 */}
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-[22px] font-black text-slate-900 dark:text-white leading-snug">
              무엇을 도와드릴까요?
            </p>
            <p className="text-[13px] text-slate-400 dark:text-slate-500 font-medium">
              {role === 'admin'
                ? '매뉴얼 생성·수정·삭제를 자유롭게 요청해보세요'
                : '매뉴얼에 대해 궁금한 것을 무엇이든 물어보세요'}
            </p>
          </div>

          {/* 빠른 시작 칩 — 직원 전용 (관리자는 칩 없음) */}
          {role === 'staff' && (
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {['출결 처리 방법', '상담 문의 대응', '수업 진행 순서', '비품 신청 절차'].map(chip => (
                <button
                  key={chip}
                  onClick={() => setInput(chip)}
                  className="px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[12px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 채팅 뷰 (대화 시작 후) ── */}
      {!isLandingView && (
        <main ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-6 no-scrollbar relative z-10">
          {messages.map((msg, idx) => {
            const jsonContent = msg.role === 'model' ? extractJson(msg.content) : null;
            return (
              <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && (
                  <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 border ${role === 'admin' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <img src="/haema_logo.png" alt="AI" className="size-5 object-contain" />
                  </div>
                )}
                <div className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end max-w-[82%]' : 'items-start max-w-[82%]'}`}>
                  <div className={`rounded-[1.5rem] px-5 py-3.5 text-[14px] leading-relaxed tracking-normal whitespace-pre-wrap ${msg.role === 'user'
                    ? 'rounded-tr-sm bg-slate-900 text-white font-medium dark:bg-slate-100 dark:text-slate-900'
                    : 'rounded-tl-sm bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-700 font-medium'
                    }`}>
                    {renderMessageContent(msg.content)}

                    {jsonContent && (() => {
                      let parsedType = 'UNKNOWN';
                      try { parsedType = JSON.parse(jsonContent).requestType || 'UNKNOWN'; } catch { }
                      const isCreate = parsedType === 'STRUCTURE_MANUAL';
                      const isUpdate = parsedType === 'UPDATE_MANUAL';
                      const isDelete = parsedType === 'DELETE_MANUAL';
                      const isDeleteCat = parsedType === 'DELETE_CATEGORY';
                      const labelText = isCreate ? '매뉴얼 생성 준비됨' : isUpdate ? '매뉴얼 수정 준비됨' : isDelete ? '매뉴얼 삭제 준비됨' : isDeleteCat ? '카테고리 전체 삭제 준비됨' : '작업 준비됨';
                      const btnColor = (isDelete || isDeleteCat) ? 'bg-red-500 hover:bg-red-600' : isUpdate ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600';
                      const iconColor = (isDelete || isDeleteCat) ? 'text-red-400' : isUpdate ? 'text-amber-400' : 'text-emerald-400';
                      const btnText = isCreate ? '즉시 생성하기' : isUpdate ? '즉시 수정하기' : (isDelete || isDeleteCat) ? '즉시 삭제하기' : '즉시 적용하기';
                      return (
                        <div className="mt-2 px-3 py-2 rounded-xl bg-slate-900 text-white space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`material-symbols-outlined ${iconColor} text-xs`}>
                              {isDelete ? 'delete' : isUpdate ? 'edit' : 'auto_awesome'}
                            </span>
                            <span className={`text-[9px] font-black ${iconColor} uppercase tracking-widest`}>{labelText}</span>
                          </div>
                          <button
                            onClick={() => handleApplyStructure(jsonContent)}
                            disabled={isApplying}
                            className={`w-full py-1.5 ${isApplying ? 'bg-slate-600' : btnColor} text-white rounded-lg text-[10px] font-black transition-all active:scale-95 flex items-center justify-center gap-1.5`}
                          >
                            {isApplying && <div className="size-2.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                            {isApplying ? '처리 중...' : btnText}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 px-1">{msg.timestamp}</span>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex gap-3 items-center pl-11">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ── 하단 입력창 (Genspark 스타일) ── */}
      <div className={`px-5 pb-6 pt-3 shrink-0 z-20 ${isLandingView ? '' : 'border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950'}`}>
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-[1.75rem] border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm">
          {/* + 버튼 */}
          <button
            onClick={handleReset}
            className="size-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all active:scale-90 shrink-0 shadow-sm"
            title="대화 초기화"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>

          {/* 텍스트 입력 */}
          <input
            className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
            placeholder={role === 'admin' ? '매뉴얼 관리를 요청해보세요...' : '무엇이든 물어보세요...'}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />

          {/* 전송 / 중단 버튼 */}
          {isLoading ? (
            <button
              onClick={stopMessage}
              className="size-9 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg active:scale-90 transition-all shrink-0"
              title="중단하기"
            >
              <span className="material-symbols-outlined text-[18px]">stop</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              {/* 마이크 버튼 */}
              <button
                onClick={handleVoice}
                title={isListening ? '음성 인식 중단' : '음성으로 입력'}
                className={`size-9 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0 ${isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isListening ? 'mic' : 'mic'}
                </span>
              </button>

              {/* 전송 버튼 */}
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="size-9 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-lg active:scale-90 transition-all disabled:opacity-30 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIGuide;
