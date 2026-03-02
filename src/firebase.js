import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB_dWgMFCVLwhk-Jqvl5J6tO_SZqFYzmow",
    authDomain: "charley-488807.firebaseapp.com",
    projectId: "charley-488807",
    storageBucket: "charley-488807.firebasestorage.app",
    messagingSenderId: "664373230809",
    appId: "1:664373230809:web:e2a789387e687aebc992c8",
    measurementId: "G-ZBVT0R1JLF"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
