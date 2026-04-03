/**
 * Firestore Test Data Cleanup — One-time use
 * Clears all documents from: users, deposits, withdrawals, transactions
 * 
 * Run this from the Admin Panel (temporary button) or browser console
 */

import { db } from "./firebase"
import { collection, getDocs, doc, writeBatch } from "firebase/firestore"

const COLLECTIONS_TO_CLEAR = [
  "users",
  "deposits", 
  "withdrawals",
  "transactions",
]

export async function clearAllTestData(onProgress?: (msg: string) => void) {

  const log = (msg: string) => {
    console.log(msg)
    onProgress?.(msg)
  }

  log("🚨 Starting Firestore cleanup...")

  for (const collName of COLLECTIONS_TO_CLEAR) {
    log(`🗑️ Clearing '${collName}' collection...`)

    const snap = await getDocs(collection(db, collName))
    const totalDocs = snap.size

    if (totalDocs === 0) {
      log(`  ✅ '${collName}' already empty`)
      continue
    }

    // Batch delete (max 500 per batch)
    let deleted = 0
    let batch = writeBatch(db)
    let batchCount = 0

    for (const docSnap of snap.docs) {
      batch.delete(doc(db, collName, docSnap.id))
      batchCount++
      deleted++

      if (batchCount >= 450) { // Stay under 500 limit
        await batch.commit()
        log(`  🗑️ Deleted ${deleted}/${totalDocs} from '${collName}'`)
        batch = writeBatch(db)
        batchCount = 0
      }
    }

    if (batchCount > 0) {
      await batch.commit()
    }

    log(`  ✅ Cleared '${collName}' — ${totalDocs} documents deleted`)
  }

  log("✅ ALL TEST DATA CLEARED! Fresh start ready.")
  return true
}
