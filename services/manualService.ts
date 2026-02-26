import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    getDoc,
    setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface ManualItem {
    id: string;
    categoryId: string;
    subCategory: string;
    title: string;
    description: string;
    icon: string;
    timeEstimate: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    steps: string[];
    lastEditedBy?: string;
    lastEditedByName?: string;
    createdAt: Timestamp | null;
    updatedAt: Timestamp | null;
}

/** 카테고리별 매뉴얼 실시간 구독 */
export const subscribeToManuals = (
    categoryId: string,
    callback: (items: ManualItem[]) => void,
): (() => void) => {
    const q = query(
        collection(db, 'manualItems'),
        where('categoryId', '==', categoryId),
        orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ManualItem[]);
    });
};

/** 전체 매뉴얼 실시간 구독 (검색용) */
export const subscribeToAllManuals = (
    callback: (items: ManualItem[]) => void,
): (() => void) => {
    const q = query(collection(db, 'manualItems'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ManualItem[]);
    });
};

/** 내가 편집한 매뉴얼 실시간 구독 */
export const subscribeToMyManuals = (
    uid: string,
    callback: (items: ManualItem[]) => void,
): (() => void) => {
    const q = query(
        collection(db, 'manualItems'),
        where('lastEditedBy', '==', uid),
        orderBy('updatedAt', 'desc'),
    );
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ManualItem[]);
    });
};

/** 매뉴얼 단건 조회 */
export const getManualItem = async (id: string): Promise<ManualItem | null> => {
    const snap = await getDoc(doc(db, 'manualItems', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as ManualItem;
};

/** 새 매뉴얼 생성 */
export const createManualItem = async (
    data: Omit<ManualItem, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
    const ref = await addDoc(collection(db, 'manualItems'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
};

/** 매뉴얼 수정 */
export const updateManualItem = async (
    id: string,
    data: Partial<Omit<ManualItem, 'id' | 'createdAt'>>,
): Promise<void> => {
    await updateDoc(doc(db, 'manualItems', id), {
        ...data,
        updatedAt: serverTimestamp(),
    });
};

/** 매뉴얼 삭제 */
export const deleteManualItem = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'manualItems', id));
};

/** 매뉴얼 스크랩 토글 */
export const toggleScrapManual = async (uid: string, manualId: string): Promise<boolean> => {
    const scrapRef = doc(db, 'users', uid, 'scraps', manualId);
    const snap = await getDoc(scrapRef);

    if (snap.exists()) {
        await deleteDoc(scrapRef);
        return false; // unscrapped
    } else {
        await setDoc(scrapRef, {
            manualId,
            scrappedAt: serverTimestamp()
        });
        return true; // scrapped
    }
};

/** 특정 사용자의 스크랩 상태 확인 */
export const checkIsScrapped = async (uid: string, manualId: string): Promise<boolean> => {
    const snap = await getDoc(doc(db, 'users', uid, 'scraps', manualId));
    return snap.exists();
};

/** 사용자의 스크랩한 매뉴얼 목록 실시간 구독 */
export const subscribeToScrappedManuals = (
    uid: string,
    callback: (manuals: ManualItem[]) => void
): (() => void) => {
    const q = query(collection(db, 'users', uid, 'scraps'), orderBy('scrappedAt', 'desc'));

    return onSnapshot(q, async (snapshot) => {
        const manualIds = snapshot.docs.map(d => d.data().manualId);
        if (manualIds.length === 0) {
            callback([]);
            return;
        }

        // 각 매뉴얼의 상세 정보를 가져옴
        const manualPromises = manualIds.map(id => getManualItem(id));
        const manuals = await Promise.all(manualPromises);
        callback(manuals.filter((m): m is ManualItem => m !== null));
    });
};
