import { useRef, useState, useCallback, useEffect } from "react";
import TreeNode from "./TreeNode";

const ZOOM_FACTOR = 1.08;
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;

export default function TreeView({ tree, highlightIds, onAddChild, onEdit, onDelete, onViewProfile }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const animationTimeout = useRef(null);

  const clampScale = useCallback(
    (s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s)),
    []
  );

  const handleMouseDown = useCallback((e) => {
    if (
      e.target.closest(".tree-node") ||
      e.target.closest(".node-btn") ||
      e.target.closest(".zoom-controls")
    ) {
      return;
    }
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setIsAnimating(false);
  }, [clampScale]);

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
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setScale((prevScale) => {
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const newScale = clampScale(prevScale * factor);
      const ratio = newScale / prevScale;

      setPan((p) => ({
        x: mouseX - ratio * (mouseX - p.x),
        y: mouseY - ratio * (mouseY - p.y),
      }));

      return newScale;
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((s) => clampScale(s * ZOOM_FACTOR * ZOOM_FACTOR));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => clampScale(s / (ZOOM_FACTOR * ZOOM_FACTOR)));
  }, []);

  const handleZoomReset = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
    const contentWidth = canvas.scrollWidth;
    const contentHeight = canvas.scrollHeight;
    if (!contentWidth || !contentHeight) return;

    const padding = 80;
    const availableWidth = Math.max(containerWidth - padding, 0);
    const availableHeight = Math.max(containerHeight - padding, 0);
    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    const nextScale = clampScale(Math.min(scaleX, scaleY, 1));
    const nextPan = {
      x: (containerWidth - contentWidth * nextScale) / 2,
      y: (containerHeight - contentHeight * nextScale) / 2,
    };

    setIsAnimating(true);
    setScale(nextScale);
    setPan(nextPan);
    window.clearTimeout(animationTimeout.current);
    animationTimeout.current = window.setTimeout(() => {
      setIsAnimating(false);
    }, 400);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    if (!tree) return;
    const raf = window.requestAnimationFrame(() => {
      fitToScreen();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [tree, fitToScreen]);

  useEffect(() => {
    if (highlightIds.size > 0) {
      const firstId = highlightIds.values().next().value;
      const el = document.querySelector(`[data-node-id="${firstId}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }, [highlightIds]);

  const zoomPercent = Math.round(scale * 100);

  return (
    <div
      className="tree-view"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={handleZoomIn} title="Zoom in">+</button>
        <span className="zoom-level">{zoomPercent}%</span>
        <button className="zoom-btn" onClick={handleZoomOut} title="Zoom out">&minus;</button>
        <button className="zoom-btn" onClick={fitToScreen} title="Fit to screen">Fit</button>
        <button className="zoom-btn zoom-btn-reset" onClick={handleZoomReset} title="Reset zoom">Reset</button>
      </div>
      <div
        className={`tree-canvas${isAnimating ? " tree-canvas--animating" : ""}`}
        ref={canvasRef}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        }}
        role="tree"
        aria-label="Family tree"
      >
        <TreeNode
          node={tree}
          depth={0}
          parentId={null}
          siblingIds={[tree.id]}
          siblingIndex={0}
          highlightIds={highlightIds}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewProfile={onViewProfile}
        />
      </div>
    </div>
  );
}
