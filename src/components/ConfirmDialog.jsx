export default function ConfirmDialog({ message, onConfirm, onCancel, isClosing }) {
  return (
    <div className={`modal-overlay${isClosing ? " is-closing" : ""}`} onClick={onCancel}>
      <div
        className={`modal confirm-dialog${isClosing ? " is-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
