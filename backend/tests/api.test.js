const request = require('supertest');
const app = require('../src/app');
const datasetService = require('../src/services/dataset.service');
const ecosystemStore = require('../src/services/ecosystemStore');

describe('API Integration Tests', () => {
  beforeAll(() => {
    ecosystemStore.reset();
    datasetService.initialize();
  });

  test('GET /api/health should return 200 and UP status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  test('GET /api/components should return all graph components', async () => {
    const res = await request(app).get('/api/components');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(datasetService.getGraph().getAllComponents().length);
  });

  test('GET /api/graph should return nodes and edges', async () => {
    const res = await request(app).get('/api/graph');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nodes.length).toBe(datasetService.getGraph().getAllComponents().length);
    expect(res.body.data.edges.length).toBeGreaterThan(10);
  });

  test('GET /api/impact/failure/:id should simulate outage', async () => {
    const res = await request(app).get('/api/impact/failure/inventory-service');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rootComponent.id).toBe('inventory-service');
    expect(res.body.data.directImpact.length).toBeGreaterThan(0);
  });

  test('POST /api/analysis/change should simulate change impact', async () => {
    const res = await request(app)
      .post('/api/analysis/change')
      .send({ componentId: 'pricing-service' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rootComponent.id).toBe('pricing-service');
  });

  test('GET /api/metrics should return dynamic metrics', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalComponents).toBe(datasetService.getGraph().getAllComponents().length);
    expect(res.body.data.mostConnectedService).toBeDefined();
  });

  test('GET /api/validation should return dataset validation status', async () => {
    const res = await request(app).get('/api/validation');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
  });
});
