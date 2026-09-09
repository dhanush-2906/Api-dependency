const datasetService = require('../services/dataset.service');
const { traverseUpstream, traverseDownstream } = require('../graph/traversal');

function getAllComponents(req, res, next) {
  try {
    const graph = datasetService.getGraph();
    const typeFilter = req.query.type;
    let components = graph.getAllComponents().map(c => c.toJSON());
    
    if (typeFilter) {
      components = components.filter(c => c.type.toUpperCase() === typeFilter.toUpperCase());
    }

    res.json({
      success: true,
      count: components.length,
      data: components
    });
  } catch (err) {
    next(err);
  }
}

function getComponentById(req, res, next) {
  try {
    const { id } = req.params;
    const graph = datasetService.getGraph();
    const component = graph.getComponent(id);

    if (!component) {
      return res.status(404).json({
        success: false,
        error: `Component not found with ID '${id}'`
      });
    }

    const directDownstream = graph.getDirectDownstream(id).map(c => c.toJSON());
    const directUpstream = graph.getDirectUpstream(id).map(c => c.toJSON());
    const downstreamTraversal = traverseDownstream(graph, id);
    const upstreamTraversal = traverseUpstream(graph, id);

    res.json({
      success: true,
      data: {
        component: component.toJSON(),
        directDownstream,
        directUpstream,
        totalDownstreamCount: downstreamTraversal.totalCount,
        totalUpstreamCount: upstreamTraversal.totalCount,
        downstreamReach: downstreamTraversal.all,
        upstreamReach: upstreamTraversal.all
      }
    });
  } catch (err) {
    next(err);
  }
}

function getUpstream(req, res, next) {
  try {
    const { id } = req.params;
    const graph = datasetService.getGraph();
    const traversal = traverseUpstream(graph, id);
    res.json({
      success: true,
      data: traversal
    });
  } catch (err) {
    next(err);
  }
}

function getDownstream(req, res, next) {
  try {
    const { id } = req.params;
    const graph = datasetService.getGraph();
    const traversal = traverseDownstream(graph, id);
    res.json({
      success: true,
      data: traversal
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllComponents,
  getComponentById,
  getUpstream,
  getDownstream
};
