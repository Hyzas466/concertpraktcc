const admin = require('firebase-admin');

// Inisialisasi Firebase Admin menggunakan Application Default Credentials (ADC)
// Ini memungkinkan Cloud Run otomatis menggunakan Service Account miliknya
let db;
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
  db = admin.firestore();
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  // Create a placeholder that will throw informative errors if used
  db = null;
}

module.exports = { admin, db };
