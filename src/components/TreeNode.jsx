import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { countDescendants } from "../utils/treeUtils";
import NodeTooltip from "./NodeTooltip";

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

function focusNodeById(id) {
  const el = document.querySelector(`[data-node-id="${id}"]`);
  if (el) el.focus();
}

export default function TreeNode({
  node,
  depth = 0,
  parentId,
  siblingIds,
  siblingIndex,
  highlightIds,
  onAddChild,
  onEdit,
  onDelete,
  onViewProfile,
}) {
  const [collapsed, setCollapsed] = useState(() => depth >= 2);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const hasChildren = node.children.length > 0;
  const isHighlighted = highlightIds.has(node.id);
  const hasSocial = node.socialLinks && Object.keys(node.socialLinks).length > 0;
  const years = getYearDisplay(node);
  const descendantCount = hasChildren ? countDescendants(node) : 0;
  const siblingIdsForChildren = hasChildren ? node.children.map((c) => c.id) : [];
  const hoverTimer = useRef(null);
  const cardRef = useRef(null);
  const wrapperRef = useRef(null);
  const childRefs = useRef(new Map());
  const lastLayout = useRef("");
  const [connectorPaths, setConnectorPaths] = useState([]);
  const [connectorSize, setConnectorSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    return () => {
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!wrapperRef.current || !cardRef.current || collapsed || !hasChildren) {
      if (connectorPaths.length) setConnectorPaths([]);
      return;
    }

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const parentRect = cardRef.current.getBoundingClientRect();
    const startX = parentRect.left + parentRect.width / 2 - wrapperRect.left;
    const startY = parentRect.bottom - wrapperRect.top;

    const nextPaths = [];
    childRefs.current.forEach((childEl) => {
      if (!childEl) return;
      const childCard = childEl.querySelector(".tree-node");
      if (!childCard) return;
      const childRect = childCard.getBoundingClientRect();
      const endX = childRect.left + childRect.width / 2 - wrapperRect.left;
      const endY = childRect.top - wrapperRect.top;
      const controlY = startY + (endY - startY) * 0.55;
      nextPaths.push(
        `M ${startX},${startY} C ${startX},${controlY} ${endX},${controlY} ${endX},${endY}`
      );
    });

    const nextSize = { width: wrapperRect.width, height: wrapperRect.height };
    const serialized = JSON.stringify({ nextPaths, nextSize });
    if (serialized !== lastLayout.current) {
      lastLayout.current = serialized;
      setConnectorSize(nextSize);
      setConnectorPaths(nextPaths);
    }
  });

  const handleMouseEnter = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
      setTooltipOpen(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setTooltipOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;

    if (e.key === "ArrowLeft") {
      if (hasChildren && !collapsed) {
        setCollapsed(true);
      }
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowRight") {
      if (hasChildren && collapsed) {
        setCollapsed(false);
      }
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowUp" && siblingIds && siblingIndex > 0) {
      focusNodeById(siblingIds[siblingIndex - 1]);
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowDown" && siblingIds && siblingIndex < siblingIds.length - 1) {
      focusNodeById(siblingIds[siblingIndex + 1]);
      e.preventDefault();
      return;
    }

    if (e.key === "Enter") {
      if (onViewProfile) {
        onViewProfile(node);
      } else {
        onEdit(node);
      }
      e.preventDefault();
    }
  };

  return (
    <div className="tree-node-wrapper" ref={wrapperRef}>
      <div
        ref={cardRef}
        className={`tree-node gender-${node.gender}${isHighlighted ? " highlighted" : ""}`}
        data-node-id={node.id}
        data-parent-id={parentId || ""}
        style={{ "--depth": depth }}
        role="treeitem"
        tabIndex={0}
        aria-expanded={hasChildren ? !collapsed : undefined}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {node.photoUrl && (
          <div className="node-photo" onClick={() => onViewProfile && onViewProfile(node)}>
            <img src={node.photoUrl} alt={node.name} />
          </div>
        )}
        <div className="node-name" onClick={() => (onViewProfile ? onViewProfile(node) : onEdit(node))}>
          {node.name}
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
                  className="social-icon-link"
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
            className="node-btn"
            title="Add child"
            onClick={() => onAddChild(node.id)}
          >
            +
          </button>
          <button
            className="node-btn"
            title="Edit"
            onClick={() => onEdit(node)}
          >
            Edit
          </button>
          <button
            className="node-btn node-btn-delete"
            title="Delete"
            onClick={() => onDelete(node)}
          >
            Del
          </button>
        </div>
        {hasChildren && (
          <button
            className="node-toggle"
            title={collapsed ? "Expand" : "Collapse"}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? `> ${descendantCount}` : "v"}
          </button>
        )}
      </div>

      {hasChildren && !collapsed && connectorPaths.length > 0 && (
        <svg
          className="tree-connectors"
          width={connectorSize.width}
          height={connectorSize.height}
          viewBox={`0 0 ${connectorSize.width} ${connectorSize.height}`}
        >
          {connectorPaths.map((path, i) => (
            <path key={i} d={path} />
          ))}
        </svg>
      )}

      {hasChildren && (
        <div className={`collapse-wrapper${collapsed ? " collapse-wrapper--hidden" : ""}`}>
          <div className="tree-children">
            {node.children.map((child, index) => (
              <div
                key={child.id}
                className="tree-child"
                ref={(el) => {
                  if (el) childRefs.current.set(child.id, el);
                  else childRefs.current.delete(child.id);
                }}
              >
                <TreeNode
                  node={child}
                  depth={depth + 1}
                  parentId={node.id}
                  siblingIds={siblingIdsForChildren}
                  siblingIndex={index}
                  highlightIds={highlightIds}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewProfile={onViewProfile}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <NodeTooltip node={node} position={tooltipPosition} visible={tooltipOpen} />
    </div>
  );
}
