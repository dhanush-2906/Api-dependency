const { loadYamlDirectory } = require('../parser/yamlParser');
const { validateDataset } = require('../validators/datasetValidator');
const { normalizeDataset } = require('../graph/normalization');
const { DependencyGraph } = require('../graph/graph');
const { toComponentId } = require('../models/Component');
const ecosystemStore = require('./ecosystemStore');
const config = require('../config');

class DatasetService {
  constructor() {
    this.graph = null;
    this.validationReport = null;
    this.normalizedData = null;
    this.rawParsed = null;
    this.seedValidRecords = null; // Pre-validated seed records (source of truth)
    this.initialized = false;
  }

  initialize(dirPath = config.datasetDir) {
    this.rawParsed = loadYamlDirectory(dirPath);
    // Run validation once on seed data, save validRecords as seed source of truth
    const seedReport = validateDataset(this.rawParsed);
    this.seedValidRecords = seedReport.validRecords;
    this.validationReport = seedReport;
    this._rebuildGraph();
    this.initialized = true;
    return this.getSummary();
  }

  /**
   * Rebuilds the in-memory graph by:
   *  1. Starting from seed YAML validRecords
   *  2. Applying ecosystem store mutations (deletions, updates, new components)
   *  3. Re-normalizing and rebuilding graph
   *
   * Does NOT re-parse YAML — uses pre-validated seed records.
   */
  _rebuildGraph() {
    const storeState = ecosystemStore.getState();

    // 1. Clone seed records
    let records = (this.seedValidRecords || []).map(rec => ({ ...rec }));

    // 2. Apply deletions — remove seed components marked as deleted
    records = records.filter(rec => {
      const id = toComponentId(rec.serviceName);
      return !storeState.deletedIds.includes(id);
    });

    // 3. Apply updates to seed components
    records = records.map(rec => {
      const id = toComponentId(rec.serviceName);
      const patch = storeState.updates[id];
      if (!patch) return rec;
      return {
        ...rec,
        type: patch.type || rec.type,
        dependencies: patch.dependencies !== undefined ? patch.dependencies : rec.dependencies,
        consumers: patch.consumers !== undefined ? patch.consumers : rec.consumers
      };
    });

    // 4. Add user-created components as synthetic validated records
    for (const uc of storeState.components) {
      records.push({
        serviceName: uc.name,
        type: uc.type || 'SERVICE',
        dependencies: uc.dependencies || [],
        consumers: uc.consumers || [],
        filename: 'user-created',
        filePath: null,
        _isUserCreated: true,
        _id: uc._id
      });
    }

    // 5. Normalize and build graph from the merged records
    this.normalizedData = normalizeDataset(records);
    this.graph = DependencyGraph.fromNormalizedData(this.normalizedData);
  }

  /**
   * Public method: rebuild graph after a mutation has been persisted to the store.
   */
  rebuild() {
    this.ensureInitialized();
    this._rebuildGraph();
    return this.getSummary();
  }

  ensureInitialized() {
    if (!this.initialized || !this.graph) {
      this.initialize();
    }
  }

  getGraph() {
    this.ensureInitialized();
    return this.graph;
  }

  getValidationReport() {
    this.ensureInitialized();
    return this.validationReport;
  }

  getSummary() {
    this.ensureInitialized();
    return {
      componentCount: this.graph.getAllComponents().length,
      edgeCount: this.graph.edges.length,
      validationIssues: this.validationReport.issues.length,
      isValid: this.validationReport.isValid
    };
  }

  // ─── CRUD Methods ───────────────────────────────────────────────────────────

  /**
   * Create a new user-defined component.
   * @param {object} data — { name, type, dependencies[], consumers[] }
   * @returns {object} The created component's toJSON representation
   */
  createComponent(data) {
    this.ensureInitialized();
    const { name, type, dependencies = [], consumers = [] } = data;
    const id = toComponentId(name);

    if (this.graph.hasComponent(id)) {
      const err = new Error(`A component with the name "${name}" already exists (ID: ${id}).`);
      err.status = 409;
      throw err;
    }

    const record = {
      _id: id,
      name: name.trim(),
      type: type || 'SERVICE',
      dependencies,
      consumers
    };

    ecosystemStore.addComponent(record);
    this._rebuildGraph();

    const comp = this.graph.getComponent(id);
    return comp ? comp.toJSON() : null;
  }

  /**
   * Update an existing component (seed or user-created).
   * @param {string} id
   * @param {object} data — { name?, type?, dependencies?, consumers? }
   * @returns {object} The updated component's toJSON representation
   */
  updateComponent(id, data) {
    this.ensureInitialized();

    if (!this.graph.hasComponent(id)) {
      const err = new Error(`Component not found: ${id}`);
      err.status = 404;
      throw err;
    }

    const storeState = ecosystemStore.getState();
    const userComp = storeState.components.find(c => c._id === id);

    if (userComp) {
      // Fully replace user-created component fields
      ecosystemStore.updateComponent(id, {
        _id: id,
        name: data.name !== undefined ? data.name.trim() : userComp.name,
        type: data.type !== undefined ? data.type : userComp.type,
        dependencies: data.dependencies !== undefined ? data.dependencies : userComp.dependencies,
        consumers: data.consumers !== undefined ? data.consumers : userComp.consumers
      });
    } else {
      // Seed component — store as overlay patch (name changes not allowed since it would change ID)
      const patch = {};
      if (data.type !== undefined) patch.type = data.type;
      if (data.dependencies !== undefined) patch.dependencies = data.dependencies;
      if (data.consumers !== undefined) patch.consumers = data.consumers;
      ecosystemStore.updateComponent(id, patch);
    }

    this._rebuildGraph();
    const comp = this.graph.getComponent(id);
    return comp ? comp.toJSON() : null;
  }

  /**
   * Delete a component from the ecosystem.
   * @param {string} id
   */
  deleteComponent(id) {
    this.ensureInitialized();

    if (!this.graph.hasComponent(id)) {
      const err = new Error(`Component not found: ${id}`);
      err.status = 404;
      throw err;
    }

    ecosystemStore.deleteComponent(id);
    this._rebuildGraph();
    return { deleted: true, id };
  }

  /**
   * Reset ecosystem to seed YAML state.
   */
  resetEcosystem() {
    this.ensureInitialized();
    ecosystemStore.reset();
    this._rebuildGraph();
    return this.getSummary();
  }

  /**
   * Returns whether a component is user-created (vs. seed data).
   */
  isUserCreated(id) {
    const state = ecosystemStore.getState();
    return state.components.some(c => c._id === id);
  }
}

const datasetServiceInstance = new DatasetService();

module.exports = datasetServiceInstance;
