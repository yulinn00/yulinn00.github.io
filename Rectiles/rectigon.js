/* =========================================================
   Polygon finder for an NxN tile grid where each tile draws
   two line segments from its own center to a vertex or an
   edge-midpoint of that same tile.
   ========================================================= */

const SCALE = 2; // work in doubled integer coords: half-steps become integers

function ptKey(p) { return p[0] + ',' + p[1]; }

function cross(o, a, b) {
  return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
}

function shoelaceArea2(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1,y1] = poly[i];
    const [x2,y2] = poly[(i+1)%poly.length];
    s += x1*y2 - x2*y1;
  }
  return s;
}

const CODE_OFFSET = {
  SW:[0,0], SE:[2,0], NW:[0,2], NE:[2,2],
  S:[1,0],  N:[1,2],  W:[0,1],  E:[2,1],
};

function tilePoint(col, row, code) {
  const off = CODE_OFFSET[code];
  if (!off) throw new Error('Unknown endpoint code: ' + code);
  return [col*SCALE + off[0], row*SCALE + off[1]];
}
function tileCenter(col, row) { return [col*SCALE + 1, row*SCALE + 1]; }

// tiles: [{ col, row, ends: [codeA, codeB] }, ...]
function segmentsFromTiles(tiles) {
  const segs = [];
  for (const t of tiles) {
    const c = tileCenter(t.col, t.row);
    const [e1, e2] = t.ends.map(code => tilePoint(t.col, t.row, code));
    if (ptKey(e1) === ptKey(e2)) continue;
    segs.push([c, e1]);
    segs.push([c, e2]);
  }
  return segs;
}

function buildGraph(segments) {
  const nodes = new Map(); // key -> { p, neighbors, order: [keys], sorted by angle }
  function addNode(p) {
    const k = ptKey(p);
    if (!nodes.has(k)) nodes.set(k, { p, neighbors: new Map() });
    return k;
  }
  for (const [a,b] of segments) {
    const ka = addNode(a), kb = addNode(b);
    if (ka === kb) continue;
    nodes.get(ka).neighbors.set(kb, b);
    nodes.get(kb).neighbors.set(ka, a);
  }
  for (const node of nodes.values()) {
    node.order = [...node.neighbors.keys()].sort((k1, k2) => {
      const p1 = nodes.get(k1).p, p2 = nodes.get(k2).p;
      const a1 = Math.atan2(p1[1]-node.p[1], p1[0]-node.p[0]);
      const a2 = Math.atan2(p2[1]-node.p[1], p2[0]-node.p[0]);
      return a1 - a2;
    });
  }
  return nodes;
}

// Standard planar rotation-system face walk. Bounded faces => positive
// signed area; unbounded (outer) face(s) => negative, discarded later.
function traceFaces(nodes) {
  const visited = new Set();
  const faces = [];
  for (const [uk, node] of nodes) {
    for (const vk of node.order) {
      const startKey = uk + '>' + vk;
      if (visited.has(startKey)) continue;
      const facePts = [];
      const faceKeys = [];
      let curU = uk, curV = vk;
      while (true) {
        const edgeKey = curU + '>' + curV;
        if (visited.has(edgeKey)) break;
        visited.add(edgeKey);
        facePts.push(nodes.get(curU).p);
        faceKeys.push(curU);
        const vNode = nodes.get(curV);
        const idx = vNode.order.indexOf(curU);
        const nextK = vNode.order[(idx - 1 + vNode.order.length) % vNode.order.length];
        curU = curV;
        curV = nextK;
      }
      if (facePts.length >= 2) faces.push({ pts: facePts, keys: faceKeys });
    }
  }
  return faces;
}

// Collapse dangling "spikes" (a,b,a) and drop collinear pass-through points
// (cosmetic cleanup — doesn't change the shape, just removes 180° vertices).
function simplifyFace(pts) {
  let poly = pts.map(p => p.slice());

  let shrunk = true;
  while (shrunk && poly.length > 1) {
    shrunk = false;
    for (let i = 0; i < poly.length; i++) {
      const n = poly.length;
      if (n < 3) break;
      const a = poly[i];
      const cIdx = (i+2)%n;
      if (ptKey(a) === ptKey(poly[cIdx])) {
        const bIdx = (i+1)%n;
        const toRemove = new Set([bIdx, cIdx]);
        poly = poly.filter((_, idx) => !toRemove.has(idx));
        shrunk = true;
        break;
      }
    }
  }

  poly = poly.filter((p, i) => i === 0 || ptKey(p) !== ptKey(poly[i-1]));
  if (poly.length > 1 && ptKey(poly[0]) === ptKey(poly[poly.length-1])) poly.pop();

  let again = true;
  while (again && poly.length > 2) {
    again = false;
    const n = poly.length;
    for (let i = 0; i < n; i++) {
      const a = poly[(i-1+n)%n], b = poly[i], c = poly[(i+1)%n];
      if (cross(a, b, c) === 0) {
        poly.splice(i, 1);
        again = true;
        break;
      }
    }
  }
  return poly;
}

// Public API
function findPolygons(tiles) {
  const segments = segmentsFromTiles(tiles);
  const graph = buildGraph(segments);
  const rawFaces = traceFaces(graph);

  const polygons = [];
  for (const { pts: face, keys } of rawFaces) {
    if (shoelaceArea2(face) <= 0) continue; // unbounded / outer face

    // PROVISO: if more than two line segments meet at a point (degree > 2),
    // that point is not considered part of a polygon — any face touching
    // such a junction point is discarded entirely.
    const touchesJunction = keys.some(k => graph.get(k).order.length > 2);
    if (touchesJunction) continue;

    const simplified = simplifyFace(face);
    if (simplified.length < 3) continue;
    if (Math.abs(shoelaceArea2(simplified)) === 0) continue;

    polygons.push(simplified.map(([x,y]) => [x/SCALE, y/SCALE])); // back to real coords
  }
  return polygons;
}

// Area of a single polygon (list of [x,y] points in real tile coordinates),
// via the shoelace formula. Works for any simple polygon, any vertex order.
function polygonArea(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

// Longest simple path through the segment graph, measured by total
// Euclidean length. "At most two lines of the path at any point" is just
// the normal definition of a simple path: the path enters/exits each
// vertex it visits via at most two of the segments meeting there (one
// in, one out — or just one, at the two path endpoints), and never
// revisits a vertex. Any vertex can be a start or end point, and the
// path doesn't need to be closed.
function longestPath(tiles) {
  const segments = segmentsFromTiles(tiles);
  const graph = buildGraph(segments);

  /***
  function dist(kA, kB) {
    const a = graph.get(kA).p, b = graph.get(kB).p;
    const dx = (a[0] - b[0]) / SCALE, dy = (a[1] - b[1]) / SCALE;
    return Math.sqrt(dx * dx + dy * dy);
  }
  ***/
  function dist(kA, kB) {
    const a = graph.get(kA).p, b = graph.get(kB).p;
    const dx = (a[0] - b[0]) / SCALE * 3, dy = (a[1] - b[1]) / SCALE * 4;
    return Math.sqrt(dx * dx + dy * dy);
  }



  let best = { length: 0, keys: [] };

  function dfs(curKey, visited, path, length) {
    if (length > best.length) best = { length, keys: path.slice() };
    const node = graph.get(curKey);
    for (const nbrKey of node.order) {
      if (visited.has(nbrKey)) continue;
      visited.add(nbrKey);
      path.push(nbrKey);
      dfs(nbrKey, visited, path, length + dist(curKey, nbrKey));
      path.pop();
      visited.delete(nbrKey);
    }
  }

  for (const startKey of graph.keys()) {
    dfs(startKey, new Set([startKey]), [startKey], 0);
  }

  return {
    length: best.length,
    path: best.keys.map(k => graph.get(k).p.map(v => v / SCALE)),
  };
}

//module.exports = { findPolygons, segmentsFromTiles, polygonArea, findPolygonsWithArea, longestPath };

