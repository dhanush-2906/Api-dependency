const express = require('express');
const router = express.Router();
const controller = require('../controllers/metrics.controller');

router.get('/', controller.getMetrics);

module.exports = router;
