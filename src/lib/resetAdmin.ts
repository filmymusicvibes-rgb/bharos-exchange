/**
 * Temporary Admin Password Reset — NO AUTH NEEDED
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
    return "✅ Done! Password set to Admin2026. Now login above!"
  } catch (err: any) {
    return "❌ Error: " + err.message
  }
}
