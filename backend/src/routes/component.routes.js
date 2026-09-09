const express = require('express');
const router = express.Router();
const controller = require('../controllers/component.controller');

router.get('/', controller.getAllComponents);
router.get('/:id', controller.getComponentById);
router.get('/:id/upstream', controller.getUpstream);
router.get('/:id/downstream', controller.getDownstream);

module.exports = router;
