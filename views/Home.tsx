
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MANUAL_CATEGORIES } from '../constants';
import { FlowyIcon } from '../components/Layout';
import { UserRole } from '../types';
import { subscribeToAllManuals, ManualItem } from '../services/manualService';

interface HomeProps {
  role?: UserRole;
}

const Home: React.FC<HomeProps> = ({ role }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const adminCategories = MANUAL_CATEGORIES.filter(c => c.type === 'admin');
  const [allManuals, setAllManuals] = useState<ManualItem[]>([]);

  useEffect(() => {
    const unsub = subscribeToAllManuals(setAllManuals);
    return unsub;
  }, []);

  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition;
    if (!recognitionRef.current && SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ko-KR';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  };

  useEffect(() => { initSpeechRecognition(); }, []);

  const toggleVoiceSearch = async () => {
    initSpeechRecognition();
    if (!recognitionRef.current) {
      alert('음성 인식을 지원하지 않는 환경입니다.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        alert('마이크 권한이 필요합니다.');
        setIsListening(false);
      }
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allManuals.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  }, [searchQuery, allManuals]);


  return (
    <div className="pb-40 min-h-screen relative">
      {isListening && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in text-white">
          <div className="pulse-animation flex items-center justify-center h-28 w-28 bg-white rounded-full shadow-2xl mb-10">
            <span className="material-symbols-outlined text-slate-900 text-5xl fill-1">mic</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight">말씀해 주세요</h3>
          <button onClick={() => setIsListening(false)} className="mt-16 bg-white/10 px-10 py-4 rounded-full border border-white/20 font-black text-sm active:scale-95 transition-all">취소</button>
        </div>
      )}

      <header className="px-6 pt-14 pb-2 flex items-center justify-between relative z-10">
        <h1 className="text-slate-800 dark:text-white text-xl font-black tracking-[0.15em] uppercase">FLOWY</h1>
        <div className="size-10 rounded-full bg-white/45 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/40">
          <span className="material-symbols-outlined text-slate-400 text-xl">notifications</span>
        </div>
      </header>

      <main className="px-6 pt-6 space-y-12 relative z-10">
        {/* Search Bar */}
        <div className="relative">
          <div className={`flex items-center bg-white/55 backdrop-blur-xl dark:bg-slate-900/55 rounded-[2rem] border transition-all duration-300 shadow-xl shadow-blue-200/10 ${searchQuery ? 'border-primary ring-4 ring-primary/5' : 'border-white/60 dark:border-slate-800'}`}>
            <span className="material-symbols-outlined pl-5 text-slate-300">search</span>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-5 px-3 font-bold dark:text-white"
              placeholder="무엇을 도와드릴까요?"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={toggleVoiceSearch} className="mr-3 p-3 rounded-2xl text-primary hover:bg-primary/5 transition-colors">
              <span className="material-symbols-outlined text-2xl">mic</span>
            </button>
          </div>
        </div>

        {searchQuery ? (
          <div className="bg-white/70 backdrop-blur-xl dark:bg-slate-900/70 rounded-[2.5rem] p-7 shadow-2xl border border-white/40 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">검색 결과 ({filteredItems.length})</span>
              <button onClick={() => setSearchQuery('')} className="text-xs font-bold text-primary">닫기</button>
            </div>
            <div className="space-y-4">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <div key={item.id} onClick={() => navigate(`/manuals/${item.categoryId}/${item.id}`)} className="flex items-center gap-4 p-4 rounded-2xl bg-white/55 dark:bg-slate-800/55 hover:bg-white/70 hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-white/60">
                    <div className="size-11 rounded-xl bg-white/70 dark:bg-slate-700 shadow-sm flex items-center justify-center text-primary/80 shrink-0">
                      <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-black text-slate-800 dark:text-white">{item.title}</p>
                        {item.hasRecentUpdate && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600/80 text-[9px] font-black uppercase tracking-tighter animate-pulse">UPDATED</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold truncate mt-0.5 opacity-80">{item.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-10 text-slate-400 text-xs font-bold">일치하는 정보가 없습니다</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in">
            {/* AI 가이드 카드 (Outlined Style) */}
            <div
              onClick={() => navigate('/ai')}
              className="border-2 border-primary/20 bg-white/30 backdrop-blur-md p-8 rounded-[3rem] shadow-xl shadow-blue-100/20 flex items-center gap-6 active:scale-[0.98] transition-all group relative"
            >
              <div className="size-16 bg-white/85 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-100/20 shrink-0 z-10 border border-white">
                <FlowyIcon className="size-10" />
              </div>
              <div className="flex-1 z-10">
                <h3 className="text-slate-800 dark:text-white text-xl font-black tracking-tight">Flowy</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold mt-1.5 tracking-tight leading-relaxed">물어볼 곳이 필요할 때,<br />Flowy에게 도움을 요청하세요.</p>
              </div>
              <div className="size-10 rounded-full bg-primary/5 flex items-center justify-center text-primary z-10">
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </div>
            </div>

            {/* Admin Protocols */}
            <section>
              <div className="flex items-center gap-4 mb-8 px-1">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">Admin Protocols</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                {adminCategories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => navigate(`/manuals/${cat.id}`)}
                    className="bg-white/55 backdrop-blur-md dark:bg-slate-900/55 p-6 rounded-[2.5rem] border border-white/40 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer active:scale-95 flex flex-col items-center text-center gap-4"
                  >
                    <div className={`size-14 rounded-3xl ${cat.bgClass} flex items-center justify-center shadow-inner`}>
                      {cat.icon === 'Aa' ? (
                        <span className={`${cat.colorClass} text-xl font-black`}>Aa</span>
                      ) : (
                        <span className={`material-symbols-outlined ${cat.colorClass} text-3xl`}>{cat.icon}</span>
                      )}
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{cat.name}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
