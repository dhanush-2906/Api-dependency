/**
 * SQLite Persistence Integration Tests
 * Verifies that mutations are stored in SQLite and survive server/connection restart.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const request = require('supertest');
const app = require('../src/app');
const datasetService = require('../src/services/dataset.service');
const ecosystemStore = require('../src/services/ecosystemStore');
const { getDatabase, closeDatabase, initDatabase } = require('../src/database/sqlite');

describe('SQLite Persistence Layer Tests', () => {
  beforeEach(() => {
    datasetService.initialize();
    ecosystemStore.reset();
    datasetService.rebuild();
  });

  afterAll(() => {
    ecosystemStore.reset();
    datasetService.rebuild();
  });

  test('SQLite database and tables should exist', () => {
    const db = getDatabase();
    expect(db).toBeDefined();

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    expect(tables).toContain('user_components');
    expect(tables).toContain('seed_component_updates');
    expect(tables).toContain('deleted_seed_components');
  });

  test('Adding a component should persist in SQLite user_components table', () => {
    ecosystemStore.addComponent({
      _id: 'test-billing-service',
      name: 'Test Billing Service',
      type: 'SERVICE',
      dependencies: ['auth-service'],
      consumers: ['customer-portal']
    });

    const state = ecosystemStore.getState();
    expect(state.components.some(c => c._id === 'test-billing-service')).toBe(true);

    // Direct SQLite verification
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM user_components WHERE id = ?').get('test-billing-service');
    expect(row).toBeDefined();
    expect(row.name).toBe('Test Billing Service');
    expect(JSON.parse(row.dependencies)).toContain('auth-service');
    expect(JSON.parse(row.consumers)).toContain('customer-portal');
  });

  test('Updating a seed component should persist in SQLite seed_component_updates table', () => {
    ecosystemStore.updateComponent('cart-service', {
      type: 'APPLICATION',
      dependencies: ['auth-service', 'inventory-service']
    });

    const state = ecosystemStore.getState();
    expect(state.updates['cart-service']).toBeDefined();
    expect(state.updates['cart-service'].type).toBe('APPLICATION');
    expect(state.updates['cart-service'].dependencies).toContain('auth-service');

    // Direct SQLite verification
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM seed_component_updates WHERE id = ?').get('cart-service');
    expect(row).toBeDefined();
    expect(row.type).toBe('APPLICATION');
    expect(JSON.parse(row.dependencies)).toContain('auth-service');
  });

  test('Deleting a seed component should persist in SQLite deleted_seed_components table', () => {
    ecosystemStore.deleteComponent('invoice-service');

    const state = ecosystemStore.getState();
    expect(state.deletedIds).toContain('invoice-service');

    // Direct SQLite verification
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM deleted_seed_components WHERE id = ?').get('invoice-service');
    expect(row).toBeDefined();
    expect(row.id).toBe('invoice-service');
  });

  test('Resetting ecosystem should wipe all SQLite mutation tables and restore seed baseline', () => {
    // Add mutations
    ecosystemStore.addComponent({
      _id: 'temp-service',
      name: 'Temp Service',
      type: 'SERVICE',
      dependencies: [],
      consumers: []
    });
    ecosystemStore.updateComponent('order-service', { type: 'APPLICATION' });
    ecosystemStore.deleteComponent('cart-service');

    // Reset
    ecosystemStore.reset();
    const state = ecosystemStore.getState();
    expect(state.components.length).toBe(0);
    expect(Object.keys(state.updates).length).toBe(0);
    expect(state.deletedIds.length).toBe(0);

    // Direct SQLite check
    const db = getDatabase();
    const countUsers = db.prepare('SELECT COUNT(*) as c FROM user_components').get().c;
    const countUpdates = db.prepare('SELECT COUNT(*) as c FROM seed_component_updates').get().c;
    const countDeleted = db.prepare('SELECT COUNT(*) as c FROM deleted_seed_components').get().c;

    expect(countUsers).toBe(0);
    expect(countUpdates).toBe(0);
    expect(countDeleted).toBe(0);
  });

  test('Mutations should survive database connection close and reopen (simulated restart)', () => {
    // 1. Add component
    ecosystemStore.addComponent({
      _id: 'persistent-service',
      name: 'Persistent Service',
      type: 'SERVICE',
      dependencies: ['auth-service'],
      consumers: []
    });

    // 2. Simulate complete restart by closing connection
    const currentDbPath = getDatabase().name;
    closeDatabase();

    // 3. Re-open connection
    const newDb = initDatabase(currentDbPath);
    expect(newDb).toBeDefined();

    // 4. Verify data survived restart
    const state = ecosystemStore.getState();
    const found = state.components.find(c => c._id === 'persistent-service');
    expect(found).toBeDefined();
    expect(found.name).toBe('Persistent Service');

    // Cleanup
    ecosystemStore.deleteComponent('persistent-service');
  });

  test('REST API CRUD operations should persist in SQLite and update canonical graph', async () => {
    // POST /api/components
    const createRes = await request(app)
      .post('/api/components')
      .send({
        name: 'Telemetry Service',
        type: 'SERVICE',
        dependencies: ['Auth Service'],
        consumers: ['Customer Portal']
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);

    // Verify in GET /api/components
    const listRes = await request(app).get('/api/components');
    const compInList = listRes.body.data.find(c => c.id === 'telemetry-service');
    expect(compInList).toBeDefined();

    // Verify in GET /api/graph
    const graphRes = await request(app).get('/api/graph');
    const nodeInGraph = graphRes.body.data.nodes.find(n => n.id === 'telemetry-service');
    expect(nodeInGraph).toBeDefined();

    // Cleanup via DELETE
    const delRes = await request(app).delete('/api/components/telemetry-service');
    expect(delRes.status).toBe(200);
  });
});
