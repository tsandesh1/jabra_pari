import { getNodeImage } from "../utils/avatarUtils";

function getYearDisplay(node) {
  const birth = node.birthDate ? new Date(node.birthDate + "T00:00:00").getFullYear() : null;
  const death = node.deathDate ? new Date(node.deathDate + "T00:00:00").getFullYear() : null;
  if (!birth && !death) return null;
  const parts = [birth, death || (birth ? "present" : null)].filter(Boolean);
  return parts.join(" - ");
}

export default function NodeTooltip({ node, position, visible }) {
  if (!visible || !position || !node) return null;

  const years = getYearDisplay(node);
  const image = getNodeImage(node);

  return (
    <div
      className="node-tooltip"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      role="tooltip"
    >
      <div className="node-tooltip-header">
        <img src={image} alt={node.name} />
        <div>
          <div className="node-tooltip-name">{node.name}</div>
          {years && <div className="node-tooltip-years">{years}</div>}
        </div>
      </div>
      <div className="node-tooltip-meta">{node.children.length} direct child(ren)</div>
    </div>
  );
}
