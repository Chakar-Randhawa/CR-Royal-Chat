import React from 'react';
import { DeliveryStage } from '../../types';

interface RelayReceiptProps {
  stage?: DeliveryStage;
  size?: number;
  className?: string;
}

export const RelayReceipt: React.FC<RelayReceiptProps> = ({
  stage = 'sent',
  size = 15,
  className = '',
}) => {
  if (stage === 'sending') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`opacity-75 ${className}`}
        aria-label="Sending"
      >
        <circle cx="8" cy="8" r="6" />
        <polyline points="8 4.5 8 8 10.5 9.5" />
      </svg>
    );
  }

  if (stage === 'sent') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`opacity-80 ${className}`}
        aria-label="Sent"
      >
        <polyline points="3 8.5 6.5 11.5 13 4.5" />
      </svg>
    );
  }

  if (stage === 'delivered') {
    return (
      <svg
        width={size + 3}
        height={size}
        viewBox="0 0 19 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`opacity-80 ${className}`}
        aria-label="Delivered"
      >
        <polyline points="2 8.5 5.5 11.5 12 4.5" />
        <polyline points="7 8.5 10.5 11.5 17 4.5" />
      </svg>
    );
  }

  // read - bright blue
  return (
    <svg
      width={size + 3}
      height={size}
      viewBox="0 0 19 16"
      fill="none"
      stroke="#2563EB"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-[#2563EB] dark:text-[#82B7F5] ${className}`}
      aria-label="Read"
    >
      <polyline points="2 8.5 5.5 11.5 12 4.5" />
      <polyline points="7 8.5 10.5 11.5 17 4.5" />
    </svg>
  );
};
