import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    getDocs,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Timestamp | null;
}

export interface ChatRoom {
    id: string;
    participants: string[];
    lastMessage: string;
    lastMessageTime: Timestamp | null;
}

/** 두 uid로 고유한 채팅방 ID 생성 (항상 동일한 채팅방) */
export const getChatId = (uid1: string, uid2: string): string => {
    return [uid1, uid2].sort().join('_');
};

/** 메시지 전송 + 채팅방 메타데이터 업데이트 */
export const sendMessage = async (
    chatId: string,
    senderId: string,
    senderName: string,
    otherUid: string,
    text: string,
): Promise<void> => {
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        senderId,
        senderName,
        timestamp: serverTimestamp(),
    });
    await setDoc(
        doc(db, 'chats', chatId),
        {
            participants: [senderId, otherUid],
            lastMessage: text,
            lastMessageTime: serverTimestamp(),
        },
        { merge: true },
    );
};

/** 채팅방 메시지 실시간 구독 */
export const subscribeToMessages = (
    chatId: string,
    callback: (messages: ChatMessage[]) => void,
): (() => void) => {
    const q = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'asc'),
    );
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        })) as ChatMessage[];
        callback(messages);
    });
};

/** 특정 유저가 참여한 채팅방 목록 실시간 구독 */
export const subscribeToUserChats = (
    uid: string,
    callback: (chats: ChatRoom[]) => void,
): (() => void) => {
    const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', uid),
    );
    return onSnapshot(q, (snapshot) => {
        const chats = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        })) as ChatRoom[];
        callback(chats);
    });
};

/** 채팅방 삭제 (메시지 전체 + 채팅방 문서) */
export const deleteChatRoom = async (chatId: string): Promise<void> => {
    const messages = await getDocs(collection(db, 'chats', chatId, 'messages'));
    await Promise.all(messages.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'chats', chatId));
};
