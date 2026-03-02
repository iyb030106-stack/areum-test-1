
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createFAQ, updateFAQ, getFAQ } from '../services/faqService';
import { auth } from '../services/firebase';
import { useAcademy } from '../contexts/AcademyContext';

const FAQEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { academyId } = useAcademy();
    const isEdit = Boolean(id);

    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [category, setCategory] = useState('일반');
    const [loading, setLoading] = useState(isEdit);

    const categories = ['일반', '시스템', '근태/급여', '시설관리', '학생관리', '기타'];

    useEffect(() => {
        if (id) {
            getFAQ(id).then((data) => {
                if (data) {
                    setQuestion(data.question);
                    setAnswer(data.answer);
                    setCategory(data.category);
                }
                setLoading(false);
            });
        }
    }, [id]);

    const handleSave = async () => {
        if (!question.trim() || !answer.trim()) {
            alert('질문과 답변을 모두 입력해주세요.');
            return;
        }

        try {
            if (isEdit && id) {
                await updateFAQ(id, { question, answer, category });
            } else {
                if (!academyId) throw new Error("academyId is required");
                const user = auth.currentUser;
                await createFAQ({
                    question,
                    answer,
                    category,
                    academyId,
                    authorId: user?.uid || 'unknown',
                    authorName: user?.displayName || '관리자',
                });
            }
            navigate('/faq', { replace: true });
        } catch (error) {
            console.error('Error saving FAQ:', error);
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="pb-32 min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="sticky top-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/50 dark:border-slate-800 px-4 pt-14 pb-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="text-primary p-2 active:scale-95">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    {isEdit ? 'Q&A 수정' : '새 Q&A 작성'}
                </h1>
            </header>

            <main className="px-6 py-8 space-y-8">
                <section className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">카테고리</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${category === cat
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900 dark:border-white'
                                        : 'bg-white dark:bg-slate-800 text-slate-400 border-white dark:border-slate-700'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">질문 (Question)</label>
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="직원들이 자주 묻는 질문을 입력하세요"
                            className="w-full p-5 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-white/40 dark:border-slate-700 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-slate-900 dark:text-white min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">답변 (Answer)</label>
                        <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="명확하고 친절한 답변을 입력하세요"
                            className="w-full p-5 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-white/40 dark:border-slate-700 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all font-medium text-slate-700 dark:text-slate-300 min-h-[200px]"
                        />
                    </div>
                </section>

                <button
                    onClick={handleSave}
                    className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black shadow-xl shadow-slate-900/20 active:scale-95 transition-all text-base dark:bg-white dark:text-slate-900"
                >
                    저장하기
                </button>
            </main>
        </div>
    );
};

export default FAQEdit;
