import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
}

export function Skeleton({
  width,
  height,
  variant = 'rectangular',
  className = ''
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  if (variant === 'text' && !height) {
    style.height = '1.2em';
  }

  return (
    <div
      className={`bg-surface-variant/50 animate-pulse motion-reduce:animate-none ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
