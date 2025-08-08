import React, { forwardRef } from 'react';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Styles de base
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    // Variantes
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 dark:focus:ring-offset-gray-800',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 dark:focus:ring-offset-gray-800',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 dark:focus:ring-offset-gray-800',
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-gray-500 dark:focus:ring-offset-gray-800',
      outline: 'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-gray-500 dark:focus:ring-offset-gray-800',
    };

    // Tailles
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    // Classes finales
    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    // Gérer les touches clavier
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Permettre Enter et Space pour activer le bouton
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!disabled && !loading) {
          event.currentTarget.click();
        }
      }
    };

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2" aria-hidden="true">
            {icon}
          </span>
        )}
        
        <span>{children}</span>
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2" aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;
