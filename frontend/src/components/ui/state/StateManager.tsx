import { useDelayedLoading } from '../../../hooks/useDelayedLoading';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { SuccessState } from './SuccessState';
import type { StateManagerProps } from './types';

export function StateManager({
  isLoading = false,
  isError = false,
  isEmpty = false,
  isSuccess = false,
  loadingProps,
  errorProps,
  emptyProps,
  successProps,
  children
}: StateManagerProps) {
  // Use delayed loading to prevent flickering
  const showLoading = useDelayedLoading(
    isLoading, 
    loadingProps?.delayMs ?? 200, 
    loadingProps?.minDisplayMs ?? 500
  );

  if (showLoading) {
    return <LoadingState {...loadingProps} />;
  }

  if (isError) {
    return <ErrorState {...errorProps} />;
  }

  if (isSuccess && successProps) {
    return <SuccessState {...successProps} />;
  }

  if (isEmpty && emptyProps) {
    return <EmptyState {...emptyProps} />;
  }

  return <>{children}</>;
}
