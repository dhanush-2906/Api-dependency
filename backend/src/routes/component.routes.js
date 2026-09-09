const express = require('express');
const router = express.Router();
const controller = require('../controllers/component.controller');
const crudController = require('../controllers/crud.controller');

router.get('/', controller.getAllComponents);

// CRUD mutation routes
router.post('/', crudController.createComponent);
router.post('/reset', crudController.resetEcosystem);
router.put('/:id', crudController.updateComponent);
router.delete('/:id', crudController.deleteComponent);

// Read-only detail routes
router.get('/:id', controller.getComponentById);
router.get('/:id/upstream', controller.getUpstream);
router.get('/:id/downstream', controller.getDownstream);

module.exports = router;
