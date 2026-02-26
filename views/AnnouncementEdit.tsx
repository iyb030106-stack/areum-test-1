
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { STORE_UPDATES } from '../constants';

const AnnouncementEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';
  const announcement = isEdit ? STORE_UPDATES.find(u => u.id === id) : null;

  const [title, setTitle] = useState(announcement?.title || '');
  const [description, setDescription] = useState(announcement?.description || '');
  const [category, setCategory] = useState(announcement?.category || '일반');
  const [isImportant, setIsImportant] = useState(announcement?.isImportant || false);

  if (isEdit && !announcement) return <div className="p-8 text-center font-bold">공지사항을 찾을 수 없습니다.</div>;

  const handleSave = () => {
    alert(isEdit ? '공지사항이 수정되었습니다. (데모 버전)' : '새 공지사항이 게시되었습니다. (데모 버전)');
    navigate('/announcements');
  };

  return (
    <div className="pb-32 min-h-screen relative">
      <header className="sticky top-0 z-20 bg-white/55 backdrop-blur-xl border-b border-white/40 px-4 pt-14 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-primary p-2 active:scale-95">
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="text-lg font-black tracking-tight text-slate-900">{isEdit ? '공지 수정' : '새 공지 작성'}</h1>
        </div>
        <button 
          onClick={handleSave}
          className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all"
        >
          {isEdit ? '수정' : '게시'}
        </button>
      </header>

      <main className="px-6 py-8 space-y-8 relative z-10">
        <section className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 ml-1">공지 제목</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white/55 backdrop-blur-md border border-white/40 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-900"
              placeholder="제목을 입력하세요"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 ml-1">카테고리</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {['필독', '일반', '매뉴얼', '일정'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat as any)}
                  className={`px-5 py-2.5 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all border ${
                    category === cat 
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                      : 'bg-white/55 text-slate-400 border-white/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/55 backdrop-blur-md border border-white/40">
            <input 
              type="checkbox" 
              id="important"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="size-5 rounded border-slate-300 text-primary focus:ring-primary/20"
            />
            <label htmlFor="important" className="text-sm font-bold text-slate-700 cursor-pointer flex-1">
              중요 공지로 설정 (상단 고정)
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 ml-1">공지 내용</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white/55 backdrop-blur-md border border-white/40 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-slate-700 min-h-[200px]"
              placeholder="공지할 내용을 상세히 입력하세요"
            />
          </div>
        </section>

        <div className="pt-6">
          <button 
            onClick={handleSave}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-base shadow-xl active:scale-95 transition-all"
          >
            {isEdit ? '수정 완료' : '공지 게시하기'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AnnouncementEdit;
