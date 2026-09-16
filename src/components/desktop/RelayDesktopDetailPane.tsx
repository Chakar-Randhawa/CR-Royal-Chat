import React from 'react';
import { ConversationView } from '../chat/ConversationView';
import { RelayMark } from '../common/RelayMark';
import { Lock, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RelayDesktopDetailPane: React.FC = () => {
  const { activeConversationId, conversations } = useApp();

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  if (activeConversation) {
    return <ConversationView conversation={activeConversation} />;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F8F8F5] dark:bg-[#141B20] text-center select-none border-l border-[#E2E7EC] dark:border-[#354148]">
      <div className="flex flex-col items-center max-w-sm">
        <div className="p-4 bg-white dark:bg-[#202A30] rounded-3xl shadow-sm border border-[#E2E7EC] dark:border-[#354148] mb-5">
          <RelayMark size={64} />
        </div>

        <h2 className="text-2xl font-extrabold text-[#202A30] dark:text-[#F4F5F2] tracking-tight">
          Relay for Web
        </h2>
        <p className="text-sm text-[#68747A] dark:text-[#ACB7BD] mt-2 leading-relaxed">
          Send and receive messages without keeping your phone online. Every message is secured with zero-knowledge end-to-end encryption.
        </p>

        <div className="flex items-center gap-2 mt-8 text-xs font-semibold text-[#8C9BA5] bg-white dark:bg-[#202A30] px-4 py-2 rounded-full border border-[#E2E7EC] dark:border-[#354148] shadow-2xs">
          <Lock className="w-3.5 h-3.5 text-[#10B981]" />
          <span>End-to-end encrypted · X25519 & AES-256-GCM</span>
        </div>
      </div>
    </div>
  );
};
