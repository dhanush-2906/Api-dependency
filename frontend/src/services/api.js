import axios from 'axios';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
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
