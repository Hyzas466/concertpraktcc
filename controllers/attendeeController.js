const { Attendee, Event, Ticket, User } = require('../models');
const { getCache, setCache, delCache } = require('../config/cache');
const { db, FieldValue } = require('../config/firestore');

// ── Helper: Safe Firestore logging (non-blocking) ──
// Jika Firestore belum aktif atau gagal, log ke console saja agar core flow tetap jalan
const safeFirestoreAdd = async (collection, data) => {
  try {
    if (!db) {
      console.warn(`⚠️ Firestore not available, skipping log to ${collection}`);
      return null;
    }
    return await db.collection(collection).add(data);
  } catch (error) {
    console.error(`⚠️ Firestore write to ${collection} failed:`, error.message);
    return null;
  }
};

const safeFirestoreUpdate = async (docRef, data) => {
  try {
    if (!docRef) return;
    await docRef.set(data, { merge: true });
  } catch (error) {
    console.error('⚠️ Firestore update failed:', error.message);
  }
};

const getTimestamp = () => {
  try {
    if (FieldValue && typeof FieldValue.serverTimestamp === 'function') {
      return FieldValue.serverTimestamp();
    }
  } catch (_) {}
  return new Date();
};

// Get all tickets/attendees owned by the current user
const getUserTickets = async (req, res) => {
  try {
    const user_id = req.user.id;
    const attendees = await Attendee.findAll({
      where: { user_id },
      include: [
        { model: Event, attributes: ['title', 'event_date', 'venue'] },
        { model: Ticket, attributes: ['category'] }
      ]
    });

    res.json({ success: true, data: attendees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Validate QR Code (used by Gatekeeper) - Using Redis/Firestore Cache for speed
const validateQR = async (req, res) => {
  let scanRef = null;
  try {
    const { qrCode } = req.params;

    // 1. Enqueue scan attempt in Firestore (Antrean Scan)
    scanRef = await safeFirestoreAdd('scan_queue', {
      qr_code: qrCode,
      status: 'verifying',
      timestamp: getTimestamp()
    });
    
    // Check Cache
    const cacheKey = `qr_validation_${qrCode}`;
    let cachedAttendee = null;
    try {
      cachedAttendee = await getCache(cacheKey);
    } catch (cacheErr) {
      console.warn('⚠️ Cache read failed, falling back to DB:', cacheErr.message);
    }

    if (cachedAttendee) {
      // Update scan queue status
      await safeFirestoreUpdate(scanRef, { status: 'verified' });
      
      // Log access (Fast Access Log)
      await safeFirestoreAdd('access_logs', {
        qr_code: qrCode,
        action: 'validate',
        status: 'success',
        message: 'QR code verified from cache',
        timestamp: getTimestamp()
      });

      return res.json({ 
        success: true, 
        data: cachedAttendee, 
        source: 'cache' 
      });
    }

    // If not in cache, query DB
    const attendee = await Attendee.findOne({
      where: { qr_code: qrCode },
      include: [
        { model: Event, attributes: ['title', 'event_date'] },
        { model: Ticket, attributes: ['category'] },
        { model: User, attributes: ['full_name', 'email'] }
      ]
    });

    if (!attendee) {
      // Update scan queue status
      await safeFirestoreUpdate(scanRef, { status: 'failed' });

      // Log access
      await safeFirestoreAdd('access_logs', {
        qr_code: qrCode,
        action: 'validate',
        status: 'failed',
        message: 'Invalid QR Code scanned',
        timestamp: getTimestamp()
      });

      return res.status(404).json({ success: false, message: 'Invalid QR Code' });
    }

    // Set cache for 5 minutes (to speed up subsequent scans if gate is crowded - Status QR Gate Ramai)
    try {
      await setCache(cacheKey, attendee, 300);
    } catch (cacheErr) {
      console.warn('⚠️ Cache write failed:', cacheErr.message);
    }

    // Update scan queue status
    await safeFirestoreUpdate(scanRef, { status: 'verified' });

    // Log access
    await safeFirestoreAdd('access_logs', {
      qr_code: qrCode,
      action: 'validate',
      status: 'success',
      message: `QR code verified successfully for attendee ${attendee.attendee_name}`,
      timestamp: getTimestamp()
    });

    res.json({ success: true, data: attendee, source: 'db' });
  } catch (error) {
    await safeFirestoreUpdate(scanRef, { status: 'error', error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check in Attendee
const checkIn = async (req, res) => {
  let scanRef = null;
  try {
    const { qrCode } = req.params;

    // 1. Enqueue checkin scan attempt in Firestore (Antrean Scan)
    scanRef = await safeFirestoreAdd('scan_queue', {
      qr_code: qrCode,
      status: 'checkin_processing',
      timestamp: getTimestamp()
    });

    const attendee = await Attendee.findOne({ 
      where: { qr_code: qrCode },
      include: [
        { model: Event, attributes: ['title'] },
        { model: Ticket, attributes: ['category'] }
      ]
    });

    if (!attendee) {
      await safeFirestoreUpdate(scanRef, { status: 'failed' });

      await safeFirestoreAdd('access_logs', {
        qr_code: qrCode,
        action: 'check_in',
        status: 'failed',
        message: 'Invalid QR Code checkin attempt',
        timestamp: getTimestamp()
      });

      return res.status(404).json({ success: false, message: 'Invalid QR Code' });
    }

    if (attendee.check_in_status === 'checked_in') {
      await safeFirestoreUpdate(scanRef, { status: 'failed' });

      await safeFirestoreAdd('access_logs', {
        qr_code: qrCode,
        action: 'check_in',
        status: 'failed',
        message: 'Ticket already checked in',
        timestamp: getTimestamp()
      });

      return res.status(400).json({ success: false, message: 'Ticket already checked in' });
    }

    await attendee.update({ 
      check_in_status: 'checked_in',
      check_in_time: new Date()
    });

    // Invalidate Cache for this QR to reflect updated status
    try {
      await delCache(`qr_validation_${qrCode}`);
    } catch (cacheErr) {
      console.warn('⚠️ Cache delete failed:', cacheErr.message);
    }

    // Update scan queue status
    await safeFirestoreUpdate(scanRef, { status: 'completed' });

    // Log access
    await safeFirestoreAdd('access_logs', {
      qr_code: qrCode,
      action: 'check_in',
      status: 'success',
      message: `Attendee ${attendee.attendee_name} checked in successfully`,
      timestamp: getTimestamp()
    });

    // Send real-time notification to Firestore for the spectator (Notif Penonton)
    await safeFirestoreAdd('spectator_notifications', {
      user_id: attendee.user_id,
      title: 'Check-in Berhasil',
      message: `Selamat datang di ${attendee.Event?.title || 'Konser'}! Tiket kategori ${attendee.Ticket?.category || ''} Anda telah berhasil di-scan.`,
      type: 'check_in',
      is_read: false,
      created_at: getTimestamp()
    });

    res.json({ success: true, message: 'Check-in successful', data: attendee });
  } catch (error) {
    await safeFirestoreUpdate(scanRef, { status: 'error', error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserTickets,
  validateQR,
  checkIn
};
