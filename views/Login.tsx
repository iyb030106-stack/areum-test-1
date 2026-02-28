
import React, { useState } from 'react';
import { HaemaIcon } from '../components/Layout';
import { loginUser, registerUser, FirestoreUser } from '../services/authService';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (user: FirestoreUser) => void;
}

type ViewState = 'selection' | 'login' | 'signup';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/user-not-found': '등록되지 않은 이메일입니다.',
  'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
  'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
  'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
  'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/too-many-requests': '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
};

const getErrorMessage = (error: unknown): string => {
  const code = (error as { code?: string })?.code;
  return FIREBASE_ERRORS[code || ''] || '오류가 발생했습니다. 다시 시도해주세요.';
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<ViewState>('selection');
  const [selectedRole, setSelectedRole] = useState<UserRole>('staff');

  // Login form
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  // Signup form
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [position, setPosition] = useState('');
  const [subject, setSubject] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setView('login');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) return;
    setLoading(true);
    setError('');
    try {
      const { userData } = await loginUser(email, pw);
      onLogin(userData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !signupEmail || !signupPw || !position) return;
    setLoading(true);
    setError('');
    try {
      const userData = await registerUser(
        signupEmail,
        signupPw,
        name,
        selectedRole,
        position,
        subject || undefined,
      );
      onLogin(userData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square bg-blue-400/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] aspect-square bg-emerald-400/10 rounded-full blur-[100px] animate-pulse delay-1000" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-10 animate-fade-in">
          <div className="size-20 bg-white/85 backdrop-blur-md rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200/20 mb-6 border border-white">
            <HaemaIcon className="size-12 animate-bounce-slow" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 mb-1">HAEMA</h1>
          <p className="text-slate-400 text-xs font-medium">학원 운영의 흐름을 바꾸다</p>
        </div>

        <div className="animate-slide-up">
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/30">

            {/* 역할 선택 */}
            {view === 'selection' && (
              <>
                <h2 className="text-lg font-black text-slate-800 mb-8 text-center tracking-tight">로그인 방식을 선택해주세요</h2>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => handleRoleSelect('admin')}
                    className="group flex items-center gap-5 p-5 rounded-3xl bg-white/40 border border-white/80 text-slate-800 hover:bg-white/60 transition-all active:scale-[0.98] shadow-sm"
                  >
                    <div className="size-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl text-indigo-500">admin_panel_settings</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-base">관리자 로그인</p>
                      <p className="text-[10px] text-slate-400 font-bold">원장님 및 매니저용</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  </button>

                  <button
                    onClick={() => handleRoleSelect('staff')}
                    className="group flex items-center gap-5 p-5 rounded-3xl bg-white/40 border border-white/80 text-slate-800 hover:bg-white/60 transition-all active:scale-[0.98] shadow-sm"
                  >
                    <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl text-blue-500">badge</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-base">직원 로그인</p>
                      <p className="text-[10px] text-slate-400 font-bold">강사 및 행정직원용</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  </button>
                </div>
              </>
            )}

            {/* 로그인 */}
            {view === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="flex items-center gap-2 mb-6">
                  <button type="button" onClick={() => { setView('selection'); setError(''); }} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">
                    {selectedRole === 'admin' ? '관리자' : '직원'} 로그인
                  </h2>
                </div>

                {error && (
                  <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-xl">mail</span>
                    <input
                      type="email"
                      placeholder="이메일 주소"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/50 border border-white rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-xl">lock</span>
                    <input
                      type="password"
                      placeholder="비밀번호"
                      value={pw}
                      onChange={e => setPw(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/50 border border-white rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !pw}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? '로그인 중...' : '로그인'}
                </button>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setView('signup'); setError(''); }}
                    className="text-xs font-bold text-slate-400 hover:text-primary transition-colors"
                  >
                    신규 계정 생성하기
                  </button>
                </div>
              </form>
            )}

            {/* 회원가입 */}
            {view === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-6">
                  <button type="button" onClick={() => { setView('login'); setError(''); }} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">
                    {selectedRole === 'admin' ? '관리자' : '직원'} 계정 생성
                  </h2>
                </div>

                {error && (
                  <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="이름"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-white/50 border border-white rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <input
                  type="email"
                  placeholder="이메일 주소"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-white/50 border border-white rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <input
                  type="password"
                  placeholder="비밀번호 (6자 이상)"
                  value={signupPw}
                  onChange={e => setSignupPw(e.target.value)}
                  className="w-full px-5 py-4 bg-white/50 border border-white rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <input
                  type="text"
                  placeholder="직책 (예: 원장, 강사, 행정)"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  className="w-full px-5 py-4 bg-white/50 border border-white rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                {selectedRole === 'staff' && (
                  <input
                    type="text"
                    placeholder="담당 과목 (선택, 예: Vocabulary)"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-5 py-4 bg-white/50 border border-white rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                )}

                <button
                  type="submit"
                  disabled={loading || !name || !signupEmail || !signupPw || !position}
                  className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-sm shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? '가입 중...' : '가입하기'}
                </button>
              </form>
            )}
          </div>

          <div className="text-center mt-8">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Haema EDU System v2.0 · Firebase
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-primary text-xs font-black animate-pulse">처리 중...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
