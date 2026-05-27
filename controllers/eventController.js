const { Event, Ticket, User } = require('../models');
const { getCache, setCache, delCache } = require('../config/cache');

/**
 * Get all events
 * GET /api/v1/events
 */
exports.getAllEvents = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const cacheKey = `all_events_${status || 'all'}`;
    const cachedEvents = await getCache(cacheKey);
    if (cachedEvents) {
      return res.json({
        success: true,
        data: cachedEvents,
        source: 'cache'
      });
    }

    const events = await Event.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'full_name', 'email']
        },
        {
          model: Ticket,
          attributes: ['id', 'category', 'price', 'quota', 'sold']
        }
      ],
      order: [['event_date', 'ASC']]
    });

    await setCache(cacheKey, events, 3600);

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
};

/**
 * Get event by ID
 * GET /api/v1/events/:id
 */
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `event_${id}`;
    const cachedEvent = await getCache(cacheKey);
    if (cachedEvent) {
      return res.json({
        success: true,
        data: cachedEvent,
        source: 'cache'
      });
    }

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'full_name', 'email']
        },
        {
          model: Ticket,
          attributes: ['id', 'category', 'price', 'quota', 'sold', 'description']
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await setCache(cacheKey, event, 3600);

    res.json({
      success: true,
      data: event,
      source: 'db'
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: error.message
    });
  }
};

/**
 * Create new event (Admin only)
 * POST /api/v1/events
 */
exports.createEvent = async (req, res) => {
  try {
    const { title, description, venue, event_date, status } = req.body;

    const event = await Event.create({
      title,
      description,
      venue,
      event_date,
      status: status || 'draft',
      created_by: req.user.id
    });

    await delCache('all_events_*');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message
    });
  }
};

/**
 * Update event (Admin only)
 * PUT /api/v1/events/:id
 */
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, venue, event_date, status } = req.body;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await event.update({
      title,
      description,
      venue,
      event_date,
      status
    });

    await delCache('all_events_*');
    await delCache(`event_${id}`);

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
};

/**
 * Delete event (Admin only)
 * DELETE /api/v1/events/:id
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await event.destroy();

    await delCache('all_events_*');
    await delCache(`event_${id}`);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message
    });
  }
};
