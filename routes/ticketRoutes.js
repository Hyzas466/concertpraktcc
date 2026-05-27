const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.post('/', authenticate, adminOnly, ticketController.createTicket);
router.get('/event/:eventId', ticketController.getTicketsByEvent);
router.put('/:id', authenticate, adminOnly, ticketController.updateTicket);
router.delete('/:id', authenticate, adminOnly, ticketController.deleteTicket);

module.exports = router;
