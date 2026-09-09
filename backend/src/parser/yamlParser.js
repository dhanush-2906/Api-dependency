const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Parses a single YAML file safely.
 * @param {string} filePath 
 * @returns {object} { success: boolean, data: object|null, error: string|null, filePath: string, filename: string }
 */
function parseYamlFile(filePath) {
  const filename = path.basename(filePath);
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    if (!fileContent || !fileContent.trim()) {
      return {
        success: false,
        data: null,
        error: `File is empty: ${filename}`,
        filePath,
        filename
      };
    }
    const data = yaml.load(fileContent);
    return {
      success: true,
      data,
      error: null,
      filePath,
      filename
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: `YAML parse error in ${filename}: ${err.message}`,
      filePath,
      filename
    };
  }
}

/**
 * Scans a directory for all .yaml / .yml files and parses them.
 * @param {string} dirPath 
 * @returns {Array<object>} Array of parsed file results
 */
function loadYamlDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Dataset directory not found: ${dirPath}`);
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  return files.map(file => parseYamlFile(path.join(dirPath, file)));
}

module.exports = {
  parseYamlFile,
  loadYamlDirectory
};
