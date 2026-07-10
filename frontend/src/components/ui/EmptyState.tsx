import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-lg rounded-xl border border-dashed border-outline bg-surface-container-low/50 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-md shadow-sm border border-outline text-primary">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <h3 className="mb-xs">{title}</h3>
      {description && (
        <p className="text-on-surface-variant max-w-sm mb-lg text-body-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
