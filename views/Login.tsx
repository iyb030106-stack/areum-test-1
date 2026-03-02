
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HaemaIcon } from '../components/Layout';
import { loginUser, registerUser, findAcademyByInviteCode, generateUniqueInviteCode, deleteUserAccount, logoutUser, FirestoreUser } from '../services/authService';
import { UserRole } from '../types';
import { doc, setDoc, getDoc, updateDoc, collection } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

interface LoginProps {
  onLogin: (user: FirestoreUser) => void;
  initialPendingUser?: FirestoreUser | null;
}

type ViewState = 'selection' | 'login' | 'signup' | 'academy-setup' | 'employee-setup';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/user-not-found': '등록되지 않은 이메일입니다.',
  'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
  'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
  'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
  'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/too-many-requests': '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
  'user-not-found': '등록되지 않은 사용자이거나 삭제된 계정입니다.',
  'permission-denied': '접근 권한이 없거나 인증이 거부되었습니다.',
  'invalid-academy': '유효하지 않은 학원 고유번호입니다.',
};

const getErrorMessage = (error: any): string => {
  const code = error?.code || error?.message || (typeof error === 'string' ? error : '');
  if (code?.includes('permission-denied')) return FIREBASE_ERRORS['permission-denied'];
  if (code === 'invalid-academy') return FIREBASE_ERRORS['invalid-academy'];
  if (code?.includes('400')) return '로그인 정보가 만료되었습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.';
  return FIREBASE_ERRORS[code] || '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
};

// 입력 필드 컴포넌트
const Input: React.FC<{
  icon: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}> = ({ icon, type = 'text', placeholder, value, onChange }) => (
  <div className="relative">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-xl">{icon}</span>
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full pl-12 pr-4 py-4 bg-white/50 border border-white rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
    />
  </div>
);

const Login: React.FC<LoginProps> = ({ onLogin, initialPendingUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<ViewState>(() => {
    if (initialPendingUser && !initialPendingUser.academyId) {
      return initialPendingUser.role === 'admin' ? 'academy-setup' : 'employee-setup';
    }
    return 'login';
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>('staff');

  useEffect(() => {
    if (initialPendingUser && !initialPendingUser.academyId) {
      setTempUserData({
        name: initialPendingUser.name,
        email: initialPendingUser.email,
        pw: '',
        role: initialPendingUser.role,
        position: initialPendingUser.position,
        subject: initialPendingUser.subject || ''
      });
      setSelectedRole(initialPendingUser.role);
    }
  }, [initialPendingUser]);

  // 로그인 폼
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  // 회원가입 폼 (1단계 임시 저장용)
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [signupPwConfirm, setSignupPwConfirm] = useState('');
  const [position, setPosition] = useState('');
  const [subject, setSubject] = useState('');

  // 2단계 폼
  const [inviteCode, setInviteCode] = useState('');

  // 학원 정보 (2단계 - 관리자 전용)
  const [academyName, setAcademyName] = useState('');
  const [academyMotto, setAcademyMotto] = useState('');
  const [academyPhone, setAcademyPhone] = useState('');
  const [academyEmail, setAcademyEmail] = useState('');
  const [academyAddress, setAcademyAddress] = useState('');

  // 임시 저장 - 1단계 완료된 정보

  // 임시 저장 - 1단계 완료된 정보
  const [tempUserData, setTempUserData] = useState<{
    name: string; email: string; pw: string; role: UserRole; position: string; subject: string;
  } | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !pw) return;
    setLoading(true);
    try {
      const { userData } = await loginUser(email, pw);
      if (!userData.academyId) {
        // 초대 코드를 아직 안 넣은 '펜딩' 유저의 경우
        if (userData.role === 'admin') {
          setView('academy-setup');
        } else {
          // 여기서도 강제로 세션 데이터를 보정
          setView('employee-setup');
        }
        setTempUserData({
          name: userData.name,
          email: userData.email,
          pw: '',
          role: userData.role,
          position: userData.position,
          subject: userData.subject || ''
        });
      } else {
        onLogin(userData);
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
      // 만약 400 계열 에러(계정 삭제 등)가 나면 로그아웃 유도
      if (err?.message?.includes('400')) {
        logoutUser().then(() => window.location.reload());
      }
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 1단계: 정보만 저장하고 다음 화면으로 이동 (아직 Firebase Auth 생성 안 함)
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (signupPw.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (signupPw !== signupPwConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setTempUserData({
      name,
      email: signupEmail,
      pw: signupPw,
      role: selectedRole,
      position,
      subject: subject || ''
    });

    if (selectedRole === 'admin') {
      setView('academy-setup');
    } else {
      setView('employee-setup');
    }
  };

  // 학원 정보 2단계: [Auth 계정 생성] + 학원 생성 + Firestore 저장
  const handleAcademySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!academyName) return;
    setLoading(true);
    try {
      let uid = auth.currentUser?.uid;
      let freshUserObj: FirestoreUser | null = null;

      // 1. 유저 계정이 없다면 먼저 생성
      if (!uid) {
        if (!tempUserData) throw new Error('가입 정보가 유실되었습니다. 다시 가입을 시도해주세요.');
        const userData = await registerUser(
          tempUserData.email,
          tempUserData.pw,
          tempUserData.name,
          'admin', // <--- 무조건 admin 강제
          tempUserData.position,
          null,
          tempUserData.subject || ''
        );
        uid = userData.uid;
      }

      // 2. 이제 인증된 상태이므로 학원 ID 및 고유번호 생성 가능
      const dbRef = collection(db, 'academies');
      const newAcademyRef = doc(dbRef);
      const newAcademyId = newAcademyRef.id;
      const newInviteCode = await generateUniqueInviteCode();

      // 3. 학원 데이터 저장
      await setDoc(newAcademyRef, {
        info: { name: academyName, motto: academyMotto || '' },
        contact: { phone: academyPhone || '', email: academyEmail || '', address: academyAddress || '' },
        ownerId: uid,
        inviteCode: newInviteCode,
        createdAt: new Date().toISOString()
      });

      // 4. 유저 데이터에 academyId 업데이트
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { academyId: newAcademyId });

      // 최종 데이터로 로그온 처리
      const finalSnap = await getDoc(userRef);
      onLogin({ uid, ...finalSnap.data() } as FirestoreUser);
    } catch (err: any) {
      console.error("Academy setup error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 직원 가입 2단계: 학원 고유번호 확인 + [Auth 계정 생성] + Firestore 저장
  const handleEmployeeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const codeToVerify = inviteCode?.trim();
    if (!codeToVerify) return;

    setLoading(true);
    try {
      let uid = auth.currentUser?.uid;
      let freshUserObj: FirestoreUser | null = null;

      // 1. 이미 로그인된 상태(Pending 유저)가 아니라면 가입 진행
      if (!uid) {
        if (!tempUserData) throw new Error('가입 정보가 유실되었습니다. 다시 가입을 시도해주세요.');
        const userData = await registerUser(
          tempUserData.email,
          tempUserData.pw,
          tempUserData.name,
          'staff', // <--- 무조건 staff 강제
          tempUserData.position,
          null,
          tempUserData.subject || ''
        );
        uid = userData.uid;
        freshUserObj = userData;
      }

      // 2. 인증된 상태(또는 방금 생성됨)에서 고유번호 조회
      const matchId = await findAcademyByInviteCode(codeToVerify);

      if (!matchId) {
        // 번호가 틀렸을 때: 방금 가입한 계정이라면 삭제 (롤백)
        if (freshUserObj) await deleteUserAccount(uid);
        throw new Error('invalid-academy');
      }

      // 3. 번호가 맞다면 Firestore 업데이트 (역할 강제 정정)
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        academyId: matchId,
        role: 'staff' // <--- 여기서 한 번 더 staff로 덮어씌움 (분리의 핵심)
      });

      // 최종 데이터로 로그온 처리
      const finalSnap = await getDoc(userRef);
      if (!finalSnap.exists()) throw new Error('user-not-found');

      onLogin({ uid, ...finalSnap.data() } as FirestoreUser);
    } catch (err: any) {
      console.error("Setup error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-5 py-4 bg-white/50 border border-white rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300";

  return (
    <div className="min-h-full bg-slate-50 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square bg-slate-400/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] aspect-square bg-slate-300/10 rounded-full blur-[100px] animate-pulse delay-1000" />

      <div className="w-full max-w-md z-10">
        <div
          onClick={() => navigate('/')}
          className="flex flex-col items-center mb-10 animate-fade-in cursor-pointer active:scale-95 transition-all"
        >
          <div className="size-20 bg-white/85 backdrop-blur-md rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200/20 mb-6 border border-white">
            <HaemaIcon className="size-12 animate-bounce-slow" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 mb-1">HAEMA</h1>
          <p className="text-slate-400 text-xs font-medium">운영의 흐름을 바꾸다</p>
        </div>

        <div className="animate-slide-up">
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/30">

            {/* 로그인 */}
            {view === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="flex flex-col items-center mb-6">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">서비스 로그인</h2>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">이메일 계정으로 접속해주세요</p>
                </div>

                {error && (
                  <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center">{error}</div>
                )}

                <div className="space-y-4">
                  <Input icon="mail" type="email" placeholder="이메일 주소" value={email} onChange={setEmail} />
                  <Input icon="lock" type="password" placeholder="비밀번호" value={pw} onChange={setPw} />
                </div>

                <button type="submit" disabled={loading || !email || !pw}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50">
                  {loading ? '로그인 중...' : '로그인'}
                </button>

                <div className="flex justify-center pt-2">
                  <button type="button" onClick={() => { setView('signup'); setError(''); }}
                    className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">
                    신규 계정 생성하기
                  </button>
                </div>
              </form>
            )}

            {/* 회원가입 1단계: 계정 정보 */}
            {view === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <button type="button" onClick={() => { setView('login'); setError(''); }} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">
                      {selectedRole === 'admin' ? '관리자' : '직원'} 계정 생성
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">계정 기본 정보 입력</p>
                  </div>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-4">
                  <button type="button" onClick={() => setSelectedRole('admin')}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all ${selectedRole === 'admin' ? 'bg-white dark:bg-slate-700 text-slate-800 shadow-sm' : 'text-slate-400'}`}>
                    원장님(관리자)
                  </button>
                  <button type="button" onClick={() => setSelectedRole('staff')}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all ${selectedRole === 'staff' ? 'bg-white dark:bg-slate-700 text-slate-800 shadow-sm' : 'text-slate-400'}`}>
                    선생님(직원)
                  </button>
                </div>

                <input type="text" placeholder="이름" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
                <input type="email" placeholder="이메일 주소" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} className={inputClass} />
                <div className="space-y-2">
                  <input type="password" placeholder="비밀번호 (6자 이상)" value={signupPw} onChange={e => setSignupPw(e.target.value)} className={inputClass} />
                  <input type="password" placeholder="비밀번호 확인" value={signupPwConfirm} onChange={e => setSignupPwConfirm(e.target.value)} className={inputClass} />
                  {signupPwConfirm && signupPw !== signupPwConfirm && (
                    <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-100 animate-fade-in text-center">
                      <p className="text-[10px] text-red-500 font-bold">비밀번호가 일치하지 않습니다.</p>
                    </div>
                  )}
                </div>
                <input type="text" placeholder={selectedRole === 'admin' ? "직책 (예: 원장, 실장)" : "직책 (예: 영어 강사, 입시 상담)"} value={position} onChange={e => setPosition(e.target.value)} className={inputClass} />
                {selectedRole === 'staff' && (
                  <input type="text" placeholder="담당 과목 (선택, 예: Vocabulary)" value={subject} onChange={e => setSubject(e.target.value)} className={inputClass} />
                )}

                <button type="submit" disabled={!name || !signupEmail || !signupPw || !position}
                  className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-sm shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all">
                  다음 단계로 →
                </button>
              </form>
            )}

            {/* 회원가입 2단계: 학원 정보 (관리자 전용) */}
            {view === 'academy-setup' && (
              <form onSubmit={handleAcademySetup} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <button type="button" onClick={() => { setView('signup'); setError(''); }} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">학원 정보 입력</h2>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">학원 프로필 설정</p>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center">{error}</div>
                )}

                <input type="text" placeholder="학원명" value={academyName} onChange={e => setAcademyName(e.target.value)} className={inputClass} />
                <input type="text" placeholder="슬로건 (선택)" value={academyMotto} onChange={e => setAcademyMotto(e.target.value)} className={inputClass} />
                <input type="tel" placeholder="대표 전화번호" value={academyPhone} onChange={e => setAcademyPhone(e.target.value)} className={inputClass} />
                <input type="email" placeholder="대표 이메일" value={academyEmail} onChange={e => setAcademyEmail(e.target.value)} className={inputClass} />
                <input type="text" placeholder="학원 주소" value={academyAddress} onChange={e => setAcademyAddress(e.target.value)} className={inputClass} />

                <button type="submit" disabled={loading || !academyName || !academyPhone || !academyAddress}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50">
                  {loading ? '처리 중...' : '회원가입 완료 및 로그인'}
                </button>
              </form>
            )}

            {/* 직원 소속 학원 고유번호 입력 */}
            {view === 'employee-setup' && (
              <form onSubmit={handleEmployeeSetup} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <button type="button" onClick={() => { setView('signup'); setError(''); }} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">학원 고유번호 인증</h2>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      {tempUserData?.name} {tempUserData?.role === 'admin' ? '원장님' : '선생님'} 계정
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-blue-50/50 border border-blue-100/50 space-y-2 mb-2">
                  <p className="text-[12px] font-bold text-blue-600 text-center leading-relaxed">
                    원장님이 발급하신 학원 고유번호를 입력하여<br />소속 학원을 인증해주세요.
                  </p>
                  {tempUserData?.role === 'admin' && (
                    <p className="text-[10px] text-red-400 text-center font-bold">
                      * 현재 원장님으로 선택되어 있습니다. 직원이시라면 뒤로가기를 눌러 '선생님'을 선택해주세요.
                    </p>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center">{error}</div>
                )}

                <input type="text" placeholder="학원 고유번호 입력" value={inviteCode} onChange={e => setInviteCode(e.target.value)} className={inputClass} />

                <button type="submit" disabled={loading || !inviteCode}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50">
                  {loading ? '처리 중...' : '인증 및 가입 완료'}
                </button>
              </form>
            )}
          </div>

          <div className="text-center mt-8">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Haema EDU System v2.0
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-primary text-xs font-black animate-pulse">잠시만 기다려주세요...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
