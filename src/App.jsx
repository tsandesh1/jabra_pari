import { useState, useCallback, useRef, useEffect } from "react";
import Toolbar from "./components/Toolbar";
import TreeView from "./components/TreeView";
import NodeForm from "./components/NodeForm";
import ConfirmDialog from "./components/ConfirmDialog";
import ProfileModal from "./components/ProfileModal";
import { importTree } from "./utils/fileUtils";
import {
  addChild,
  deleteNode,
  updateNode,
  countDescendants,
  searchByName,
  createNode,
} from "./utils/treeUtils";

function useAnimatedModal(value, setValue) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (value) setIsClosing(false);
  }, [value]);

  const close = useCallback(() => {
    if (!value || isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      setValue(null);
      setIsClosing(false);
    }, 200);
  }, [isClosing, setValue, value]);

  return { isClosing, shouldRender: Boolean(value) || isClosing, close };
}

export default function App() {
  const [tree, setTree] = useState(null);
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [highlightIds, setHighlightIds] = useState(new Set());
  const [profileNode, setProfileNode] = useState(null);
  const emptyFileRef = useRef();

  const {
    isClosing: isProfileClosing,
    shouldRender: showProfileModal,
    close: closeProfile,
  } = useAnimatedModal(profileNode, setProfileNode);
  const {
    isClosing: isFormClosing,
    shouldRender: showFormModal,
    close: closeForm,
  } = useAnimatedModal(formState, setFormState);
  const {
    isClosing: isDeleteClosing,
    shouldRender: showDeleteModal,
    close: closeDelete,
  } = useAnimatedModal(deleteTarget, setDeleteTarget);

  const handleCreateRoot = useCallback(() => {
    setFormState({ mode: "add", parentId: null });
  }, []);

  const handleAddChild = useCallback((parentId) => {
    setFormState({ mode: "add", parentId });
  }, []);

  const handleEdit = useCallback((node) => {
    closeProfile();
    setFormState({ mode: "edit", node });
  }, [closeProfile]);

  const handleViewProfile = useCallback((node) => {
    setProfileNode(node);
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
      closeForm();
    },
    [formState, closeForm]
  );

  const handleDeleteRequest = useCallback((node) => {
    setDeleteTarget(node);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    setTree((t) => deleteNode(t, deleteTarget.id));
    closeDelete();
  }, [deleteTarget, closeDelete]);

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

  const handleEmptyImport = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = await importTree(file);
      setTree(imported);
    } catch (err) {
      alert(err.message);
    }
    if (emptyFileRef.current) emptyFileRef.current.value = "";
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
            onViewProfile={handleViewProfile}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-state-card">
              <div className="empty-state-icon">FT</div>
              <h2>No family tree yet</h2>
              <p>
                Start with a root person or import an existing JSON file to build out
                generations in minutes.
              </p>
              <div className="empty-state-actions">
                <button className="btn btn-primary" onClick={handleCreateRoot}>
                  Create Root Person
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => emptyFileRef.current?.click()}
                >
                  Import JSON
                </button>
                <input
                  ref={emptyFileRef}
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={handleEmptyImport}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {showProfileModal && (
        <ProfileModal
          node={profileNode}
          onEdit={handleEdit}
          onClose={closeProfile}
          isClosing={isProfileClosing}
        />
      )}

      {showFormModal && (
        <NodeForm
          title={formState.mode === "add" ? "Add Person" : "Edit Person"}
          node={formState.mode === "edit" ? formState.node : null}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isClosing={isFormClosing}
        />
      )}

      {showDeleteModal && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.name}"? This will also remove ${countDescendants(deleteTarget)} descendant(s).`}
          onConfirm={handleDeleteConfirm}
          onCancel={closeDelete}
          isClosing={isDeleteClosing}
        />
      )}
    </div>
  );
}
