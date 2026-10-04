-- Skyline Student Association Management System
-- Multi-College Role-Hierarchy Database Schema & Initial Seed Data
-- Character Set: utf8mb4, Engine: InnoDB

CREATE DATABASE IF NOT EXISTS skyline_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skyline_db;

-- Drop tables in reverse dependency order for clean re-creation
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS financial_transactions;
DROP TABLE IF EXISTS finance_categories;
DROP TABLE IF EXISTS expense_requests;
DROP TABLE IF EXISTS fundraiser_tasks;
DROP TABLE IF EXISTS fundraisers;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS membership_plans;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS colleges;

-- 1. Colleges Table
CREATE TABLE colleges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  domain VARCHAR(100) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_colleges_active (is_active),
  INDEX idx_colleges_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'college_admin', 'organizer', 'student') NOT NULL,
  created_by INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_user_college_role CHECK (
    (role = 'super_admin' AND college_id IS NULL) OR
    (role IN ('college_admin', 'organizer', 'student') AND college_id IS NOT NULL)
  ),
  INDEX idx_users_college (college_id),
  INDEX idx_users_college_role (college_id, role),
  INDEX idx_users_email (email),
  INDEX idx_users_is_active (is_active),
  INDEX idx_users_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Membership Plans Table
CREATE TABLE membership_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  duration_months INT NOT NULL DEFAULT 12,
  ticket_discount_note VARCHAR(255) NULL,
  merch_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  organization VARCHAR(150) NULL DEFAULT 'Odoo Student Association',
  created_by INT NULL,
  approval_status ENUM('approved', 'pending_approval', 'rejected') NOT NULL DEFAULT 'approved',
  assigned_organizers TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_plan_fee CHECK (fee >= 0),
  CONSTRAINT chk_plan_duration CHECK (duration_months > 0),
  CONSTRAINT chk_merch_discount CHECK (merch_discount_percent >= 0 AND merch_discount_percent <= 100),
  INDEX idx_plans_college (college_id),
  INDEX idx_plans_college_active (college_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Memberships Table
CREATE TABLE memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  status ENUM('pending', 'active', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  dues_status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid',
  start_date DATE NULL,
  expiry_date DATE NULL,
  reminder_sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON DELETE RESTRICT,
  INDEX idx_memberships_college (college_id),
  INDEX idx_memberships_college_user (college_id, user_id),
  INDEX idx_memberships_college_status (college_id, status),
  INDEX idx_memberships_college_expiry (college_id, expiry_date),
  INDEX idx_memberships_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Events Table
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  location VARCHAR(200) NOT NULL,
  capacity INT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  member_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  non_member_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('draft', 'published', 'completed', 'cancelled') NOT NULL DEFAULT 'published',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_event_capacity CHECK (capacity > 0),
  CONSTRAINT chk_event_member_price CHECK (member_price >= 0),
  CONSTRAINT chk_event_non_member_price CHECK (non_member_price >= 0),
  CONSTRAINT chk_event_paid_prices CHECK (NOT (is_paid = TRUE AND (non_member_price <= 0 OR member_price < 0))),
  INDEX idx_events_college (college_id),
  INDEX idx_events_college_date (college_id, event_date),
  INDEX idx_events_college_status (college_id, status),
  INDEX idx_events_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Registrations Table
CREATE TABLE registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  price_charged DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_member_at_registration BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('reserved', 'confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  qr_token VARCHAR(100) NOT NULL UNIQUE,
  checked_in_at TIMESTAMP NULL,
  checked_in_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_college_event_user (event_id, user_id),
  INDEX idx_reg_college (college_id),
  INDEX idx_reg_college_status (college_id, status),
  INDEX idx_reg_qr (qr_token),
  INDEX idx_reg_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Payments Table
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  user_id INT NOT NULL,
  payable_type ENUM('membership', 'registration', 'order') NOT NULL,
  payable_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
  method VARCHAR(50) NOT NULL DEFAULT 'mock_gateway',
  transaction_ref VARCHAR(100) NOT NULL UNIQUE,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_payments_college (college_id),
  INDEX idx_payments_college_status (college_id, status),
  INDEX idx_payments_user (user_id),
  INDEX idx_payments_payable (payable_type, payable_id),
  INDEX idx_payments_ref (transaction_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Announcements Table
CREATE TABLE announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  posted_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_announcements_college (college_id),
  INDEX idx_announcements_college_created (college_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Products Table
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  CONSTRAINT chk_product_price CHECK (base_price >= 0),
  INDEX idx_products_college (college_id),
  INDEX idx_products_college_active (college_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Product Variants Table
CREATE TABLE product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  product_id INT NOT NULL,
  size VARCHAR(20) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_college_product_size (product_id, size),
  CONSTRAINT chk_variant_stock CHECK (stock >= 0),
  INDEX idx_variants_college (college_id),
  INDEX idx_variants_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Orders Table
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'paid', 'cancelled', 'fulfilled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_orders_college (college_id),
  INDEX idx_orders_college_status (college_id, status),
  INDEX idx_orders_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Order Items Table
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  variant_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_applied DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  final_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT,
  CONSTRAINT chk_order_item_qty CHECK (quantity > 0),
  INDEX idx_order_items_college (college_id),
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Fundraisers Table
CREATE TABLE fundraisers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  goal_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_fundraiser_goal CHECK (goal_amount > 0),
  CONSTRAINT chk_fundraiser_current CHECK (current_amount >= 0),
  INDEX idx_fundraisers_college (college_id),
  INDEX idx_fundraisers_college_status (college_id, status),
  INDEX idx_fundraisers_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Fundraiser Tasks Table
CREATE TABLE fundraiser_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  fundraiser_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  assignee_id INT NOT NULL,
  status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  due_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (fundraiser_id) REFERENCES fundraisers(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_tasks_college (college_id),
  INDEX idx_tasks_fundraiser (fundraiser_id),
  INDEX idx_tasks_assignee (assignee_id),
  INDEX idx_tasks_college_status (college_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Expense Requests Table
CREATE TABLE expense_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  submitter_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  event_id INT NULL,
  fundraiser_id INT NULL,
  receipt_path VARCHAR(255) NOT NULL,
  status ENUM('submitted', 'approved', 'rejected') NOT NULL DEFAULT 'submitted',
  reviewed_by INT NULL,
  review_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (submitter_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  FOREIGN KEY (fundraiser_id) REFERENCES fundraisers(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_expense_amount CHECK (amount > 0),
  INDEX idx_expense_college (college_id),
  INDEX idx_expense_college_status (college_id, status),
  INDEX idx_expense_submitter (submitter_id),
  INDEX idx_expense_event (event_id),
  INDEX idx_expense_fundraiser (fundraiser_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Finance Categories Table
CREATE TABLE finance_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_college_category_name (college_id, name),
  INDEX idx_finance_cat_college (college_id),
  INDEX idx_finance_cat_type (college_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Financial Transactions Table (Ledger)
CREATE TABLE financial_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  category_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  source_type ENUM('payment', 'reimbursement', 'fundraiser', 'manual') NOT NULL,
  source_id INT NULL,
  description VARCHAR(255) NOT NULL,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES finance_categories(id) ON DELETE RESTRICT,
  CONSTRAINT chk_tx_amount CHECK (amount > 0),
  INDEX idx_tx_college (college_id),
  INDEX idx_tx_college_date (college_id, transaction_date),
  INDEX idx_tx_college_type (college_id, type),
  INDEX idx_tx_category (category_id),
  INDEX idx_tx_source (source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Email Logs Table
CREATE TABLE email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  recipient VARCHAR(150) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  status ENUM('sent', 'failed') NOT NULL,
  error TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
  INDEX idx_email_college (college_id),
  INDEX idx_email_college_status (college_id, status),
  INDEX idx_email_recipient (recipient),
  INDEX idx_email_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- INITIAL SEED DATA
-- =========================================================================

-- 1. Seed Super Admin (only 1, college_id is NULL)
INSERT INTO users (id, college_id, name, email, password_hash, role, created_by, is_active)
VALUES (
  1,
  NULL,
  'Super Admin',
  'superadmin@odoo.com',
  '$2b$10$m1c35mSXMudNcgv0RGxUdu6sZZ4SExHENyCQibC7sCz7jbYjehpbW',
  'super_admin',
  NULL,
  TRUE
);

-- 2. Seed Demo College
INSERT INTO colleges (id, name, code, is_active)
VALUES (
  1,
  'Skyline Institute of Technology',
  'SKYL-TECH',
  TRUE
);

-- 3. Seed College Admin for Demo College (created_by Super Admin)
INSERT INTO users (id, college_id, name, email, password_hash, role, created_by, is_active)
VALUES (
  2,
  1,
  'Dr. Sarah Connor',
  'collegeadmin@skyline.edu',
  '$2b$10$YgFPWJPnJzwmHKFo2YVXkeW.2DxArHHzER1oWZ1Lmh/3X2hKDu6u2',
  'college_admin',
  1,
  TRUE
);

-- 4. Seed Organizer for Demo College (created_by College Admin)
INSERT INTO users (id, college_id, name, email, password_hash, role, created_by, is_active)
VALUES (
  3,
  1,
  'Alex Rivera',
  'organizer@skyline.edu',
  '$2b$10$ZCKgSOWqgiZDgqmBdYJGOO25f1OOY4BTX77/7Yn.KVXCNVDb4Wxb6',
  'organizer',
  2,
  TRUE
);

-- 5. Seed Students for Demo College
INSERT INTO users (id, college_id, name, email, password_hash, role, created_by, is_active)
VALUES
(
  4,
  1,
  'Aarav Sharma',
  'aarav@skyline.edu',
  '$2b$10$l.UsMXrR/l45vuW2.ay.4ekFiSfePoGlNdMiV3cVIGlV3uiNV2F5.',
  'student',
  NULL,
  TRUE
),
(
  5,
  1,
  'Diya Patel',
  'diya@skyline.edu',
  '$2b$10$l.UsMXrR/l45vuW2.ay.4ekFiSfePoGlNdMiV3cVIGlV3uiNV2F5.',
  'student',
  NULL,
  TRUE
);

-- 6. Seed Membership Plan for Demo College
INSERT INTO membership_plans (id, college_id, name, fee, duration_months, ticket_discount_note, merch_discount_percent, is_active)
VALUES (
  1,
  1,
  'Annual Gold Membership',
  500.00,
  12,
  '50% discount on flagship events and priority registration',
  15.00,
  TRUE
);

-- 7. Seed 2 Sample Events for Demo College
INSERT INTO events (id, college_id, name, description, event_date, start_time, location, capacity, is_paid, member_price, non_member_price, status, created_by)
VALUES
(
  1,
  1,
  'Skyline Annual Hackathon 2026',
  '24-hour university-wide hackathon with exciting hardware and cloud prizes',
  '2026-11-15',
  '09:00:00',
  'Skyline Tech Innovation Center',
  100,
  TRUE,
  150.00,
  300.00,
  'published',
  3
),
(
  2,
  1,
  'Spring Welcome & Club Orientation',
  'Meet club executives, explore committee projects, and connect with peers',
  '2026-10-25',
  '14:00:00',
  'Skyline Central Auditorium',
  250,
  FALSE,
  0.00,
  0.00,
  'published',
  2
);

-- 8. Seed Sample Products and Variants for Demo College
INSERT INTO products (id, college_id, name, description, base_price, is_active)
VALUES
(
  1,
  1,
  'Skyline Official Varsity Hoodie',
  'Heavyweight cotton-fleece embroidered association hoodie',
  899.00,
  TRUE
),
(
  2,
  1,
  'Skyline Campus Graphic Tee',
  'Breathable organic cotton tee with minimal skyline logo',
  399.00,
  TRUE
);

INSERT INTO product_variants (id, college_id, product_id, size, stock)
VALUES
(1, 1, 1, 'S', 20),
(2, 1, 1, 'M', 35),
(3, 1, 1, 'L', 30),
(4, 1, 1, 'XL', 15),
(5, 1, 2, 'S', 25),
(6, 1, 2, 'M', 50),
(7, 1, 2, 'L', 40);

-- 9. Seed Finance Categories for Demo College
INSERT INTO finance_categories (id, college_id, name, type)
VALUES
(1, 1, 'Membership Dues', 'income'),
(2, 1, 'Ticket Sales', 'income'),
(3, 1, 'Merchandise Sales', 'income'),
(4, 1, 'Fundraiser', 'income'),
(5, 1, 'Sponsorship', 'income'),
(6, 1, 'Donation', 'income'),
(7, 1, 'Other Income', 'income'),
(8, 1, 'Volunteer Reimbursement', 'expense'),
(9, 1, 'Event Logistics', 'expense'),
(10, 1, 'Merchandise Production', 'expense'),
(11, 1, 'Marketing', 'expense'),
(12, 1, 'Venue Rental', 'expense'),
(13, 1, 'Equipment', 'expense'),
(14, 1, 'Other Expense', 'expense');

-- 10. Password Reset OTPs Table
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reset_email (email),
  INDEX idx_reset_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

