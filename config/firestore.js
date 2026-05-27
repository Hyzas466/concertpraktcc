const admin = require('firebase-admin');

// Inisialisasi Firebase Admin menggunakan Application Default Credentials (ADC)
// Ini memungkinkan Cloud Run otomatis menggunakan Service Account miliknya
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

module.exports = { admin, db };
