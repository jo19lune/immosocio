import { CheckCircle2 } from 'lucide-react';
import type { SuccessStateProps } from './types';

export function SuccessState({ 
  title = 'Opération réussie', 
  message, 
  icon,
  className = '' 
}: SuccessStateProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center p-8 text-center min-h-[200px] w-full bg-success/5 rounded-xl border border-success/20 ${className}`}
      role="status"
    >
      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4 text-success">
        {icon || <CheckCircle2 className="w-8 h-8" aria-hidden="true" />}
      </div>
      <h3 className="text-success-dark font-bold mb-2 text-lg">{title}</h3>
      {message && <p className="text-on-surface-variant max-w-sm text-sm">{message}</p>}
    </div>
  );
}
