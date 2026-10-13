import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'cream' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-normal transition-all duration-150 select-none focus-warm disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-[13px] px-3 py-1.5 rounded-[6px]',
    md: 'text-[15px] px-4 py-2 rounded-[6px]',
    lg: 'text-[16px] px-5 py-2.5 rounded-[6px]',
  };

  const variantStyles = {
    primary: 'bg-[#1c1c1c] text-[#fcfbf8] shadow-button-inset hover:opacity-95 active:opacity-80',
    ghost: 'bg-transparent text-[#1c1c1c] border border-[rgba(28,28,28,0.4)] hover:bg-[rgba(28,28,28,0.04)] active:opacity-80',
    cream: 'bg-[#f7f4ed] text-[#1c1c1c] hover:bg-[#eceae4] border border-[#eceae4] active:opacity-80',
    pill: 'bg-[#f7f4ed] text-[#1c1c1c] rounded-full border border-[#eceae4] shadow-button-inset hover:bg-[#f0ede5] active:opacity-80',
  };

  const chosenSize = variant === 'pill' ? 'px-3 py-1.5 text-[14px]' : sizeStyles[size];

  return (
    <button
      className={`${baseStyles} ${chosenSize} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
