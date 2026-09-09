const express = require('express');
const router = express.Router();
const controller = require('../controllers/impact.controller');

router.get('/failure/:id', controller.simulateFailure);
router.get('/change/:id', controller.analyzeChange);
router.post('/failure', controller.simulateFailure);
router.post('/change', controller.analyzeChange);

module.exports = router;
