const path = require('path');
const { parseYamlFile, loadYamlDirectory } = require('../src/parser/yamlParser');
const config = require('../src/config');

describe('YAML Parser', () => {
  test('should load and parse all 9 files from dataset directory', () => {
    const results = loadYamlDirectory(config.datasetDir);
    expect(results.length).toBe(9);
    for (const res of results) {
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(typeof res.data.service).toBe('string');
    }
  });

  test('should handle empty file gracefully', () => {
    const emptyPath = path.join(__dirname, 'empty-test.yaml');
    const fs = require('fs');
    fs.writeFileSync(emptyPath, '   ');
    const res = parseYamlFile(emptyPath);
    expect(res.success).toBe(false);
    expect(res.error).toContain('File is empty');
    fs.unlinkSync(emptyPath);
  });

  test('should handle invalid YAML syntax gracefully', () => {
    const malformedPath = path.join(__dirname, 'malformed-test.yaml');
    const fs = require('fs');
    fs.writeFileSync(malformedPath, 'service: [invalid yaml: ::');
    const res = parseYamlFile(malformedPath);
    expect(res.success).toBe(false);
    expect(res.error).toContain('YAML parse error');
    fs.unlinkSync(malformedPath);
  });
});
