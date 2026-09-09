const express = require('express');
const router = express.Router();
const controller = require('../controllers/graph.controller');

router.get('/', controller.getGraph);

module.exports = router;
