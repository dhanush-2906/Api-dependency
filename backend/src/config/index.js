const path = require('path');
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  datasetDir: process.env.DATASET_DIR || path.join(__dirname, '../../data')
};
