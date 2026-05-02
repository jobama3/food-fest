import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), 'food-fest.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS participants (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id   INTEGER NOT NULL REFERENCES events(id),
    username   TEXT NOT NULL,
    dish_name  TEXT NOT NULL,
    joined_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(event_id, username)
  );

  CREATE TABLE IF NOT EXISTS votes (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id       INTEGER NOT NULL REFERENCES events(id),
    voter_id       INTEGER NOT NULL REFERENCES participants(id),
    ranked_dish_id INTEGER NOT NULL REFERENCES participants(id),
    rank           INTEGER NOT NULL,
    UNIQUE(voter_id, rank),
    UNIQUE(voter_id, ranked_dish_id)
  );
`);

export default db;
