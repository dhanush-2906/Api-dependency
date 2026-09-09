const metricsService = require('../services/metrics.service');

function getMetrics(req, res, next) {
  try {
    const metrics = metricsService.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMetrics
};
