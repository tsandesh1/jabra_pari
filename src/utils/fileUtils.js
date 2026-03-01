export function exportTree(tree) {
  const json = JSON.stringify(tree, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "family-tree.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function validateNode(node) {
  if (!node || typeof node !== "object") return false;
  if (typeof node.id !== "string" || typeof node.name !== "string") return false;
  if (node.spouse != null) {
    if (typeof node.spouse !== "object") return false;
    if (typeof node.spouse.name !== "string" || node.spouse.name.trim() === "") return false;
    if (typeof node.spouse.gender !== "string") return false;
  }
  if (!Array.isArray(node.children)) return false;
  return node.children.every(validateNode);
}

export function importTree(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const tree = JSON.parse(e.target.result);
        if (!validateNode(tree)) {
          reject(new Error("Invalid family tree structure"));
          return;
        }
        resolve(tree);
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
