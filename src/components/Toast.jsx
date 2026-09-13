'use client';

import { useState, useEffect } from 'react';

export default function Toast({ message, type, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type} ${visible ? 'toast-visible' : ''}`}>
      {message}
    </div>
  );
}
