
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import {
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  subscribeToNoticeCategories,
  NoticeCategory
} from '../services/announcementService';
import { useAcademy } from '../contexts/AcademyContext';

const AnnouncementEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { academyId } = useAcademy();
  const isEdit = !!id && id !== 'new';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<NoticeCategory[]>([]);
  const [isImportant, setIsImportant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // 카테고리 불러오기
  useEffect(() => {
    if (!academyId) return;
    const unsubscribe = subscribeToNoticeCategories(academyId, (data) => {
      setCategories(data);
      if (!category && data.length > 0) {
        setCategory(data[0].name);
      }
    });
    return unsubscribe;
  }, [category, academyId]);

  // 수정 모드: 기존 데이터 불러오기
  useEffect(() => {
    if (!isEdit || !id) {
      setInitialLoading(false);
      return;
    }
    getAnnouncement(id).then((data) => {
      if (data) {
        setTitle(data.title);
        setDescription(data.description);
        setCategory(data.category);
        setIsImportant(data.isImportant);
      }
      setInitialLoading(false);
    });
  }, [id, isEdit]);

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !academyId) return;
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const { getUserData } = await import('../services/authService');
      const userData = await getUserData(user.uid);
      const position = userData?.position || '관리자';

      if (isEdit && id) {
        await updateAnnouncement(id, { title, description, category, isImportant });
      } else {
        await createAnnouncement({
          title,
          description,
          category,
          isImportant,
          academyId,
          authorId: user.uid,
          authorName: userData?.name || user.displayName || '관리자',
          authorPosition: position,
          authorInitial: (userData?.name || user.displayName || '관')[0],
        });
      }
      navigate('/announcements', { replace: true });
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-32 min-h-screen relative">
      <header className="sticky top-0 z-20 bg-white/55 backdrop-blur-xl border-b border-white/40 px-4 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary p-2 active:scale-95">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h1 className="text-lg font-black tracking-tight text-slate-900">
          {isEdit ? '공지 수정' : '새 공지 작성'}
        </h1>
      </header>

      <main className="px-6 py-8 space-y-8 relative z-10">
        <section className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-tight">공지 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-5 rounded-[1.75rem] bg-white/55 backdrop-blur-md border border-white/40 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-900 shadow-sm"
              placeholder="제목을 입력하세요"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-tight">카테고리</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`px-6 py-3 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all border ${category === cat.name
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-white/55 text-slate-400 border-white/40 hover:bg-white/70'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-5 rounded-[1.75rem] bg-white/55 backdrop-blur-md border border-white/40 shadow-sm">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="important"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="size-6 rounded-lg border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer accent-primary"
              />
            </div>
            <label htmlFor="important" className="text-sm font-black text-slate-700 cursor-pointer flex-1">
              중요 공지로 설정 (상단 고정)
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-tight">공지 내용</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-5 rounded-[1.75rem] bg-white/55 backdrop-blur-md border border-white/40 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-slate-700 min-h-[250px] shadow-sm leading-relaxed"
              placeholder="공지할 내용을 상세히 입력하세요"
            />
          </div>
        </section>

        <div className="pt-6">
          <button
            onClick={handleSave}
            disabled={loading || !title.trim() || !description.trim()}
            className="w-full bg-slate-900 text-white py-5 rounded-[1.75rem] font-black text-base shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '저장 중...' : isEdit ? '변경사항 저장하기' : '공지 게시하기'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AnnouncementEdit;
