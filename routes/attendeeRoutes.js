const express = require('express');
const router = express.Router();
const attendeeController = require('../controllers/attendeeController');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// User views their own tickets (QR codes)
router.get('/user', authenticate, attendeeController.getUserTickets);

// Admin/Gatekeeper validates QR
router.get('/qr/:qrCode', authenticate, adminOnly, attendeeController.validateQR);

// Admin/Gatekeeper marks ticket as checked in
router.put('/checkin/:qrCode', authenticate, adminOnly, attendeeController.checkIn);

module.exports = router;
