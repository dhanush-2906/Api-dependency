const datasetService = require('../src/services/dataset.service');
const ecosystemStore = require('../src/services/ecosystemStore');
const impactService = require('../src/services/impact.service');
const metricsService = require('../src/services/metrics.service');

describe('Impact and Metrics Analysis', () => {
  beforeAll(() => {
    ecosystemStore.reset();
    datasetService.initialize();
  });

  test('Failure simulation of Auth Service should propagate downstream only', () => {
    const impact = impactService.simulateFailure('auth-service');
    expect(impact.mode).toBe('FAILURE_SIMULATION');
    expect(impact.rootComponent.id).toBe('auth-service');
    expect(impact.metrics.totalAffected).toBeGreaterThan(0);

    const affectedIds = impact.allImpacted.map(item => item.component.id);
    expect(affectedIds).toContain('customer-service');
    expect(affectedIds).toContain('payment-service');
    expect(affectedIds).toContain('order-service');
    expect(affectedIds).not.toContain('auth-service');
  });

  test('Change impact analysis of Inventory Service should identify direct and indirect dependents', () => {
    const impact = impactService.analyzeChangeImpact('inventory-service');
    expect(impact.mode).toBe('CHANGE_IMPACT_ANALYSIS');
    expect(impact.rootComponent.id).toBe('inventory-service');

    const directIds = impact.directImpact.map(d => d.component.id);
    expect(directIds).toContain('cart-service');
    expect(directIds).toContain('order-service');

    const indirectIds = impact.indirectImpact.map(d => d.component.id);
    expect(indirectIds).toContain('customer-portal');
    expect(indirectIds).toContain('invoice-service');
  });

  test('Metrics should calculate total component breakdown accurately from graph', () => {
    const graph = datasetService.getGraph();
    const metrics = metricsService.getMetrics();
    expect(metrics.totalComponents).toBe(graph.getAllComponents().length);
    expect(metrics.totalServices).toBe(9);
    expect(metrics.totalDatabases).toBe(2);
    expect(metrics.totalExternalSystems).toBe(1);
    expect(metrics.mostConnectedService).toBeDefined();
    expect(metrics.criticalServiceCandidate).toBeDefined();
    expect(metrics.largestBlastRadiusCandidate).toBeDefined();
  });
});
