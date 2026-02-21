import { useState } from "react";

export default function SearchBar({ onSearch, onClear }) {
  const [query, setQuery] = useState("");

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) {
      onSearch(val.trim());
    } else {
      onClear();
    }
  }

  function handleClear() {
    setQuery("");
    onClear();
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search by name..."
        value={query}
        onChange={handleChange}
      />
      {query && (
        <button className="search-clear" onClick={handleClear}>
          &times;
        </button>
      )}
    </div>
  );
}
