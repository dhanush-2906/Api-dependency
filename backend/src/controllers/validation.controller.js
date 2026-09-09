const datasetService = require('../services/dataset.service');

function getValidation(req, res, next) {
  try {
    const report = datasetService.getValidationReport();
    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
}

function reloadDataset(req, res, next) {
  try {
    const summary = datasetService.initialize();
    res.json({
      success: true,
      message: 'Dataset reloaded successfully',
      data: summary
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getValidation,
  reloadDataset
};
