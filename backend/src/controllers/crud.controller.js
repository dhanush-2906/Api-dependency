/**
 * CRUD Controller — Ecosystem Management
 * Handles POST, PUT, DELETE for /api/components
 * and GET /api/components/:id (full details already in component.controller.js)
 */

const datasetService = require('../services/dataset.service');
const { toComponentId } = require('../models/Component');
const { traverseUpstream, traverseDownstream } = require('../graph/traversal');

// ─── Validation Helpers ────────────────────────────────────────────────────

const VALID_TYPES = ['SERVICE', 'APPLICATION', 'DATABASE', 'EXTERNAL'];

function validateComponentPayload(body, requireName = true) {
  const errors = [];

  if (requireName) {
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      errors.push('Field "name" is required and must be a non-empty string.');
    }
  }

  if (body.type !== undefined && !VALID_TYPES.includes(body.type)) {
    errors.push(`Field "type" must be one of: ${VALID_TYPES.join(', ')}.`);
  }

  if (body.dependencies !== undefined && !Array.isArray(body.dependencies)) {
    errors.push('Field "dependencies" must be an array of component names.');
  }

  if (body.consumers !== undefined && !Array.isArray(body.consumers)) {
    errors.push('Field "consumers" must be an array of component names.');
  }

  return errors;
}

// ─── Handlers ─────────────────────────────────────────────────────────────

function createComponent(req, res, next) {
  try {
    const errors = validateComponentPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const comp = datasetService.createComponent({
      name: req.body.name.trim(),
      type: (req.body.type || 'SERVICE').toUpperCase(),
      dependencies: req.body.dependencies || [],
      consumers: req.body.consumers || []
    });

    if (!comp) {
      return res.status(500).json({ success: false, error: 'Failed to create component.' });
    }

    // Return full details after rebuild
    const graph = datasetService.getGraph();
    const id = comp.id;
    const directDownstream = graph.getDirectDownstream(id).map(c => c.toJSON());
    const directUpstream = graph.getDirectUpstream(id).map(c => c.toJSON());
    const downstreamTraversal = traverseDownstream(graph, id);
    const upstreamTraversal = traverseUpstream(graph, id);

    return res.status(201).json({
      success: true,
      data: {
        component: { ...comp, isUserCreated: true },
        directDownstream,
        directUpstream,
        totalDownstreamCount: downstreamTraversal.totalCount,
        totalUpstreamCount: upstreamTraversal.totalCount,
        downstreamReach: downstreamTraversal.all,
        upstreamReach: upstreamTraversal.all
      }
    });
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({ success: false, error: err.message });
    }
    next(err);
  }
}

function updateComponent(req, res, next) {
  try {
    const { id } = req.params;
    const errors = validateComponentPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const patch = {};
    if (req.body.type !== undefined) patch.type = req.body.type.toUpperCase();
    if (req.body.dependencies !== undefined) patch.dependencies = req.body.dependencies;
    if (req.body.consumers !== undefined) patch.consumers = req.body.consumers;
    // name is allowed only for user-created components
    if (req.body.name !== undefined) patch.name = req.body.name.trim();

    const comp = datasetService.updateComponent(id, patch);
    if (!comp) {
      return res.status(404).json({ success: false, error: `Component not found: ${id}` });
    }

    const graph = datasetService.getGraph();
    const directDownstream = graph.getDirectDownstream(comp.id).map(c => c.toJSON());
    const directUpstream = graph.getDirectUpstream(comp.id).map(c => c.toJSON());
    const downstreamTraversal = traverseDownstream(graph, comp.id);
    const upstreamTraversal = traverseUpstream(graph, comp.id);
    const isUserCreated = datasetService.isUserCreated(comp.id);

    return res.json({
      success: true,
      data: {
        component: { ...comp, isUserCreated },
        directDownstream,
        directUpstream,
        totalDownstreamCount: downstreamTraversal.totalCount,
        totalUpstreamCount: upstreamTraversal.totalCount,
        downstreamReach: downstreamTraversal.all,
        upstreamReach: upstreamTraversal.all
      }
    });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ success: false, error: err.message });
    }
    next(err);
  }
}

function deleteComponent(req, res, next) {
  try {
    const { id } = req.params;
    const result = datasetService.deleteComponent(id);
    return res.json({ success: true, data: result });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ success: false, error: err.message });
    }
    next(err);
  }
}

function resetEcosystem(req, res, next) {
  try {
    const summary = datasetService.resetEcosystem();
    return res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createComponent,
  updateComponent,
  deleteComponent,
  resetEcosystem
};
