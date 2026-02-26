
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getManualItem, createManualItem, updateManualItem } from '../services/manualService';
import { auth } from '../services/firebase';

const AVAILABLE_ICONS = [
  'description', 'menu_book', 'library_books', 'sticky_note_2',
  'checklist', 'rule', 'fact_check', 'event_note',
  'school', 'history_edu', 'assignment', 'chrome_reader_mode',
  'campaign', 'forum', 'support_agent', 'groups',
  'settings', 'build', 'print', 'computer',
  'payments', 'monetization_on', 'receipt_long', 'account_balance',
  'emoji_events', 'workspace_premium', 'star', 'thumb_up',
  'warning', 'error', 'medical_services', 'security'
];

const ManualEdit: React.FC = () => {
  const { catId, taskId } = useParams<{ catId: string; taskId: string }>();
  const navigate = useNavigate();
  const isEdit = !!taskId && taskId !== 'new';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [icon, setIcon] = useState('description');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [steps, setSteps] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  // 수정 모드: 기존 데이터 불러오기
  useEffect(() => {
    if (!isEdit || !taskId) return;
    getManualItem(taskId).then((data) => {
      if (data) {
        setTitle(data.title);
        setDescription(data.description);
        setSubCategory(data.subCategory);
        setIcon(data.icon || 'description');
        setTimeEstimate(data.timeEstimate);
        setLevel(data.level);
        setSteps(data.steps.length > 0 ? data.steps : ['']);
      }
      setInitialLoading(false);
    });
  }, [taskId, isEdit]);

  const handleSave = async () => {
    if (!title.trim() || !catId) return;
    setLoading(true);
    try {
      const user = auth.currentUser;
      const editedBy = user?.uid || '';
      const editedByName = user?.displayName || '';
      const validSteps = steps.filter((s) => s.trim());
      if (isEdit && taskId) {
        await updateManualItem(taskId, {
          title,
          description,
          subCategory,
          icon,
          timeEstimate,
          level,
          steps: validSteps,
          lastEditedBy: editedBy,
          lastEditedByName: editedByName,
        });
        navigate(`/manuals/${catId}/${taskId}`, { replace: true });
      } else {
        const newId = await createManualItem({
          categoryId: catId,
          title,
          description,
          subCategory,
          icon,
          timeEstimate,
          level,
          steps: validSteps,
          lastEditedBy: editedBy,
          lastEditedByName: editedByName,
        });
        navigate(`/manuals/${catId}/${newId}`, { replace: true });
      }
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStep = () => setSteps([...steps, '']);
  const handleStepChange = (index: number, value: string) => {
    const next = [...steps];
    next[index] = value;
    setSteps(next);
  };
  const handleRemoveStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-32 min-h-screen relative">
      {/* 헤더 - 저장 버튼 없음 (하단 버튼만 사용) */}
      <header className="sticky top-0 z-20 bg-white/55 backdrop-blur-xl border-b border-white/40 px-4 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary p-2 active:scale-95">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h1 className="text-lg font-black tracking-tight text-slate-900">
          {isEdit ? '매뉴얼 수정' : '새 매뉴얼 작성'}
        </h1>
      </header>

      <main className="px-6 py-8 space-y-8 relative z-10">
        <section className="space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">기본 정보</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 ml-1">매뉴얼 제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white/55 backdrop-blur-md border border-white/40 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-900"
                placeholder="제목을 입력하세요"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 ml-1">소분류 (섹션명)</label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white/55 backdrop-blur-md border border-white/40 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-900"
                placeholder="예: 일일 테스트, 재시험 관리"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 ml-1">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white/55 backdrop-blur-md border border-white/40 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-slate-700 min-h-[100px]"
                placeholder="매뉴얼에 대한 간단한 설명"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">예상 시간</label>
                <input
                  type="text"
                  value={timeEstimate}
                  onChange={(e) => setTimeEstimate(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white/55 backdrop-blur-md border border-white/40 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-900"
                  placeholder="예: 10분"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">난이도</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full p-4 rounded-2xl bg-white/55 backdrop-blur-md border border-white/40 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-900 appearance-none"
                >
                  <option value="Beginner">초급</option>
                  <option value="Intermediate">중급</option>
                  <option value="Advanced">고급</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 ml-1">아이콘 선택 (현재 선택됨: <span className="material-symbols-outlined align-middle text-[14px] text-primary">{icon}</span>)</label>
              <div className="p-4 rounded-2xl bg-white/55 backdrop-blur-md border border-white/40 h-48 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-6 gap-3">
                  {AVAILABLE_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`flex items-center justify-center p-3 rounded-xl transition-all active:scale-95 ${icon === iconName
                          ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                          : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 border border-slate-100'
                        }`}
                      title={iconName}
                    >
                      <span className="material-symbols-outlined text-[24px] pointer-events-none">{iconName}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">단계별 가이드</h2>
            <button
              onClick={handleAddStep}
              className="text-xs font-bold text-primary flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              단계 추가
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-3 items-start animate-fade-in">
                <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-3">
                  <span className="text-xs font-black text-slate-400">{index + 1}</span>
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={step}
                    onChange={(e) => handleStepChange(index, e.target.value)}
                    className="w-full p-4 pr-10 rounded-2xl bg-white/55 backdrop-blur-md border border-white/40 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-slate-700 min-h-[80px]"
                    placeholder={`${index + 1}단계 내용을 입력하세요`}
                  />
                  {steps.length > 1 && (
                    <button
                      onClick={() => handleRemoveStep(index)}
                      className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-6">
          <button
            onClick={handleSave}
            disabled={loading || !title.trim()}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-base shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '저장 중...' : '변경사항 저장하기'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ManualEdit;
