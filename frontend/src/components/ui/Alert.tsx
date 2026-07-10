import React from 'react';

interface AlertProps {
  type?: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: React.ReactNode;
  icon?: string;
  className?: string;
}

export function Alert({
  type = 'info',
  title,
  message,
  icon,
  className = '',
}: AlertProps) {
  const styles = {
    success: 'alert-success',
    error: 'alert-error',
    info: 'alert-info',
    warning: 'alert-warning',
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning',
  };

  const iconName = icon || icons[type];

  return (
    <div className={`alert ${styles[type]} ${className}`}>
      <span className="material-symbols-outlined shrink-0">
        {iconName}
      </span>
      <div className="flex flex-col">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div className="text-body-sm opacity-90">{message}</div>
      </div>
    </div>
  );
}
