// Shared Firebase Admin SDK initialization for Vercel serverless functions
// Used by api/telegram.js and api/bot-earn.js

import admin from 'firebase-admin'

let db = null

function getFirestoreAdmin() {
  if (db) return db

  // Initialize only once
  if (!admin.apps.length) {
    // Use service account from environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'bharos-exchange-app'
      })
    } else {
      // Fallback: initialize with project ID only (for development)
      admin.initializeApp({
        projectId: 'bharos-exchange-app'
      })
    }
  }

  db = admin.firestore()
  return db
}

export default getFirestoreAdmin
