import { useEffect } from 'react';

// Simple auto-dismissing toast. Usage:
//   const [toast, setToast] = useState(null); // { type: 'success'|'error', text }
//   setToast({ type: 'success', text: 'Saved.' });
//   <Toast toast={toast} onClose={() => setToast(null)} />
export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`}>
      <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
      {toast.text}
    </div>
  );
}
