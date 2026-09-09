import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

/**
 * MutationToast — success/error toast notification
 * Props: { toast: { type: 'success'|'error', message: string } | null, onDismiss }
 */
export default function MutationToast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      className="mutation-toast"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        borderColor: isSuccess ? 'rgba(52, 211, 153, 0.5)' : 'rgba(239, 68, 68, 0.5)',
        background: isSuccess ? 'rgba(6, 26, 18, 0.97)' : 'rgba(26, 6, 6, 0.97)'
      }}
    >
      {isSuccess
        ? <CheckCircle size={15} color="var(--app-color)" />
        : <XCircle size={15} color="#ef4444" />
      }
      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>
        {toast.message}
      </span>
      <button className="btn-icon" onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}>
        <X size={12} />
      </button>
    </div>
  );
}
