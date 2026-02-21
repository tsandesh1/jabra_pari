import { useRef, useState, useCallback, useEffect } from "react";
import TreeNode from "./TreeNode";

export default function TreeView({ tree, highlightIds, onAddChild, onEdit, onDelete }) {
  const containerRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest(".tree-node") || e.target.closest(".node-btn")) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale((s) => Math.min(2, Math.max(0.2, s + delta)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    if (highlightIds.size > 0) {
      const firstId = highlightIds.values().next().value;
      const el = document.querySelector(`[data-node-id="${firstId}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }, [highlightIds]);

  return (
    <div
      className="tree-view"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="tree-canvas"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        }}
      >
        <TreeNode
          node={tree}
          highlightIds={highlightIds}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
