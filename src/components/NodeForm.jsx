import { useState } from "react";

export default function NodeForm({ node, onSubmit, onCancel, title }) {
  const [name, setName] = useState(node?.name || "");
  const [birthYear, setBirthYear] = useState(node?.birthYear || "");
  const [deathYear, setDeathYear] = useState(node?.deathYear || "");
  const [gender, setGender] = useState(node?.gender || "other");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      birthYear: birthYear ? Number(birthYear) : null,
      deathYear: deathYear ? Number(deathYear) : null,
      gender,
    });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal node-form" onClick={(e) => e.stopPropagation()}>
        <h3>{title || "Add Person"}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </label>
          <label>
            Birth Year
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="e.g. 1950"
            />
          </label>
          <label>
            Death Year
            <input
              type="number"
              value={deathYear}
              onChange={(e) => setDeathYear(e.target.value)}
              placeholder="Leave empty if alive"
            />
          </label>
          <label>
            Gender
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {node ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
