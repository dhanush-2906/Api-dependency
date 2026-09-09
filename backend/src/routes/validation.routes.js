const express = require('express');
const router = express.Router();
const controller = require('../controllers/validation.controller');

router.get('/', controller.getValidation);
router.post('/reload', controller.reloadDataset);

module.exports = router;
