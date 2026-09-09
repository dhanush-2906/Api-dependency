const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'API Dependency Visualizer & Change Impact Analyzer'
  });
});

module.exports = router;
