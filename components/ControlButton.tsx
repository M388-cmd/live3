import React from 'react';

interface ControlButtonProps {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  'aria-label': string;
  // FIX: Add disabled prop to the interface to handle button state.
  disabled?: boolean;
}

export const ControlButton: React.FC<ControlButtonProps> = ({ onClick, className, children, 'aria-label': ariaLabel, disabled }) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      // FIX: Pass disabled prop to the button element.
      disabled={disabled}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white/80 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
};
