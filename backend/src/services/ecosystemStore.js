/**
 * EcosystemStore — JSON-backed persistence layer for user-defined mutations.
 *
 * Schema:
 *   components: [ { _id, name, type, dependencies, consumers } ]  — user-created
 *   updates:    { [id]: { type?, dependencies?, consumers? } }     — patches to seed components
 *   deletedIds: [ 'id1', ... ]                                     — seed component IDs removed
 */

const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../../data/ecosystem-mutations.json');

class EcosystemStore {
  constructor() {
    this._state = null;
  }

  _load() {
    if (this._state !== null) return this._state;
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        this._state = {
          components: Array.isArray(parsed.components) ? parsed.components : [],
          updates: (parsed.updates && typeof parsed.updates === 'object') ? parsed.updates : {},
          deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : []
        };
      } else {
        this._state = { components: [], updates: {}, deletedIds: [] };
      }
    } catch {
      this._state = { components: [], updates: {}, deletedIds: [] };
    }
    return this._state;
  }

  _save() {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(this._state, null, 2), 'utf8');
  }

  getState() {
    return this._load();
  }

  /** Add a new user-created component record. Guards against duplicates by _id. */
  addComponent(record) {
    const state = this._load();
    // Guard against duplicate IDs
    if (state.components.some(c => c._id === record._id)) {
      return; // Already exists, skip
    }
    state.components.push(record);
    this._save();
  }

  /** Update a component by id — handles both user-created and seed overlay. */
  updateComponent(id, patch) {
    const state = this._load();

    // Check if it's a user-created component
    const userIdx = state.components.findIndex(c => c._id === id);
    if (userIdx !== -1) {
      // Replace the entire record (patch contains full updated fields)
      state.components[userIdx] = { ...state.components[userIdx], ...patch };
    } else {
      // Seed component — store as overlay patch
      state.updates[id] = { ...(state.updates[id] || {}), ...patch };
    }
    this._save();
  }

  /** Delete a component by id. */
  deleteComponent(id) {
    const state = this._load();

    // If it's user-created, remove from components array
    const userIdx = state.components.findIndex(c => c._id === id);
    if (userIdx !== -1) {
      state.components.splice(userIdx, 1);
      // Also remove any updates for it
      delete state.updates[id];
    } else {
      // Seed component — mark as deleted
      if (!state.deletedIds.includes(id)) {
        state.deletedIds.push(id);
      }
      // Remove any pending update
      delete state.updates[id];
    }
    this._save();
  }

  /** Reset all mutations — restores pure seed state. */
  reset() {
    this._state = { components: [], updates: {}, deletedIds: [] };
    this._save();
  }
}

const ecosystemStoreInstance = new EcosystemStore();
module.exports = ecosystemStoreInstance;
