const datasetService = require('../services/dataset.service');

function getGraph(req, res, next) {
  try {
    const graph = datasetService.getGraph();
    res.json({
      success: true,
      data: graph.toJSON()
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getGraph
};
