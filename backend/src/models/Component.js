const { ComponentType, inferComponentType } = require('./ComponentType');

function toComponentId(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

class Component {
  constructor({ id, name, type, metadata = {}, sourceFile = null }) {
    this.name = (name || '').trim();
    this.id = id || toComponentId(this.name);
    this.type = type || inferComponentType(this.name, metadata.type);
    this.metadata = metadata;
    this.sourceFile = sourceFile;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      metadata: this.metadata,
      sourceFile: this.sourceFile
    };
  }
}

module.exports = {
  Component,
  toComponentId
};
