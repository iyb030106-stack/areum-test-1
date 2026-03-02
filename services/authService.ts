import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    deleteUser,
    User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, collection, onSnapshot, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserRole } from '../types';

export interface FirestoreUser {
    uid: string;
    name: string;
    email: string;
    role: UserRole;
    position: string;
    subject?: string;
    avatarColor: string;
    avatarTextColor: string;
    initial: string;
    avatarUrl?: string;
    academyId?: string;
    createdAt: Timestamp;
}

const AVATAR_PALETTE = [
    { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    { bg: 'bg-violet-100', text: 'text-violet-600' },
    { bg: 'bg-blue-100', text: 'text-blue-600' },
    { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    { bg: 'bg-rose-100', text: 'text-rose-600' },
    { bg: 'bg-amber-100', text: 'text-amber-600' },
    { bg: 'bg-teal-100', text: 'text-teal-600' },
    { bg: 'bg-cyan-100', text: 'text-cyan-600' },
];

/** 이름 기반 아바타 색상 세트 가져오기 */
export const getAvatarColors = (name: string) => {
    const index = name.charCodeAt(0) % AVATAR_PALETTE.length;
    return AVATAR_PALETTE[index];
};

/** 이메일/비밀번호로 로그인 */
export const loginUser = async (
    email: string,
    password: string,
): Promise<{ user: User; userData: FirestoreUser }> => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', credential.user.uid));
    if (!snap.exists()) {
        throw new Error('user-not-found');
    }
    return {
        user: credential.user,
        userData: { uid: credential.user.uid, ...snap.data() } as FirestoreUser,
    };
};

/** 새 계정 생성 (회원가입) - academyId가 있을 때만 최종 생성 */
export const registerUser = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    position: string,
    academyId?: string,
    subject?: string,
): Promise<FirestoreUser> => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const colors = getAvatarColors(name);
    const userData: Omit<FirestoreUser, 'uid'> = {
        name,
        email,
        role,
        position,
        subject: subject || '',
        avatarColor: colors.bg,
        avatarTextColor: colors.text,
        initial: name.charAt(0).toUpperCase(),
        academyId: academyId || (role === 'admin' ? '' : null),
        createdAt: Timestamp.now(),
    };
    await setDoc(doc(db, 'users', credential.user.uid), userData);
    return { uid: credential.user.uid, ...userData };
};

/** Firestore에서 유저 정보 불러오기 */
export const getUserData = async (uid: string): Promise<FirestoreUser | null> => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return { uid, ...snap.data() } as FirestoreUser;
};

/** 프로필 업데이트 (이름, 직책, 아바타 URL 등) */
export const updateUserProfile = async (
    uid: string,
    data: Partial<Omit<FirestoreUser, 'uid' | 'createdAt' | 'email' | 'role'>>
): Promise<void> => {
    await updateDoc(doc(db, 'users', uid), data);
};

/** 로그아웃 */
export const logoutUser = () => signOut(auth);

/** 계정 탈퇴 (Firestore 데이터 삭제 + Auth 계정 삭제) */
export const deleteUserAccount = async (uid: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user || user.uid !== uid) throw new Error('인증된 사용자가 아닙니다.');

    // 1. 유저 데이터 먼저 삭제
    await deleteDoc(doc(db, 'users', uid));

    // 2. 로그아웃 수행 (영속성 토큰 제거를 위해 삭제 전 수행 고려)
    // 단, deleteUser 자체가 로그아웃을 포함하므로 순서가 중요함.
    // 여기서는 삭제 먼저 하고, 실패 시 로그아웃만이라도 하도록 처리.
    try {
        await deleteUser(user);
    } catch (e) {
        await signOut(auth); // 삭제 실패하더라도 로컬 세션이라도 정리
        throw e;
    }
};

/** 전체 사용자 목록 실시간 구독 (가입 날짜 오름차순) */
export const subscribeToAllUsers = (
    academyId: string,
    callback: (users: FirestoreUser[]) => void
): (() => void) => {
    if (!academyId) return () => { };
    const q = query(collection(db, 'users'), where('academyId', '==', academyId));
    return onSnapshot(q, (snap) => {
        const users = snap.docs.map(d => ({ uid: d.id, ...d.data() })) as FirestoreUser[];
        users.sort((a, b) => {
            const tA = (a.createdAt as any)?.toMillis?.() || 0;
            const tB = (b.createdAt as any)?.toMillis?.() || 0;
            return tA - tB; // asc
        });
        callback(users);
    }, (error) => {
        console.error("subscribeToAllUsers error:", error);
    });
};

/** 학원 고유번호로 학원 찾기 */
export const findAcademyByInviteCode = async (code: string): Promise<string | null> => {
    const q = query(collection(db, 'academies'), where('inviteCode', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].id;
};

/** 유일한 학원 고유번호 생성 (중복 체크 포함) */
export const generateUniqueInviteCode = async (length: number = 10): Promise<string> => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let attempts = 0;
    while (attempts < 10) {
        attempts++;
        let code = '';
        for (let i = 0; i < length; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // 중복 체크
        const q = query(collection(db, 'academies'), where('inviteCode', '==', code));
        const snap = await getDocs(q);
        if (snap.empty) return code;
    }
    // 극악의 확률로 실패 시 타임스탬프 기반 생성
    return 'AC' + Date.now().toString(36).toUpperCase();
};
