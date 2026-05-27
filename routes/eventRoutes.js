const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', authenticate, adminOnly, eventController.createEvent);
router.put('/:id', authenticate, adminOnly, eventController.updateEvent);
router.delete('/:id', authenticate, adminOnly, eventController.deleteEvent);

module.exports = router;
