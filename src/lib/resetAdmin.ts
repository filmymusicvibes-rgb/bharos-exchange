/**
 * Temporary Admin Password Reset Script
 * Creates/updates admin credentials in Firestore
 * DELETE THIS FILE AFTER USE!
 */

import { db, auth } from "./firebase"
import { doc, setDoc } from "firebase/firestore"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"

export async function resetAdminPassword() {
  try {
    // First authenticate with Firebase Auth
    const email = "teambharos@gmail.com"
    const password = "Admin2026"
    
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      try {
        await createUserWithEmailAndPassword(auth, email, password)
      } catch (e: any) {
        // If already exists with different password, try common ones
        if (e.code === 'auth/email-already-in-use') {
          // Try alternate passwords that may have been set before
          const attempts = ["admin123", "Admin123", "bharos2026", "Bharos2026", "admin2026"]
          let signedIn = false
          for (const pwd of attempts) {
            try {
              await signInWithEmailAndPassword(auth, email, pwd)
              signedIn = true
              break
            } catch {}
          }
          if (!signedIn) {
            return "❌ Cannot sign into Firebase Auth. Please reset via Firebase Console."
          }
        }
      }
    }

    // Now write to Firestore (authenticated)
    await setDoc(doc(db, "admins", "teambharos@gmail.com"), {
      password: password,
      userEmail: "teambharos@gmail.com",
      role: "superadmin",
      updatedAt: new Date()
    })
    
    return "✅ Admin password reset to Admin2026! Now login above."
  } catch (err: any) {
    return "❌ Error: " + err.message
  }
}
