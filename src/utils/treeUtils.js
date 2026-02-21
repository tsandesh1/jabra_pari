export function generateId() {
  return crypto.randomUUID();
}

export function createNode({ name, birthDate, deathDate, marriageDate, gender, photoUrl, socialLinks, permanentAddress, currentAddress, education }) {
  return {
    id: generateId(),
    name,
    birthDate: birthDate || null,
    deathDate: deathDate || null,
    marriageDate: marriageDate || null,
    gender: gender || "other",
    photoUrl: photoUrl || null,
    socialLinks: socialLinks || {},
    permanentAddress: permanentAddress || null,
    currentAddress: currentAddress || null,
    education: education || [],
    children: [],
  };
}

function cloneTree(node) {
  return JSON.parse(JSON.stringify(node));
}

export function addChild(tree, parentId, newNode) {
  const newTree = cloneTree(tree);
  const parent = findNode(newTree, parentId);
  if (parent) {
    parent.children.push(newNode);
  }
  return newTree;
}

export function deleteNode(tree, nodeId) {
  if (tree.id === nodeId) return null;
  const newTree = cloneTree(tree);
  removeFromParent(newTree, nodeId);
  return newTree;
}

function removeFromParent(node, nodeId) {
  const idx = node.children.findIndex((c) => c.id === nodeId);
  if (idx !== -1) {
    node.children.splice(idx, 1);
    return true;
  }
  for (const child of node.children) {
    if (removeFromParent(child, nodeId)) return true;
  }
  return false;
}

export function updateNode(tree, nodeId, updates) {
  const newTree = cloneTree(tree);
  const node = findNode(newTree, nodeId);
  if (node) {
    Object.assign(node, updates);
  }
  return newTree;
}

export function findNode(tree, nodeId) {
  if (tree.id === nodeId) return tree;
  for (const child of tree.children) {
    const found = findNode(child, nodeId);
    if (found) return found;
  }
  return null;
}

export function countDescendants(node) {
  let count = 0;
  for (const child of node.children) {
    count += 1 + countDescendants(child);
  }
  return count;
}

export function searchByName(tree, query) {
  const results = [];
  const q = query.toLowerCase();
  function walk(node) {
    if (node.name.toLowerCase().includes(q)) {
      results.push(node.id);
    }
    for (const child of node.children) {
      walk(child);
    }
  }
  walk(tree);
  return results;
}

export function getGeneration(tree, nodeId, depth = 0) {
  if (tree.id === nodeId) return depth;
  for (const child of tree.children) {
    const d = getGeneration(child, nodeId, depth + 1);
    if (d !== -1) return d;
  }
  return -1;
}
