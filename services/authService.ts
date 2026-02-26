import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
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

const getAvatarColors = (name: string) => {
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
    if (!snap.exists()) throw new Error('사용자 정보를 찾을 수 없습니다.');
    return {
        user: credential.user,
        userData: { uid: credential.user.uid, ...snap.data() } as FirestoreUser,
    };
};

/** 새 계정 생성 (회원가입) */
export const registerUser = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    position: string,
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
        initial: name.charAt(0),
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

/** 로그아웃 */
export const logoutUser = () => signOut(auth);
