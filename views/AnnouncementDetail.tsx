
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnnouncement, deleteAnnouncement, formatTimeAgo, Announcement } from '../services/announcementService';

interface AnnouncementDetailProps {
  role?: string;
}

const AnnouncementDetail: React.FC<AnnouncementDetailProps> = ({ role }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getAnnouncement(id).then((data) => {
      setAnnouncement(data);
      setLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      await deleteAnnouncement(id);
      navigate('/announcements');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <span className="material-symbols-outlined text-slate-300 text-5xl">search_off</span>
        <p className="text-slate-400 font-bold">공지를 찾을 수 없습니다.</p>
        <button onClick={() => navigate(-1)} className="text-primary font-bold text-sm">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="pb-32 min-h-screen relative">
      <header className="sticky top-0 z-20 bg-white/40 dark:bg-background-dark/40 backdrop-blur-xl border-b border-white/40 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-primary p-2 active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">공지 상세내용</h1>
        {role === 'admin' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/announcements/${id}/edit`)}
              className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary active:scale-95 transition-all"
              title="수정"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="size-9 rounded-full bg-red-50 flex items-center justify-center text-red-500 active:scale-95 transition-all"
              title="삭제"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        ) : (
          <div className="w-10" />
        )}
      </header>

      <main className="px-7 py-10 space-y-8 animate-fade-in relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${announcement.category === '필독'
                ? 'bg-red-100/50 text-red-600'
                : announcement.category === '매뉴얼'
                  ? 'bg-blue-100/50 text-blue-600'
                  : announcement.category === '일정'
                    ? 'bg-emerald-100/50 text-emerald-600'
                    : 'bg-slate-100/50 text-slate-600'
                }`}
            >
              {announcement.category}
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {formatTimeAgo(announcement.createdAt)} 작성됨
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2">
            {announcement.title}
          </h2>
          <p className="text-xs text-slate-400 font-bold mb-6">작성자: {announcement.authorName}</p>

          <div className="h-px w-full bg-white/20 dark:bg-slate-800 mb-8"></div>

          <div className="text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
            {announcement.description}
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="w-full bg-white/60 backdrop-blur-md text-slate-900 py-5 rounded-[2rem] border border-white/40 font-black text-sm active:scale-95 transition-all shadow-sm mt-12"
        >
          목록으로 돌아가기
        </button>
      </main>
    </div>
  );
};

export default AnnouncementDetail;
