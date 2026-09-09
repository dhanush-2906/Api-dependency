/**
 * Canonical In-Memory Dependency Graph Model.
 * 
 * Representation:
 * - components: Map<string, Component>
 * - forwardAdjacency: Map<string, Set<string>> (Provider -> Downstream Consumers)
 * - reverseAdjacency: Map<string, Set<string>> (Consumer -> Upstream Providers)
 * - edges: Array of canonical edges
 */
class DependencyGraph {
  constructor() {
    this.components = new Map();
    this.forwardAdjacency = new Map();
    this.reverseAdjacency = new Map();
    this.edges = [];
  }

  static fromNormalizedData(normalizedData) {
    const graph = new DependencyGraph();

    for (const comp of normalizedData.components) {
      graph.addComponent(comp);
    }

    for (const edge of normalizedData.edges) {
      graph.addEdge(edge);
    }

    return graph;
  }

  addComponent(component) {
    this.components.set(component.id, component);
    if (!this.forwardAdjacency.has(component.id)) {
      this.forwardAdjacency.set(component.id, new Set());
    }
    if (!this.reverseAdjacency.has(component.id)) {
      this.reverseAdjacency.set(component.id, new Set());
    }
  }

  getComponent(id) {
    return this.components.get(id) || null;
  }

  hasComponent(id) {
    return this.components.has(id);
  }

  getAllComponents() {
    return Array.from(this.components.values());
  }

  addEdge(edge) {
    this.edges.push(edge);

    if (!this.forwardAdjacency.has(edge.source)) {
      this.forwardAdjacency.set(edge.source, new Set());
    }
    this.forwardAdjacency.get(edge.source).add(edge.target);

    if (!this.reverseAdjacency.has(edge.target)) {
      this.reverseAdjacency.set(edge.target, new Set());
    }
    this.reverseAdjacency.get(edge.target).add(edge.source);
  }

  getDirectDownstream(id) {
    const targets = this.forwardAdjacency.get(id);
    if (!targets) return [];
    return Array.from(targets).map(targetId => this.components.get(targetId)).filter(Boolean);
  }

  getDirectUpstream(id) {
    const sources = this.reverseAdjacency.get(id);
    if (!sources) return [];
    return Array.from(sources).map(sourceId => this.components.get(sourceId)).filter(Boolean);
  }

  toJSON() {
    return {
      nodes: this.getAllComponents().map(c => c.toJSON()),
      edges: this.edges
    };
  }
}

module.exports = {
  DependencyGraph
};
