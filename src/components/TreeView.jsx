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

const NODE_WIDTH = 240;
const LEVEL_GAP = 170;
const SIBLING_GAP = 72;

const nodeTypes = {
  family: FlowNode,
};

function measureSubtree(node, collapsedById, map, ignoreCollapsed = false) {
  const isCollapsed = Boolean(collapsedById[node.id]);
  if ((!ignoreCollapsed && isCollapsed) || node.children.length === 0) {
    map.set(node.id, 1);
    return 1;
  }
  let sum = 0;
  for (const child of node.children) {
    sum += measureSubtree(child, collapsedById, map, ignoreCollapsed);
  }
  map.set(node.id, Math.max(sum, 1));
  return map.get(node.id);
}

function buildFlow(tree, collapsedById, positionOverrides, handlers, highlightIds) {
  const nodes = [];
  const edges = [];
  const visibleSpans = new Map();
  const layoutSpans = new Map();
  measureSubtree(tree, collapsedById, visibleSpans, false);
  measureSubtree(tree, collapsedById, layoutSpans, true);

  const unit = NODE_WIDTH + SIBLING_GAP;

  function place(node, depth, startUnits) {
    const span = layoutSpans.get(node.id) || 1;
    const center = startUnits + span / 2;
    const basePosition = {
      x: center * unit,
      y: depth * LEVEL_GAP,
    };
    const position = positionOverrides[node.id] || basePosition;
    const collapsed = Boolean(collapsedById[node.id]);
    const hasChildren = node.children.length > 0;

    nodes.push({
      id: node.id,
      type: "family",
      position,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
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
        sourceHandle: "bottom",
        targetHandle: "top",
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
  if (!selectedNodeId) {
    return { relatedIds: new Set() };
  }

  const parentById = new Map();

  function indexParents(node, parentId = null) {
    parentById.set(node.id, parentId);
    for (const child of node.children) {
      indexParents(child, node.id);
    }
  }

  function collectDescendants(node, bag) {
    bag.add(node.id);
    for (const child of node.children) {
      collectDescendants(child, bag);
    }
  }

  function findNode(node, targetId) {
    if (node.id === targetId) return node;
    for (const child of node.children) {
      const match = findNode(child, targetId);
      if (match) return match;
    }
    return null;
  }

  indexParents(tree);
  const selectedNode = findNode(tree, selectedNodeId);
  if (!selectedNode) {
    return { relatedIds: new Set() };
  }

  const ancestors = new Set();
  let cursor = selectedNodeId;
  while (cursor) {
    ancestors.add(cursor);
    cursor = parentById.get(cursor);
  }

  const descendants = new Set();
  collectDescendants(selectedNode, descendants);

  const relatedIds = new Set([...ancestors, ...descendants]);
  return { relatedIds };
}

function TreeFlow({ tree, highlightIds, onAddChild, onEdit, onDelete, onViewProfile }) {
  const [reactFlow, setReactFlow] = useState(null);
  const [collapsedById, setCollapsedById] = useState(() => buildInitialCollapsedMap(tree));
  const [positionOverrides, setPositionOverrides] = useState({});
  const [selectedNodeId, setSelectedNodeId] = useState(tree.id);

  const handleTraverseNode = useCallback((id, hasChildren) => {
    setSelectedNodeId(id);
    if (hasChildren) {
      setCollapsedById((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    }

    if (!reactFlow) return;
    const target = reactFlow.getNode(id);
    if (!target) return;
    reactFlow.setCenter(target.position.x + NODE_WIDTH / 2, target.position.y + 64, {
      duration: 280,
      zoom: Math.max(reactFlow.getZoom(), 0.85),
    });
  }, [reactFlow]);

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
    const next = buildFlow(tree, collapsedById, positionOverrides, handlers, highlightIds);
    const { relatedIds } = buildRelationshipIds(tree, selectedNodeId);
    const hasSelection = relatedIds.size > 0;

    next.edges = next.edges.map((edge) => {
      const isRelated = hasSelection && relatedIds.has(edge.source) && relatedIds.has(edge.target);
      return {
        ...edge,
        className: isRelated ? "relationship-edge" : "default-edge",
        markerEnd: {
          ...edge.markerEnd,
          color: isRelated ? "#2a7f9e" : "rgba(80, 90, 105, 0.42)",
        },
      };
    });

    return next;
  }, [tree, collapsedById, positionOverrides, handlers, highlightIds, selectedNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flow.edges);

  useEffect(() => setNodes(flow.nodes), [flow.nodes, setNodes]);
  useEffect(() => setEdges(flow.edges), [flow.edges, setEdges]);

  useEffect(() => {
    if (!reactFlow || highlightIds.size === 0) return;
    const firstId = highlightIds.values().next().value;
    const target = nodes.find((n) => n.id === firstId);
    if (!target) return;
    reactFlow.setCenter(target.position.x + NODE_WIDTH / 2, target.position.y + 60, {
      zoom: Math.max(reactFlow.getZoom(), 0.75),
      duration: 380,
    });
  }, [highlightIds, nodes, reactFlow]);

  useEffect(() => {
    if (!reactFlow) return;
    reactFlow.fitView({ duration: 300, padding: 0.25 });
  }, [tree, reactFlow]);

  const handleNodeDragStop = useCallback((_, node) => {
    setPositionOverrides((prev) => ({
      ...prev,
      [node.id]: { x: node.position.x, y: node.position.y },
    }));
  }, []);

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
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        elementsSelectable={false}
        className="tree-flow"
      />
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
