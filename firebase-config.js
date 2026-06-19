import {
    getApp,
    getApps,
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_TdiyJmXO3Eq-m5A0ojvn01yq-WR7ij4",
    authDomain: "maycrosshub.firebaseapp.com",
    projectId: "maycrosshub",
    storageBucket: "maycrosshub.firebasestorage.app",
    messagingSenderId: "678338025875",
    appId: "1:678338025875:web:14484845f0fdef8c053066",
    measurementId: "G-Y2MZ4NKNHS"
};

export const firebaseApp = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);
