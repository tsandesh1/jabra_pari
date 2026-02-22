import { useMemo, useEffect, useState, useCallback } from "react";
import ReactFlow, {
  MarkerType,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import FlowNode from "./FlowNode";
import { countDescendants } from "../utils/treeUtils";

const DESKTOP_LAYOUT = {
  nodeWidth: 188,
  nodeHeight: 110,
  levelGap: 240,
  siblingGap: 56,
  paddingX: 110,
  paddingY: 80,
};

const MOBILE_LAYOUT = {
  nodeWidth: 160,
  nodeHeight: 98,
  levelGap: 190,
  siblingGap: 34,
  paddingX: 72,
  paddingY: 60,
};

const nodeTypes = {
  family: FlowNode,
};

function buildInitialCollapsedMap(tree) {
  const map = {};
  function walk(node) {
    if (node.children.length > 0) map[node.id] = true;
    for (const child of node.children) walk(child);
  }
  walk(tree);
  return map;
}

function buildChildrenById(tree) {
  const byId = new Map();
  function walk(node) {
    byId.set(
      node.id,
      node.children.map((child) => child.id)
    );
    for (const child of node.children) walk(child);
  }
  walk(tree);
  return byId;
}

function buildActiveFlowNodeSet(selectedNodeId, childrenById, parentById) {
  if (!selectedNodeId) return new Set();

  const ids = new Set();

  // Include all ancestors up to root.
  let cursor = selectedNodeId;
  while (cursor) {
    ids.add(cursor);
    cursor = parentById.get(cursor);
  }

  // Include all descendants down to leaves.
  const stack = [selectedNodeId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    ids.add(current);
    const children = childrenById.get(current) || [];
    for (const childId of children) stack.push(childId);
  }

  return ids;
}

function buildParentById(tree) {
  const byId = new Map();
  function walk(node, parentId = null) {
    byId.set(node.id, parentId);
    for (const child of node.children) walk(child, node.id);
  }
  walk(tree);
  return byId;
}

function measureSubtree(node, collapsedById, map) {
  const isCollapsed = Boolean(collapsedById[node.id]);
  if (isCollapsed || node.children.length === 0) {
    map.set(node.id, 1);
    return 1;
  }
  let sum = 0;
  for (const child of node.children) {
    sum += measureSubtree(child, collapsedById, map);
  }
  map.set(node.id, Math.max(sum, 1));
  return map.get(node.id);
}

function buildFlow(tree, collapsedById, handlers, highlightIds, layout) {
  const nodes = [];
  const edges = [];
  const spans = new Map();
  measureSubtree(tree, collapsedById, spans);
  const unit = layout.nodeHeight + layout.siblingGap;

  function place(node, depth, startUnits) {
    const span = spans.get(node.id) || 1;
    const center = startUnits + span / 2;
    const collapsed = Boolean(collapsedById[node.id]);
    const hasChildren = node.children.length > 0;

    nodes.push({
      id: node.id,
      type: "family",
      position: {
        x: layout.paddingX + depth * layout.levelGap,
        y: layout.paddingY + center * unit,
      },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      data: {
        node,
        collapsed,
        hasChildren,
        descendantCount: hasChildren ? countDescendants(node) : 0,
        isHighlighted: highlightIds.has(node.id),
        ...handlers,
      },
      draggable: true,
      selectable: false,
    });

    if (collapsed || !hasChildren) return;
    let cursor = startUnits;
    for (const child of node.children) {
      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        sourceHandle: "right",
        targetHandle: "left",
        type: "bezier",
        markerEnd: { type: MarkerType.ArrowClosed },
      });
      place(child, depth + 1, cursor);
      cursor += spans.get(child.id) || 1;
    }
  }

  place(tree, 0, 0);
  return { nodes, edges };
}

function getCanvasSize(nodes, layout) {
  if (!nodes.length) return { width: 900, height: 600 };

  let maxX = 0;
  let maxY = 0;
  for (const n of nodes) {
    maxX = Math.max(maxX, n.position.x);
    maxY = Math.max(maxY, n.position.y);
  }

  return {
    width: Math.max(900, maxX + layout.nodeWidth + layout.paddingX),
    height: Math.max(620, maxY + layout.nodeHeight + layout.paddingY),
  };
}

function TreeFlow({ tree, highlightIds, onAddChild, onEdit, onDelete, onViewProfile }) {
  const [reactFlow, setReactFlow] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(tree.id);
  const [collapsedById, setCollapsedById] = useState(() => buildInitialCollapsedMap(tree));
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const layout = isMobile ? MOBILE_LAYOUT : DESKTOP_LAYOUT;
  const childrenById = useMemo(() => buildChildrenById(tree), [tree]);
  const parentById = useMemo(() => buildParentById(tree), [tree]);

  const focusNode = useCallback(
    (id, includeChildren = false) => {
      if (!reactFlow) return;
      const target = reactFlow.getNode(id);
      if (!target) return;

      const baseX = target.position.x + layout.nodeWidth / 2;
      const baseY = target.position.y + layout.nodeHeight / 2;

      if (isMobile) {
        const xBias = includeChildren ? layout.levelGap * 0.38 : 0;
        reactFlow.setCenter(baseX + xBias, baseY, {
          duration: 220,
          zoom: 0.85,
        });
        return;
      }

      reactFlow.setCenter(baseX, baseY, {
        duration: 220,
        zoom: 0.9,
      });
    },
    [isMobile, layout.levelGap, layout.nodeHeight, layout.nodeWidth, reactFlow]
  );

  const focusActiveCluster = useCallback(
    (parentId) => {
      if (!reactFlow) return;
      const parent = reactFlow.getNode(parentId);
      if (!parent) return;
      const childNodes = (childrenById.get(parentId) || [])
        .map((id) => reactFlow.getNode(id))
        .filter(Boolean);
      const cluster = [parent, ...childNodes];

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const n of cluster) {
        minX = Math.min(minX, n.position.x);
        minY = Math.min(minY, n.position.y);
        maxX = Math.max(maxX, n.position.x);
        maxY = Math.max(maxY, n.position.y);
      }

      const bounds = {
        x: minX - 40,
        y: minY - 40,
        width: Math.max(layout.nodeWidth + 80, maxX - minX + layout.nodeWidth + 80),
        height: Math.max(layout.nodeHeight + 80, maxY - minY + layout.nodeHeight + 80),
      };

      reactFlow.fitBounds(bounds, {
        duration: 260,
        padding: isMobile ? 0.28 : 0.16,
        maxZoom: isMobile ? 0.95 : 1.15,
      });
    },
    [childrenById, isMobile, layout.nodeHeight, layout.nodeWidth, reactFlow]
  );

  const handlers = useMemo(
    () => ({
      onAddChild,
      onEdit,
      onDelete,
      onViewProfile,
      onTraverseNode: (id, hasChildren, isCollapsed) => {
        setSelectedNodeId(id);
        if (hasChildren) {
          setCollapsedById((prev) => ({
            ...prev,
            [id]: !isCollapsed,
          }));
        }
        requestAnimationFrame(() => {
          const willExpand = hasChildren ? isCollapsed : false;
          if (willExpand && !isMobile) {
            focusActiveCluster(id);
          } else {
            focusNode(id, willExpand);
          }
        });
      },
      onToggleCollapse: (id) =>
        setCollapsedById((prev) => ({
          ...prev,
          [id]: !prev[id],
        })),
    }),
    [focusActiveCluster, focusNode, isMobile, onAddChild, onDelete, onEdit, onViewProfile]
  );

  const flow = useMemo(() => {
    const next = buildFlow(tree, collapsedById, handlers, highlightIds, layout);
    const activeFlowNodes = buildActiveFlowNodeSet(selectedNodeId, childrenById, parentById);
    const hasActiveFlow = activeFlowNodes.size > 0;

    next.edges = next.edges.map((edge) => {
      const isRelated =
        hasActiveFlow && activeFlowNodes.has(edge.source) && activeFlowNodes.has(edge.target);
      return {
        ...edge,
        className: isRelated ? "relationship-edge" : "default-edge",
        animated: isRelated,
        markerEnd: {
          ...edge.markerEnd,
          color: isRelated ? "#2a7f9e" : "rgba(80, 90, 105, 0.34)",
        },
      };
    });
    return next;
  }, [tree, collapsedById, handlers, highlightIds, layout, selectedNodeId, childrenById, parentById]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flow.edges);

  useEffect(() => setNodes(flow.nodes), [flow.nodes, setNodes]);
  useEffect(() => setEdges(flow.edges), [flow.edges, setEdges]);

  useEffect(() => {
    if (!reactFlow || !selectedNodeId) return;
    const hasChildren = (childrenById.get(selectedNodeId) || []).length > 0;
    const isExpanded = hasChildren && !collapsedById[selectedNodeId];
    if (isExpanded && !isMobile) {
      focusActiveCluster(selectedNodeId);
    } else {
      focusNode(selectedNodeId, isExpanded);
    }
  }, [
    nodes,
    reactFlow,
    selectedNodeId,
    focusActiveCluster,
    focusNode,
    collapsedById,
    childrenById,
    isMobile,
  ]);

  useEffect(() => {
    if (highlightIds.size === 0) return;
    const firstMatchId = highlightIds.values().next().value;
    if (!firstMatchId) return;

    const raf = window.requestAnimationFrame(() => {
      setSelectedNodeId(firstMatchId);
      setCollapsedById((prev) => {
        const next = { ...prev };
        let cursor = parentById.get(firstMatchId);
        while (cursor) {
          next[cursor] = false;
          cursor = parentById.get(cursor);
        }
        return next;
      });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [highlightIds, parentById]);

  const canvasSize = useMemo(() => getCanvasSize(nodes, layout), [nodes, layout]);

  const handleNodeDragStop = useCallback((_, node) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))
    );
  }, [setNodes]);

  return (
    <div className="tree-view tree-view-scrollable">
      <div
        className="tree-flow-frame"
        style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleNodeDragStop}
          onPaneClick={() => setSelectedNodeId(null)}
          onInit={setReactFlow}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: isMobile ? 0.72 : 0.86 }}
          minZoom={0.35}
          maxZoom={1.4}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          nodesDraggable
          elementsSelectable={false}
          panOnScroll
          panOnDrag
          zoomOnScroll={false}
          zoomOnPinch
          zoomOnDoubleClick={false}
          className="tree-flow"
        />
      </div>
    </div>
  );
}

export default function TreeView(props) {
  return (
    <ReactFlowProvider>
      <TreeFlow key={props.tree.id} {...props} />
    </ReactFlowProvider>
  );
}
