const request = require('supertest');
const app = require('../src/app');
const datasetService = require('../src/services/dataset.service');
const { AiIntentService } = require('../src/services/ai/ai.intent.service');
const aiEntityService = require('../src/services/ai/ai.entity.service');
const aiService = require('../src/services/ai/ai.service');

describe('AI Architecture Copilot Tests', () => {
  beforeAll(() => {
    datasetService.initialize();
  });

  afterAll(() => {
    datasetService.resetEcosystem();
  });

  // ─── 1. ENTITY RESOLUTION ──────────────────────────────────────────────────
  describe('Entity Resolution', () => {
    test('resolves exact component IDs and names', () => {
      const res1 = aiEntityService.resolveComponent('auth-service');
      expect(res1.match).toBeDefined();
      expect(res1.match.id).toBe('auth-service');

      const res2 = aiEntityService.resolveComponent('Order Service');
      expect(res2.match).toBeDefined();
      expect(res2.match.id).toBe('order-service');
    });

    test('resolves partial aliases and case-insensitive queries', () => {
      const res = aiEntityService.resolveComponent('auth');
      expect(res.match).toBeDefined();
      expect(res.match.id).toBe('auth-service');
    });

    test('resolves contextual pronouns when selected component is provided', () => {
      const res = aiEntityService.resolveComponent('this', 'cart-service');
      expect(res.match).toBeDefined();
      expect(res.match.id).toBe('cart-service');
    });

    test('returns unknown entity error for non-existent components', () => {
      const res = aiEntityService.resolveComponent('NonExistentMicroserviceX');
      expect(res.match).toBeNull();
      expect(res.error).toContain('does not exist');
    });
  });

  // ─── 2. INTENT EXTRACTION ──────────────────────────────────────────────────
  describe('Intent Extraction', () => {
    test('extracts SUMMARIZE_ARCHITECTURE intent', async () => {
      const intent = await AiIntentService.extractIntent('Summarize my architecture');
      expect(intent.operation).toBe('SUMMARIZE_ARCHITECTURE');
    });

    test('extracts ANALYZE_FAILURE intent for single component', async () => {
      const intent = await AiIntentService.extractIntent('What happens if Auth Service fails?');
      expect(intent.operation).toBe('ANALYZE_FAILURE');
      expect(intent.targets).toBeDefined();
    });

    test('extracts ANALYZE_FAILURE intent for multi-component outage', async () => {
      const intent = await AiIntentService.extractIntent('What if Auth Service and Payment Service fail?');
      expect(intent.operation).toBe('ANALYZE_FAILURE');
      expect(intent.targets.length).toBe(2);
    });

    test('extracts ANALYZE_CHANGE_IMPACT intent', async () => {
      const intent = await AiIntentService.extractIntent('What happens if I modify Inventory Service?');
      expect(intent.operation).toBe('ANALYZE_CHANGE_IMPACT');
    });

    test('extracts EXPLAIN_PATH intent', async () => {
      const intent = await AiIntentService.extractIntent('Why is Customer Portal affected by Auth Service?');
      expect(intent.operation).toBe('EXPLAIN_PATH');
    });

    test('extracts GET_RISKS intent', async () => {
      const intent = await AiIntentService.extractIntent('What are the biggest architectural risks and single points of failure?');
      expect(intent.operation).toBe('GET_RISKS');
    });

    test('extracts CREATE_COMPONENT intent with dependencies and consumers', async () => {
      const intent = await AiIntentService.extractIntent('Create Notification Service as an API that depends on Auth Service and is consumed by Customer Portal');
      expect(intent.operation).toBe('CREATE_COMPONENT');
      expect(intent.component.name).toContain('Notification Service');
      expect(intent.component.type).toBe('SERVICE');
      expect(intent.component.dependencies).toContain('Auth Service');
      expect(intent.component.consumers).toContain('Customer Portal');
    });

    test('extracts DELETE_COMPONENT intent', async () => {
      const intent = await AiIntentService.extractIntent('Remove Auth Service');
      expect(intent.operation).toBe('DELETE_COMPONENT');
    });

    test('extracts ADD_DEPENDENCY intent', async () => {
      const intent = await AiIntentService.extractIntent('Make Order Service depend on Inventory Service');
      expect(intent.operation).toBe('ADD_DEPENDENCY');
    });
  });

  // ─── 3. AI CHAT API ENDPOINT ───────────────────────────────────────────────
  describe('POST /api/ai/chat', () => {
    test('answers architecture summary with factual metrics', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'Summarize my architecture' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('ANALYSIS_RESULT');
      expect(res.body.data.text).toContain('Architecture Topology Overview');
      expect(res.body.data.analysisData.totalComponents).toBeGreaterThan(0);
    });

    test('simulates outage with exact blast radius calculations', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'What happens if Auth Service fails?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('ANALYSIS_RESULT');
      expect(res.body.data.text).toContain('Outage Blast Radius');
      expect(res.body.data.analysisData.singleResult.metrics.totalAffected).toBeGreaterThan(0);
    });

    test('explains dependency paths accurately without hallucination', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'Why is Customer Portal affected by Auth Service?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('ANALYSIS_RESULT');
      expect(res.body.data.text).toContain('Impact Trace');
      expect(res.body.data.analysisData.hasPath).toBe(true);
    });

    test('identifies single points of failure and risks', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'What are the biggest architectural risks?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('ANALYSIS_RESULT');
      expect(res.body.data.text).toContain('Architecture Risk');
      expect(res.body.data.analysisData.spofCandidates.length).toBeGreaterThan(0);
    });

    test('generates mutation preview for component creation requiring confirmation', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'Create Notification Service as an API depending on Auth Service and consumed by Customer Portal'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('MUTATION_PREVIEW');
      expect(res.body.data.requiresConfirmation).toBe(true);
      expect(res.body.data.proposedChange.action).toBe('CREATE');
      expect(res.body.data.proposedChange.component.name).toBe('Notification Service');
      expect(res.body.data.proposedChange.component.dependencies).toContain('Auth Service');
    });

    test('generates mutation preview with high impact warning for deletion', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'Remove Auth Service' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('MUTATION_PREVIEW');
      expect(res.body.data.requiresConfirmation).toBe(true);
      expect(res.body.data.isDestructive).toBe(true);
      expect(res.body.data.proposedChange.action).toBe('DELETE');
      expect(res.body.data.proposedChange.affectedDownstreamCount).toBeGreaterThan(0);
    });
  });

  // ─── 4. CONFIRMED MUTATION EXECUTION ───────────────────────────────────────
  describe('POST /api/ai/execute', () => {
    test('executes confirmed CREATE mutation and updates graph', async () => {
      const createRes = await request(app)
        .post('/api/ai/execute')
        .send({
          operation: 'CREATE_COMPONENT',
          payload: {
            name: 'Audit Log Service',
            type: 'SERVICE',
            dependencies: ['Auth Service'],
            consumers: ['Customer Portal']
          }
        });

      expect(createRes.status).toBe(200);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.component.name).toBe('Audit Log Service');

      // Verify component exists in live graph
      const getRes = await request(app).get('/api/components/audit-log-service');
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.component.name).toBe('Audit Log Service');
      expect(getRes.body.data.directUpstream.length).toBe(1);
      expect(getRes.body.data.directDownstream.length).toBe(1);

      // Clean up
      await request(app).delete('/api/components/audit-log-service');
    });
  });

  // ─── 5. SUGGESTIONS ENDPOINT ───────────────────────────────────────────────
  describe('GET /api/ai/suggestions', () => {
    test('returns contextual prompt suggestions', async () => {
      const res = await request(app).get('/api/ai/suggestions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('returns component-specific suggestions when selectedComponentId provided', async () => {
      const res = await request(app).get('/api/ai/suggestions?selectedComponentId=auth-service');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const hasAuth = res.body.data.some(s => s.prompt.includes('Auth Service'));
      expect(hasAuth).toBe(true);
    });
  });
});
