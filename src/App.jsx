import { useState, useCallback } from "react";
import Toolbar from "./components/Toolbar";
import TreeView from "./components/TreeView";
import NodeForm from "./components/NodeForm";
import ConfirmDialog from "./components/ConfirmDialog";
import {
  addChild,
  deleteNode,
  updateNode,
  countDescendants,
  searchByName,
  createNode,
} from "./utils/treeUtils";

export default function App() {
  const [tree, setTree] = useState(null);
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [highlightIds, setHighlightIds] = useState(new Set());

  const handleCreateRoot = useCallback(() => {
    setFormState({ mode: "add", parentId: null });
  }, []);

  const handleAddChild = useCallback((parentId) => {
    setFormState({ mode: "add", parentId });
  }, []);

  const handleEdit = useCallback((node) => {
    setFormState({ mode: "edit", node });
  }, []);

  const handleFormSubmit = useCallback(
    (data) => {
      if (formState.mode === "add") {
        const newNode = createNode(data);
        if (formState.parentId === null) {
          setTree(newNode);
        } else {
          setTree((t) => addChild(t, formState.parentId, newNode));
        }
      } else {
        setTree((t) => updateNode(t, formState.node.id, data));
      }
      setFormState(null);
    },
    [formState]
  );

  const handleDeleteRequest = useCallback((node) => {
    setDeleteTarget(node);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    setTree((t) => deleteNode(t, deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget]);

  const handleSearch = useCallback(
    (query) => {
      if (!tree) return;
      const ids = searchByName(tree, query);
      setHighlightIds(new Set(ids));
    },
    [tree]
  );

  const handleClearSearch = useCallback(() => {
    setHighlightIds(new Set());
  }, []);

  return (
    <div className="app">
      <Toolbar
        tree={tree}
        onImport={setTree}
        onCreateRoot={handleCreateRoot}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
      />
      <div className="main-area">
        {tree ? (
          <TreeView
            tree={tree}
            highlightIds={highlightIds}
            onAddChild={handleAddChild}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        ) : (
          <div className="empty-state">
            <p>No family tree loaded.</p>
            <p>Create a root person or import a JSON file to get started.</p>
          </div>
        )}
      </div>

      {formState && (
        <NodeForm
          title={formState.mode === "add" ? "Add Person" : "Edit Person"}
          node={formState.mode === "edit" ? formState.node : null}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormState(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.name}"? This will also remove ${countDescendants(deleteTarget)} descendant(s).`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
