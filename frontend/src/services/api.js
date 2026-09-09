import axios from 'axios';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getHealth = async () => {
  const res = await client.get('/health');
  return res.data;
};

export const getComponents = async (type = null) => {
  const res = await client.get('/components', {
    params: type && type !== 'ALL' ? { type } : {}
  });
  return res.data.data;
};

export const getComponentById = async (id) => {
  const res = await client.get(`/components/${id}`);
  return res.data.data;
};

export const getGraphData = async () => {
  const res = await client.get('/graph');
  return res.data.data;
};

export const getMetrics = async () => {
  const res = await client.get('/metrics');
  return res.data.data;
};

export const getValidationReport = async () => {
  const res = await client.get('/validation');
  return res.data.data;
};

export const simulateFailure = async (componentId) => {
  const res = await client.get(`/impact/failure/${componentId}`);
  return res.data.data;
};

export const analyzeChangeImpact = async (componentId) => {
  const res = await client.get(`/impact/change/${componentId}`);
  return res.data.data;
};

// ─── Ecosystem Management CRUD ──────────────────────────────────────────────

export const createComponent = async (data) => {
  const res = await client.post('/components', data);
  return res.data.data;
};

export const updateComponent = async (id, data) => {
  const res = await client.put(`/components/${id}`, data);
  return res.data.data;
};

export const deleteComponent = async (id) => {
  const res = await client.delete(`/components/${id}`);
  return res.data;
};

export const resetEcosystem = async () => {
  const res = await client.post('/components/reset');
  return res.data.data;
};

// ─── AI Architecture Copilot ─────────────────────────────────────────────────

export const sendAiChat = async ({ message, history = [], selectedComponentId = null, activeAnalysis = null }) => {
  const res = await client.post('/ai/chat', {
    message,
    history,
    selectedComponentId,
    activeAnalysis
  });
  return res.data.data;
};

export const executeAiMutation = async ({ operation, payload }) => {
  const res = await client.post('/ai/execute', {
    operation,
    payload
  });
  return res.data.data;
};

export const getAiSuggestions = async (selectedComponentId = null) => {
  const res = await client.get('/ai/suggestions', {
    params: selectedComponentId ? { selectedComponentId } : {}
  });
  return res.data.data;
};
