/**
 * AI Context Service
 * Gathers current architecture context from deterministic backend graph and metrics.
 * Ensures the AI operates with 100% grounded, up-to-date facts.
 */

const datasetService = require('../dataset.service');
const metricsService = require('../metrics.service');

class AiContextService {
  /**
   * Builds structured and text context from the CURRENT in-memory graph.
   * @param {string|null} selectedComponentId
   * @param {object|null} activeAnalysis
   * @returns {object} structured context
   */
  getArchitectureContext(selectedComponentId = null, activeAnalysis = null) {
    const graph = datasetService.getGraph();
    const components = graph.getAllComponents();
    const edges = graph.edges;
    const metrics = metricsService.getMetrics();

    // Map each component with its direct dependencies (upstream) and direct consumers (downstream)
    const componentSummaries = components.map(c => {
      const upstream = graph.getDirectUpstream(c.id).map(u => ({ id: u.id, name: u.name, type: u.type }));
      const downstream = graph.getDirectDownstream(c.id).map(d => ({ id: d.id, name: d.name, type: d.type }));
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        isUserCreated: datasetService.isUserCreated(c.id),
        directDependencies: upstream.map(u => u.name),
        directConsumers: downstream.map(d => d.name),
        directDependenciesCount: upstream.length,
        directConsumersCount: downstream.length
      };
    });

    let selectedContext = null;
    if (selectedComponentId) {
      const selectedComp = graph.getComponent(selectedComponentId);
      if (selectedComp) {
        const directUpstream = graph.getDirectUpstream(selectedComp.id).map(u => u.name);
        const directDownstream = graph.getDirectDownstream(selectedComp.id).map(d => d.name);
        selectedContext = {
          id: selectedComp.id,
          name: selectedComp.name,
          type: selectedComp.type,
          isUserCreated: datasetService.isUserCreated(selectedComp.id),
          directDependencies: directUpstream,
          directConsumers: directDownstream
        };
      }
    }

    // Build a compact text summary for LLM prompt injection
    const topologyLines = componentSummaries.map(c => {
      const deps = c.directDependencies.length > 0 ? c.directDependencies.join(', ') : 'None';
      const consumers = c.directConsumers.length > 0 ? c.directConsumers.join(', ') : 'None';
      return `- ${c.name} [Type: ${c.type}] | Depends on: [${deps}] | Consumed by: [${consumers}]`;
    });

    const summaryText = [
      `CURRENT ARCHITECTURE TOPOLOGY (${components.length} components, ${edges.length} canonical edges):`,
      ...topologyLines,
      '',
      `SYSTEM METRICS:`,
      `- Total Services: ${metrics.totalServices}`,
      `- Total Applications: ${metrics.totalApplications}`,
      `- Total Databases: ${metrics.totalDatabases}`,
      `- Total External Systems: ${metrics.totalExternalSystems}`,
      `- Most Connected Service: ${metrics.mostConnectedService ? metrics.mostConnectedService.name : 'N/A'} (${metrics.mostConnectedService?.connections || 0} connections)`,
      `- Critical Service Candidate: ${metrics.criticalServiceCandidate ? metrics.criticalServiceCandidate.name : 'N/A'} (Downstream Reach: ${metrics.criticalServiceCandidate?.reachableDownstreamCount || 0})`,
      `- Largest Blast Radius: ${metrics.largestBlastRadiusCandidate ? metrics.largestBlastRadiusCandidate.name : 'N/A'} (Blast Count: ${metrics.largestBlastRadiusCandidate?.blastRadiusCount || 0})`
    ].join('\n');

    return {
      components: componentSummaries,
      totalComponents: components.length,
      totalEdges: edges.length,
      metrics,
      selectedComponent: selectedContext,
      activeAnalysis: activeAnalysis || null,
      summaryText
    };
  }
}

module.exports = new AiContextService();
