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
    writeBatch,
    getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notificationService';

export interface ManualCategory {
    id: string;
    name: string;
    icon: string;
    colorClass: string;
    bgClass: string;
    type: 'admin' | 'subject';
    order: number;
    academyId: string;
    createdAt?: Timestamp | null;
}

/** 카테고리 초기화 (필요시) */
export const initializeCategoriesIfNeeded = async (academyId: string, initialCategories: any[]): Promise<void> => {
    if (!academyId) return;
    const q = query(collection(db, 'manualCategories'), where('academyId', '==', academyId));
    const snap = await getDocs(q);
    if (snap.empty) {
        const batch = writeBatch(db);
        initialCategories.forEach((cat, index) => {
            const { id, ...data } = cat;
            const ref = doc(collection(db, 'manualCategories'));
            batch.set(ref, {
                ...data,
                order: index,
                academyId,
                createdAt: serverTimestamp(),
            });
        });
        await batch.commit();
    }
};

/** 카테고리 실시간 구독 */
export const subscribeToCategories = (
    academyId: string,
    callback: (categories: ManualCategory[]) => void,
): (() => void) => {
    if (!academyId) return () => { };
    const q = query(
        collection(db, 'manualCategories'),
        where('academyId', '==', academyId)
    );
    return onSnapshot(q, (snapshot) => {
        const rawItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ManualCategory[];
        const map = new Map<string, ManualCategory>();
        rawItems.forEach(item => {
            if (!map.has(item.name)) map.set(item.name, item);
        });
        const items = Array.from(map.values());
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(items);
    }, (error) => {
        console.error("subscribeToCategories error:", error);
    });
};

/** 카테고리 생성 */
export const createManualCategory = async (
    data: Omit<ManualCategory, 'id' | 'createdAt'>,
): Promise<string> => {
    const ref = await addDoc(collection(db, 'manualCategories'), {
        ...data,
        createdAt: serverTimestamp(),
    });
    return ref.id;
};

/** 카테고리 수정 */
export const updateManualCategory = async (
    id: string,
    data: Partial<Omit<ManualCategory, 'id' | 'createdAt'>>,
): Promise<void> => {
    await updateDoc(doc(db, 'manualCategories', id), data);
};

/** 카테고리 삭제 (해당 카테고리의 매뉴얼 아이템 및 알림도 함께 삭제) */
export const deleteManualCategory = async (id: string): Promise<void> => {
    const batch = writeBatch(db);

    // 1. 해당 카테고리의 매뉴얼 아이템들 찾기
    const itemsSnap = await getDocs(
        query(collection(db, 'manualItems'), where('categoryId', '==', id))
    );

    for (const itemDoc of itemsSnap.docs) {
        // 2. 각 매뉴얼 아이템의 알림들 삭제
        const notiSnap = await getDocs(query(collection(db, 'notifications'), where('targetId', '==', itemDoc.id)));
        notiSnap.docs.forEach(d => batch.delete(d.ref));

        // 3. 매뉴얼 아이템 원본 삭제
        batch.delete(itemDoc.ref);
    }

    // 4. 카테고리 삭제
    batch.delete(doc(db, 'manualCategories', id));
    await batch.commit();
};

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
    academyId: string;
    createdAt: Timestamp | null;
    updatedAt: Timestamp | null;
}

/** 카테고리별 매뉴얼 실시간 구독 */
export const subscribeToManuals = (
    categoryId: string,
    academyId: string,
    callback: (items: ManualItem[]) => void,
): (() => void) => {
    if (!academyId) return () => { };
    const q = query(
        collection(db, 'manualItems'),
        where('academyId', '==', academyId),
        where('categoryId', '==', categoryId)
    );
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ManualItem[];
        items.sort((a, b) => {
            const tA = a.createdAt?.toMillis() || 0;
            const tB = b.createdAt?.toMillis() || 0;
            return tB - tA; // desc
        });
        callback(items);
    }, (error) => {
        console.error("subscribeToManuals error:", error);
    });
};

/** 전체 매뉴얼 실시간 구독 (검색용) */
export const subscribeToAllManuals = (
    academyId: string,
    callback: (items: ManualItem[]) => void,
): (() => void) => {
    if (!academyId) return () => { };
    const q = query(
        collection(db, 'manualItems'),
        where('academyId', '==', academyId)
    );
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ManualItem[];
        items.sort((a, b) => {
            const tA = a.createdAt?.toMillis() || 0;
            const tB = b.createdAt?.toMillis() || 0;
            return tB - tA; // desc
        });
        callback(items);
    }, (error) => {
        console.error("subscribeToAllManuals error:", error);
    });
};

/** 내가 편집한 매뉴얼 실시간 구독 */
export const subscribeToMyManuals = (
    uid: string,
    academyId: string,
    callback: (items: ManualItem[]) => void,
): (() => void) => {
    if (!academyId) return () => { };
    const q = query(
        collection(db, 'manualItems'),
        where('academyId', '==', academyId),
        where('lastEditedBy', '==', uid)
    );
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ManualItem[];
        items.sort((a, b) => {
            const tA = a.updatedAt?.toMillis() || 0;
            const tB = b.updatedAt?.toMillis() || 0;
            return tB - tA; // desc
        });
        callback(items);
    }, (error) => {
        console.error("subscribeToMyManuals error:", error);
    });
};

export const getManualItem = async (id: string): Promise<ManualItem | null> => {
    if (!id || typeof id !== 'string') return null;
    try {
        const snap = await getDoc(doc(db, 'manualItems', id));
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as ManualItem;
    } catch (err) {
        console.error("Error fetching manual item:", err);
        return null;
    }
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

    // 알림 생성
    await createNotification({
        type: 'manual',
        action: 'created',
        title: data.title,
        targetId: ref.id,
        categoryId: data.categoryId,
        academyId: data.academyId,
        authorName: data.lastEditedByName || '관리자',
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

    // 알림 생성 (수정 시)
    if (data.title) {
        const item = await getManualItem(id);
        await createNotification({
            type: 'manual',
            action: 'updated',
            title: data.title,
            targetId: id,
            categoryId: data.categoryId || (item?.categoryId),
            academyId: data.academyId || (item?.academyId || ''),
            authorName: data.lastEditedByName || '관리자',
        });
    }
};

/** 매뉴얼 삭제 (관련 알림도 함께 삭제) */
export const deleteManualItem = async (id: string): Promise<void> => {
    const batch = writeBatch(db);

    // 1. 관련 알림 삭제
    const notiSnap = await getDocs(query(collection(db, 'notifications'), where('targetId', '==', id)));
    notiSnap.docs.forEach(d => batch.delete(d.ref));

    // 2. 매뉴얼 원본 삭제
    batch.delete(doc(db, 'manualItems', id));

    await batch.commit();
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

export const checkIsScrapped = async (uid: string, manualId: string): Promise<boolean> => {
    if (!uid || !manualId) return false;
    try {
        const snap = await getDoc(doc(db, 'users', uid, 'scraps', manualId));
        return snap.exists();
    } catch (err) {
        console.error("Error checking scrap status:", err);
        return false;
    }
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
