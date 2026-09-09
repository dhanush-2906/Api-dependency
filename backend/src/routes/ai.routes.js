/**
 * AI Copilot Routes
 * Mounted at /api/ai
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/ai.controller');

router.post('/chat', controller.handleChat);
router.post('/execute', controller.handleExecute);
router.get('/suggestions', controller.handleSuggestions);

module.exports = router;
