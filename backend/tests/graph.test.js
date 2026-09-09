const datasetService = require('../src/services/dataset.service');
const { traverseDownstream, traverseUpstream } = require('../src/graph/traversal');
const { DependencyGraph } = require('../src/graph/graph');
const { Component } = require('../src/models/Component');

describe('Graph Traversal & Cycle Safety', () => {
  beforeAll(() => {
    datasetService.initialize();
  });

  test('should traverse downstream correctly for Product Catalog Service', () => {
    const graph = datasetService.getGraph();
    const result = traverseDownstream(graph, 'product-catalog-service');
    
    // Product Catalog Service consumers: Pricing Service, Inventory Service, Customer Portal
    const directIds = result.direct.map(d => d.component.id);
    expect(directIds).toContain('pricing-service');
    expect(directIds).toContain('inventory-service');
    expect(directIds).toContain('customer-portal');
  });

  test('should traverse upstream correctly for Order Service', () => {
    const graph = datasetService.getGraph();
    const result = traverseUpstream(graph, 'order-service');
    
    const directUpstreamIds = result.direct.map(d => d.component.id);
    expect(directUpstreamIds).toContain('customer-service');
    expect(directUpstreamIds).toContain('inventory-service');
    expect(directUpstreamIds).toContain('pricing-service');
    expect(directUpstreamIds).toContain('payment-service');
  });

  test('should safely terminate on cyclic graphs without infinite recursion', () => {
    const testGraph = new DependencyGraph();
    testGraph.addComponent(new Component({ id: 'a', name: 'Service A' }));
    testGraph.addComponent(new Component({ id: 'b', name: 'Service B' }));
    testGraph.addComponent(new Component({ id: 'c', name: 'Service C' }));
    
    // Create cycle: A -> B -> C -> A
    testGraph.addEdge({ source: 'a', target: 'b' });
    testGraph.addEdge({ source: 'b', target: 'c' });
    testGraph.addEdge({ source: 'c', target: 'a' });

    const downstream = traverseDownstream(testGraph, 'a');
    expect(downstream.totalCount).toBe(2); // b and c
    const upstream = traverseUpstream(testGraph, 'a');
    expect(upstream.totalCount).toBe(2); // c and b
  });
});
