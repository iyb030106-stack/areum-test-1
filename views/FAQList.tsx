
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { subscribeToFAQs, deleteFAQ, FAQ } from '../services/faqService';

interface FAQListProps {
    role?: UserRole;
}

const FAQList: React.FC<FAQListProps> = ({ role }) => {
    const navigate = useNavigate();
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const unsubscribe = subscribeToFAQs(setFaqs);
        return unsubscribe;
    }, []);

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('이 Q&A를 삭제할까요?')) {
            await deleteFAQ(id);
        }
    };

    return (
        <div className="pb-32 min-h-screen relative">
            <header className="sticky top-0 z-20 bg-white/55 dark:bg-slate-900/55 backdrop-blur-xl border-b border-white/40 shadow-sm">
                <div className="px-6 pt-14 pb-2 flex items-center justify-between">
                    <div>
                        <h1 className="text-primary dark:text-white text-2xl font-black tracking-tighter leading-none">HAEMA</h1>
                        <p className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mt-1.5">Q&A</p>
                    </div>
                    {role === 'admin' && (
                        <button
                            onClick={() => navigate('/faq/new')}
                            className="size-10 rounded-full bg-white/45 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/40 hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all active:scale-95 relative"
                        >
                            <span className="material-symbols-outlined text-[24px]">add</span>
                        </button>
                    )}
                </div>

                <div className="px-6 mb-4">
                    <div className="relative flex items-center bg-white/55 dark:bg-slate-800/55 rounded-2xl border border-white/40 dark:border-slate-700 px-4 py-3">
                        <span className="material-symbols-outlined text-slate-300 text-xl mr-2">search</span>
                        <input
                            type="text"
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full dark:text-white p-0"
                            placeholder="궁금한 내용을 검색하세요"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <main className="px-6 pt-8 space-y-4 relative z-10">
                {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq) => (
                        <div
                            key={faq.id}
                            className={`overflow-hidden bg-white/55 backdrop-blur-md dark:bg-slate-800/55 rounded-[2rem] border border-white/40 dark:border-slate-700 transition-all duration-300 ${expandedId === faq.id ? 'ring-2 ring-slate-300/60 shadow-lg' : 'shadow-sm'}`}
                        >
                            <button
                                onClick={() => toggleExpand(faq.id)}
                                className="w-full text-left p-6 flex items-start gap-4 transition-colors hover:bg-white/40 dark:hover:bg-slate-700/40"
                            >
                                <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 mt-1">
                                    <span className="text-sm font-black">Q</span>
                                </div>
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className="text-[10px] font-black text-primary dark:text-slate-400 uppercase tracking-widest mb-1">{faq.category}</p>
                                    <h3 className="text-[15px] font-black text-slate-900 dark:text-white leading-snug">
                                        {faq.question}
                                    </h3>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className={`material-symbols-outlined text-slate-300 transition-transform duration-300 ${expandedId === faq.id ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </div>
                            </button>

                            {expandedId === faq.id && (
                                <div className="px-6 pb-6 pt-2 animate-fade-in">
                                    <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-700/30 border border-slate-100/80 dark:border-slate-700">
                                        <div className="flex gap-4">
                                            <div className="size-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 shrink-0 text-[10px] font-black">A</div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                                                {faq.answer}
                                            </p>
                                        </div>

                                        {role === 'admin' && (
                                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-600">
                                                <button
                                                    onClick={() => navigate(`/faq/${faq.id}/edit`)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black text-slate-500 hover:bg-slate-100 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                                    수정
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(faq.id, e)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    삭제
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="py-24 text-center">
                        <span className="material-symbols-outlined text-slate-200 text-6xl mb-4">quiz</span>
                        <p className="text-slate-400 text-sm font-black italic">
                            {faqs.length === 0 ? '아직 등록된 Q&A가 없습니다' : '검색 결과가 없습니다'}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FAQList;
