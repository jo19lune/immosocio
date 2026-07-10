import { Loader2 } from 'lucide-react';
import type { LoadingStateProps } from './types';

export function LoadingState({ message = 'Chargement en cours...', className = '' }: LoadingStateProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center p-8 min-h-[200px] w-full ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" aria-hidden="true" />
      <span className="text-on-surface-variant font-medium text-sm">{message}</span>
    </div>
  );
}
