import { AlertTriangle, RefreshCcw } from 'lucide-react';
import type { ErrorStateProps } from './types';

export function ErrorState({ 
  title = 'Une erreur est survenue', 
  message = 'Nous n\'avons pas pu charger les données. Veuillez réessayer.', 
  onRetry, 
  retryText = 'Réessayer',
  className = '' 
}: ErrorStateProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center p-8 text-center min-h-[200px] w-full bg-error-container/10 rounded-xl border border-error/20 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-error" aria-hidden="true" />
      </div>
      <h3 className="text-error font-bold mb-2 text-lg">{title}</h3>
      <p className="text-on-surface-variant max-w-sm mb-6 text-sm">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <RefreshCcw className="w-4 h-4" aria-hidden="true" />
          {retryText}
        </button>
      )}
    </div>
  );
}
