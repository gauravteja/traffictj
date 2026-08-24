-- Adds 'speed_bump' as a third hazard type, alongside pothole and
-- waterlogging (see CLAUDE.md - "bumps and potholes and weather"
-- follow-up to the hazards feature). SQLite doesn't support altering
-- a CHECK constraint in place, so this rebuilds the table: create a
-- new one with the widened constraint, copy every row across, drop
-- the old table, rename the new one into place. Safe to run against
-- the live traffic-wedge-mvp database (only ~24 seed rows as of
-- 2026-08-24) with:
--   npx wrangler d1 execute traffic-wedge-mvp --file=migrations/0002_add_speed_bump_hazard_type.sql

CREATE TABLE hazards_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT CHECK(type IN ('pothole', 'waterlogging', 'speed_bump')) NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  description TEXT,
  photo_url TEXT,
  source TEXT DEFAULT 'user_report',
  status TEXT CHECK(status IN ('active', 'resolved', 'disputed')) DEFAULT 'active',
  reported_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO hazards_new (id, type, lat, lng, description, photo_url, source, status, reported_at, created_at)
  SELECT id, type, lat, lng, description, photo_url, source, status, reported_at, created_at FROM hazards;

DROP TABLE hazards;

ALTER TABLE hazards_new RENAME TO hazards;
