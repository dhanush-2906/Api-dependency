const { loadYamlDirectory } = require('../parser/yamlParser');
const { validateDataset } = require('../validators/datasetValidator');
const { normalizeDataset } = require('../graph/normalization');
const { DependencyGraph } = require('../graph/graph');
const config = require('../config');

class DatasetService {
  constructor() {
    this.graph = null;
    this.validationReport = null;
    this.normalizedData = null;
    this.rawParsed = null;
    this.initialized = false;
  }

  initialize(dirPath = config.datasetDir) {
    this.rawParsed = loadYamlDirectory(dirPath);
    this.validationReport = validateDataset(this.rawParsed);
    this.normalizedData = normalizeDataset(this.validationReport.validRecords);

    // Merge normalization issues into validation report
    if (this.normalizedData.issues && this.normalizedData.issues.length > 0) {
      this.validationReport.issues.push(...this.normalizedData.issues);
    }

    this.graph = DependencyGraph.fromNormalizedData(this.normalizedData);
    this.initialized = true;
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
}

const datasetServiceInstance = new DatasetService();

module.exports = datasetServiceInstance;
