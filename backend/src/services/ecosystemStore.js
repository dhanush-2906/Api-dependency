/**
 * EcosystemStore — SQLite-backed persistence layer for user-defined mutations.
 * Powered by `better-sqlite3` with ACID transactions and prepared statements.
 *
 * Implements the protected public interface:
 *   - getState(): { components: [...], updates: {...}, deletedIds: [...] }
 *   - addComponent(record)
 *   - updateComponent(id, patch)
 *   - deleteComponent(id)
 *   - reset()
 */

const { getDatabase } = require('../database/sqlite');

class EcosystemStore {
  constructor() {
    this._db = null;
    this._statements = null;
  }

  _getStatements() {
    const db = getDatabase();
    if (this._statements && this._db === db && db.open) {
      return this._statements;
    }

    this._db = db;
    this._statements = {
      getUserComponents: db.prepare('SELECT * FROM user_components ORDER BY created_at ASC'),
      getUserComponentById: db.prepare('SELECT * FROM user_components WHERE id = ?'),
      getSeedUpdates: db.prepare('SELECT * FROM seed_component_updates'),
      getSeedUpdateById: db.prepare('SELECT * FROM seed_component_updates WHERE id = ?'),
      getDeletedSeedComponents: db.prepare('SELECT id FROM deleted_seed_components'),

      insertUserComponent: db.prepare(`
        INSERT OR IGNORE INTO user_components (id, name, type, dependencies, consumers, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `),

      updateUserComponent: db.prepare(`
        UPDATE user_components
        SET name = ?, type = ?, dependencies = ?, consumers = ?, updated_at = ?
        WHERE id = ?
      `),

      upsertSeedUpdate: db.prepare(`
        INSERT INTO seed_component_updates (id, type, dependencies, consumers, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          type = COALESCE(excluded.type, seed_component_updates.type),
          dependencies = COALESCE(excluded.dependencies, seed_component_updates.dependencies),
          consumers = COALESCE(excluded.consumers, seed_component_updates.consumers),
          updated_at = excluded.updated_at
      `),

      deleteUserComponent: db.prepare('DELETE FROM user_components WHERE id = ?'),
      deleteSeedUpdate: db.prepare('DELETE FROM seed_component_updates WHERE id = ?'),
      insertDeletedSeedComponent: db.prepare('INSERT OR IGNORE INTO deleted_seed_components (id, deleted_at) VALUES (?, ?)'),

      clearUserComponents: db.prepare('DELETE FROM user_components'),
      clearSeedUpdates: db.prepare('DELETE FROM seed_component_updates'),
      clearDeletedSeedComponents: db.prepare('DELETE FROM deleted_seed_components')
    };

    return this._statements;
  }

  /**
   * Returns the current full mutation state matching the existing canonical interface.
   * @returns {{ components: Array<object>, updates: object, deletedIds: Array<string> }}
   */
  getState() {
    const stmts = this._getStatements();

    // 1. User Created Components
    const userRows = stmts.getUserComponents.all();
    const components = userRows.map(row => {
      let deps = [];
      let consumers = [];
      try { deps = JSON.parse(row.dependencies); } catch {}
      try { consumers = JSON.parse(row.consumers); } catch {}

      return {
        _id: row.id,
        name: row.name,
        type: row.type,
        dependencies: Array.isArray(deps) ? deps : [],
        consumers: Array.isArray(consumers) ? consumers : []
      };
    });

    // 2. Seed Updates
    const updateRows = stmts.getSeedUpdates.all();
    const updates = {};
    for (const row of updateRows) {
      updates[row.id] = {};
      if (row.type !== null && row.type !== undefined) {
        updates[row.id].type = row.type;
      }
      if (row.dependencies !== null && row.dependencies !== undefined) {
        try { updates[row.id].dependencies = JSON.parse(row.dependencies); } catch {}
      }
      if (row.consumers !== null && row.consumers !== undefined) {
        try { updates[row.id].consumers = JSON.parse(row.consumers); } catch {}
      }
    }

    // 3. Deleted Seed Component IDs
    const deletedRows = stmts.getDeletedSeedComponents.all();
    const deletedIds = deletedRows.map(r => r.id);

    return {
      components,
      updates,
      deletedIds
    };
  }

  /**
   * Adds a new user-created component record.
   * @param {object} record — { _id, name, type, dependencies, consumers }
   */
  addComponent(record) {
    const stmts = this._getStatements();
    const now = new Date().toISOString();
    const id = record._id || record.id;
    const deps = JSON.stringify(record.dependencies || []);
    const consumers = JSON.stringify(record.consumers || []);

    stmts.insertUserComponent.run(
      id,
      record.name.trim(),
      record.type || 'SERVICE',
      deps,
      consumers,
      now,
      now
    );
  }

  /**
   * Updates an existing component (user-created or seed overlay).
   * @param {string} id 
   * @param {object} patch 
   */
  updateComponent(id, patch) {
    const stmts = this._getStatements();
    const now = new Date().toISOString();

    // Check if it's a user-created component
    const userComp = stmts.getUserComponentById.get(id);

    if (userComp) {
      let currentDeps = [];
      let currentConsumers = [];
      try { currentDeps = JSON.parse(userComp.dependencies); } catch {}
      try { currentConsumers = JSON.parse(userComp.consumers); } catch {}

      const newName = patch.name !== undefined ? patch.name.trim() : userComp.name;
      const newType = patch.type !== undefined ? patch.type : userComp.type;
      const newDeps = patch.dependencies !== undefined ? patch.dependencies : currentDeps;
      const newConsumers = patch.consumers !== undefined ? patch.consumers : currentConsumers;

      stmts.updateUserComponent.run(
        newName,
        newType,
        JSON.stringify(newDeps),
        JSON.stringify(newConsumers),
        now,
        id
      );
    } else {
      // Seed component overlay update
      const existingUpdate = stmts.getSeedUpdateById.get(id);
      let updatedType = patch.type !== undefined ? patch.type : (existingUpdate?.type || null);
      let updatedDeps = patch.dependencies !== undefined 
        ? JSON.stringify(patch.dependencies) 
        : (existingUpdate?.dependencies || null);
      let updatedConsumers = patch.consumers !== undefined 
        ? JSON.stringify(patch.consumers) 
        : (existingUpdate?.consumers || null);

      stmts.upsertSeedUpdate.run(
        id,
        updatedType,
        updatedDeps,
        updatedConsumers,
        now
      );
    }
  }

  /**
   * Deletes a component from the ecosystem (user-created removed, seed marked deleted).
   * @param {string} id 
   */
  deleteComponent(id) {
    const db = getDatabase();
    const stmts = this._getStatements();
    const now = new Date().toISOString();

    const deleteTx = db.transaction(() => {
      const userComp = stmts.getUserComponentById.get(id);
      if (userComp) {
        stmts.deleteUserComponent.run(id);
        stmts.deleteSeedUpdate.run(id);
      } else {
        stmts.insertDeletedSeedComponent.run(id, now);
        stmts.deleteSeedUpdate.run(id);
      }
    });

    deleteTx();
  }

  /**
   * Resets all mutations — restores pure seed state.
   */
  reset() {
    const db = getDatabase();
    const stmts = this._getStatements();

    const resetTx = db.transaction(() => {
      stmts.clearUserComponents.run();
      stmts.clearSeedUpdates.run();
      stmts.clearDeletedSeedComponents.run();
    });

    resetTx();
  }
}

const ecosystemStoreInstance = new EcosystemStore();
module.exports = ecosystemStoreInstance;
