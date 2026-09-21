import React, { useState } from 'react';

interface RoyalChatAvatarProps {
  name: string;
  asset?: string | null;
  size?: number;
  online?: boolean;
  className?: string;
}

const AVATAR_PALETTE = [
  'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-200',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200',
];

export const RoyalChatAvatar: React.FC<RoyalChatAvatarProps> = ({
  name,
  asset,
  size = 48,
  online = false,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const initial = name.trim().length > 0 ? name.trim()[0].toUpperCase() : 'R';
  const colorIndex = Math.abs(
    name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % AVATAR_PALETTE.length;

  const resolvedAsset = asset && !imgError ? asset : null;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full font-semibold select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {resolvedAsset ? (
        <img
          src={resolvedAsset}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`w-full h-full rounded-full flex items-center justify-center text-sm font-semibold tracking-wide ${AVATAR_PALETTE[colorIndex]}`}
          style={{ fontSize: size * 0.38 }}
        >
          {initial}
        </div>
      )}

      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-[#329877] ring-2 ring-[#F8F8F5] dark:ring-[#202A30]"
          style={{
            width: Math.max(9, size * 0.22),
            height: Math.max(9, size * 0.22),
          }}
          title="Online"
        />
      )}
    </div>
  );
};
