const { Attendee, Event, Ticket, User } = require('../models');
const { getCache, setCache, delCache } = require('../config/cache');
const { db, FieldValue } = require('../config/firestore');

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
    scanRef = await db.collection('scan_queue').add({
      qr_code: qrCode,
      status: 'verifying',
      timestamp: FieldValue.serverTimestamp()
    });
    
    // Check Cache
    const cacheKey = `qr_validation_${qrCode}`;
    const cachedAttendee = await getCache(cacheKey);

    if (cachedAttendee) {
      // Update scan queue status
      await db.collection('scan_queue').doc(scanRef.id).set({ status: 'verified' }, { merge: true });
      
      // Log access (Fast Access Log)
      await db.collection('access_logs').add({
        qr_code: qrCode,
        action: 'validate',
        status: 'success',
        message: 'QR code verified from cache',
        timestamp: FieldValue.serverTimestamp()
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
      await db.collection('scan_queue').doc(scanRef.id).set({ status: 'failed' }, { merge: true });

      // Log access
      await db.collection('access_logs').add({
        qr_code: qrCode,
        action: 'validate',
        status: 'failed',
        message: 'Invalid QR Code scanned',
        timestamp: FieldValue.serverTimestamp()
      });

      return res.status(404).json({ success: false, message: 'Invalid QR Code' });
    }

    // Set cache for 5 minutes (to speed up subsequent scans if gate is crowded - Status QR Gate Ramai)
    await setCache(cacheKey, attendee, 300);

    // Update scan queue status
    await db.collection('scan_queue').doc(scanRef.id).set({ status: 'verified' }, { merge: true });

    // Log access
    await db.collection('access_logs').add({
      qr_code: qrCode,
      action: 'validate',
      status: 'success',
      message: `QR code verified successfully for attendee ${attendee.attendee_name}`,
      timestamp: FieldValue.serverTimestamp()
    });

    res.json({ success: true, data: attendee, source: 'db' });
  } catch (error) {
    if (scanRef) {
      await db.collection('scan_queue').doc(scanRef.id).set({ status: 'error', error: error.message }, { merge: true });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check in Attendee
const checkIn = async (req, res) => {
  let scanRef = null;
  try {
    const { qrCode } = req.params;

    // 1. Enqueue checkin scan attempt in Firestore (Antrean Scan)
    scanRef = await db.collection('scan_queue').add({
      qr_code: qrCode,
      status: 'checkin_processing',
      timestamp: FieldValue.serverTimestamp()
    });

    const attendee = await Attendee.findOne({ 
      where: { qr_code: qrCode },
      include: [
        { model: Event, attributes: ['title'] },
        { model: Ticket, attributes: ['category'] }
      ]
    });

    if (!attendee) {
      await db.collection('scan_queue').doc(scanRef.id).set({ status: 'failed' }, { merge: true });

      await db.collection('access_logs').add({
        qr_code: qrCode,
        action: 'check_in',
        status: 'failed',
        message: 'Invalid QR Code checkin attempt',
        timestamp: FieldValue.serverTimestamp()
      });

      return res.status(404).json({ success: false, message: 'Invalid QR Code' });
    }

    if (attendee.check_in_status === 'checked_in') {
      await db.collection('scan_queue').doc(scanRef.id).set({ status: 'failed' }, { merge: true });

      await db.collection('access_logs').add({
        qr_code: qrCode,
        action: 'check_in',
        status: 'failed',
        message: 'Ticket already checked in',
        timestamp: FieldValue.serverTimestamp()
      });

      return res.status(400).json({ success: false, message: 'Ticket already checked in' });
    }

    await attendee.update({ 
      check_in_status: 'checked_in',
      check_in_time: new Date()
    });

    // Invalidate Cache for this QR to reflect updated status
    await delCache(`qr_validation_${qrCode}`);

    // Update scan queue status
    await db.collection('scan_queue').doc(scanRef.id).set({ status: 'completed' }, { merge: true });

    // Log access
    await db.collection('access_logs').add({
      qr_code: qrCode,
      action: 'check_in',
      status: 'success',
      message: `Attendee ${attendee.attendee_name} checked in successfully`,
      timestamp: FieldValue.serverTimestamp()
    });

    // Send real-time notification to Firestore for the spectator (Notif Penonton)
    await db.collection('spectator_notifications').add({
      user_id: attendee.user_id,
      title: 'Check-in Berhasil',
      message: `Selamat datang di ${attendee.Event?.title || 'Konser'}! Tiket kategori ${attendee.Ticket?.category || ''} Anda telah berhasil di-scan.`,
      type: 'check_in',
      is_read: false,
      created_at: FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: 'Check-in successful', data: attendee });
  } catch (error) {
    if (scanRef) {
      await db.collection('scan_queue').doc(scanRef.id).set({ status: 'error', error: error.message }, { merge: true });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserTickets,
  validateQR,
  checkIn
};
