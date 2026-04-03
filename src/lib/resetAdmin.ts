/**
 * Temporary Admin Password Reset Script
 * Creates/updates admin credentials in Firestore
 * DELETE THIS FILE AFTER USE!
 */

import { db } from "./firebase"
import { doc, setDoc } from "firebase/firestore"

export async function resetAdminPassword() {
  try {
    await setDoc(doc(db, "admins", "teambharos@gmail.com"), {
      password: "Admin2026",
      userEmail: "teambharos@gmail.com",
      role: "superadmin",
      updatedAt: new Date()
    })
    return "✅ Admin password reset to Admin2026!"
  } catch (err: any) {
    return "❌ Error: " + err.message
  }
}
