const { Component, toComponentId } = require('../models/Component');
const { inferComponentType } = require('../models/ComponentType');

/**
 * Normalizes dataset records into a canonical graph representation:
 * Canonical Direction: PROVIDER -> CONSUMER
 *
 * Rules:
 * - If record A declares dependency B: B is Provider, A is Consumer => Edge(B -> A)
 * - If record A declares consumer C: A is Provider, C is Consumer => Edge(A -> C)
 * - Deduplicates edges.
 * - Extracts and creates all referenced component nodes with inferred types.
 */
function normalizeDataset(validRecords) {
  const componentsMap = new Map();
  const rawEdges = [];
  const normalizationIssues = [];

  // Step 1: Register all primary declared components
  for (const rec of validRecords) {
    const id = toComponentId(rec.serviceName);
    const comp = new Component({
      id,
      name: rec.serviceName,
      type: inferComponentType(rec.serviceName, rec.type),
      metadata: {
        rawType: rec.type,
        declaredDependencies: rec.dependencies,
        declaredConsumers: rec.consumers
      },
      sourceFile: rec.filename
    });
    componentsMap.set(id, comp);
  }

  // Helper to ensure component exists in map
  function ensureComponent(name) {
    if (!name || typeof name !== 'string') return null;
    const cleanName = name.trim();
    if (!cleanName) return null;
    const id = toComponentId(cleanName);
    if (!componentsMap.has(id)) {
      const comp = new Component({
        id,
        name: cleanName,
        type: inferComponentType(cleanName),
        metadata: { inferred: true },
        sourceFile: null
      });
      componentsMap.set(id, comp);
    }
    return id;
  }

  // Step 2: Build edges from dependencies and consumers
  for (const rec of validRecords) {
    const currentId = toComponentId(rec.serviceName);

    // Dependencies: Provider -> Current (current depends on dep)
    for (const dep of rec.dependencies) {
      if (typeof dep !== 'string' || !dep.trim()) {
        normalizationIssues.push({
          type: 'WARNING',
          code: 'MALFORMED_DEPENDENCY',
          message: `Invalid dependency entry in ${rec.filename}: ${JSON.stringify(dep)}`,
          file: rec.filename
        });
        continue;
      }
      const providerId = ensureComponent(dep);
      if (providerId) {
        rawEdges.push({
          source: providerId,
          target: currentId,
          sourceName: dep.trim(),
          targetName: rec.serviceName,
          declaredIn: rec.filename,
          origin: 'dependency'
        });
      }
    }

    // Consumers: Current -> Consumer (consumer depends on current)
    for (const cons of rec.consumers) {
      if (typeof cons !== 'string' || !cons.trim()) {
        normalizationIssues.push({
          type: 'WARNING',
          code: 'MALFORMED_CONSUMER',
          message: `Invalid consumer entry in ${rec.filename}: ${JSON.stringify(cons)}`,
          file: rec.filename
        });
        continue;
      }
      const consumerId = ensureComponent(cons);
      if (consumerId) {
        rawEdges.push({
          source: currentId,
          target: consumerId,
          sourceName: rec.serviceName,
          targetName: cons.trim(),
          declaredIn: rec.filename,
          origin: 'consumer'
        });
      }
    }
  }

  // Step 3: Deduplicate edges (canonical key: `${source}->${target}`)
  const uniqueEdgesMap = new Map();
  for (const edge of rawEdges) {
    const edgeKey = `${edge.source}->${edge.target}`;
    if (!uniqueEdgesMap.has(edgeKey)) {
      uniqueEdgesMap.set(edgeKey, {
        id: `e-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        sourceName: edge.sourceName,
        targetName: edge.targetName,
        origins: [edge.origin],
        declaredIn: [edge.declaredIn]
      });
    } else {
      const existing = uniqueEdgesMap.get(edgeKey);
      if (!existing.origins.includes(edge.origin)) {
        existing.origins.push(edge.origin);
      }
      if (!existing.declaredIn.includes(edge.declaredIn)) {
        existing.declaredIn.push(edge.declaredIn);
      }
    }
  }

  const normalizedEdges = Array.from(uniqueEdgesMap.values());

  return {
    components: Array.from(componentsMap.values()),
    componentsMap,
    edges: normalizedEdges,
    issues: normalizationIssues
  };
}

module.exports = {
  normalizeDataset
};
