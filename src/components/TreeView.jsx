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
  nodeWidth: 240,
  levelGap: 300,
  siblingGap: 84,
};

const MOBILE_LAYOUT = {
  nodeWidth: 170,
  levelGap: 220,
  siblingGap: 24,
};

const nodeTypes = {
  family: FlowNode,
};

function indexTree(tree) {
  const nodeById = new Map();
  const parentById = new Map();
  const childrenById = new Map();

  function walk(node, parentId = null) {
    nodeById.set(node.id, node);
    parentById.set(node.id, parentId);
    childrenById.set(
      node.id,
      node.children.map((c) => c.id)
    );
    for (const child of node.children) {
      walk(child, node.id);
    }
  }

  walk(tree);
  return { nodeById, parentById, childrenById };
}

function getPathToRoot(nodeId, parentById) {
  const path = [];
  let cursor = nodeId;
  while (cursor) {
    path.push(cursor);
    cursor = parentById.get(cursor);
  }
  return path.reverse();
}

function buildMobileVisibleSet(tree, focusedNodeId, treeIndex) {
  const visible = new Set();
  const focusId = focusedNodeId || tree.id;
  const path = getPathToRoot(focusId, treeIndex.parentById);

  for (const id of path) visible.add(id);
  for (const childId of treeIndex.childrenById.get(focusId) || []) visible.add(childId);

  if (focusId === tree.id) {
    for (const childId of treeIndex.childrenById.get(tree.id) || []) visible.add(childId);
  }

  return visible;
}

function measureSubtree(node, collapsedById, visibleIds, map, ignoreCollapsed = false) {
  if (visibleIds && !visibleIds.has(node.id)) {
    map.set(node.id, 0);
    return 0;
  }
  const isCollapsed = Boolean(collapsedById[node.id]);
  const visibleChildren = node.children.filter((c) => !visibleIds || visibleIds.has(c.id));
  if ((!ignoreCollapsed && isCollapsed) || visibleChildren.length === 0) {
    map.set(node.id, 1);
    return 1;
  }

  let sum = 0;
  for (const child of visibleChildren) {
    sum += measureSubtree(child, collapsedById, visibleIds, map, ignoreCollapsed);
  }
  map.set(node.id, Math.max(sum, 1));
  return map.get(node.id);
}

function buildFlow(tree, collapsedById, positionOverrides, handlers, highlightIds, layout, visibleIds) {
  const nodes = [];
  const edges = [];
  const visibleSpans = new Map();
  const layoutSpans = new Map();

  measureSubtree(tree, collapsedById, visibleIds, visibleSpans, false);
  measureSubtree(tree, collapsedById, visibleIds, layoutSpans, true);

  const unit = layout.nodeWidth + layout.siblingGap;

  function place(node, depth, startUnits) {
    if (visibleIds && !visibleIds.has(node.id)) return;

    const span = layoutSpans.get(node.id) || 1;
    const center = startUnits + span / 2;
    const basePosition = {
      x: depth * layout.levelGap,
      y: center * unit,
    };
    const position = positionOverrides[node.id] || basePosition;
    const collapsed = Boolean(collapsedById[node.id]);
    const hasChildren = node.children.length > 0;
    const visibleChildren = node.children.filter((c) => !visibleIds || visibleIds.has(c.id));

    nodes.push({
      id: node.id,
      type: "family",
      position,
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

    if (collapsed || visibleChildren.length === 0) return;

    let cursor = startUnits;
    for (const child of visibleChildren) {
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
      cursor += layoutSpans.get(child.id) || visibleSpans.get(child.id) || 1;
    }
  }

  place(tree, 0, 0);
  return { nodes, edges };
}

function buildInitialCollapsedMap(tree) {
  const map = {};
  function walk(node) {
    if (node.children.length > 0) map[node.id] = true;
    for (const child of node.children) walk(child);
  }
  walk(tree);
  return map;
}

function buildRelationshipIds(tree, selectedNodeId) {
  if (!selectedNodeId) return new Set();

  const { parentById, nodeById } = indexTree(tree);
  const selectedNode = nodeById.get(selectedNodeId);
  if (!selectedNode) return new Set();

  const relatedIds = new Set();
  let cursor = selectedNodeId;
  while (cursor) {
    relatedIds.add(cursor);
    cursor = parentById.get(cursor);
  }

  function collectDescendants(node) {
    relatedIds.add(node.id);
    for (const child of node.children) collectDescendants(child);
  }
  collectDescendants(selectedNode);

  return relatedIds;
}

function TreeFlow({ tree, highlightIds, onAddChild, onEdit, onDelete, onViewProfile }) {
  const [reactFlow, setReactFlow] = useState(null);
  const [collapsedById, setCollapsedById] = useState(() => buildInitialCollapsedMap(tree));
  const [positionOverrides, setPositionOverrides] = useState({});
  const [selectedNodeId, setSelectedNodeId] = useState(tree.id);
  const [focusedNodeId, setFocusedNodeId] = useState(tree.id);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const treeIndex = useMemo(() => indexTree(tree), [tree]);
  const visibleIds = useMemo(
    () => (isMobile ? buildMobileVisibleSet(tree, focusedNodeId, treeIndex) : null),
    [focusedNodeId, isMobile, tree, treeIndex]
  );

  const layout = useMemo(() => {
    if (!isMobile) return DESKTOP_LAYOUT;
    const visibleChildren = treeIndex.childrenById.get(focusedNodeId)?.length || 1;
    return {
      ...MOBILE_LAYOUT,
      siblingGap: Math.max(14, MOBILE_LAYOUT.siblingGap - Math.min(visibleChildren, 6)),
    };
  }, [focusedNodeId, isMobile, treeIndex.childrenById]);

  const centerNode = useCallback(
    (id, zoomFloor = 1) => {
      if (!reactFlow) return;
      const target = reactFlow.getNode(id);
      if (!target) return;
      reactFlow.setCenter(target.position.x + layout.nodeWidth / 2, target.position.y + 60, {
        duration: 260,
        zoom: Math.max(reactFlow.getZoom(), zoomFloor),
      });
    },
    [layout.nodeWidth, reactFlow]
  );

  const handleTraverseNode = useCallback(
    (id, hasChildren) => {
      setSelectedNodeId(id);
      setFocusedNodeId(id);
      if (hasChildren) {
        setCollapsedById((prev) => ({ ...prev, [id]: false }));
      }
      centerNode(id, isMobile ? 1.02 : 0.85);
    },
    [centerNode, isMobile]
  );

  const handlers = useMemo(
    () => ({
      onAddChild,
      onEdit,
      onDelete,
      onViewProfile,
      onToggleCollapse: (id) =>
        setCollapsedById((prev) => ({
          ...prev,
          [id]: !prev[id],
        })),
      onTraverseNode: handleTraverseNode,
    }),
    [onAddChild, onDelete, onEdit, onViewProfile, handleTraverseNode]
  );

  const flow = useMemo(() => {
    const next = buildFlow(
      tree,
      collapsedById,
      positionOverrides,
      handlers,
      highlightIds,
      layout,
      visibleIds
    );
    const relatedIds = buildRelationshipIds(tree, selectedNodeId);
    const hasSelection = relatedIds.size > 0;

    next.edges = next.edges.map((edge) => {
      const isRelated = hasSelection && relatedIds.has(edge.source) && relatedIds.has(edge.target);
      return {
        ...edge,
        className: isRelated ? "relationship-edge" : "default-edge",
        markerEnd: {
          ...edge.markerEnd,
          color: isRelated ? "#2a7f9e" : "rgba(80, 90, 105, 0.36)",
        },
      };
    });

    return next;
  }, [tree, collapsedById, positionOverrides, handlers, highlightIds, layout, visibleIds, selectedNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flow.edges);

  useEffect(() => setNodes(flow.nodes), [flow.nodes, setNodes]);
  useEffect(() => setEdges(flow.edges), [flow.edges, setEdges]);

  useEffect(() => {
    if (!reactFlow) return;
    reactFlow.fitView({
      duration: 260,
      padding: isMobile ? 0.04 : 0.2,
      minZoom: isMobile ? 1 : 0.4,
      maxZoom: isMobile ? 1.8 : 2,
      includeHiddenNodes: false,
    });
    if (isMobile) {
      centerNode(tree.id, 1.02);
    }
  }, [centerNode, isMobile, reactFlow, tree.id, flow.nodes.length]);

  useEffect(() => {
    if (!reactFlow || highlightIds.size === 0) return;
    const firstId = highlightIds.values().next().value;
    centerNode(firstId, isMobile ? 1.02 : 0.8);
  }, [centerNode, highlightIds, isMobile, reactFlow]);

  const handleNodeDragStop = useCallback((_, node) => {
    setPositionOverrides((prev) => ({
      ...prev,
      [node.id]: { x: node.position.x, y: node.position.y },
    }));
  }, []);

  const siblingNav = useMemo(() => {
    const parentId = treeIndex.parentById.get(focusedNodeId);
    if (!parentId) return { prev: null, next: null };
    const siblings = treeIndex.childrenById.get(parentId) || [];
    const idx = siblings.indexOf(focusedNodeId);
    return {
      prev: idx > 0 ? siblings[idx - 1] : null,
      next: idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null,
    };
  }, [focusedNodeId, treeIndex.childrenById, treeIndex.parentById]);

  return (
    <div className="tree-view">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={() => setSelectedNodeId(null)}
        onInit={setReactFlow}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: isMobile ? 0.04 : 0.2,
          minZoom: isMobile ? 1 : 0.4,
          maxZoom: isMobile ? 1.8 : 2,
        }}
        minZoom={isMobile ? 1 : 0.35}
        maxZoom={isMobile ? 2 : 3}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll={!isMobile}
        panOnDrag
        className="tree-flow"
      />

      {isMobile && (
        <div className="tree-mobile-controls">
          <button className="mobile-ctrl-btn" onClick={() => reactFlow?.zoomIn({ duration: 120 })}>
            +
          </button>
          <button className="mobile-ctrl-btn" onClick={() => reactFlow?.zoomOut({ duration: 120 })}>
            -
          </button>
          <button className="mobile-ctrl-btn" onClick={() => reactFlow?.fitView({ duration: 200, padding: 0.04 })}>
            Fit
          </button>
          <button
            className="mobile-ctrl-btn"
            onClick={() => {
              setFocusedNodeId(tree.id);
              setSelectedNodeId(tree.id);
              centerNode(tree.id, 1.02);
            }}
          >
            Root
          </button>
          <button
            className="mobile-ctrl-btn"
            disabled={!siblingNav.prev}
            onClick={() =>
              siblingNav.prev &&
              handleTraverseNode(
                siblingNav.prev,
                (treeIndex.childrenById.get(siblingNav.prev) || []).length > 0
              )
            }
          >
            Prev
          </button>
          <button
            className="mobile-ctrl-btn"
            disabled={!siblingNav.next}
            onClick={() =>
              siblingNav.next &&
              handleTraverseNode(
                siblingNav.next,
                (treeIndex.childrenById.get(siblingNav.next) || []).length > 0
              )
            }
          >
            Next
          </button>
        </div>
      )}
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
