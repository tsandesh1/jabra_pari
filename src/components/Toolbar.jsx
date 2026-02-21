import { useRef } from "react";
import SearchBar from "./SearchBar";
import { exportTree, importTree } from "../utils/fileUtils";

export default function Toolbar({ tree, onImport, onCreateRoot, onSearch, onClearSearch }) {
  const fileRef = useRef();

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = await importTree(file);
      onImport(imported);
    } catch (err) {
      alert(err.message);
    }
    fileRef.current.value = "";
  }

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1>Family Tree</h1>
      </div>
      <div className="toolbar-center">
        {tree && <SearchBar onSearch={onSearch} onClear={onClearSearch} />}
      </div>
      <div className="toolbar-right">
        {!tree && (
          <button className="btn btn-primary" onClick={onCreateRoot}>
            Create Root
          </button>
        )}
        {tree && (
          <button className="btn btn-secondary" onClick={() => exportTree(tree)}>
            Export JSON
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => fileRef.current.click()}>
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleImport}
        />
      </div>
    </div>
  );
}
