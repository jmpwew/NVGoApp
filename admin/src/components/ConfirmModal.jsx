import { useEffect } from 'react';
import './ConfirmModal.css';


export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default', //default or dangerr
  loading = false,
  onConfirm,
  onCancel,
}) {
 
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !loading) onCancel?.();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

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