-- ============================================================
-- Nanyuki Law Firm - Multi-Tenant Database Schema
-- Add firms, subscriptions, and payments tables
-- Run this file after the original database.sql
-- ============================================================

USE nanyuki_law_firm;

-- ============================================================
-- FIRMS (Law Firm Tenants)
-- ============================================================
CREATE TABLE firms (
  id            VARCHAR(36) PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  phone         VARCHAR(50),
  address       TEXT,
  logo_url      VARCHAR(500),
  currency      VARCHAR(3) DEFAULT 'KES',
  timezone      VARCHAR(50) DEFAULT 'Africa/Nairobi',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================
CREATE TABLE plans (
  id              VARCHAR(36) PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  price_monthly   DECIMAL(10,2) DEFAULT 0,
  price_annually  DECIMAL(10,2) DEFAULT 0,
  currency        VARCHAR(3) DEFAULT 'KES',
  features        JSON, -- JSON array of feature codes
  limits          JSON, -- JSON object with limits: {users: 5, storage_gb: 10, matters: 50, invoices_per_month: 100}
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- FIRM SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id                    VARCHAR(36) PRIMARY KEY,
  firm_id               VARCHAR(36) NOT NULL,
  plan_id               VARCHAR(36) NOT NULL,
  status                ENUM('trialing','active','past_due','canceled','expired') DEFAULT 'trialing',
  trial_start_date      DATE,
  trial_end_date        DATE,
  billing_cycle_start   DATE,
  billing_cycle_end     DATE,
  next_billing_date     DATE,
  canceled_at           TIMESTAMP NULL,
  renewal_reminder_sent BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id),
  INDEX idx_subscriptions_firm (firm_id),
  INDEX idx_subscriptions_status (status),
  INDEX idx_subscriptions_next_billing (next_billing_date)
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id              VARCHAR(36) PRIMARY KEY,
  firm_id         VARCHAR(36) NOT NULL,
  subscription_id VARCHAR(36),
  invoice_id      VARCHAR(36),
  amount          DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'KES',
  payment_method  ENUM('mpesa','card','bank_transfer','cash') DEFAULT 'mpesa',
  payment_status  ENUM('pending','completed','failed','refunded','cancelled') DEFAULT 'pending',
  transaction_id  VARCHAR(255), -- M-Pesa transaction ID
  mpesa_details   JSON, -- M-Pesa response details
  description     TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at    TIMESTAMP NULL,
  FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  INDEX idx_payments_firm (firm_id),
  INDEX idx_payments_status (payment_status),
  INDEX idx_payments_transaction (transaction_id)
);

-- ============================================================
-- USAGE TRACKING (for plan limits)
-- ============================================================
CREATE TABLE usage_metrics (
  id              VARCHAR(36) PRIMARY KEY,
  firm_id         VARCHAR(36) NOT NULL,
  metric_type     ENUM('users','storage_gb','matters','invoices_monthly') NOT NULL,
  current_value   INT DEFAULT 0,
  limit_value     INT,
  billing_period  VARCHAR(7), -- YYYY-MM format
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE,
  UNIQUE KEY unique_firm_metric_period (firm_id, metric_type, billing_period),
  INDEX idx_usage_firm (firm_id),
  INDEX idx_usage_type (metric_type)
);

-- ============================================================
-- ADD FIRM_ID TO EXISTING TABLES
-- ============================================================

-- Add firm_id to users table
ALTER TABLE users ADD COLUMN firm_id VARCHAR(36) NULL;
ALTER TABLE users ADD FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE SET NULL;
ALTER TABLE users ADD INDEX idx_users_firm (firm_id);

-- Add firm_id to clients table
ALTER TABLE clients ADD COLUMN firm_id VARCHAR(36) NULL;
ALTER TABLE clients ADD FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE SET NULL;
ALTER TABLE clients ADD INDEX idx_clients_firm (firm_id);

-- Add firm_id to matters table
ALTER TABLE matters ADD COLUMN firm_id VARCHAR(36) NULL;
ALTER TABLE matters ADD FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE SET NULL;
ALTER TABLE matters ADD INDEX idx_matters_firm (firm_id);

-- Add firm_id to tasks table
ALTER TABLE tasks ADD COLUMN firm_id VARCHAR(36) NULL;
ALTER TABLE tasks ADD FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD INDEX idx_tasks_firm (firm_id);

-- Add firm_id to calendar_events table
ALTER TABLE calendar_events ADD COLUMN firm_id VARCHAR(36) NULL;
ALTER TABLE calendar_events ADD FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE SET NULL;
ALTER TABLE calendar_events ADD INDEX idx_events_firm (firm_id);

-- Add firm_id to documents table
ALTER TABLE documents ADD COLUMN firm_id VARCHAR(36) NULL;
ALTER TABLE documents ADD FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE SET NULL;
ALTER TABLE documents ADD INDEX idx_documents_firm (firm_id);

-- Add firm_id to invoices table
ALTER TABLE invoices ADD COLUMN firm_id VARCHAR(36) NULL;
ALTER TABLE invoices ADD FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD INDEX idx_invoices_firm (firm_id);

-- Add firm_id to time_entries table
ALTER TABLE time_entries ADD COLUMN firm_id VARCHAR(36) NULL;
ALTER TABLE time_entries ADD FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE SET NULL;
ALTER TABLE time_entries ADD INDEX idx_time_firm (firm_id);

-- Add firm_id to notifications table
ALTER TABLE notifications ADD COLUMN firm_id VARCHAR(36) NULL;
ALTER TABLE notifications ADD FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD INDEX idx_notifications_firm (firm_id);

-- Add firm_id to audit_logs table
ALTER TABLE audit_logs ADD COLUMN firm_id VARCHAR(36) NULL;
ALTER TABLE audit_logs ADD FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE SET NULL;
ALTER TABLE audit_logs ADD INDEX idx_audit_firm (firm_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert default plans
INSERT INTO plans (id, name, description, price_monthly, price_annually, features, limits) VALUES
('plan_free', 'Free', 'Free plan for small firms', 0, 0, 
 '["dashboard","clients","matters","tasks","calendar","documents","basic_reports"]',
 '{"users": 3, "storage_gb": 1, "matters": 10, "invoices_per_month": 5}'),
('plan_basic', 'Basic', 'Basic plan for growing firms', 2500, 25000, 
 '["dashboard","clients","matters","tasks","calendar","documents","advanced_reports","email_notifications"]',
 '{"users": 5, "storage_gb": 5, "matters": 50, "invoices_per_month": 20}'),
('plan_pro', 'Professional', 'Professional plan for established firms', 5000, 50000, 
 '["dashboard","clients","matters","tasks","calendar","documents","advanced_reports","email_notifications","api_access","priority_support"]',
 '{"users": 15, "storage_gb": 20, "matters": 200, "invoices_per_month": 100}'),
('plan_enterprise', 'Enterprise', 'Enterprise plan for large firms', 10000, 100000, 
 '["dashboard","clients","matters","tasks","calendar","documents","advanced_reports","email_notifications","api_access","priority_support","custom_integrations","dedicated_account_manager"]',
 '{"users": 999, "storage_gb": 999, "matters": 9999, "invoices_per_month": 9999}');

-- Create default firm (Nanyuki Law Firm)
INSERT INTO firms (id, name, email, phone, address, currency, timezone) VALUES
('firm_nlf', 'Nanyuki Law Firm', 'info@nanyukilaw.com', '+254 700 100 000', '123 Main Street, Nanyuki, Kenya', 'KES', 'Africa/Nairobi');

-- Assign existing users to the default firm
UPDATE users SET firm_id = 'firm_nlf' WHERE id IN ('1', '2', '3', '4');

-- Assign existing clients to the default firm
UPDATE clients SET firm_id = 'firm_nlf';

-- Assign existing matters to the default firm
UPDATE matters SET firm_id = 'firm_nlf';

-- Assign existing tasks to the default firm
UPDATE tasks SET firm_id = 'firm_nlf';

-- Assign existing calendar events to the default firm
UPDATE calendar_events SET firm_id = 'firm_nlf';

-- Assign existing documents to the default firm
UPDATE documents SET firm_id = 'firm_nlf';

-- Assign existing invoices to the default firm
UPDATE invoices SET firm_id = 'firm_nlf';

-- Assign existing time entries to the default firm
UPDATE time_entries SET firm_id = 'firm_nlf';

-- Assign existing notifications to the default firm
UPDATE notifications SET firm_id = 'firm_nlf';

-- Assign existing audit logs to the default firm
UPDATE audit_logs SET firm_id = 'firm_nlf';

-- Create a free subscription for the default firm
INSERT INTO subscriptions (id, firm_id, plan_id, status, trial_start_date, trial_end_date, billing_cycle_start, billing_cycle_end, next_billing_date) VALUES
('sub_nlf_free', 'firm_nlf', 'plan_free', 'active', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY));

-- Initialize usage metrics for the default firm
INSERT INTO usage_metrics (id, firm_id, metric_type, current_value, limit_value, billing_period) VALUES
('usage_nlf_users', 'firm_nlf', 'users', 4, 3, DATE_FORMAT(CURDATE(), '%Y-%m')),
('usage_nlf_storage', 'firm_nlf', 'storage_gb', 0, 1, DATE_FORMAT(CURDATE(), '%Y-%m')),
('usage_nlf_matters', 'firm_nlf', 'matters', 12, 10, DATE_FORMAT(CURDATE(), '%Y-%m')),
('usage_nlf_invoices', 'firm_nlf', 'invoices_monthly', 8, 5, DATE_FORMAT(CURDATE(), '%Y-%m'));

SELECT 'Multi-tenant schema created successfully!' AS status;