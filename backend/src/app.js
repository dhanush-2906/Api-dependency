const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health.routes');
const componentRoutes = require('./routes/component.routes');
const graphRoutes = require('./routes/graph.routes');
const impactRoutes = require('./routes/impact.routes');
const analysisRoutes = require('./routes/analysis.routes');
const metricsRoutes = require('./routes/metrics.routes');
const validationRoutes = require('./routes/validation.routes');
const aiRoutes = require('./routes/ai.routes');

const datasetService = require('./services/dataset.service');

// Initialize dataset into memory
datasetService.initialize();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/ai', aiRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
