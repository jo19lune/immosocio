import { Spinner } from '../loading/Spinner';
import type { LoadingStateProps } from './types';

export function LoadingState({ message = 'Chargement en cours...', className = '' }: LoadingStateProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center p-8 min-h-[200px] w-full ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size="lg" className="mb-4" />
      <span className="text-on-surface-variant font-medium text-sm">{message}</span>
    </div>
  );
}
