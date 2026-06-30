import React from 'react';

interface SkeletonProps {
  className?: string;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', circle = false }) => {
  return (
    <div 
      className={`skeleton bg-muted ${circle ? 'rounded-full' : 'rounded-md'} ${className}`} 
      aria-hidden="true"
    />
  );
};

export default Skeleton;
