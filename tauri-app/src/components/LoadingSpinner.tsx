import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'gray' | 'white';
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  text,
  variant = 'spinner',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses = {
    blue: 'text-blue-500',
    gray: 'text-gray-500',
    white: 'text-white',
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div
              className={`${sizeClasses[size]} ${colorClasses[color]} animate-bounce`}
            >
              <div className="w-full h-full bg-current rounded-full"></div>
            </div>
            <div
              className={`${sizeClasses[size]} ${colorClasses[color]} animate-bounce`}
              style={{ animationDelay: '0.1s' }}
            >
              <div className="w-full h-full bg-current rounded-full"></div>
            </div>
            <div
              className={`${sizeClasses[size]} ${colorClasses[color]} animate-bounce`}
              style={{ animationDelay: '0.2s' }}
            >
              <div className="w-full h-full bg-current rounded-full"></div>
            </div>
          </div>
        );

      case 'pulse':
        return (
          <div
            className={`${sizeClasses[size]} ${colorClasses[color]} animate-pulse`}
          >
            <div className="w-full h-full bg-current rounded-full"></div>
          </div>
        );

      default:
        return (
          <div
            className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
          >
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {renderSpinner()}
      {text && (
        <p className={`text-sm ${colorClasses[color]} animate-pulse`}>{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
