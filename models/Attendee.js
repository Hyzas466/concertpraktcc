const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendee = sequelize.define('Attendee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tickets',
      key: 'id'
    }
  },
  qr_code: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  qr_image_url: {
    type: DataTypes.STRING(500)
  },
  attendee_name: {
    type: DataTypes.STRING(255)
  },
  attendee_email: {
    type: DataTypes.STRING(255)
  },
  check_in_status: {
    type: DataTypes.ENUM('not_checked', 'checked_in'),
    defaultValue: 'not_checked'
  },
  check_in_time: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'attendees',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Attendee;
