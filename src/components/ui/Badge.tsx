import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'subtle' | 'dark' | 'outline';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'subtle',
  className = '',
  icon
}) => {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-normal transition-colors';

  const variants = {
    subtle: 'bg-[rgba(28,28,28,0.04)] text-[rgba(28,28,28,0.83)] border border-[#eceae4]',
    dark: 'bg-[#1c1c1c] text-[#fcfbf8]',
    outline: 'border border-[rgba(28,28,28,0.4)] text-[#1c1c1c] bg-transparent',
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {icon && <span className="opacity-75">{icon}</span>}
      {children}
    </span>
  );
};
