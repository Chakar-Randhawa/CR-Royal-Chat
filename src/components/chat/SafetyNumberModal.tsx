import React, { useState } from 'react';
import { X, ShieldCheck, Check, QrCode } from 'lucide-react';
import { RelayAvatar } from '../common/RelayAvatar';
import { RelayButton } from '../common/RelayButton';

interface SafetyNumberModalProps {
  contactName: string;
  avatarAsset?: string | null;
  onClose: () => void;
}

export const SafetyNumberModal: React.FC<SafetyNumberModalProps> = ({
  contactName,
  avatarAsset,
  onClose,
}) => {
  const [verified, setVerified] = useState(false);

  // Deterministic 60-digit safety fingerprint
  const numberBlocks = [
    '38291', '04928', '19402', '84729',
    '91038', '29481', '02948', '19482',
    '73910', '48291', '03829', '48192',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F8F8F5] dark:bg-[#141B20] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#E2E7EC] dark:border-[#354148] relative flex flex-col items-center text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#68747A] hover:text-[#202A30] dark:hover:text-white rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative mt-2 mb-3">
          <RelayAvatar name={contactName} asset={avatarAsset} size={64} />
          <div className="absolute -bottom-1 -right-1 bg-[#10B981] p-1.5 rounded-full text-white ring-2 ring-white dark:ring-[#141B20]">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-[#202A30] dark:text-[#F4F5F2]">
          Verify safety number
        </h3>
        <p className="text-xs text-[#68747A] dark:text-[#ACB7BD] mt-1 max-w-[260px]">
          Compare this 60-digit number with {contactName}’s device to verify end-to-end encryption.
        </p>

        {/* QR Code visual preview */}
        <div className="my-4 p-3 bg-white rounded-2xl border border-[#E2E7EC] dark:border-[#354148] shadow-xs">
          <div className="w-32 h-32 flex flex-col items-center justify-center relative bg-stone-50 rounded-xl overflow-hidden">
            {/* Clean SVG QR code representation */}
            <svg viewBox="0 0 100 100" className="w-28 h-28 fill-[#202A30]">
              <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z" />
              <path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z" />
              <path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z" />
              <rect x="45" y="10" width="5" height="20" />
              <rect x="10" y="45" width="20" height="5" />
              <rect x="45" y="45" width="10" height="10" />
              <rect x="60" y="55" width="25" height="5" />
              <rect x="55" y="70" width="10" height="20" />
              <rect x="75" y="75" width="15" height="15" />
              <circle cx="50" cy="50" r="3" fill="#F05D48" />
            </svg>
          </div>
        </div>

        {/* 60-digit blocks grid */}
        <div className="grid grid-cols-4 gap-x-2 gap-y-1 bg-white dark:bg-[#202A30] p-3.5 rounded-2xl border border-[#E2E7EC] dark:border-[#354148] w-full text-center">
          {numberBlocks.map((block, idx) => (
            <span
              key={idx}
              className="font-mono text-xs text-[#202A30] dark:text-[#F4F5F2] font-semibold tracking-wider"
            >
              {block}
            </span>
          ))}
        </div>

        <div className="mt-5 w-full">
          <RelayButton
            variant={verified ? 'secondary' : 'primary'}
            onClick={() => setVerified(!verified)}
            icon={verified ? <Check className="w-4 h-4 text-[#10B981]" /> : undefined}
          >
            {verified ? 'Verified with peer' : 'Mark as verified'}
          </RelayButton>
        </div>
      </div>
    </div>
  );
};
