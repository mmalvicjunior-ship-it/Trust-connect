'use client';

import { useState, useId } from 'react';

export default function PasswordField({ id, name, value, onChange, placeholder, required, minLength, label, withIcon = true }) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className={`form-group ${withIcon ? 'form-group-icon' : ''}`}>
      {label && (
        <label htmlFor={inputId}>
          {withIcon && <i className="fas fa-lock"></i>}
          <span>{label}</span>
        </label>
      )}
      <div className="pw-wrap">
        <input
          type={visible ? 'text' : 'password'}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={visible ? 'off' : 'current-password'}
          className="pw-input"
        />
        <button
          type="button"
          className="pw-toggle"
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
        >
          <i className={visible ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
        </button>
      </div>
    </div>
  );
}