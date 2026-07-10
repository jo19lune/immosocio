import React from 'react';

export interface StateProps {
  className?: string;
}

export interface LoadingStateProps extends StateProps {
  message?: string;
  delayMs?: number;
  minDisplayMs?: number;
}

export interface ErrorStateProps extends StateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export interface EmptyStateProps extends StateProps {
  icon?: React.ReactNode | string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export interface SuccessStateProps extends StateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export interface StateManagerProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  isSuccess?: boolean;
  
  loadingProps?: LoadingStateProps;
  errorProps?: ErrorStateProps;
  emptyProps?: EmptyStateProps;
  successProps?: SuccessStateProps;
  
  children: React.ReactNode;
}
