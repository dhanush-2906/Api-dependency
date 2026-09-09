const path = require('path');
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  datasetDir: process.env.DATASET_DIR || path.join(__dirname, '../../data'),
  sqliteDbPath: process.env.SQLITE_DB_PATH || path.join(__dirname, '../../data/ecosystem.db'),
  hfToken: process.env.HF_TOKEN || '',
  hfModel: process.env.HF_MODEL || 'meta-llama/Llama-3.3-70B-Instruct',
  hfRouterUrl: process.env.HF_ROUTER_URL || 'https://router.huggingface.co/v1/chat/completions'
};
