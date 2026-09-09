const impactService = require('../services/impact.service');

function simulateFailure(req, res, next) {
  try {
    const id = req.params.id || req.body.id || req.body.componentId;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required component ID'
      });
    }

    const result = impactService.simulateFailure(id);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

function analyzeChange(req, res, next) {
  try {
    const id = req.params.id || req.body.id || req.body.componentId;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required component ID'
      });
    }

    const result = impactService.analyzeChangeImpact(id);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  simulateFailure,
  analyzeChange
};
