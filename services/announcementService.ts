import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notificationService';

export interface Announcement {
    id: string;
    title: string;
    description: string;
    category: string;
    isImportant: boolean;
    authorId: string;
    authorName: string;
    authorPosition: string; // 직책
    authorInitial: string;
    createdAt: Timestamp | null;
    updatedAt: Timestamp | null;
}

export interface NoticeCategory {
    id: string;
    name: string;
    order: number;
    createdAt?: Timestamp;
}

/** 공지사항 카테고리 실시간 구독 */
export const subscribeToNoticeCategories = (
    callback: (items: NoticeCategory[]) => void,
): (() => void) => {
    const q = query(collection(db, 'notice_categories'), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as NoticeCategory[];
        callback(items);
    });
};

/** 공지사항 카테고리 생성 */
export const createNoticeCategory = async (name: string, order: number): Promise<string> => {
    const ref = await addDoc(collection(db, 'notice_categories'), {
        name,
        order,
        createdAt: serverTimestamp(),
    });
    return ref.id;
};

/** 공지사항 카테고리 수정 */
export const updateNoticeCategory = async (id: string, name: string): Promise<void> => {
    await updateDoc(doc(db, 'notice_categories', id), { name });
};

/** 공지사항 카테고리 삭제 */
export const deleteNoticeCategory = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'notice_categories', id));
};

/** 초기 카테고리 설정 (필요시) */
export const initializeNoticeCategoriesIfNeeded = async (initialNames: string[]): Promise<void> => {
    const q = query(collection(db, 'notice_categories'));
    const snap = await import('firebase/firestore').then(({ getDocs }) => getDocs(q));
    if (snap.empty) {
        for (let i = 0; i < initialNames.length; i++) {
            await createNoticeCategory(initialNames[i], i);
        }
    }
};

/** 공지사항 목록 실시간 구독 */
export const subscribeToAnnouncements = (
    callback: (items: Announcement[]) => void,
): (() => void) => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Announcement[];
        callback(items);
    });
};

/** 공지사항 단건 조회 */
export const getAnnouncement = async (id: string): Promise<Announcement | null> => {
    const snap = await getDoc(doc(db, 'announcements', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Announcement;
};

/** 새 공지사항 생성 */
export const createAnnouncement = async (
    data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
    const ref = await addDoc(collection(db, 'announcements'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // 알림 생성
    await createNotification({
        type: 'announcement',
        action: 'created',
        title: data.title,
        targetId: ref.id,
        authorName: data.authorName,
    });

    return ref.id;
};

/** 공지사항 수정 */
export const updateAnnouncement = async (
    id: string,
    data: Partial<Omit<Announcement, 'id' | 'createdAt'>>,
): Promise<void> => {
    await updateDoc(doc(db, 'announcements', id), {
        ...data,
        updatedAt: serverTimestamp(),
    });

    // 알림 생성 (수정 시)
    if (data.title) {
        await createNotification({
            type: 'announcement',
            action: 'updated',
            title: data.title,
            targetId: id,
            authorName: '관리자', // 수정자는 일단 관리자로 표기
        });
    }
};

/** 공지사항 삭제 */
export const deleteAnnouncement = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'announcements', id));
};

/** Timestamp → 상대 시간 문자열 (예: "2시간 전") */
export const formatTimeAgo = (ts: Timestamp | null): string => {
    if (!ts) return '';
    const now = Date.now();
    const diff = now - ts.toDate().getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '방금';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
};
