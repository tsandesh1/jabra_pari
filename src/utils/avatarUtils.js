function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getPlaceholderImage(node) {
  const seed = node.id || node.name || "family-node";
  const imageIndex = (hashString(seed) % 70) + 1;
  return `https://i.pravatar.cc/160?img=${imageIndex}`;
}

export function getNodeImage(node) {
  return node.photoUrl || getPlaceholderImage(node);
}
