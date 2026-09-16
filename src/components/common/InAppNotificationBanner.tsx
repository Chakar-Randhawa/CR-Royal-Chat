import React from 'react';
import { useApp } from '../../context/AppContext';
import { RelayAvatar } from './RelayAvatar';
import { X } from 'lucide-react';

export const InAppNotificationBanner: React.FC = () => {
  const { inAppNotification, dismissInAppNotification, setActiveConversationId, markConversationRead } = useApp();

  if (!inAppNotification) return null;

  const handleClick = () => {
    setActiveConversationId(inAppNotification.chatId);
    markConversationRead(inAppNotification.chatId);
    dismissInAppNotification();
  };

  return (
    <div className="fixed top-3 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-top-4 duration-200">
      <div
        onClick={handleClick}
        className="flex items-center gap-3 p-3 bg-white dark:bg-[#202A30] rounded-2xl shadow-xl border border-[#E2E7EC] dark:border-[#354148] cursor-pointer hover:shadow-2xl transition-all"
      >
        <RelayAvatar
          name={inAppNotification.senderName}
          asset={inAppNotification.avatarUrl}
          size={42}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#202A30] dark:text-[#F4F5F2] truncate">
              {inAppNotification.senderName}
            </span>
            <span className="text-[10px] text-[#68747A] dark:text-[#ACB7BD]">
              {inAppNotification.timestamp}
            </span>
          </div>
          <p className="text-xs text-[#68747A] dark:text-[#ACB7BD] truncate mt-0.5">
            {inAppNotification.text}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            dismissInAppNotification();
          }}
          className="p-1 text-[#8C9BA5] hover:text-[#202A30] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
