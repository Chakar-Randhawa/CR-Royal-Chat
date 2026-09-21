import React from 'react';
import { ConversationView } from '../chat/ConversationView';
import { RoyalChatMark } from '../common/RoyalChatMark';
import { useApp } from '../../context/AppContext';

export const RoyalChatDesktopDetailPane: React.FC = () => {
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
          <RoyalChatMark size={64} />
        </div>

        <h2 className="text-2xl font-extrabold text-[#202A30] dark:text-[#F4F5F2] tracking-tight">
          Royal Chat for Web
        </h2>
        <p className="text-sm text-[#68747A] dark:text-[#ACB7BD] mt-2 leading-relaxed">
          Send and receive messages in real time, on any device, using just your Royal Chat username.
        </p>
      </div>
    </div>
  );
};
