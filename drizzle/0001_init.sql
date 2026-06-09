-- NDIS Referral System — Initial Schema Migration

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('pending', 'contacted', 'enrolled', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  participant_name TEXT NOT NULL,
  participant_phone TEXT NOT NULL,
  participant_email TEXT,
  suburb TEXT,
  state TEXT,
  postcode TEXT,
  disability_type TEXT,
  support_needs TEXT,
  ndis_status TEXT,
  age INTEGER,
  citizenship TEXT,
  referrer_name TEXT,
  referrer_phone TEXT,
  referrer_email TEXT,
  referrer_relation TEXT,
  status lead_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  care_plan TEXT,
  contacted_at BIGINT,
  enrolled_at BIGINT,
  gross_commission INTEGER DEFAULT 1000,
  referrer_payout INTEGER DEFAULT 200,
  net_commission INTEGER DEFAULT 800,
  gift_card_sent BOOLEAN DEFAULT FALSE,
  ip_city TEXT,
  ip_state TEXT,
  ip_country TEXT,
  ip_postcode TEXT,
  ip_lat REAL,
  ip_lng REAL,
  referral_source TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  visitor_name TEXT,
  visitor_email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  staff_id INTEGER,
  created_at BIGINT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_referrer_name ON leads(referrer_name);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
