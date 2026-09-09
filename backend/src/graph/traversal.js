/**
 * Graph Traversal Algorithms.
 * 
 * Key Principles:
 * - Uses BFS with a visited Set to ensure cycle termination.
 * - Distance tracking allows clear separation into direct (distance === 1) and indirect (distance > 1).
 */

/**
 * Traverses downstream from the given startId (following forwardAdjacency: Provider -> Consumer).
 * @param {DependencyGraph} graph 
 * @param {string} startId 
 * @returns {object} { root, direct: [], indirect: [], all: [], distances: Object }
 */
function traverseDownstream(graph, startId) {
  const root = graph.getComponent(startId);
  if (!root) {
    throw new Error(`Component not found: ${startId}`);
  }

  const visited = new Set([startId]);
  const queue = [{ id: startId, distance: 0 }];
  const direct = [];
  const indirect = [];
  const all = [];
  const distances = { [startId]: 0 };

  while (queue.length > 0) {
    const { id: currentId, distance: currentDist } = queue.shift();

    const forwardNeighbors = graph.forwardAdjacency.get(currentId) || new Set();
    for (const neighborId of forwardNeighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        const dist = currentDist + 1;
        distances[neighborId] = dist;

        const neighborComp = graph.getComponent(neighborId);
        if (neighborComp) {
          const item = {
            component: neighborComp.toJSON(),
            distance: dist
          };
          all.push(item);

          if (dist === 1) {
            direct.push(item);
          } else {
            indirect.push(item);
          }
        }

        queue.push({ id: neighborId, distance: dist });
      }
    }
  }

  return {
    root: root.toJSON(),
    direct,
    indirect,
    all,
    totalCount: all.length,
    distances
  };
}

/**
 * Traverses upstream from the given startId (following reverseAdjacency: Consumer -> Provider).
 * @param {DependencyGraph} graph 
 * @param {string} startId 
 * @returns {object} { root, direct: [], indirect: [], all: [], distances: Object }
 */
function traverseUpstream(graph, startId) {
  const root = graph.getComponent(startId);
  if (!root) {
    throw new Error(`Component not found: ${startId}`);
  }

  const visited = new Set([startId]);
  const queue = [{ id: startId, distance: 0 }];
  const direct = [];
  const indirect = [];
  const all = [];
  const distances = { [startId]: 0 };

  while (queue.length > 0) {
    const { id: currentId, distance: currentDist } = queue.shift();

    const reverseNeighbors = graph.reverseAdjacency.get(currentId) || new Set();
    for (const neighborId of reverseNeighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        const dist = currentDist + 1;
        distances[neighborId] = dist;

        const neighborComp = graph.getComponent(neighborId);
        if (neighborComp) {
          const item = {
            component: neighborComp.toJSON(),
            distance: dist
          };
          all.push(item);

          if (dist === 1) {
            direct.push(item);
          } else {
            indirect.push(item);
          }
        }

        queue.push({ id: neighborId, distance: dist });
      }
    }
  }

  return {
    root: root.toJSON(),
    direct,
    indirect,
    all,
    totalCount: all.length,
    distances
  };
}

module.exports = {
  traverseDownstream,
  traverseUpstream
};
