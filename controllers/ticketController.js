const { Ticket, Event } = require('../models');
const { getCache, setCache, delCache } = require('../config/cache');

// Create a new ticket category for an event
const createTicket = async (req, res) => {
  try {
    const { event_id, category, price, quota, description } = req.body;

    const event = await Event.findByPk(event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const ticket = await Ticket.create({
      event_id,
      category,
      price,
      quota,
      description
    });

    // Invalidate cache
    await delCache(`tickets_event_${event_id}`);
    await delCache(`event_${event_id}`);
    await delCache('all_events_*');

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all tickets for a specific event
const getTicketsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check Cache
    const cacheKey = `tickets_event_${eventId}`;
    const cachedTickets = await getCache(cacheKey);
    if (cachedTickets) {
      return res.json({ success: true, data: cachedTickets, source: 'cache' });
    }

    const tickets = await Ticket.findAll({
      where: { event_id: eventId }
    });

    // Set Cache
    await setCache(cacheKey, tickets, 3600); // Cache for 1 hour

    res.json({ success: true, data: tickets, source: 'db' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update ticket
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, price, quota, description } = req.body;

    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    await ticket.update({
      category: category !== undefined ? category : ticket.category,
      price: price !== undefined ? price : ticket.price,
      quota: quota !== undefined ? quota : ticket.quota,
      description: description !== undefined ? description : ticket.description
    });

    // Invalidate cache
    await delCache(`tickets_event_${ticket.event_id}`);
    await delCache(`event_${ticket.event_id}`);
    await delCache('all_events_*');

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete ticket
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const eventId = ticket.event_id;
    await ticket.destroy();

    // Invalidate cache
    await delCache(`tickets_event_${eventId}`);
    await delCache(`event_${eventId}`);
    await delCache('all_events_*');

    res.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTicket,
  getTicketsByEvent,
  updateTicket,
  deleteTicket
};
