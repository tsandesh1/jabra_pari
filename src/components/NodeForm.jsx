import { useState, useRef } from "react";

const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/..." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
];

function emptyEducation() {
  return { institution: "", degree: "", year: "" };
}

export default function NodeForm({ node, onSubmit, onCancel, title, isClosing }) {
  const [name, setName] = useState(node?.name || "");
  const [birthDate, setBirthDate] = useState(node?.birthDate || "");
  const [deathDate, setDeathDate] = useState(node?.deathDate || "");
  const [marriageDate, setMarriageDate] = useState(node?.marriageDate || "");
  const [gender, setGender] = useState(node?.gender || "other");
  const [photoUrl, setPhotoUrl] = useState(node?.photoUrl || null);
  const [socialLinks, setSocialLinks] = useState(node?.socialLinks || {});
  const [permanentAddress, setPermanentAddress] = useState(node?.permanentAddress || "");
  const [currentAddress, setCurrentAddress] = useState(node?.currentAddress || "");
  const [education, setEducation] = useState(
    node?.education?.length ? node.education : []
  );
  const [showSocial, setShowSocial] = useState(
    () => node?.socialLinks && Object.values(node.socialLinks).some(Boolean)
  );
  const [showAddresses, setShowAddresses] = useState(
    () => !!(node?.permanentAddress || node?.currentAddress)
  );
  const [showEducation, setShowEducation] = useState(
    () => node?.education?.length > 0
  );
  const fileRef = useRef();

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Photo must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleSocialChange(key, value) {
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
  }

  function handleEducationChange(index, field, value) {
    setEducation((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addEducationEntry() {
    setEducation((prev) => [...prev, emptyEducation()]);
  }

  function removeEducationEntry(index) {
    setEducation((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const cleanLinks = {};
    for (const [k, v] of Object.entries(socialLinks)) {
      if (v && v.trim()) cleanLinks[k] = v.trim();
    }
    const cleanEducation = education.filter(
      (ed) => ed.institution.trim() || ed.degree.trim() || ed.year
    );
    onSubmit({
      name: name.trim(),
      birthDate: birthDate || null,
      deathDate: deathDate || null,
      marriageDate: marriageDate || null,
      gender,
      photoUrl: photoUrl || null,
      socialLinks: Object.keys(cleanLinks).length > 0 ? cleanLinks : {},
      permanentAddress: permanentAddress.trim() || null,
      currentAddress: currentAddress.trim() || null,
      education: cleanEducation,
    });
  }

  return (
    <div className={`modal-overlay${isClosing ? " is-closing" : ""}`} onClick={onCancel}>
      <div
        className={`modal node-form${isClosing ? " is-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title || "Add Person"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="photo-upload-section">
            <div
              className="photo-preview"
              onClick={() => fileRef.current.click()}
              title="Click to upload photo"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Photo" />
              ) : (
                <span className="photo-placeholder">+</span>
              )}
            </div>
            {photoUrl && (
              <button
                type="button"
                className="photo-remove"
                onClick={() => setPhotoUrl(null)}
              >
                Remove photo
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            />
          </div>

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
            Birth Date
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </label>
          <label>
            Death Date
            <input
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              placeholder="Leave empty if alive"
            />
          </label>
          <label>
            Marriage Date
            <input
              type="date"
              value={marriageDate}
              onChange={(e) => setMarriageDate(e.target.value)}
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

          {/* Addresses section */}
          <button
            type="button"
            className="btn btn-secondary section-toggle"
            onClick={() => setShowAddresses(!showAddresses)}
          >
            {showAddresses ? "Hide addresses" : "Add addresses"}
          </button>

          {showAddresses && (
            <div className="section-fields">
              <label>
                Permanent Address
                <input
                  type="text"
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  placeholder="e.g. 123 Main St, City, Country"
                />
              </label>
              <label>
                Current Address
                <input
                  type="text"
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  placeholder="e.g. 456 Oak Ave, City, Country"
                />
              </label>
            </div>
          )}

          {/* Education section */}
          <button
            type="button"
            className="btn btn-secondary section-toggle"
            onClick={() => {
              setShowEducation(!showEducation);
              if (!showEducation && education.length === 0) {
                addEducationEntry();
              }
            }}
          >
            {showEducation ? "Hide education" : "Add education"}
          </button>

          {showEducation && (
            <div className="section-fields">
              {education.map((ed, i) => (
                <div key={i} className="education-entry">
                  <div className="education-header">
                    <span className="education-label">Education {i + 1}</span>
                    <button
                      type="button"
                      className="education-remove"
                      onClick={() => removeEducationEntry(i)}
                    >
                      &times;
                    </button>
                  </div>
                  <label>
                    Institution
                    <input
                      type="text"
                      value={ed.institution}
                      onChange={(e) => handleEducationChange(i, "institution", e.target.value)}
                      placeholder="e.g. MIT"
                    />
                  </label>
                  <label>
                    Degree
                    <input
                      type="text"
                      value={ed.degree}
                      onChange={(e) => handleEducationChange(i, "degree", e.target.value)}
                      placeholder="e.g. B.S. Computer Science"
                    />
                  </label>
                  <label>
                    Year
                    <input
                      type="number"
                      value={ed.year}
                      onChange={(e) => handleEducationChange(i, "year", e.target.value)}
                      placeholder="e.g. 2010"
                    />
                  </label>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addEducationEntry}
                style={{ fontSize: "0.8rem" }}
              >
                + Add another
              </button>
            </div>
          )}

          {/* Social links section */}
          <button
            type="button"
            className="btn btn-secondary section-toggle"
            onClick={() => setShowSocial(!showSocial)}
          >
            {showSocial ? "Hide social links" : "Add social links"}
          </button>

          {showSocial && (
            <div className="section-fields">
              {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
                <label key={key}>
                  {label}
                  <input
                    type="url"
                    value={socialLinks[key] || ""}
                    onChange={(e) => handleSocialChange(key, e.target.value)}
                    placeholder={placeholder}
                  />
                </label>
              ))}
            </div>
          )}

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
