
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
import { createAnnouncement, subscribeToAnnouncements, Announcement } from '../services/announcementService';
import { subscribeToFAQs, createFAQ, FAQ } from '../services/faqService';
import { auth } from '../services/firebase';
import { useChat } from '../contexts/ChatContext';

import { FirestoreUser } from '../services/authService';
import { useAcademy } from '../contexts/AcademyContext';

interface AIGuideProps {
  role: UserRole;
  currentUser?: FirestoreUser;
}

const AIGuide: React.FC<AIGuideProps> = ({ role, currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { academyId, academyName } = useAcademy();
  const initialPrompt = (location.state as any)?.prompt || '';
  const [input, setInput] = useState('');
  const [categories, setCategories] = useState<ManualCategory[]>([]);
  const [manuals, setManuals] = useState<ManualItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [importantOverrides, setImportantOverrides] = useState<Record<number, boolean>>({});
  const { messagesMap, isLoading, sendMessage, stopMessage, resetChat } = useChat();
  const messages = messagesMap[role] || [];

  useEffect(() => {
    if (!academyId) return;
    const unsubCats = subscribeToCategories(academyId, setCategories);
    const unsubItems = subscribeToAllManuals(academyId, setManuals);
    const unsubAnns = subscribeToAnnouncements(academyId, setAnnouncements);
    const unsubFaqs = subscribeToFAQs(academyId, setFaqs);
    return () => {
      unsubCats();
      unsubItems();
      unsubAnns();
      unsubFaqs();
    };
  }, [academyId, role]);

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

  // 매뉴얼, 공지사항, FAQ 데이터를 AI가 읽기 쉬운 텍스트 컨텍스트로 변환
  const getAIContext = () => {
    let context = "아래는 현재 학원의 시스템 정보입니다. 사용자의 질문에 답변할 때 이 정보를 먼저 확인하세요.\n";

    context += "\n[1. 매뉴얼 정보]\n";
    categories.forEach(cat => {
      context += `\n카테고리: ${cat.name} (${cat.type === 'admin' ? '운영' : '수업'}) | ID: ${cat.id}\n`;
      const catItems = manuals.filter(m => m.categoryId === cat.id);
      catItems.forEach(item => {
        context += `- [ID:${item.id}] 제목: ${item.title}\n  내용: ${item.description}\n  단계: ${item.steps.join(' > ')}\n`;
      });
    });

    context += "\n[2. 최근 공지사항]\n";
    if (announcements.length === 0) context += "공지사항이 없습니다.\n";
    announcements.slice(0, 10).forEach(ann => {
      context += `- [${ann.isImportant ? '중요' : '일반'}] [${ann.category}] ${ann.title}: ${ann.description} (작성: ${ann.authorName} ${ann.authorPosition})\n`;
    });

    context += "\n[3. 자주 묻는 질문 (FAQ)]\n";
    if (faqs.length === 0) context += "FAQ가 없습니다.\n";
    faqs.forEach(faq => {
      context += `Q: ${faq.question}\nA: ${faq.answer}\n`;
    });

    return context;
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;

    setInput('');
    // 관리자/직원 모두 전체 컨텍스트를 제공
    const context = getAIContext();
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
  const handleApplyStructure = async (jsonStr: string, isImportantOverride?: boolean) => {
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
              academyId,
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
              academyId,
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

        // ── 공지사항 생성 ──────────────────────────────────
      } else if (data.requestType === 'CREATE_ANNOUNCEMENT') {
        if (!data.announcements || !Array.isArray(data.announcements)) {
          alert('공지사항 데이터 구조를 찾을 수 없습니다.');
          return;
        }
        const user = auth.currentUser;
        for (const ann of data.announcements) {
          await createAnnouncement({
            title: ann.title,
            description: ann.description,
            category: ann.category || '일반',
            academyId,
            isImportant: isImportantOverride !== undefined ? isImportantOverride : (ann.isImportant ?? false),
            authorId: user?.uid || 'AI_ASSISTANT',
            authorName: currentUser?.name || user?.displayName || 'Haema AI',
            authorPosition: currentUser?.position || '관리자',
            authorInitial: (currentUser?.name?.[0] || user?.displayName?.[0] || 'H'),
          });
        }
        alert(`✅ ${data.announcements.length}개의 공지사항이 등록되었습니다!`);

        // ── FAQ 생성 ──────────────────────────────────
      } else if (data.requestType === 'CREATE_FAQ') {
        if (!data.faqs || !Array.isArray(data.faqs)) {
          alert('FAQ 데이터 구조를 찾을 수 없습니다.');
          return;
        }
        const user = auth.currentUser;
        for (const faq of data.faqs) {
          await createFAQ({
            question: faq.question,
            answer: faq.answer,
            category: faq.category || '일반',
            academyId,
            authorId: user?.uid || 'AI_ASSISTANT',
            authorName: currentUser?.name || user?.displayName || 'Haema AI',
          });
        }
        alert(`✅ ${data.faqs.length}개의 Q&A가 등록되었습니다!`);

      } else {
        alert('올바른 데이터 형식이 아닙니다.');
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

  const handleCopyText = (text: string, idx: number) => {
    // JSON 블록 제외하고 텍스트만 복사
    const textToCopy = text.replace(/```json\n[\s\S]*?\n```/, '').trim();
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(idx);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const renderMessageContent = (content: string) => {
    // 1단계: 완성된 코드 블록 제거 (언어 태그·개행 형식 무관)
    let textOnly = content
      .replace(/```[\w]*[\r\n][\s\S]*?[\r\n]```/g, '')
      .replace(/```[\s\S]*?```/g, '');

    // 2단계: 스트리밍 중 미완성 코드 블록 제거
    // (``` 로 시작했지만 아직 닫히지 않은 부분을 잘라냄)
    const openIdx = textOnly.indexOf('```');
    if (openIdx !== -1) {
      textOnly = textOnly.substring(0, openIdx);
    }

    textOnly = textOnly.trim();
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
  const isLandingView = messages.length === 0;

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden font-display bg-white dark:bg-slate-950 z-10">

      {/* ── 상단 고정 헤더 (항상 표시) ── */}
      <header className="flex items-center justify-between px-6 pt-11 pb-3 shrink-0 z-10 border-b border-slate-100 dark:border-slate-800">
        {/* 학원명 타이틀 */}
        <div
          onClick={() => navigate('/')}
          className="flex items-baseline gap-1.5 cursor-pointer active:scale-95 transition-all"
        >
          <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">HAEMA</span>
          {academyName && academyName !== 'HAEMA' && (
            <span className="text-[13px] font-bold text-slate-400 dark:text-slate-500 tracking-tight">{academyName}</span>
          )}
        </div>

        {/* 오른쪽: 버튼 그룹 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuide(true)}
            className="size-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-90 border border-slate-100 dark:border-slate-700"
            title="사용 방법 가이드"
          >
            <span className="material-symbols-outlined text-[18px]">help_outline</span>
          </button>
          <button
            onClick={handleReset}
            className="size-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90 border border-slate-100 dark:border-slate-700"
            title="대화 초기화"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          </button>
        </div>
      </header>

      {/* ── 메인 컨텐츠 영역 ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
        {/* 랜딩 뷰 (대화 없을 때) */}
        {isLandingView && (
          <div className="flex-1 flex flex-col items-center pt-12 pb-10 px-6 text-center animate-fade-in">
            {/* 해마 캐릭터 */}
            <img
              src="/haema_logo.png"
              alt="HAEMA"
              className="size-20 object-contain haema-flip animate-float drop-shadow-sm mb-8"
            />

            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              안녕하세요 !
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-[13px] leading-relaxed mb-10">
              {role === 'admin'
                ? '매뉴얼을 관리하거나 공지사항을 등록해보세요.'
                : '업무 방법이 궁금하면 저에게 물어보세요.'}
            </p>

            {/* 추천 질문 그리드 */}
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-[300px] animate-slide-up">
              {(role === 'admin' ? [
                { icon: 'edit_document', text: '매뉴얼 관리 방법' },
                { icon: 'campaign', text: '공지사항 등록' },
                { icon: 'category', text: '카테고리 생성' },
                { icon: 'settings_suggest', text: '운영 설정 변경' },
              ] : [
                { icon: 'task_alt', text: '출결 처리 방법' },
                { icon: 'campaign', text: '공지사항 확인' },
                { icon: 'person_search', text: '상담 매뉴얼' },
                { icon: 'more_horiz', text: '기타 업무' },
              ]).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q.text)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 transition-all active:scale-95 shadow-sm text-[10px] font-bold hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <span className="material-symbols-outlined text-[15px] opacity-70">{q.icon}</span>
                  <span className="truncate">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 채팅 뷰 (대화 시작 후) */}
        {!isLandingView && (
          <main ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-6 relative z-10 overscroll-contain">
            {messages.map((msg, idx) => {
              const jsonContent = msg.role === 'model' ? extractJson(msg.content) : null;
              return (
                <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'model' && (
                    <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 border ${role === 'admin' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <img src="/haema_logo.png" alt="AI" className="size-5 object-contain haema-flip" />
                    </div>
                  )}
                  <div className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end max-w-[82%]' : 'items-start max-w-[82%]'}`}>
                    <div className={`group relative rounded-[1.5rem] px-5 py-3.5 text-[14px] leading-relaxed tracking-normal whitespace-pre-wrap ${msg.role === 'user'
                      ? 'rounded-tr-sm bg-slate-900 text-white font-medium dark:bg-slate-100 dark:text-slate-900'
                      : 'rounded-tl-sm bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-700 font-medium'
                      }`}>
                      {renderMessageContent(msg.content)}

                      {/* 복사 버튼 */}
                      <button
                        onClick={() => handleCopyText(msg.content, idx)}
                        className={`absolute bottom-2 right-2 p-1.5 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm transition-all opacity-0 group-hover:opacity-100 active:scale-90 ${copiedId === idx ? 'text-emerald-500 opacity-100' : 'text-slate-400'}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {copiedId === idx ? 'check' : 'content_copy'}
                        </span>
                      </button>

                      {jsonContent && (() => {
                        let parsedType = 'UNKNOWN';
                        try { parsedType = JSON.parse(jsonContent).requestType || 'UNKNOWN'; } catch { }
                        const isCreate = parsedType === 'STRUCTURE_MANUAL';
                        const isUpdate = parsedType === 'UPDATE_MANUAL';
                        const isDelete = parsedType === 'DELETE_MANUAL';
                        const isDeleteCat = parsedType === 'DELETE_CATEGORY';
                        const isAnnouncement = parsedType === 'CREATE_ANNOUNCEMENT';
                        const isFAQ = parsedType === 'CREATE_FAQ';
                        const labelText = isAnnouncement ? '공지사항 등록 준비됨' : isFAQ ? 'Q&A 등록 준비됨' : isCreate ? '매뉴얼 생성 준비됨' : isUpdate ? '매뉴얼 수정 준비됨' : isDelete ? '매뉴얼 삭제 준비됨' : isDeleteCat ? '카테고리 전체 삭제 준비됨' : '작업 준비됨';
                        const btnColor = (isDelete || isDeleteCat) ? 'bg-red-500 hover:bg-red-600' : isUpdate ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600';
                        const iconColor = (isDelete || isDeleteCat) ? 'text-red-400' : isUpdate ? 'text-amber-400' : 'text-emerald-400';
                        const btnText = (isAnnouncement || isFAQ) ? '즉시 등록하기' : isCreate ? '즉시 생성하기' : isUpdate ? '즉시 수정하기' : (isDelete || isDeleteCat) ? '즉시 삭제하기' : '즉시 적용하기';
                        const icon = isDelete ? 'delete' : isUpdate ? 'edit' : (isAnnouncement || isFAQ) ? 'campaign' : 'auto_awesome';
                        return (
                          <div className="mt-2 px-3 py-2 rounded-xl bg-slate-900 text-white space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`material-symbols-outlined ${iconColor} text-xs`}>
                                {icon}
                              </span>
                              <span className={`text-[9px] font-black ${iconColor} uppercase tracking-widest`}>{labelText}</span>
                            </div>

                            {/* 공지사항: 중요 토글 */}
                            {isAnnouncement && (
                              <div className="flex items-center justify-between py-1 border-t border-slate-700">
                                <span className="text-[10px] font-bold text-slate-400">중요 공지로 등록</span>
                                <button
                                  onClick={() => setImportantOverrides(prev => ({ ...prev, [idx]: !(prev[idx] ?? false) }))}
                                  className={`relative w-9 h-5 rounded-full transition-all shrink-0 ${(importantOverrides[idx] ?? false) ? 'bg-red-500' : 'bg-slate-700'
                                    }`}
                                >
                                  <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${(importantOverrides[idx] ?? false) ? 'left-[18px]' : 'left-0.5'
                                    }`} />
                                </button>
                              </div>
                            )}

                            <button
                              onClick={() => handleApplyStructure(jsonContent, isAnnouncement ? (importantOverrides[idx] ?? false) : undefined)}
                              className={`w-full py-2.5 rounded-xl text-[11px] font-black text-white shadow-lg active:scale-95 transition-all ${btnColor}`}
                              disabled={isApplying}
                            >
                              {isApplying ? '처리 중...' : btnText}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 px-1">{msg.timestamp}</span>
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
      </div>

      {/* ── 하단 입력창 (Genspark 스타일) ── */}
      <div className={`px-5 pb-[86px] pt-3 shrink-0 z-20 ${isLandingView ? '' : 'border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950'}`}>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 shadow-sm">
          {/* 텍스트 입력 */}
          <input
            className="flex-1 bg-transparent border-none focus:ring-0 text-[12px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
            placeholder={role === 'admin' ? '매뉴얼을 HAEMA에게 말해보세요.' : '업무 방법이 궁금하면 HAEMA에게 물어보세요.'}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />

          {/* 전송 / 중단 버튼 */}
          {isLoading ? (
            <button
              onClick={stopMessage}
              className="size-7 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg active:scale-90 transition-all shrink-0"
              title="중단하기"
            >
              <span className="material-symbols-outlined text-[16px]">stop</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              {/* 마이크 버튼 */}
              <button
                onClick={handleVoice}
                title={isListening ? '음성 인식 중단' : '음성으로 입력'}
                className={`size-7 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0 ${isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">mic</span>
              </button>

              {/* 전송 버튼 */}
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="size-7 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-lg active:scale-90 transition-all disabled:opacity-30 shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 사용 방법 바텀 시트 ── */}
      {
        showGuide && (
          <div
            className="fixed inset-x-0 top-0 bottom-16 z-50 flex items-end justify-center"
            onClick={() => setShowGuide(false)}
          >
            {/* 딤드 배경 */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

            {/* 시트 본문 */}
            <div
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2rem] pt-5 pb-6 shadow-2xl flex flex-col max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 핸들 바 */}
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 shrink-0" />

              {/* 헤더 (고정) */}
              <div className="flex items-center justify-between mb-5 px-6 shrink-0">
                <div>
                  <h2 className="text-[17px] font-black text-slate-900 dark:text-white">사용 방법 가이드</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {role === 'admin' ? '관리자 모드 · 매뉴얼 관리' : '직원 모드 · 지식 검색'}
                  </p>
                </div>
                <button
                  onClick={() => setShowGuide(false)}
                  className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* 컨텐츠 (스크롤 가능) */}
              <div className="overflow-y-auto px-6 space-y-4">
                {role === 'admin' ? (
                  <>
                    {[
                      { icon: 'add_circle', color: 'text-emerald-500 bg-emerald-50', title: '매뉴얼 추가', desc: '새로운 매뉴얼 항목을 만들어요', examples: ['"수학 기초반 수업 진행 방법 추가해줘"', '"학생 상담 절차 새로 만들어줘"'] },
                      { icon: 'help_center', color: 'text-blue-500 bg-blue-50', title: 'Q&A 등록', desc: '자주 묻는 질문(FAQ)을 등록해요', examples: ['"주차 관련 공지사항을 Q&A로도 올려줘"', '"신상 상담 시 주의사항을 FAQ에 추가해"'] },
                      { icon: 'edit', color: 'text-amber-500 bg-amber-50', title: '매뉴얼 수정', desc: '기존 항목의 내용을 바꿔요', examples: ['"출결 관리 매뉴얼 내용 수정해줘"', '"비품 신청 절차 단계 바꿔줘"'] },
                      { icon: 'delete', color: 'text-red-500 bg-red-50', title: '매뉴얼 / 카테고리 삭제', desc: '항목 또는 카테고리 전체를 삭제해요', examples: ['"운영 관리 카테고리 삭제해줘"', '"출결 관련 항목 지워줘"'] },
                    ].map(item => (
                      <div key={item.title} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
                        <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${item.color} dark:bg-slate-700`}>
                          <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black text-slate-800 dark:text-white">{item.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 mb-2">{item.desc}</p>
                          <div className="space-y-1">
                            {item.examples.map(ex => (
                              <button
                                key={ex}
                                onClick={() => { setInput(ex.replace(/"/g, '')); setShowGuide(false); }}
                                className="block w-full text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl px-3 py-1.5 hover:bg-slate-100 transition-all active:scale-95"
                              >
                                {ex}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { icon: 'search', color: 'text-blue-500 bg-blue-50', title: '매뉴얼 검색', desc: '등록된 매뉴얼에서 찾아드려요', examples: ['"출결 처리 방법 알려줘"', '"학생 상담 대응 절차 어떻게 돼?"'] },
                      { icon: 'help', color: 'text-violet-500 bg-violet-50', title: '업무 질문', desc: '학원 운영 관련 질문에 답해요', examples: ['"수업 중 문제 학생 대응법"', '"학부모 민원 처리 순서"'] },
                    ].map(item => (
                      <div key={item.title} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
                        <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${item.color} dark:bg-slate-700`}>
                          <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black text-slate-800 dark:text-white">{item.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 mb-2">{item.desc}</p>
                          <div className="space-y-1">
                            {item.examples.map(ex => (
                              <button
                                key={ex}
                                onClick={() => { setInput(ex.replace(/"/g, '')); setShowGuide(false); }}
                                className="block w-full text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl px-3 py-1.5 hover:bg-slate-100 transition-all active:scale-95"
                              >
                                {ex}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* 음성 입력 안내 */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <div className="size-9 rounded-xl bg-rose-50 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-rose-500">mic</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-slate-800 dark:text-white">음성으로 입력</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">입력창 오른쪽 🎤 버튼을 탭하면 말로 요청할 수 있어요</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AIGuide;
