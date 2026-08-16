/**
 * Firebase Client Configuration
 * Uses environment variables with hardcoded fallbacks for Studio/Vercel compatibility.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAEyCM4Ay93zrxMjSWU5h5Dcr7HkPF3rUE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-3002446330-d43c8.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-3002446330-d43c8",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-3002446330-d43c8.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1024789679712",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1024789679712:web:b54cd61dcd21fce715fd05",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};
