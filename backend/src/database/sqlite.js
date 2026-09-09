/**
 * SQLite Database Connection & Schema Initialization
 * Uses `better-sqlite3` for robust, high-performance synchronous persistence.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../config');

let dbInstance = null;

/**
 * Initializes SQLite database connection and sets up schema idempotently.
 * @param {string} [dbPath] 
 * @returns {Database.Database}
 */
function initDatabase(dbPath = config.sqliteDbPath) {
  if (dbInstance && dbInstance.name === dbPath) {
    return dbInstance;
  }

  // Ensure parent directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);

  // Enable WAL mode for high concurrency & foreign keys
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Schema: 1. User Created Components
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_components (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      dependencies TEXT NOT NULL DEFAULT '[]',
      consumers TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS seed_component_updates (
      id TEXT PRIMARY KEY,
      type TEXT,
      dependencies TEXT,
      consumers TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deleted_seed_components (
      id TEXT PRIMARY KEY,
      deleted_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_user_components_name ON user_components(name);
  `);

  // Migrate legacy JSON mutations if present and SQLite database is currently empty
  migrateLegacyJsonIfPresent(db, dir);

  dbInstance = db;
  return db;
}

/**
 * Migrates legacy `ecosystem-mutations.json` data into SQLite if the tables are empty.
 * Preserves the JSON file and saves a backup.
 */
function migrateLegacyJsonIfPresent(db, dataDir) {
  try {
    const legacyPath = path.join(dataDir, 'ecosystem-mutations.json');
    if (!fs.existsSync(legacyPath)) return;

    const backupPath = path.join(dataDir, 'ecosystem-mutations.backup.json');

    // If backup already exists, migration was previously done — never re-migrate
    if (fs.existsSync(backupPath)) return;

    // Check if SQLite is already populated
    const countUser = db.prepare('SELECT COUNT(*) as count FROM user_components').get().count;
    const countUpdates = db.prepare('SELECT COUNT(*) as count FROM seed_component_updates').get().count;
    const countDeleted = db.prepare('SELECT COUNT(*) as count FROM deleted_seed_components').get().count;

    if (countUser > 0 || countUpdates > 0 || countDeleted > 0) {
      return; // Already has data, skip migration
    }

    const raw = fs.readFileSync(legacyPath, 'utf8');
    const parsed = JSON.parse(raw);
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO user_components (id, name, type, dependencies, consumers, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertUpdate = db.prepare(`
      INSERT OR REPLACE INTO seed_component_updates (id, type, dependencies, consumers, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertDeleted = db.prepare(`
      INSERT OR IGNORE INTO deleted_seed_components (id, deleted_at)
      VALUES (?, ?)
    `);

    const migrateTx = db.transaction(() => {
      // 1. User Components
      if (Array.isArray(parsed.components)) {
        for (const c of parsed.components) {
          const compId = c._id || c.id || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          insertUser.run(
            compId,
            c.name,
            c.type || 'SERVICE',
            JSON.stringify(c.dependencies || []),
            JSON.stringify(c.consumers || []),
            now,
            now
          );
        }
      }

      // 2. Seed Updates
      if (parsed.updates && typeof parsed.updates === 'object') {
        for (const [id, patch] of Object.entries(parsed.updates)) {
          insertUpdate.run(
            id,
            patch.type || null,
            patch.dependencies !== undefined ? JSON.stringify(patch.dependencies) : null,
            patch.consumers !== undefined ? JSON.stringify(patch.consumers) : null,
            now
          );
        }
      }

      // 3. Deleted Seed Components
      if (Array.isArray(parsed.deletedIds)) {
        for (const id of parsed.deletedIds) {
          insertDeleted.run(id, now);
        }
      }
    });

    migrateTx();

    // Create a backup of legacy JSON
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(legacyPath, backupPath);
    }
  } catch (err) {
    console.error('Warning: Failed to migrate legacy JSON to SQLite:', err.message);
  }
}

/**
 * Returns the singleton database instance.
 * @returns {Database.Database}
 */
function getDatabase() {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

/**
 * Closes the database connection (useful for testing & clean shutdowns).
 */
function closeDatabase() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {}
    dbInstance = null;
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
};
