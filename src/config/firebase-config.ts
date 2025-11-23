import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB_iEaoTSookyUyp4VbiB-obebUD1jpB4k",
    authDomain: "grupoemanuel46-36947.firebaseapp.com",
    databaseURL: "https://grupoemanuel46-36947-default-rtdb.firebaseio.com",
    projectId: "grupoemanuel46-36947",
    storageBucket: "grupoemanuel46-36947.firebasestorage.app",
    messagingSenderId: "1078739221850",
    appId: "1:1078739221850:web:d15d96c46c572a70f18763",
    measurementId: "G-BC6SRTKXC6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

export default app;
