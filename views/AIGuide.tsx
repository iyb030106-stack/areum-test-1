
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAIResponse } from '../services/geminiService';
import { ChatMessage } from '../types';
import { FlowyIcon } from '../components/Layout';

const AIGuide: React.FC = () => {
  const location = useLocation();
  const initialPrompt = (location.state as any)?.prompt || '';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: '안녕하세요! 무엇을 도와드릴까요?',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition;
    if (!recognitionRef.current && SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ko-KR';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev.trim() ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  };

  useEffect(() => { initSpeechRecognition(); }, []);
  useEffect(() => {
    if (initialPrompt && messages.length === 1) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const toggleListening = async () => {
    initSpeechRecognition();
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
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
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await getAIResponse(textToSend, history);
      setMessages((prev) => [...prev, {
        role: 'model',
        content: response || "답변을 생성할 수 없습니다.",
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'model',
        content: "네트워크 오류가 발생했습니다.",
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] overflow-hidden relative font-display">
      {isListening && (
        <div className="absolute inset-0 z-[100] bg-primary/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in text-white">
          <div className="pulse-animation flex items-center justify-center h-32 w-32 bg-white rounded-full shadow-2xl">
            <span className="material-symbols-outlined text-primary text-6xl fill-1">mic</span>
          </div>
          <h3 className="text-2xl font-black mt-12 tracking-tight">말씀해 주세요...</h3>
          <button onClick={toggleListening} className="mt-20 bg-white/10 px-10 py-4 rounded-full border border-white/20 font-black text-sm active:scale-95 transition-all">중단하기</button>
        </div>
      )}

      <header className="flex items-center gap-5 bg-white/55 backdrop-blur-xl dark:bg-background-dark/55 px-7 pt-14 pb-5 border-b border-white/40 shrink-0 shadow-sm z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-white shadow-inner text-primary">
          <FlowyIcon className="size-7" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Flowy</h2>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-60">Flowy Intelligence</span>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-16 relative z-10">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-3.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="h-9 w-9 rounded-xl bg-white shadow-inner text-primary flex items-center justify-center shrink-0">
                <FlowyIcon className="size-6" />
              </div>
            )}
            <div className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end max-w-[85%]' : 'items-start max-w-[85%]'}`}>
              <div className={`rounded-[1.75rem] px-6 py-4 shadow-sm text-sm font-bold leading-relaxed tracking-tight ${msg.role === 'user'
                  ? 'rounded-tr-none bg-primary text-white shadow-xl shadow-primary/10'
                  : 'rounded-tl-none bg-white/70 backdrop-blur-md dark:bg-slate-800/70 text-slate-800 dark:text-white border border-white/40 dark:border-slate-700'
                }`}>
                {msg.content}
              </div>
              <span className="text-[10px] font-black text-slate-400 px-2 opacity-50 uppercase tracking-tighter">{msg.timestamp}</span>
            </div>
          </div>
        ))}
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
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-5">
          {['상담 매뉴얼', '환불 규정', '결제 오류', '학생 출결'].map(tag => (
            <button key={tag} onClick={() => handleSend(tag)} className="whitespace-nowrap rounded-2xl bg-white/55 dark:bg-slate-800/55 px-5 py-2.5 text-[11px] font-black text-slate-600 dark:text-slate-400 border border-white/40 dark:border-slate-700 active:scale-95 transition-all shadow-sm">{tag}</button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleListening} className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-white/55 dark:bg-slate-800/55 text-slate-400 hover:text-primary transition-all active:scale-90 shrink-0 border border-white/40">
            <span className="material-symbols-outlined text-2xl">mic</span>
          </button>
          <div className="flex-1 relative">
            <input
              className="w-full rounded-[1.5rem] border-none bg-white/55 dark:bg-slate-800/55 px-6 py-4.5 text-sm font-bold focus:ring-4 focus:ring-primary/10 dark:text-white placeholder:text-slate-300 border border-white/40"
              placeholder="무엇이 궁금하세요?"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
          </div>
          <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-primary text-white disabled:opacity-50 active:scale-95 shadow-2xl shadow-primary/30 shrink-0">
            <span className="material-symbols-outlined text-2xl">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIGuide;
