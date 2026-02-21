const SOCIAL_LABELS = {
  facebook: "Facebook",
  twitter: "X / Twitter",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function ProfileModal({ node, onEdit, onClose, isClosing }) {
  const hasSocial = node.socialLinks && Object.keys(node.socialLinks).length > 0;
  const hasEducation = node.education && node.education.length > 0;

  return (
    <div className={`modal-overlay${isClosing ? " is-closing" : ""}`} onClick={onClose}>
      <div
        className={`modal profile-modal${isClosing ? " is-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-header">
          {node.photoUrl ? (
            <div className="profile-photo">
              <img src={node.photoUrl} alt={node.name} />
            </div>
          ) : (
            <div className="profile-photo profile-photo-empty">
              <span>{node.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <h2 className="profile-name">{node.name}</h2>
          <span className={`profile-gender-badge gender-badge-${node.gender}`}>
            {node.gender}
          </span>
        </div>

        <div className="profile-details">
          {node.birthDate && (
            <div className="profile-row">
              <span className="profile-label">Born</span>
              <span className="profile-value">{formatDate(node.birthDate)}</span>
            </div>
          )}
          {node.deathDate && (
            <div className="profile-row">
              <span className="profile-label">Died</span>
              <span className="profile-value">{formatDate(node.deathDate)}</span>
            </div>
          )}
          {node.marriageDate && (
            <div className="profile-row">
              <span className="profile-label">Married</span>
              <span className="profile-value">{formatDate(node.marriageDate)}</span>
            </div>
          )}
          {node.permanentAddress && (
            <div className="profile-row">
              <span className="profile-label">Permanent Address</span>
              <span className="profile-value">{node.permanentAddress}</span>
            </div>
          )}
          {node.currentAddress && (
            <div className="profile-row">
              <span className="profile-label">Current Address</span>
              <span className="profile-value">{node.currentAddress}</span>
            </div>
          )}
        </div>

        {hasEducation && (
          <div className="profile-section">
            <h4 className="profile-section-title">Education</h4>
            {node.education.map((ed, i) => (
              <div key={i} className="profile-education-item">
                <div className="profile-edu-institution">{ed.institution}</div>
                {ed.degree && <div className="profile-edu-degree">{ed.degree}</div>}
                {ed.year && <div className="profile-edu-year">{ed.year}</div>}
              </div>
            ))}
          </div>
        )}

        {hasSocial && (
          <div className="profile-section">
            <h4 className="profile-section-title">Social Media</h4>
            <div className="profile-social-list">
              {Object.entries(node.socialLinks).map(([platform, url]) => {
                const label = SOCIAL_LABELS[platform] || platform;
                if (!url) return null;
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-social-link"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={() => { onClose(); onEdit(node); }}>
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
