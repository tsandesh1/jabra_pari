import { createPortal } from "react-dom";

function getYearDisplay(node) {
  const birth = node.birthDate ? new Date(node.birthDate + "T00:00:00").getFullYear() : null;
  const death = node.deathDate ? new Date(node.deathDate + "T00:00:00").getFullYear() : null;
  if (!birth && !death) return null;
  const parts = [birth, death || (birth ? "present" : null)].filter(Boolean);
  return parts.join(" \u2013 ");
}

export default function NodeTooltip({ node, position, visible }) {
  if (!visible || !node || !position) return null;

  const years = getYearDisplay(node);
  const childCount = node.children.length;

  return createPortal(
    <div
      className="node-tooltip"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      role="tooltip"
    >
      <div className="node-tooltip-header">
        {node.photoUrl ? (
          <img src={node.photoUrl} alt={node.name} />
        ) : (
          <div className="node-tooltip-initial">{node.name.charAt(0).toUpperCase()}</div>
        )}
        <div>
          <div className="node-tooltip-name">{node.name}</div>
          {years && <div className="node-tooltip-years">{years}</div>}
        </div>
      </div>
      <div className="node-tooltip-meta">
        {childCount} {childCount === 1 ? "child" : "children"}
      </div>
    </div>,
    document.body
  );
}
