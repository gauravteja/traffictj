-- Crowdsourced hazard reports (potholes, waterlogging) - the V2 idea
-- from CLAUDE.md, known gap #5. No schema for the other tables
-- (users, saved_routes, advisories, alerts_sent) is checked in yet -
-- this is the first migration file in the repo. Applied directly to
-- the live D1 database (traffic-wedge-mvp); run this against a fresh
-- database with:
--   npx wrangler d1 execute traffic-wedge-mvp --file=migrations/0001_create_hazards.sql

CREATE TABLE IF NOT EXISTS hazards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT CHECK(type IN ('pothole', 'waterlogging')) NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  description TEXT,
  photo_url TEXT,
  -- 'user_report' (submitted through the app) or
  -- 'seed_blr_potholes_github' (one-time import - see CLAUDE.md)
  source TEXT DEFAULT 'user_report',
  status TEXT CHECK(status IN ('active', 'resolved', 'disputed')) DEFAULT 'active',
  reported_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);
