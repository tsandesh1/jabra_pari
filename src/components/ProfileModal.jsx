import { getNodeImage } from "../utils/avatarUtils";

const SOCIAL_LABELS = {
  facebook: "Facebook",
  twitter: "X / Twitter",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value + "T00:00:00");
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatYears(node) {
  const birth = node.birthDate ? new Date(node.birthDate + "T00:00:00").getFullYear() : null;
  const death = node.deathDate ? new Date(node.deathDate + "T00:00:00").getFullYear() : null;
  if (!birth && !death) return null;
  const parts = [birth, death || (birth ? "present" : null)].filter(Boolean);
  return parts.join(" - ");
}

function readableGender(gender) {
  if (!gender) return "Other";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function formatSpouse(spouse) {
  if (!spouse?.name) return "-";
  const spouseGender = readableGender(spouse.gender);
  return `${spouse.name} (${spouseGender})`;
}

export default function ProfileModal({ node, onEdit, onClose, isClosing }) {
  if (!node) return null;

  const years = formatYears(node);
  const socials = Object.entries(node.socialLinks || {}).filter(([, url]) => url);
  const image = getNodeImage(node);

  return (
    <div className={`modal-overlay${isClosing ? " is-closing" : ""}`} onClick={onClose}>
      <div
        className={`modal profile-modal${isClosing ? " is-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-header">
          <div className="profile-photo">
            <img src={image} alt={node.name} />
          </div>
          <h3 className="profile-name">{node.name}</h3>
          <span className={`profile-gender-badge gender-badge-${node.gender || "other"}`}>
            {readableGender(node.gender)}
          </span>
          {years && <div className="node-years">{years}</div>}
        </div>

        <div className="profile-details">
          <div className="profile-row">
            <span className="profile-label">Birth Date</span>
            <span className="profile-value">{formatDate(node.birthDate)}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Death Date</span>
            <span className="profile-value">{formatDate(node.deathDate)}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Marriage Date</span>
            <span className="profile-value">{formatDate(node.marriageDate)}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Spouse</span>
            <span className="profile-value">{formatSpouse(node.spouse)}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Permanent Address</span>
            <span className="profile-value">{node.permanentAddress || "-"}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Current Address</span>
            <span className="profile-value">{node.currentAddress || "-"}</span>
          </div>
        </div>

        {node.education?.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title">Education</div>
            {node.education.map((entry, index) => (
              <div key={index} className="profile-education-item">
                <div className="profile-edu-institution">{entry.institution || "-"}</div>
                <div className="profile-edu-degree">{entry.degree || "-"}</div>
                <div className="profile-edu-year">{entry.year || "-"}</div>
              </div>
            ))}
          </div>
        )}

        {socials.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-title">Social Links</div>
            <div className="profile-social-list">
              {socials.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-social-link"
                >
                  {SOCIAL_LABELS[platform] || platform}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onEdit(node)}>
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
