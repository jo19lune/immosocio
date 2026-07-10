
export interface ProgressBarProps {
  value?: number;
  indeterminate?: boolean;
  color?: 'primary' | 'secondary' | 'error';
  className?: string;
}

export function ProgressBar({
  value = 0,
  indeterminate = false,
  color = 'primary',
  className = ''
}: ProgressBarProps) {
  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    error: 'bg-error',
  };

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <>
      {indeterminate && (
        <style>
          {`
            @keyframes indeterminate-progress {
              0% { transform: translateX(-100%) scaleX(0.2); }
              50% { transform: translateX(0%) scaleX(0.5); }
              100% { transform: translateX(100%) scaleX(0.2); }
            }
          `}
        </style>
      )}
      <div 
        className={`w-full h-1 bg-surface-variant overflow-hidden rounded-full ${className}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuetext={indeterminate ? "Chargement en cours" : undefined}
      >
        <div
          className={`h-full rounded-full ${colorClasses[color]} ${
            indeterminate 
              ? 'w-full' 
              : 'transition-all duration-300 ease-in-out'
          }`}
          style={{
            ...(indeterminate 
                ? { animation: 'indeterminate-progress 1.5s infinite linear' }
                : { width: `${clampedValue}%` }
               ),
             transformOrigin: 'left'
          }}
        />
      </div>
    </>
  );
}
