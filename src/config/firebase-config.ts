import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAwZRLfocinK91pVm_9Y2DilWVyXD9s4Qc",
    authDomain: "grupoemanuel46-bb986.firebaseapp.com",
    databaseURL: "https://grupoemanuel46-bb986-default-rtdb.firebaseio.com",
    projectId: "grupoemanuel46-bb986",
    storageBucket: "grupoemanuel46-bb986.firebasestorage.app",
    messagingSenderId: "463949954396",
    appId: "1:463949954396:web:62ee9f181d8c34636d9599"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

export default app;
