import { useState } from "react";

export default function TreeNode({
  node,
  highlightIds,
  onAddChild,
  onEdit,
  onDelete,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.children.length > 0;
  const isHighlighted = highlightIds.has(node.id);

  const years = [
    node.birthYear,
    node.deathYear ? node.deathYear : node.birthYear ? "present" : null,
  ]
    .filter(Boolean)
    .join(" – ");

  return (
    <div className="tree-node-wrapper">
      <div
        className={`tree-node gender-${node.gender}${isHighlighted ? " highlighted" : ""}`}
        data-node-id={node.id}
      >
        <div className="node-name" onClick={() => onEdit(node)}>
          {node.name}
        </div>
        {years && <div className="node-years">{years}</div>}
        <div className="node-actions">
          <button
            className="node-btn"
            title="Add child"
            onClick={() => onAddChild(node.id)}
          >
            +
          </button>
          <button
            className="node-btn node-btn-delete"
            title="Delete"
            onClick={() => onDelete(node)}
          >
            &times;
          </button>
          {hasChildren && (
            <button
              className="node-btn"
              title={collapsed ? "Expand" : "Collapse"}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? "▶" : "▼"}
            </button>
          )}
        </div>
      </div>
      {hasChildren && !collapsed && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              highlightIds={highlightIds}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
