/**
 * Impact Path Finder.
 * Computes human-readable and structured paths from root to reachable downstream targets.
 */

/**
 * Finds all simple directed paths from startId to targetId (up to maxPaths)
 */
function findPathsBetween(graph, startId, targetId, maxPaths = 10) {
  const paths = [];

  function dfs(currentId, currentPath, visited) {
    if (paths.length >= maxPaths) return;
    if (currentId === targetId) {
      paths.push([...currentPath]);
      return;
    }

    const neighbors = graph.forwardAdjacency.get(currentId) || new Set();
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        currentPath.push(neighborId);
        dfs(neighborId, currentPath, visited);
        currentPath.pop();
        visited.delete(neighborId);
      }
    }
  }

  dfs(startId, [startId], new Set([startId]));
  return paths;
}

/**
 * Generates all downstream impact paths from rootId to every reachable node.
 * @param {DependencyGraph} graph 
 * @param {string} rootId 
 * @returns {Array<object>} Array of path objects with node IDs, names, and formatted string
 */
function generateImpactPaths(graph, rootId) {
  const root = graph.getComponent(rootId);
  if (!root) return [];

  const allPaths = [];
  const visited = new Set([rootId]);

  function dfs(currentId, currentPath) {
    const neighbors = graph.forwardAdjacency.get(currentId) || new Set();
    
    // If leaf or has children, record the path if length > 1
    if (currentPath.length > 1) {
      const names = currentPath.map(id => {
        const comp = graph.getComponent(id);
        return comp ? comp.name : id;
      });
      allPaths.push({
        nodeIds: [...currentPath],
        nodeNames: names,
        pathString: names.join(' ? '),
        targetId: currentId,
        length: currentPath.length - 1
      });
    }

    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        currentPath.push(neighborId);
        dfs(neighborId, currentPath);
        currentPath.pop();
        visited.delete(neighborId);
      }
    }
  }

  dfs(rootId, [rootId]);
  return allPaths;
}

module.exports = {
  findPathsBetween,
  generateImpactPaths
};
