import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBngLSW5njMOc3cYz79yJRlG6POW1Ol2-c",
    authDomain: "areum-test1.firebaseapp.com",
    projectId: "areum-test1",
    storageBucket: "areum-test1.firebasestorage.app",
    messagingSenderId: "816404319896",
    appId: "1:816404319896:web:a72e496105c55abebfcaed",
    measurementId: "G-QN1L2EV0WG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
