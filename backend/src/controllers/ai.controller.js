/**
 * AI Copilot Express Controller
 * Handles /api/ai/chat, /api/ai/execute, and /api/ai/suggestions
 */

const aiService = require('../services/ai/ai.service');

async function handleChat(req, res, next) {
  try {
    const { message, history, selectedComponentId, activeAnalysis } = req.body;
    const response = await aiService.processChat({
      message,
      history,
      selectedComponentId,
      activeAnalysis
    });

    res.json({
      success: true,
      data: response
    });
  } catch (err) {
    next(err);
  }
}

async function handleExecute(req, res, next) {
  try {
    const { operation, payload } = req.body;
    if (!operation || !payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: operation and payload.'
      });
    }

    const result = aiService.executeMutation({ operation, payload });
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function handleSuggestions(req, res, next) {
  try {
    const { selectedComponentId } = req.query;
    const suggestions = aiService.getSuggestions(selectedComponentId);
    res.json({
      success: true,
      data: suggestions
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleChat,
  handleExecute,
  handleSuggestions
};
