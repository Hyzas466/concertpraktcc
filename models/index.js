const User = require('./User');
const Event = require('./Event');
const Ticket = require('./Ticket');
const Order = require('./Order');
const Attendee = require('./Attendee');
const Notification = require('./Notification');

// Define relationships
Event.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Event, { foreignKey: 'created_by' });

Ticket.belongsTo(Event, { foreignKey: 'event_id' });
Event.hasMany(Ticket, { foreignKey: 'event_id' });

Order.belongsTo(User, { foreignKey: 'user_id' });
Order.belongsTo(Event, { foreignKey: 'event_id' });
Order.belongsTo(Ticket, { foreignKey: 'ticket_id' });
User.hasMany(Order, { foreignKey: 'user_id' });

Attendee.belongsTo(Order, { foreignKey: 'order_id' });
Attendee.belongsTo(User, { foreignKey: 'user_id' });
Attendee.belongsTo(Event, { foreignKey: 'event_id' });
Attendee.belongsTo(Ticket, { foreignKey: 'ticket_id' });

Order.hasMany(Attendee, { foreignKey: 'order_id' });

Notification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });

module.exports = {
  User,
  Event,
  Ticket,
  Order,
  Attendee,
  Notification
};
