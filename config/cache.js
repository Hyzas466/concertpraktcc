  .const { db } = require('./firestore');

const getCache = async (key) => {
  if (!db) return null;
  try {
    const docRef = db.collection('qr_cache').doc(key);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const data = doc.data();
    if (Date.now() > data.expiry) {
      await docRef.delete();
      return null;
    }
    return data.value;
  } catch (error) {
    console.error(`Error in getCache for key ${key}:`, error.message);
    return null;
  }
};

const setCache = async (key, value, expirationInSeconds = 3600) => {
  if (!db) return;
  try {
    const expiry = Date.now() + (expirationInSeconds * 1000);
    await db.collection('qr_cache').doc(key).set({
      value,
      expiry
    });
  } catch (error) {
    console.error(`Error in setCache for key ${key}:`, error.message);
  }
};

const delCache = async (keyPattern) => {
  if (!db) return;
  try {
    // For direct/specific keys
    if (!keyPattern.includes('*')) {
      await db.collection('qr_cache').doc(keyPattern).delete();
      return;
    }

    // For wildcard patterns (e.g. all_events_*)
    const snapshot = await db.collection('qr_cache').get();
    const regexPattern = keyPattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);

    const batch = [];
    snapshot.forEach(doc => {
      if (regex.test(doc.id)) {
        batch.push(db.collection('qr_cache').doc(doc.id).delete());
      }
    });

    await Promise.all(batch);
  } catch (error) {
    console.error(`Error in delCache for pattern ${keyPattern}:`, error.message);
  }
};

module.exports = {
  getCache,
  setCache,
  delCache
};

