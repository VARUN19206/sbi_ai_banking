-- =============================================================
--  SBI AI Banking Assistant — MySQL Schema
--  Run:  mysql -u root -p < schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS sbi_ai_banking
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sbi_ai_banking;

-- ─── 1. Users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED       AUTO_INCREMENT PRIMARY KEY,
  cif_number      VARCHAR(20)        NOT NULL UNIQUE,
  account_number  VARCHAR(20)        NOT NULL UNIQUE,
  first_name      VARCHAR(60)        NOT NULL,
  last_name       VARCHAR(60)        NOT NULL,
  email           VARCHAR(120)       NOT NULL UNIQUE,
  phone           VARCHAR(15)        NOT NULL UNIQUE,
  password_hash   VARCHAR(255)       NOT NULL,
  pan_number      VARCHAR(10)        UNIQUE,
  date_of_birth   DATE,
  branch          VARCHAR(100),
  ifsc_code       VARCHAR(15),
  city            VARCHAR(60),
  credit_score    SMALLINT           DEFAULT 750,
  risk_profile    ENUM('conservative','moderate','aggressive') DEFAULT 'moderate',
  ai_plan         ENUM('basic','smart_pro') DEFAULT 'smart_pro',
  kyc_verified    TINYINT(1)         DEFAULT 0,
  is_active       TINYINT(1)         DEFAULT 1,
  last_login      DATETIME,
  created_at      DATETIME           DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email  (email),
  INDEX idx_cif    (cif_number)
) ENGINE=InnoDB;

-- ─── 2. Transactions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              INT UNSIGNED       AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED       NOT NULL,
  reference_no    VARCHAR(40)        NOT NULL UNIQUE,
  description     VARCHAR(200)       NOT NULL,
  amount          DECIMAL(12,2)      NOT NULL,                  -- negative = debit
  type            ENUM('credit','debit') NOT NULL,
  category        ENUM(
                    'income','food','grocery','transport','shopping',
                    'utility','insurance','ott','loan','transfer','investment','other'
                  ) DEFAULT 'other',
  merchant        VARCHAR(100),
  balance_after   DECIMAL(14,2),
  agent_flag      VARCHAR(60),                                  -- which agent flagged it
  ai_analysed     TINYINT(1)         DEFAULT 0,
  txn_date        DATETIME           NOT NULL,
  created_at      DATETIME           DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, txn_date),
  INDEX idx_category  (category)
) ENGINE=InnoDB;

-- ─── 3. Recommendations ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recommendations (
  id              INT UNSIGNED       AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED       NOT NULL,
  agent_type      ENUM('spending','savings','loan','bill_reminder','investment') NOT NULL,
  title           VARCHAR(200)       NOT NULL,
  description     TEXT               NOT NULL,
  priority        ENUM('low','medium','high','urgent') DEFAULT 'medium',
  potential_value DECIMAL(12,2),                               -- savings / gain amount
  action_url      VARCHAR(255),
  is_read         TINYINT(1)         DEFAULT 0,
  is_dismissed    TINYINT(1)         DEFAULT 0,
  expires_at      DATETIME,
  created_at      DATETIME           DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_agent (user_id, agent_type),
  INDEX idx_priority   (priority)
) ENGINE=InnoDB;

-- ─── 4. Notifications ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              INT UNSIGNED       AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED       NOT NULL,
  type            ENUM('alert','reminder','info','success','warning') DEFAULT 'info',
  agent_source    VARCHAR(40),
  title           VARCHAR(200)       NOT NULL,
  body            TEXT,
  is_read         TINYINT(1)         DEFAULT 0,
  sent_email      TINYINT(1)         DEFAULT 0,
  sent_push       TINYINT(1)         DEFAULT 0,
  created_at      DATETIME           DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB;

-- ─── 5. Feedback ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id                   INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id              INT UNSIGNED  NOT NULL,
  recommendation_id    INT UNSIGNED,
  helpfulness_rating   TINYINT       CHECK (helpfulness_rating BETWEEN 1 AND 5),
  accuracy_rating      TINYINT       CHECK (accuracy_rating    BETWEEN 1 AND 5),
  comment              TEXT,
  agent_type           VARCHAR(40),
  created_at           DATETIME      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)           REFERENCES users(id)           ON DELETE CASCADE,
  FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE SET NULL,
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ─── 6. Agent runs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_runs (
  id              INT UNSIGNED       AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED       NOT NULL,
  agent_type      ENUM('spending','savings','loan','bill_reminder','investment','orchestrator') NOT NULL,
  status          ENUM('pending','running','completed','failed') DEFAULT 'pending',
  txns_analysed   INT                DEFAULT 0,
  output_summary  TEXT,
  error_message   VARCHAR(500),
  started_at      DATETIME           DEFAULT CURRENT_TIMESTAMP,
  completed_at    DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB;

-- ─── 7. Bills / recurring ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  id              INT UNSIGNED       AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED       NOT NULL,
  biller_name     VARCHAR(100)       NOT NULL,
  amount          DECIMAL(10,2),
  due_day         TINYINT            CHECK (due_day BETWEEN 1 AND 31),
  category        VARCHAR(40),
  auto_pay        TINYINT(1)         DEFAULT 0,
  last_paid_at    DATE,
  next_due_at     DATE,
  is_active       TINYINT(1)         DEFAULT 1,
  created_at      DATETIME           DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Seed: demo user ───────────────────────────────────────────────────────────
-- password: Demo@1234  (bcrypt hash generated externally)
INSERT IGNORE INTO users
  (cif_number, account_number, first_name, last_name, email, phone, password_hash,
   pan_number, date_of_birth, branch, ifsc_code, city, credit_score, kyc_verified)
VALUES
  ('CIF1234567', '10482100004821', 'varun', 'H',
   'vv3750303@gmail.com', '+918197789550',
   '$2a$10$7caicFsR1mdZAaKQuCOyJumbMmA1tsAvK4UkNvD3suxy6sPqNM0ka',
   'ABCDE1234F', '2006-02-19', 'MG Road, Bengaluru', 'SBIN0004821', 'Bengaluru',
   768, 1);

SELECT 'Schema created successfully ✅' AS status;