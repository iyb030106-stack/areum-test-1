
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Notification {
    id: string;
    type: 'announcement' | 'manual';
    action: 'created' | 'updated';
    title: string;
    targetId: string;
    categoryId?: string;
    authorName: string;
    createdAt: Timestamp | null;
}

/** 알림 구독 (최근 20개) */
export const subscribeToNotifications = (
    callback: (notifications: Notification[]) => void,
): (() => void) => {
    const q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(20)
    );
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Notification[];
        callback(items);
    });
};

/** 알림 생성 */
export const createNotification = async (
    data: Omit<Notification, 'id' | 'createdAt'>,
): Promise<void> => {
    await addDoc(collection(db, 'notifications'), {
        ...data,
        createdAt: serverTimestamp(),
    });
};

/** 시간 포맷팅 (알림용) */
export const formatNotificationTime = (ts: Timestamp | null): string => {
    if (!ts) return '';
    const now = Date.now();
    const diff = now - ts.toDate().getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '방금';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return ts.toDate().toLocaleDateString();
};
