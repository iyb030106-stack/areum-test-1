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
    deletedBy?: string[]; // 삭제를 누른 사용자 ID 목록
    lastMessage: string;
    academyId: string;
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
    academyId: string,
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
            academyId,
            lastMessageTime: serverTimestamp(),
            deletedBy: [], // 메시지가 전송되면 양쪽 모두에게 다시 나타나게 함
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
    }, (error) => {
        console.error("subscribeToChatMessages error:", error);
    });
};

/** 특정 유저가 참여한 채팅방 목록 실시간 구독 */
export const subscribeToUserChats = (
    uid: string,
    academyId: string,
    callback: (chats: ChatRoom[]) => void,
): (() => void) => {
    if (!academyId) return () => { };
    const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', uid)
    );
    return onSnapshot(q, (snapshot) => {
        const chats = snapshot.docs
            .map((d) => ({
                id: d.id,
                ...d.data(),
            })) as ChatRoom[];

        const filteredChats = chats.filter(c => c.academyId === academyId);

        // 내가 삭제하지 않은 채팅방만 필터링
        const activeChats = filteredChats.filter(chat =>
            !chat.deletedBy || !chat.deletedBy.includes(uid)
        );

        callback(activeChats);
    }, (error) => {
        console.error("subscribeToUserChats error:", error);
    });
};

/** 채팅방 독립적 삭제 (나에게만 안 보이게 처리) */
export const deleteChatRoomForUser = async (chatId: string, uid: string): Promise<void> => {
    const chatRef = doc(db, 'chats', chatId);
    const snap = await getDocs(query(collection(db, 'chats'), where('__name__', '==', chatId)));

    if (snap.empty) return;

    const chatData = snap.docs[0].data() as ChatRoom;
    const currentDeletedBy = chatData.deletedBy || [];

    if (!currentDeletedBy.includes(uid)) {
        const newDeletedBy = [...currentDeletedBy, uid];

        // 만약 참여자 전원이 삭제했다면? (선택사항: 원하면 진짜 삭제하거나 그대로 둠)
        // 여기서는 그냥 나에게만 안 보이게 필드 업데이트만 함
        await setDoc(chatRef, {
            deletedBy: newDeletedBy
        }, { merge: true });
    }
};
