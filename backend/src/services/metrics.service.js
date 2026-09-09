const datasetService = require('./dataset.service');
const { ComponentType } = require('../models/ComponentType');
const { traverseDownstream } = require('../graph/traversal');

class MetricsService {
  getMetrics() {
    const graph = datasetService.getGraph();
    const components = graph.getAllComponents();
    const edges = graph.edges;

    let totalServices = 0;
    let totalApplications = 0;
    let totalDatabases = 0;
    let totalExternal = 0;

    for (const comp of components) {
      if (comp.type === ComponentType.SERVICE) totalServices++;
      else if (comp.type === ComponentType.APPLICATION) totalApplications++;
      else if (comp.type === ComponentType.DATABASE) totalDatabases++;
      else if (comp.type === ComponentType.EXTERNAL) totalExternal++;
    }

    // Connectivity: in-degree (reverseAdjacency) + out-degree (forwardAdjacency)
    let mostConnectedService = null;
    let maxConnections = -1;

    // Downstream reachability for Criticality and Blast Radius
    let criticalServiceCandidate = null;
    let maxDownstreamServices = -1;

    let largestBlastRadiusCandidate = null;
    let maxBlastRadius = -1;

    const componentScores = [];

    for (const comp of components) {
      const directDownstream = graph.forwardAdjacency.get(comp.id)?.size || 0;
      const directUpstream = graph.reverseAdjacency.get(comp.id)?.size || 0;
      const totalDegree = directDownstream + directUpstream;

      // Traversal for transitive downstream reachability
      const traversal = traverseDownstream(graph, comp.id);
      const downstreamCount = traversal.totalCount;

      const scoreItem = {
        id: comp.id,
        name: comp.name,
        type: comp.type,
        directDownstreamCount: directDownstream,
        directUpstreamCount: directUpstream,
        totalConnectivity: totalDegree,
        criticalityScore: downstreamCount,
        blastRadiusCount: downstreamCount
      };
      componentScores.push(scoreItem);

      // Most Connected Service (among services/APIs)
      if (comp.type === ComponentType.SERVICE && totalDegree > maxConnections) {
        maxConnections = totalDegree;
        mostConnectedService = {
          id: comp.id,
          name: comp.name,
          type: comp.type,
          connections: totalDegree,
          directUpstream,
          directDownstream
        };
      }

      // Critical Service Candidate (service with highest downstream reachability)
      if (comp.type === ComponentType.SERVICE && downstreamCount > maxDownstreamServices) {
        maxDownstreamServices = downstreamCount;
        criticalServiceCandidate = {
          id: comp.id,
          name: comp.name,
          type: comp.type,
          criticalityScore: downstreamCount,
          reachableDownstreamCount: downstreamCount
        };
      }

      // Largest Blast Radius Candidate (across all components)
      if (downstreamCount > maxBlastRadius) {
        maxBlastRadius = downstreamCount;
        largestBlastRadiusCandidate = {
          id: comp.id,
          name: comp.name,
          type: comp.type,
          blastRadiusCount: downstreamCount
        };
      }
    }

    return {
      totalServices,
      totalApplications,
      totalDatabases,
      totalExternalSystems: totalExternal,
      totalComponents: components.length,
      totalDependencies: edges.length,
      mostConnectedService,
      criticalServiceCandidate,
      largestBlastRadiusCandidate,
      suggestedCriticalityFormula: 'Transitive downstream reachable components (Provider -> Consumer)',
      componentScores
    };
  }
}

module.exports = new MetricsService();
