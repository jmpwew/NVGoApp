import './ConfirmModal.css';

// Reusable confirmation dialog, styled to match the app's existing modals
// (used instead of the native browser confirm()).
//
// Usage:
//   const [confirm, setConfirm] = useState(null); // { onConfirm } or null
//   <ConfirmModal
//     open={!!confirm}
//     title="Mark this report as resolved?"
//     message="The reporter will be notified once every assigned office resolves it."
//     confirmLabel="Resolve"
//     onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
//     onCancel={() => setConfirm(null)}
//   />
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default', // 'default' | 'danger'
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <h3 className="confirm-modal-title">{title}</h3>
        {message && <p className="confirm-modal-message">{message}</p>}
        <div className="confirm-modal-actions">
          <button className="btn-gray" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={tone === 'danger' ? 'btn-red' : 'btn-green'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Please wait...</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}