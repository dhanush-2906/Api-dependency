/**
 * Validates parsed YAML dataset results for schema correctness, integrity, and contradictions.
 */
function validateDataset(parsedResults) {
  const issues = [];
  const validRecords = [];

  for (const item of parsedResults) {
    if (!item.success) {
      issues.push({
        type: 'ERROR',
        code: 'PARSE_FAILURE',
        message: item.error,
        file: item.filename
      });
      continue;
    }

    const doc = item.data;
    if (!doc || typeof doc !== 'object') {
      issues.push({
        type: 'ERROR',
        code: 'INVALID_ROOT',
        message: `File content is not an object: ${item.filename}`,
        file: item.filename
      });
      continue;
    }

    // Supported identity fields: service, name, component
    const serviceName = doc.service || doc.name || doc.component;
    if (!serviceName || typeof serviceName !== 'string' || !serviceName.trim()) {
      issues.push({
        type: 'ERROR',
        code: 'MISSING_SERVICE_NAME',
        message: `Missing required 'service' or 'name' attribute in ${item.filename}`,
        file: item.filename
      });
      continue;
    }

    // Validate dependencies field if present
    if (doc.dependencies !== undefined && doc.dependencies !== null) {
      if (!Array.isArray(doc.dependencies)) {
        issues.push({
          type: 'WARNING',
          code: 'INVALID_DEPENDENCIES_TYPE',
          message: `'dependencies' in ${item.filename} should be an array`,
          file: item.filename
        });
      }
    }

    // Validate consumers field if present
    if (doc.consumers !== undefined && doc.consumers !== null) {
      if (!Array.isArray(doc.consumers)) {
        issues.push({
          type: 'WARNING',
          code: 'INVALID_CONSUMERS_TYPE',
          message: `'consumers' in ${item.filename} should be an array`,
          file: item.filename
        });
      }
    }

    validRecords.push({
      serviceName: serviceName.trim(),
      type: doc.type,
      dependencies: Array.isArray(doc.dependencies) ? doc.dependencies : [],
      consumers: Array.isArray(doc.consumers) ? doc.consumers : [],
      raw: doc,
      filename: item.filename,
      filePath: item.filePath
    });
  }

  return {
    isValid: issues.filter(i => i.type === 'ERROR').length === 0,
    issues,
    validRecords
  };
}

module.exports = {
  validateDataset
};
