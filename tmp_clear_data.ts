
import { db } from './services/firebase';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

async function clearManualData() {
    console.log('--- 매뉴얼 데이터 초기화 시작 ---');

    // 1. 카테고리 삭제
    const catSnap = await getDocs(collection(db, 'manualCategories'));
    const catBatch = writeBatch(db);
    catSnap.docs.forEach(d => catBatch.delete(d.ref));
    await catBatch.commit();
    console.log(`${catSnap.size}개의 카테고리 삭제 완료`);

    // 2. 매뉴얼 아이템 삭제
    const itemSnap = await getDocs(collection(db, 'manualItems'));
    const itemBatch = writeBatch(db);
    itemSnap.docs.forEach(d => itemBatch.delete(d.ref));
    await itemBatch.commit();
    console.log(`${itemSnap.size}개의 매뉴얼 아이템 삭제 완료`);

    console.log('--- 모든 데이터가 비워졌습니다. 앱을 새로고침 해주세요. ---');
}

clearManualData();
