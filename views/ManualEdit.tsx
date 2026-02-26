
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MANUAL_ITEMS } from '../constants';

const ManualEdit: React.FC = () => {
  const { catId, taskId } = useParams<{ catId: string; taskId: string }>();
  const navigate = useNavigate();
  const isEdit = !!taskId && taskId !== 'new';
  const item = isEdit ? MANUAL_ITEMS.find(i => i.id === taskId) : null;

  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [timeEstimate, setTimeEstimate] = useState(item?.timeEstimate || '');
  const [level, setLevel] = useState(item?.level || 'Beginner');
  const [steps, setSteps] = useState<string[]>(item?.steps || ['']);

  if (isEdit && !item) return <div className="p-8 text-center font-bold">매뉴얼을 찾을 수 없습니다.</div>;

  const handleSave = () => {
    // In a real app, we would call an API here
    alert(isEdit ? '변경사항이 저장되었습니다. (데모 버전)' : '새 매뉴얼이 등록되었습니다. (데모 버전)');
    navigate(isEdit ? `/manuals/${catId}/${taskId}` : `/manuals/${catId}`);
  };

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  return (
    <div className="pb-32 min-h-screen relative">
      <header className="sticky top-0 z-20 bg-white/55 backdrop-blur-xl border-b border-white/40 px-4 pt-14 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-primary p-2 active:scale-95">
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="text-lg font-black tracking-tight text-slate-900">매뉴얼 편집</h1>
        </div>
        <button 
          onClick={handleSave}
          className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all"
        >
          저장
        </button>
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
              <label className="text-[11px] font-bold text-slate-500 ml-1">설명</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white/55 backdrop-blur-md border border-white/40 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-slate-700 min-h-[100px]"
                placeholder="매뉴얼에 대한 간단한 설명을 입력하세요"
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
                  <button 
                    onClick={() => handleRemoveStep(index)}
                    className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-6">
          <button 
            onClick={handleSave}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-base shadow-xl active:scale-95 transition-all"
          >
            변경사항 저장하기
          </button>
        </div>
      </main>
    </div>
  );
};

export default ManualEdit;
