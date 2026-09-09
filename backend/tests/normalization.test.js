const { normalizeDataset } = require('../src/graph/normalization');
const { ComponentType } = require('../src/models/ComponentType');

describe('Normalization & Graph Semantics', () => {
  test('should invert dependency into Provider -> Consumer', () => {
    const records = [
      {
        serviceName: 'Order Service',
        type: 'API',
        dependencies: ['Inventory Service'],
        consumers: [],
        filename: 'order-service.yaml'
      }
    ];

    const result = normalizeDataset(records);
    expect(result.edges.length).toBe(1);
    expect(result.edges[0].source).toBe('inventory-service');
    expect(result.edges[0].target).toBe('order-service');
  });

  test('should direct consumer into Provider -> Consumer', () => {
    const records = [
      {
        serviceName: 'Inventory Service',
        type: 'API',
        dependencies: [],
        consumers: ['Order Service'],
        filename: 'inventory-service.yaml'
      }
    ];

    const result = normalizeDataset(records);
    expect(result.edges.length).toBe(1);
    expect(result.edges[0].source).toBe('inventory-service');
    expect(result.edges[0].target).toBe('order-service');
  });

  test('should deduplicate bidirectional declarations into single canonical edge', () => {
    const records = [
      {
        serviceName: 'Order Service',
        type: 'API',
        dependencies: ['Inventory Service'],
        consumers: [],
        filename: 'order-service.yaml'
      },
      {
        serviceName: 'Inventory Service',
        type: 'API',
        dependencies: [],
        consumers: ['Order Service'],
        filename: 'inventory-service.yaml'
      }
    ];

    const result = normalizeDataset(records);
    expect(result.edges.length).toBe(1);
    expect(result.edges[0].source).toBe('inventory-service');
    expect(result.edges[0].target).toBe('order-service');
    expect(result.edges[0].origins).toContain('dependency');
    expect(result.edges[0].origins).toContain('consumer');
  });

  test('should correctly classify component types from names', () => {
    const records = [
      {
        serviceName: 'Customer Service',
        type: 'API',
        dependencies: ['Customer DB'],
        consumers: ['Customer Portal'],
        filename: 'customer-service.yaml'
      }
    ];

    const result = normalizeDataset(records);
    const dbComp = result.components.find(c => c.id === 'customer-db');
    const portalComp = result.components.find(c => c.id === 'customer-portal');

    expect(dbComp.type).toBe(ComponentType.DATABASE);
    expect(portalComp.type).toBe(ComponentType.APPLICATION);
  });
});
