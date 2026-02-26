
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

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    authorId: string;
    authorName: string;
    createdAt: Timestamp | null;
    updatedAt: Timestamp | null;
}

/** FAQ 실시간 구독 */
export const subscribeToFAQs = (
    callback: (faqs: FAQ[]) => void,
): (() => void) => {
    const q = query(
        collection(db, 'faqs'),
        orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as FAQ[]);
    });
};

/** FAQ 단건 조회 */
export const getFAQ = async (id: string): Promise<FAQ | null> => {
    const snap = await getDoc(doc(db, 'faqs', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as FAQ;
};

/** FAQ 생성 */
export const createFAQ = async (
    data: Omit<FAQ, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
    const ref = await addDoc(collection(db, 'faqs'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
};

/** FAQ 수정 */
export const updateFAQ = async (
    id: string,
    data: Partial<Omit<FAQ, 'id' | 'createdAt'>>,
): Promise<void> => {
    await updateDoc(doc(db, 'faqs', id), {
        ...data,
        updatedAt: serverTimestamp(),
    });
};

/** FAQ 삭제 */
export const deleteFAQ = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'faqs', id));
};
