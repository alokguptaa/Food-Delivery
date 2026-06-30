// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "food-delivery-382a0.firebaseapp.com",
  projectId: "food-delivery-382a0",
  storageBucket: "food-delivery-382a0.firebasestorage.app",
  messagingSenderId: "125525847587",
  appId: "1:125525847587:web:4d5e581cc0a3b6b57fcb96"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

export {app, auth};
