-- ============================================================
-- Nanyuki Law Firm (NLF) - MySQL Database
-- Run this file in MySQL Workbench or via CLI:
--   mysql -u root -p < database.sql
-- ============================================================

DROP DATABASE IF EXISTS nanyuki_law_firm;
CREATE DATABASE nanyuki_law_firm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nanyuki_law_firm;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            VARCHAR(36)  PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,          -- bcrypt hash of "password123"
  name          VARCHAR(255) NOT NULL,
  role          ENUM('super_admin','managing_partner','advocate','paralegal','accountant','reception','client') NOT NULL,
  title         VARCHAR(255),
  avatar        VARCHAR(10),
  billing_rate  DECIMAL(10,2) DEFAULT 0,
  phone         VARCHAR(50),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE clients (
  id             VARCHAR(36)  PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  type           ENUM('individual','corporate') NOT NULL DEFAULT 'individual',
  email          VARCHAR(255),
  phone          VARCHAR(50),
  kra_pin        VARCHAR(50),
  address        TEXT,
  id_number      VARCHAR(100),
  contact_person VARCHAR(255),
  notes          TEXT,
  status         ENUM('active','inactive') DEFAULT 'active',
  matters_count  INT DEFAULT 0,
  created_at     DATE,
  INDEX idx_clients_status (status),
  INDEX idx_clients_name   (name)
);

-- ============================================================
-- MATTERS
-- ============================================================
CREATE TABLE matters (
  id                   VARCHAR(36)  PRIMARY KEY,
  matter_number        VARCHAR(50)  NOT NULL UNIQUE,
  title                VARCHAR(500) NOT NULL,
  client_id            VARCHAR(36),
  client_name          VARCHAR(255),
  practice_area        VARCHAR(100),
  status               ENUM('consultation','active','court','settled','closed','archived') DEFAULT 'active',
  assigned_advocate    VARCHAR(255),
  assigned_advocate_id VARCHAR(36),
  court                VARCHAR(255),
  registry             VARCHAR(255),
  filing_date          DATE,
  next_hearing         DATE,
  description          TEXT,
  opposing_party       VARCHAR(255),
  opposing_counsel     VARCHAR(255),
  value                DECIMAL(15,2) DEFAULT 0,
  created_at           DATE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  INDEX idx_matters_status (status),
  INDEX idx_matters_client (client_id)
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE tasks (
  id               VARCHAR(36) PRIMARY KEY,
  title            VARCHAR(500) NOT NULL,
  description      TEXT,
  matter_id        VARCHAR(36),
  matter_number    VARCHAR(50),
  assigned_to      VARCHAR(255),
  assigned_to_id   VARCHAR(36),
  priority         ENUM('low','medium','high','urgent') DEFAULT 'medium',
  status           ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  due_date         DATE,
  created_at       DATE,
  FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE SET NULL,
  INDEX idx_tasks_status   (status),
  INDEX idx_tasks_priority (priority),
  INDEX idx_tasks_assigned (assigned_to_id)
);

CREATE TABLE task_comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  task_id    VARCHAR(36) NOT NULL,
  author     VARCHAR(255),
  text_body  TEXT,
  date_posted DATE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- ============================================================
-- CALENDAR EVENTS
-- ============================================================
CREATE TABLE calendar_events (
  id             VARCHAR(36) PRIMARY KEY,
  title          VARCHAR(500) NOT NULL,
  type           ENUM('hearing','mention','deadline','meeting','filing') DEFAULT 'meeting',
  event_date     DATE NOT NULL,
  start_time     VARCHAR(10),
  end_time       VARCHAR(10),
  matter_id      VARCHAR(36),
  matter_number  VARCHAR(50),
  location       VARCHAR(500),
  description    TEXT,
  color          VARCHAR(20),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE SET NULL,
  INDEX idx_events_date (event_date)
);

CREATE TABLE event_attendees (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  event_id   VARCHAR(36) NOT NULL,
  attendee   VARCHAR(255),
  FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE documents (
  id           VARCHAR(36) PRIMARY KEY,
  name         VARCHAR(500) NOT NULL,
  type         VARCHAR(20),
  size         VARCHAR(50),
  matter_id    VARCHAR(36),
  matter_number VARCHAR(50),
  client_id    VARCHAR(36),
  client_name  VARCHAR(255),
  uploaded_by  VARCHAR(255),
  uploaded_at  DATE,
  version      INT DEFAULT 1,
  access_level ENUM('public','team','restricted') DEFAULT 'team',
  category     ENUM('pleading','correspondence','evidence','contract','template','other') DEFAULT 'other',
  FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  INDEX idx_docs_matter (matter_id),
  INDEX idx_docs_client (client_id)
);

CREATE TABLE document_tags (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  document_id VARCHAR(36) NOT NULL,
  tag         VARCHAR(100),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE invoices (
  id             VARCHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  matter_id      VARCHAR(36),
  matter_number  VARCHAR(50),
  client_id      VARCHAR(36),
  client_name    VARCHAR(255),
  amount         DECIMAL(15,2) DEFAULT 0,
  paid           DECIMAL(15,2) DEFAULT 0,
  status         ENUM('draft','sent','partial','paid','overdue','cancelled') DEFAULT 'draft',
  due_date       DATE,
  issued_date    DATE,
  tax            DECIMAL(15,2) DEFAULT 0,
  discount       DECIMAL(15,2) DEFAULT 0,
  FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  INDEX idx_invoices_status (status),
  INDEX idx_invoices_client (client_id)
);

CREATE TABLE invoice_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id  VARCHAR(36) NOT NULL,
  description TEXT,
  hours       DECIMAL(6,2),
  rate        DECIMAL(10,2),
  amount      DECIMAL(15,2),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- ============================================================
-- TIME ENTRIES
-- ============================================================
CREATE TABLE time_entries (
  id            VARCHAR(36) PRIMARY KEY,
  matter_id     VARCHAR(36),
  matter_number VARCHAR(50),
  user_id       VARCHAR(36),
  user_name     VARCHAR(255),
  entry_date    DATE,
  hours         DECIMAL(5,2),
  description   TEXT,
  billable      BOOLEAN DEFAULT TRUE,
  rate          DECIMAL(10,2) DEFAULT 0,
  status        ENUM('pending','approved','billed') DEFAULT 'pending',
  FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_time_matter (matter_id),
  INDEX idx_time_user   (user_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id         VARCHAR(36) PRIMARY KEY,
  user_id    VARCHAR(36),
  title      VARCHAR(500),
  message    TEXT,
  type       ENUM('deadline','hearing','task','invoice','system') DEFAULT 'system',
  is_read    BOOLEAN DEFAULT FALSE,
  link       VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id)
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    VARCHAR(36),
  user_name  VARCHAR(255),
  action     VARCHAR(100),
  module     VARCHAR(100),
  details    TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user   (user_id),
  INDEX idx_audit_module (module)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- password_hash below is bcrypt hash of "password123" (rounds=10)
INSERT INTO users (id, email, password_hash, name, role, title, avatar, billing_rate, phone) VALUES
('1', 'admin@gmail.com',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'James Mwangi',   'super_admin',       'System Administrator', 'JM', 0,     '+254 700 100 001'),
('2', 'owner@gmail.com',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Grace Wanjiku',  'managing_partner',  'Managing Partner',     'GW', 15000, '+254 700 100 002'),
('3', 'advocate@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Peter Kamau',    'advocate',          'Senior Advocate',      'PK', 10000, '+254 700 100 003'),
('4', 'customer@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mary Njeri',     'client',            'Client',               'MN', 0,     '+254 700 100 004');

INSERT INTO clients (id, name, type, email, phone, kra_pin, address, id_number, contact_person, notes, status, matters_count, created_at) VALUES
('c1',  'Safaricom PLC',           'corporate', 'legal@safaricom.co.ke',  '+254 722 000 001', 'P051234567A', 'Safaricom House, Waiyaki Way, Nairobi',   'PVT-2024-001', 'John Odhiambo',    'Major corporate client, priority handling', 'active',   4, '2024-01-15'),
('c2',  'Kenya Power & Lighting',  'corporate', 'legal@kplc.co.ke',       '+254 722 000 002', 'P051234568B', 'Stima Plaza, Kolobot Rd, Nairobi',        'PVT-2024-002', 'Alice Muthoni',    'Ongoing regulatory matters',                'active',   3, '2024-02-10'),
('c3',  'David Kimani Njoroge',    'individual','david.kimani@gmail.com', '+254 712 345 678', 'A012345678B', '45 Moi Avenue, Nanyuki',                  '28901234',     NULL,               'Land dispute case',                         'active',   2, '2024-03-05'),
('c4',  'Equity Bank Limited',     'corporate', 'legal@equitybank.co.ke', '+254 722 000 003', 'P051234569C', 'Equity Centre, Hospital Rd, Nairobi',     'PVT-2024-003', 'Sarah Wambui',     'Banking litigation matters',                'active',   5, '2024-01-20'),
('c5',  'Jane Achieng Ouma',       'individual','jane.ouma@yahoo.com',    '+254 733 456 789', 'A012345679C', '12 Kenyatta Street, Nanyuki',             '31234567',     NULL,               'Employment dispute',                        'active',   1, '2024-04-12'),
('c6',  'Mt. Kenya Breweries',     'corporate', 'legal@mkb.co.ke',        '+254 722 000 004', 'P051234570D', 'Industrial Area, Nanyuki',                'PVT-2024-004', 'Michael Maina',    'IP and trademark matters',                  'active',   2, '2024-05-01'),
('c7',  'Samuel Mutua Kilonzo',    'individual','samuel.mutua@gmail.com', '+254 700 567 890', 'A012345680E', '78 Laikipia Road, Nanyuki',               '29876543',     NULL,               'Criminal defense case',                     'active',   1, '2024-06-15'),
('c8',  'Nanyuki Ranch Ltd',       'corporate', 'admin@nanyukiranch.co.ke','+254 722 000 005','P051234571F', 'Ranch Road, Nanyuki',                     'PVT-2024-005', 'Elizabeth Njeri',  'Land and property matters',                 'active',   3, '2024-02-28'),
('c9',  'Florence Wangari Mwangi', 'individual','florence.w@gmail.com',   '+254 711 678 901', 'A012345681G', '23 Cedar Lane, Nanyuki',                  '30123456',     NULL,               'Family law - divorce proceedings',          'active',   1, '2024-07-20'),
('c10', 'Laikipia County Government','corporate','legal@laikipia.go.ke',  '+254 722 000 006', 'P051234572H', 'County HQ, Nanyuki',                      'GOV-2024-001', 'Patrick Karanja',  'Government advisory and litigation',        'active',   6, '2024-01-05'),
('c11', 'Robert Otieno Ochieng',   'individual','robert.otieno@gmail.com','+254 723 789 012', 'A012345682I', '56 Market Street, Nanyuki',               '27654321',     NULL,               'Commercial dispute',                        'inactive', 1, '2023-11-10'),
('c12', 'Ol Pejeta Conservancy',   'corporate', 'legal@olpejeta.org',     '+254 722 000 007', 'P051234573J', 'Ol Pejeta, Nanyuki',                      'NGO-2024-001', 'Catherine Wanjiku','Conservation and land rights',              'active',   2, '2024-03-18');

INSERT INTO matters (id, matter_number, title, client_id, client_name, practice_area, status, assigned_advocate, assigned_advocate_id, court, registry, filing_date, next_hearing, description, opposing_party, opposing_counsel, value, created_at) VALUES
('m1',  'NLF/2024/0001', 'Safaricom v. Communications Authority - Licensing Dispute',  'c1',  'Safaricom PLC',           'Commercial', 'court',        'Peter Kamau',  '3', 'High Court of Kenya - Milimani',        'Commercial Division',      '2024-02-15', '2026-03-10', 'Dispute regarding telecommunications licensing fees and regulatory compliance', 'Communications Authority of Kenya', 'Kaplan & Stratton Advocates', 5000000,  '2024-02-10'),
('m2',  'NLF/2024/0002', 'Kimani Land Title Dispute - Nanyuki Plot LR 1234',           'c3',  'David Kimani Njoroge',    'Land',       'active',       'Grace Wanjiku','2', 'Environment & Land Court - Nanyuki',   'Land Division',            '2024-03-20', '2026-03-15', 'Land title dispute over Plot LR 1234 in Nanyuki town',                        'Joseph Mwangi Karanja',             'Mwangi & Associates',         8000000,  '2024-03-15'),
('m3',  'NLF/2024/0003', 'Equity Bank Debt Recovery - Commercial Loan Default',        'c4',  'Equity Bank Limited',     'Commercial', 'active',       'Peter Kamau',  '3', 'High Court - Nairobi',                 'Commercial Division',      '2024-04-01', '2026-03-20', 'Recovery of KES 25M commercial loan default',                                 'ABC Trading Company Ltd',           'Hamilton Harrison & Mathews', 25000000, '2024-03-28'),
('m4',  'NLF/2024/0004', 'Ouma v. TechCorp Kenya - Wrongful Termination',              'c5',  'Jane Achieng Ouma',       'Employment', 'court',        'Grace Wanjiku','2', 'Employment & Labour Relations Court',  'Nairobi',                  '2024-05-10', '2026-03-05', 'Wrongful termination claim with discrimination allegations',                   'TechCorp Kenya Ltd',                'Bowmans Kenya',               3500000,  '2024-05-05'),
('m5',  'NLF/2024/0005', 'Mt. Kenya Breweries Trademark Registration',                 'c6',  'Mt. Kenya Breweries',     'IP',         'active',       'Peter Kamau',  '3', 'KIPI - Kenya Industrial Property Institute','Trademark Registry',    '2024-06-01', '2026-04-01', 'Trademark registration and protection for new product line',                   'N/A',                               'N/A',                         1500000,  '2024-05-28'),
('m6',  'NLF/2024/0006', 'Republic v. Samuel Mutua - Criminal Defense',                'c7',  'Samuel Mutua Kilonzo',    'Criminal',   'court',        'Grace Wanjiku','2', 'Chief Magistrate\'s Court - Nanyuki', 'Criminal Division',        '2024-07-01', '2026-03-08', 'Criminal defense - fraud charges',                                            'Republic of Kenya',                 'Office of DPP',               2000000,  '2024-06-28'),
('m7',  'NLF/2024/0007', 'Nanyuki Ranch Boundary Dispute',                             'c8',  'Nanyuki Ranch Ltd',       'Land',       'consultation', 'Peter Kamau',  '3', 'Environment & Land Court',             'Nanyuki',                  NULL,         NULL,         'Boundary dispute with neighboring property',                                   'Laikipia Farmers Cooperative',      'TBD',                         12000000, '2024-08-01'),
('m8',  'NLF/2024/0008', 'Wangari Divorce Proceedings',                                'c9',  'Florence Wangari Mwangi', 'Family',     'active',       'Grace Wanjiku','2', 'Family Division - High Court',         'Nairobi',                  '2024-08-15', '2026-03-25', 'Divorce proceedings with property and custody disputes',                       'James Mwangi Kariuki',              'Iseme Kamau & Maema',         4000000,  '2024-08-10'),
('m9',  'NLF/2024/0009', 'Laikipia County Procurement Advisory',                       'c10', 'Laikipia County Government','Commercial','active',       'Peter Kamau',  '3', 'N/A - Advisory',                       'N/A',                      NULL,         NULL,         'Advisory on public procurement compliance and tender disputes',                'N/A',                               'N/A',                         3000000,  '2024-01-10'),
('m10', 'NLF/2024/0010', 'KPLC Power Line Easement Dispute',                           'c2',  'Kenya Power & Lighting',  'Land',       'settled',      'Grace Wanjiku','2', 'Environment & Land Court',             'Nanyuki',                  '2024-03-01', NULL,         'Easement dispute for power line installation through private land',             'Multiple Landowners',               'Various',                     6000000,  '2024-02-25'),
('m11', 'NLF/2025/0011', 'Ol Pejeta Conservation Easement',                            'c12', 'Ol Pejeta Conservancy',   'Land',       'active',       'Peter Kamau',  '3', 'N/A',                                  'N/A',                      NULL,         NULL,         'Drafting and registration of conservation easement agreements',                'N/A',                               'N/A',                         2500000,  '2025-01-15'),
('m12', 'NLF/2025/0012', 'Safaricom Data Privacy Compliance',                          'c1',  'Safaricom PLC',           'Commercial', 'consultation', 'Grace Wanjiku','2', 'N/A - Advisory',                       'N/A',                      NULL,         NULL,         'Advisory on Data Protection Act compliance and GDPR alignment',                'N/A',                               'N/A',                         2000000,  '2025-02-01');

INSERT INTO tasks (id, title, description, matter_id, matter_number, assigned_to, assigned_to_id, priority, status, due_date, created_at) VALUES
('t1',  'Draft Statement of Claim - Safaricom v. CA',    'Prepare and file the statement of claim for the licensing dispute', 'm1', 'NLF/2024/0001', 'Peter Kamau',  '3', 'high',   'in_progress', '2026-03-05', '2026-02-20'),
('t2',  'File Land Search - Kimani Matter',              'Conduct official land search at Nanyuki Land Registry',            'm2', 'NLF/2024/0002', 'Grace Wanjiku','2', 'urgent', 'pending',     '2026-03-01', '2026-02-18'),
('t3',  'Prepare Witness Statements - Ouma Case',        'Interview and prepare witness statements for employment tribunal', 'm4', 'NLF/2024/0004', 'Grace Wanjiku','2', 'high',   'pending',     '2026-03-03', '2026-02-19'),
('t4',  'Review Trademark Application - MKB',            'Review and finalize trademark application documents',              'm5', 'NLF/2024/0005', 'Peter Kamau',  '3', 'medium', 'completed',   '2026-02-28', '2026-02-15'),
('t5',  'Client Meeting - Nanyuki Ranch',                'Schedule and conduct initial consultation for boundary dispute',   'm7', 'NLF/2024/0007', 'Peter Kamau',  '3', 'medium', 'in_progress', '2026-03-07', '2026-02-22'),
('t6',  'Prepare Invoice - Equity Bank Q1',              'Generate quarterly invoice for Equity Bank matters',               'm3', 'NLF/2024/0003', 'Grace Wanjiku','2', 'medium', 'pending',     '2026-03-10', '2026-02-24'),
('t7',  'Court Filing - Mutua Criminal Defense',         'File defense response before court deadline',                      'm6', 'NLF/2024/0006', 'Grace Wanjiku','2', 'urgent', 'in_progress', '2026-03-02', '2026-02-20'),
('t8',  'Draft Procurement Advisory Memo',               'Prepare advisory memo on procurement compliance for Laikipia County','m9','NLF/2024/0009','Peter Kamau', '3', 'low',    'pending',     '2026-03-15', '2026-02-24'),
('t9',  'Divorce Settlement Proposal',                   'Draft settlement proposal for Wangari divorce case',               'm8', 'NLF/2024/0008', 'Grace Wanjiku','2', 'high',   'pending',     '2026-03-12', '2026-02-23'),
('t10', 'Data Protection Audit Report',                  'Complete data protection compliance audit report for Safaricom',   'm12','NLF/2025/0012', 'Peter Kamau',  '3', 'medium', 'pending',     '2026-03-20', '2026-02-25');

INSERT INTO task_comments (task_id, author, text_body, date_posted) VALUES
('t1', 'Grace Wanjiku', 'Please include the 2023 regulatory amendments',          '2026-02-21'),
('t4', 'Peter Kamau',   'Application submitted to KIPI',                          '2026-02-27'),
('t7', 'Grace Wanjiku', 'Need additional evidence documents from client',          '2026-02-23');

INSERT INTO calendar_events (id, title, type, event_date, start_time, end_time, matter_id, matter_number, location, description, color) VALUES
('e1',  'Hearing - Safaricom v. CA',      'hearing',  '2026-03-10', '09:00', '12:00', 'm1', 'NLF/2024/0001', 'High Court - Milimani, Court Room 3',       'Main hearing for licensing dispute',      '#ef4444'),
('e2',  'Mention - Kimani Land Dispute',  'mention',  '2026-03-15', '10:00', '10:30', 'm2', 'NLF/2024/0002', 'ELC Nanyuki',                               'Case mention for directions',             '#f59e0b'),
('e3',  'Deadline - Mutua Defense Filing','deadline', '2026-03-02', '17:00', '17:00', 'm6', 'NLF/2024/0006', 'Magistrate\'s Court - Nanyuki',             'Last day to file defense response',       '#dc2626'),
('e4',  'Hearing - Ouma Employment Case', 'hearing',  '2026-03-05', '09:30', '13:00', 'm4', 'NLF/2024/0004', 'ELRC - Nairobi',                            'Employment tribunal hearing',             '#ef4444'),
('e5',  'Partners Meeting',               'meeting',  '2026-03-03', '14:00', '16:00', NULL, NULL,            'NLF Boardroom',                             'Monthly partners review meeting',         '#3b82f6'),
('e6',  'Client Meeting - Nanyuki Ranch', 'meeting',  '2026-03-07', '10:00', '11:30', 'm7', 'NLF/2024/0007', 'NLF Office',                                'Initial consultation for boundary dispute','#3b82f6'),
('e7',  'Filing Deadline - Trademark MKB','filing',   '2026-04-01', '16:00', '16:00', 'm5', 'NLF/2024/0005', 'KIPI Office',                               'Trademark application filing deadline',    '#8b5cf6'),
('e8',  'Hearing - Wangari Divorce',      'hearing',  '2026-03-25', '09:00', '12:00', 'm8', 'NLF/2024/0008', 'Family Division - High Court',              'Divorce proceedings hearing',             '#ef4444'),
('e9',  'Hearing - Equity Bank Recovery', 'hearing',  '2026-03-20', '10:00', '13:00', 'm3', 'NLF/2024/0003', 'High Court - Commercial Division',          'Debt recovery hearing',                   '#ef4444'),
('e10', 'Staff Training - Legal Tech',    'meeting',  '2026-03-12', '14:00', '17:00', NULL, NULL,            'NLF Conference Room',                       'Training on new legal management system', '#10b981'),
('e11', 'Mutua Criminal Hearing',         'hearing',  '2026-03-08', '09:00', '11:00', 'm6', 'NLF/2024/0006', 'Chief Magistrate\'s Court - Nanyuki',       'Criminal defense hearing',                '#ef4444'),
('e12', 'Deadline - Quarterly Tax Filing','deadline', '2026-03-31', '17:00', '17:00', NULL, NULL,            'KRA Portal',                                'Quarterly tax return filing deadline',     '#dc2626');

INSERT INTO event_attendees (event_id, attendee) VALUES
('e1','Peter Kamau'),('e1','Grace Wanjiku'),
('e2','Grace Wanjiku'),
('e3','Grace Wanjiku'),
('e4','Grace Wanjiku'),
('e5','Grace Wanjiku'),('e5','Peter Kamau'),('e5','James Mwangi'),
('e6','Peter Kamau'),
('e7','Peter Kamau'),
('e8','Grace Wanjiku'),
('e9','Peter Kamau'),
('e10','All Staff'),
('e11','Grace Wanjiku'),
('e12','James Mwangi');

INSERT INTO documents (id, name, type, size, matter_id, matter_number, client_id, client_name, uploaded_by, uploaded_at, version, access_level, category) VALUES
('d1',  'Statement of Claim - Safaricom v CA.pdf', 'pdf',  '2.4 MB', 'm1',  'NLF/2024/0001', 'c1',  'Safaricom PLC',           'Peter Kamau',  '2026-02-20', 2, 'team',       'pleading'),
('d2',  'Land Search Report - LR 1234.pdf',         'pdf',  '1.1 MB', 'm2',  'NLF/2024/0002', 'c3',  'David Kimani Njoroge',    'Grace Wanjiku','2026-02-18', 1, 'team',       'evidence'),
('d3',  'Employment Contract - Ouma.pdf',           'pdf',  '856 KB', 'm4',  'NLF/2024/0004', 'c5',  'Jane Achieng Ouma',       'Grace Wanjiku','2026-02-19', 1, 'restricted', 'evidence'),
('d4',  'Trademark Application - MKB.docx',         'docx', '543 KB', 'm5',  'NLF/2024/0005', 'c6',  'Mt. Kenya Breweries',     'Peter Kamau',  '2026-02-15', 3, 'team',       'correspondence'),
('d5',  'Defense Brief - Mutua.pdf',                'pdf',  '1.8 MB', 'm6',  'NLF/2024/0006', 'c7',  'Samuel Mutua Kilonzo',    'Grace Wanjiku','2026-02-23', 1, 'restricted', 'pleading'),
('d6',  'Procurement Advisory Memo.docx',           'docx', '234 KB', 'm9',  'NLF/2024/0009', 'c10', 'Laikipia County Government','Peter Kamau', '2026-02-24', 1, 'team',       'correspondence'),
('d7',  'Fee Note Template.docx',                   'docx', '125 KB', NULL,  NULL,            NULL,  NULL,                      'James Mwangi', '2024-01-01', 5, 'public',     'template'),
('d8',  'Plaint Template.docx',                     'docx', '98 KB',  NULL,  NULL,            NULL,  NULL,                      'James Mwangi', '2024-01-01', 3, 'public',     'template'),
('d9',  'Power of Attorney Template.docx',          'docx', '112 KB', NULL,  NULL,            NULL,  NULL,                      'James Mwangi', '2024-01-01', 2, 'public',     'template'),
('d10', 'Demand Letter Template.docx',              'docx', '87 KB',  NULL,  NULL,            NULL,  NULL,                      'James Mwangi', '2024-01-01', 4, 'public',     'template'),
('d11', 'Affidavit Template.docx',                  'docx', '95 KB',  NULL,  NULL,            NULL,  NULL,                      'James Mwangi', '2024-01-01', 2, 'public',     'template'),
('d12', 'Settlement Agreement - KPLC.pdf',          'pdf',  '1.5 MB', 'm10', 'NLF/2024/0010', 'c2',  'Kenya Power & Lighting',  'Grace Wanjiku','2025-12-15', 1, 'team',       'contract');

INSERT INTO document_tags (document_id, tag) VALUES
('d1','pleading'),('d1','court-filing'),
('d2','land-search'),('d2','evidence'),
('d3','contract'),('d3','employment'),
('d4','trademark'),('d4','IP'),
('d5','defense'),('d5','criminal'),
('d6','advisory'),('d6','procurement'),
('d7','template'),('d7','billing'),
('d8','template'),('d8','pleading'),
('d9','template'),('d9','authority'),
('d10','template'),('d10','demand'),
('d11','template'),('d11','affidavit'),
('d12','settlement'),('d12','agreement');

INSERT INTO invoices (id, invoice_number, matter_id, matter_number, client_id, client_name, amount, paid, status, due_date, issued_date, tax, discount) VALUES
('i1','INV-2026-001','m1', 'NLF/2024/0001','c1', 'Safaricom PLC',            850000, 850000, 'paid',    '2026-02-28','2026-01-15',136000,0),
('i2','INV-2026-002','m2', 'NLF/2024/0002','c3', 'David Kimani Njoroge',     250000, 100000, 'partial', '2026-03-15','2026-02-01', 40000,0),
('i3','INV-2026-003','m3', 'NLF/2024/0003','c4', 'Equity Bank Limited',     1200000,      0, 'sent',    '2026-03-20','2026-02-15',192000,0),
('i4','INV-2026-004','m4', 'NLF/2024/0004','c5', 'Jane Achieng Ouma',        180000, 180000, 'paid',    '2026-02-20','2026-01-20', 28800,0),
('i5','INV-2026-005','m5', 'NLF/2024/0005','c6', 'Mt. Kenya Breweries',      350000,      0, 'overdue', '2026-02-10','2026-01-10', 56000,0),
('i6','INV-2026-006','m6', 'NLF/2024/0006','c7', 'Samuel Mutua Kilonzo',     300000, 150000, 'partial', '2026-03-10','2026-02-10', 48000,0),
('i7','INV-2026-007','m9', 'NLF/2024/0009','c10','Laikipia County Government',500000, 500000, 'paid',    '2026-02-28','2026-01-28', 80000,0),
('i8','INV-2026-008','m8', 'NLF/2024/0008','c9', 'Florence Wangari Mwangi',  200000,      0, 'draft',   '2026-04-01','2026-02-25', 32000,0);

INSERT INTO invoice_items (invoice_id, description, hours, rate, amount) VALUES
('i1','Legal consultation and research',       40,15000, 600000),
('i1','Court appearance and preparation',      10,15000, 150000),
('i1','Document drafting and review',          10,10000, 100000),
('i2','Land search and due diligence',         10,10000, 100000),
('i2','Legal consultation',                    15,10000, 150000),
('i3','Debt recovery proceedings',             60,15000, 900000),
('i3','Court appearances',                     20,15000, 300000),
('i4','Employment tribunal preparation',       12,10000, 120000),
('i4','Witness preparation',                    6,10000,  60000),
('i5','Trademark research and application',    20,10000, 200000),
('i5','IP advisory services',                  15,10000, 150000),
('i6','Criminal defense preparation',          20,10000, 200000),
('i6','Court representation',                  10,10000, 100000),
('i7','Procurement advisory - Q4 2025',        30,15000, 450000),
('i7','Document review',                        5,10000,  50000),
('i8','Divorce proceedings - initial phase',   15,10000, 150000),
('i8','Mediation sessions',                     5,10000,  50000);

INSERT INTO time_entries (id, matter_id, matter_number, user_id, user_name, entry_date, hours, description, billable, rate, status) VALUES
('te1','m1', 'NLF/2024/0001','3','Peter Kamau',  '2026-02-24',3.5,'Research on telecommunications regulations',TRUE, 10000,'approved'),
('te2','m2', 'NLF/2024/0002','2','Grace Wanjiku','2026-02-24',2.0,'Client meeting and case review',            TRUE, 15000,'approved'),
('te3','m3', 'NLF/2024/0003','3','Peter Kamau',  '2026-02-24',4.0,'Drafting demand letter and court filings',  TRUE, 10000,'pending'),
('te4','m4', 'NLF/2024/0004','2','Grace Wanjiku','2026-02-23',5.0,'Witness statement preparation',             TRUE, 15000,'approved'),
('te5','m6', 'NLF/2024/0006','2','Grace Wanjiku','2026-02-23',3.0,'Defense brief drafting',                    TRUE, 15000,'pending'),
('te6','m1', 'NLF/2024/0001','3','Peter Kamau',  '2026-02-23',1.5,'Internal team meeting',                     FALSE,    0,'approved'),
('te7','m5', 'NLF/2024/0005','3','Peter Kamau',  '2026-02-22',2.5,'Trademark application review',              TRUE, 10000,'billed'),
('te8','m8', 'NLF/2024/0008','2','Grace Wanjiku','2026-02-22',3.0,'Divorce settlement research',               TRUE, 15000,'pending');

INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at) VALUES
('n1',NULL,'Upcoming Hearing',  'Hearing for Ouma v. TechCorp is scheduled for March 5, 2026',    'hearing', FALSE,'/calendar','2026-02-25 08:00:00'),
('n2',NULL,'Task Deadline',     'Land search filing for Kimani matter is due March 1, 2026',      'deadline',FALSE,'/tasks',   '2026-02-25 07:30:00'),
('n3',NULL,'Invoice Overdue',   'Invoice INV-2026-005 for Mt. Kenya Breweries is overdue',        'invoice', FALSE,'/billing', '2026-02-25 06:00:00'),
('n4',NULL,'New Task Assigned', 'You have been assigned: Draft Statement of Claim - Safaricom v. CA','task',TRUE, '/tasks',   '2026-02-24 14:00:00'),
('n5',NULL,'Filing Deadline',   'Defense filing for Mutua case due March 2, 2026',                'deadline',FALSE,'/calendar','2026-02-24 09:00:00'),
('n6',NULL,'Payment Received',  'Payment of KES 850,000 received from Safaricom PLC',             'system',  TRUE, '/billing', '2026-02-23 16:00:00'),
('n7',NULL,'Partners Meeting',  'Monthly partners meeting scheduled for March 3, 2026 at 2:00 PM','system',  TRUE, '/calendar','2026-02-22 10:00:00'),
('n8',NULL,'Document Updated',  'Statement of Claim for Safaricom v CA updated to version 2',     'system',  TRUE, '/documents','2026-02-20 11:00:00');

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_matter_summary AS
SELECT
  m.id, m.matter_number, m.title, m.status, m.practice_area,
  m.assigned_advocate, m.next_hearing, m.value,
  c.name AS client_name, c.type AS client_type
FROM matters m
LEFT JOIN clients c ON m.client_id = c.id;

CREATE OR REPLACE VIEW v_billing_summary AS
SELECT
  client_id, client_name,
  COUNT(*)                               AS invoice_count,
  SUM(amount)                            AS total_billed,
  SUM(paid)                              AS total_paid,
  SUM(amount) - SUM(paid)               AS outstanding
FROM invoices
GROUP BY client_id, client_name;

CREATE OR REPLACE VIEW v_time_summary AS
SELECT
  matter_id, matter_number,
  SUM(hours)                             AS total_hours,
  SUM(CASE WHEN billable THEN hours ELSE 0 END) AS billable_hours,
  SUM(CASE WHEN billable THEN hours * rate ELSE 0 END) AS billable_amount
FROM time_entries
GROUP BY matter_id, matter_number;

SELECT 'Database created successfully!' AS status;
