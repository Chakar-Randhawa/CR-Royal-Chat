import React from 'react';
import { useApp } from '../../context/AppContext';
import { Phone, Radio } from 'lucide-react';

export const CallsPane: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#F8F8F5] dark:bg-[#141B20] border-r border-[#E2E7EC] dark:border-[#354148]">
      <div className="p-4 bg-white dark:bg-[#202A30] border-b border-[#E2E7EC] dark:border-[#354148]">
        <h2 className="text-xl font-bold text-[#202A30] dark:text-[#F4F5F2]">Calls</h2>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-stone-200/70 dark:bg-[#182026] flex items-center justify-center mb-3">
          <Phone className="w-6 h-6 text-[#8C9BA5]" />
        </div>
        <p className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
          No call history yet
        </p>
        <p className="text-xs text-[#8C9BA5] mt-1 max-w-[240px]">
          Open a one-to-one chat and tap the phone or video icon to start a real call. Group calling isn't supported yet.
        </p>
      </div>
    </div>
  );
};

export const StarredPane: React.FC = () => {
  const { messages, conversations, setActiveConversationId } = useApp();

  const starredList: { msgText: string; time: string; sender: string; convoId: string }[] = [];

  Object.entries(messages).forEach(([convoId, list]) => {
    const convo = conversations.find((c) => c.id === convoId);
    list.forEach((m) => {
      if (m.isStarred) {
        starredList.push({
          msgText: m.text || (m.kind === 'voice' ? 'Voice note' : 'Photo'),
          time: m.sentAt,
          sender: m.isMine ? 'You' : convo?.name || 'Contact',
          convoId,
        });
      }
    });
  });

  return (
    <div className="flex flex-col h-full bg-[#F8F8F5] dark:bg-[#141B20] border-r border-[#E2E7EC] dark:border-[#354148]">
      <div className="p-4 bg-white dark:bg-[#202A30] border-b border-[#E2E7EC] dark:border-[#354148]">
        <h2 className="text-xl font-bold text-[#202A30] dark:text-[#F4F5F2]">Starred Messages</h2>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-[#E2E7EC] dark:divide-[#354148]">
        {starredList.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8C9BA5]">
            No starred messages yet. Long-press or click the menu on any message to star it.
          </div>
        ) : (
          starredList.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setActiveConversationId(item.convoId)}
              className="p-3.5 hover:bg-stone-100 dark:hover:bg-[#182026] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#F05D48]">
                  {item.sender}
                </span>
                <span className="text-[10px] text-[#8C9BA5]">{item.time}</span>
              </div>
              <p className="text-sm text-[#202A30] dark:text-[#F4F5F2] line-clamp-2">
                {item.msgText}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const StatusPane: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#F8F8F5] dark:bg-[#141B20] border-r border-[#E2E7EC] dark:border-[#354148]">
      <div className="p-4 bg-white dark:bg-[#202A30] border-b border-[#E2E7EC] dark:border-[#354148]">
        <h2 className="text-xl font-bold text-[#202A30] dark:text-[#F4F5F2]">Status</h2>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-stone-200/70 dark:bg-[#182026] flex items-center justify-center mb-3">
          <Radio className="w-6 h-6 text-[#8C9BA5]" />
        </div>
        <p className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
          Status updates aren't available yet
        </p>
        <p className="text-xs text-[#8C9BA5] mt-1 max-w-[220px]">
          This is planned for a future update.
        </p>
      </div>
    </div>
  );
};
