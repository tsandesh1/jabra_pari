import { Handle, Position } from "reactflow";
import { getNodeImage } from "../utils/avatarUtils";

const SOCIAL_ICONS = {
  facebook: { label: "Facebook", icon: "f", color: "#1877f2" },
  twitter: { label: "X", icon: "x", color: "#000" },
  instagram: { label: "Instagram", icon: "ig", color: "#e4405f" },
  linkedin: { label: "LinkedIn", icon: "in", color: "#0a66c2" },
};

function getYearDisplay(node) {
  const birth = node.birthDate ? new Date(node.birthDate + "T00:00:00").getFullYear() : null;
  const death = node.deathDate ? new Date(node.deathDate + "T00:00:00").getFullYear() : null;
  if (!birth && !death) return null;
  const parts = [birth, death || (birth ? "present" : null)].filter(Boolean);
  return parts.join(" \u2013 ");
}

export default function FlowNode({ data }) {
  const {
    node,
    collapsed,
    hasChildren,
    descendantCount,
    isHighlighted,
    onAddChild,
    onEdit,
    onDelete,
    onToggleCollapse,
    onTraverseNode,
  } = data;

  const years = getYearDisplay(node);
  const hasSocial = node.socialLinks && Object.keys(node.socialLinks).length > 0;
  const nodeImage = getNodeImage(node);
  const spouse = node.spouse?.name?.trim() ? node.spouse : null;
  const spouseImage = spouse ? getNodeImage(spouse) : null;
  const coupleName = spouse ? `${node.name} / ${spouse.name}` : node.name;

  return (
    <div
      className={`tree-node gender-${node.gender}${isHighlighted ? " highlighted" : ""}`}
      onClick={() => onTraverseNode(node.id, hasChildren, collapsed)}
    >
      <Handle id="left" type="target" position={Position.Left} className="flow-handle flow-handle-left" />

      <div
        className={`node-photo nodrag${spouse ? " node-photo-couple" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {spouse ? (
          <div className="node-photo-combined">
            <img src={nodeImage} alt={node.name} className="node-photo-half node-photo-primary" />
            <img
              src={spouseImage}
              alt={spouse.name}
              className="node-photo-half node-photo-secondary"
            />
          </div>
        ) : (
          <img src={nodeImage} alt={node.name} />
        )}
      </div>

      <div className="node-name nodrag">
        {coupleName}
      </div>
      {years && <div className="node-years">{years}</div>}

      {hasSocial && (
        <div className="node-social-links">
          {Object.entries(node.socialLinks).map(([platform, url]) => {
            const info = SOCIAL_ICONS[platform];
            if (!info || !url) return null;
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-link nodrag"
                title={info.label}
                style={{ color: info.color }}
                onClick={(e) => e.stopPropagation()}
              >
                {info.icon}
              </a>
            );
          })}
        </div>
      )}

      <div className="node-actions">
        <button
          className="node-btn nodrag"
          title="Add child"
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(node.id);
          }}
        >
          +
        </button>
        <button
          className="node-btn nodrag"
          title="Edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(node);
          }}
        >
          Edit
        </button>
        <button
          className="node-btn node-btn-delete nodrag"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node);
          }}
        >
          Del
        </button>
      </div>

      {hasChildren && (
        <button
          className="node-toggle nodrag"
          title={collapsed ? "Expand" : "Collapse"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(node.id);
          }}
        >
          {collapsed ? `> ${descendantCount}` : "v"}
        </button>
      )}

      <Handle id="right" type="source" position={Position.Right} className="flow-handle flow-handle-right" />
    </div>
  );
}
