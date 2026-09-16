import React from 'react';

interface RelayMarkProps {
  size?: number;
  className?: string;
}

export const RelayMark: React.FC<RelayMarkProps> = ({ size = 36, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <rect width="512" height="512" rx="132" fill="#202A30" />
      <path
        d="M154 379V138H266C348 138 369 184 369 220C369 261 333 287 271 287H184"
        stroke="#FFFFFF"
        strokeWidth="54"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M261 287L374 384"
        stroke="#F17D6C"
        strokeWidth="54"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
