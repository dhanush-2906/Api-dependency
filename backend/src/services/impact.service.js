const datasetService = require('./dataset.service');
const { traverseDownstream } = require('../graph/traversal');
const { generateImpactPaths } = require('../graph/pathFinder');
const { ComponentType } = require('../models/ComponentType');

class ImpactService {
  /**
   * Simulates an outage/failure of a given component.
   * Traverses DOWNSTREAM to identify all directly and indirectly affected systems.
   */
  simulateFailure(componentId) {
    const graph = datasetService.getGraph();
    const component = graph.getComponent(componentId);
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found.`);
    }

    const traversal = traverseDownstream(graph, componentId);
    const paths = generateImpactPaths(graph, componentId);

    const affectedApplications = traversal.all
      .filter(item => item.component.type === ComponentType.APPLICATION)
      .map(item => item.component);

    const affectedServices = traversal.all
      .filter(item => item.component.type === ComponentType.SERVICE)
      .map(item => item.component);

    const affectedDatabases = traversal.all
      .filter(item => item.component.type === ComponentType.DATABASE)
      .map(item => item.component);

    const affectedExternal = traversal.all
      .filter(item => item.component.type === ComponentType.EXTERNAL)
      .map(item => item.component);

    const totalNodes = graph.getAllComponents().length;
    const blastRadiusPercent = totalNodes > 1 ? Math.round((traversal.totalCount / (totalNodes - 1)) * 100) : 0;

    return {
      mode: 'FAILURE_SIMULATION',
      rootComponent: component.toJSON(),
      directImpact: traversal.direct,
      indirectImpact: traversal.indirect,
      allImpacted: traversal.all,
      affectedApplications,
      affectedServices,
      affectedDatabases,
      affectedExternal,
      impactPaths: paths,
      metrics: {
        directCount: traversal.direct.length,
        indirectCount: traversal.indirect.length,
        totalAffected: traversal.totalCount,
        affectedApplicationsCount: affectedApplications.length,
        blastRadiusPercent
      }
    };
  }

  /**
   * Analyzes the change impact of modifying a given component.
   * Traverses DOWNSTREAM to identify dependent consumers requiring testing/consideration.
   */
  analyzeChangeImpact(componentId) {
    const graph = datasetService.getGraph();
    const component = graph.getComponent(componentId);
    if (!component) {
      throw new Error(`Component with ID '${componentId}' not found.`);
    }

    const traversal = traverseDownstream(graph, componentId);
    const paths = generateImpactPaths(graph, componentId);

    const affectedApplications = traversal.all
      .filter(item => item.component.type === ComponentType.APPLICATION)
      .map(item => item.component);

    const affectedServices = traversal.all
      .filter(item => item.component.type === ComponentType.SERVICE)
      .map(item => item.component);

    return {
      mode: 'CHANGE_IMPACT_ANALYSIS',
      rootComponent: component.toJSON(),
      directImpact: traversal.direct,
      indirectImpact: traversal.indirect,
      allImpacted: traversal.all,
      affectedApplications,
      affectedServices,
      impactPaths: paths,
      metrics: {
        directDependentCount: traversal.direct.length,
        indirectDependentCount: traversal.indirect.length,
        totalDependentCount: traversal.totalCount,
        affectedApplicationsCount: affectedApplications.length
      }
    };
  }
}

module.exports = new ImpactService();
