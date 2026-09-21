import React from 'react';

interface RoyalChatButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const RoyalChatButton: React.FC<RoyalChatButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = true,
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[36px]',
    md: 'px-4 py-2.5 text-sm gap-2 min-h-[44px]',
    lg: 'px-5 py-3 text-base gap-2.5 min-h-[50px]',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#F05D48] hover:bg-[#C83E2B] text-white shadow-sm shadow-[#F05D48]/20',
    secondary:
      'bg-[#EAEFF5] dark:bg-[#202A30] text-[#202A30] dark:text-[#F4F5F2] hover:bg-[#E2E7EC] dark:hover:bg-[#2B3740] border border-[#E2E7EC] dark:border-[#354148]',
    danger:
      'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20',
    ghost:
      'text-[#68747A] dark:text-[#ACB7BD] hover:bg-black/5 dark:hover:bg-white/5',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
