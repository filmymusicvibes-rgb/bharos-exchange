import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyASVspxoe6yT0JLm2ggYZmuJgJNHXBCYfY",
  authDomain: "bharos-exchange-app.firebaseapp.com",
  projectId: "bharos-exchange-app",
  storageBucket: "bharos-exchange-app.firebasestorage.app",
  messagingSenderId: "608633000205",
  appId: "1:608633000205:web:f78078eb7c2c0e187c2044"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
