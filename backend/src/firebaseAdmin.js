const admin = require('firebase-admin')
const fs = require('fs')

function initFirebaseAdmin(){
  if(admin.apps && admin.apps.length) return admin

  // Prefer GOOGLE_APPLICATION_CREDENTIALS (path to JSON file)
  if(process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)){
    admin.initializeApp()
    return admin
  }

  // Or accept service account JSON via env var FIREBASE_SERVICE_ACCOUNT_JSON
  if(process.env.FIREBASE_SERVICE_ACCOUNT_JSON){
    const obj = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    admin.initializeApp({credential: admin.credential.cert(obj)})
    return admin
  }

  throw new Error('Firebase Admin not configured. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON')
}

module.exports = initFirebaseAdmin()
