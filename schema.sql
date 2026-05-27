-- Database: concert_ticketing
CREATE DATABASE IF NOT EXISTS concert_ticketing;
USE concert_ticketing;

-- Drop tables if exists (untuk fresh install)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS attendees;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- Table users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table events
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    venue VARCHAR(255) NOT NULL,
    event_date DATETIME NOT NULL,
    banner_url VARCHAR(500),
    status ENUM('draft', 'published', 'cancelled', 'completed') DEFAULT 'draft',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_event_date (event_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table tickets
CREATE TABLE tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    category VARCHAR(100) NOT NULL COMMENT 'VIP, Regular, Early Bird',
    price DECIMAL(10,2) NOT NULL,
    quota INT NOT NULL,
    sold INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event_id (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table orders
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    ticket_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table attendees
CREATE TABLE attendees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    ticket_id INT NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    qr_image_url VARCHAR(500),
    attendee_name VARCHAR(255),
    attendee_email VARCHAR(255),
    check_in_status ENUM('not_checked', 'checked_in') DEFAULT 'not_checked',
    check_in_time DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    INDEX idx_qr_code (qr_code),
    INDEX idx_order_id (order_id),
    INDEX idx_check_in_status (check_in_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type ENUM('order', 'event', 'reminder', 'promo') DEFAULT 'order',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert dummy admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
('admin@concert.com', '$2b$10$xfOESF6uvQPywjJjiVMsiuYwqA94gVrptbuvhO6tO2KXfRykT7Ilu', 'Admin Concert', '081234567890', 'admin');

-- Insert dummy event
INSERT INTO events (title, description, venue, event_date, status, created_by) VALUES
('Indie Fest 2026', 'Festival musik indie terbesar tahun ini', 'GOR Semarang', '2026-07-15 19:00:00', 'published', 1);

-- Insert dummy tickets
INSERT INTO tickets (event_id, category, price, quota, description) VALUES
(1, 'VIP', 500000.00, 100, 'Akses VIP lounge, merchandise gratis'),
(1, 'Regular', 250000.00, 500, 'Standing area'),
(1, 'Early Bird', 150000.00, 200, 'Harga promo early bird');