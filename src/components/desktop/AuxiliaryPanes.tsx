import React from 'react';
import { RelayAvatar } from '../common/RelayAvatar';
import { useApp } from '../../context/AppContext';
import { Phone, PhoneIncoming, PhoneOutgoing, Video, Star, Radio } from 'lucide-react';

export const CallsPane: React.FC = () => {
  const { showToast } = useApp();

  const mockCalls = [
    { id: 'c1', name: 'Aisha Rahman', time: 'Today, 14:32', type: 'incoming', video: false, missed: false },
    { id: 'c2', name: 'Mom', time: 'Yesterday, 19:10', type: 'outgoing', video: true, missed: false },
    { id: 'c3', name: 'Sami Ahmed', time: 'Monday, 11:24', type: 'incoming', video: false, missed: true },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8F8F5] dark:bg-[#141B20] border-r border-[#E2E7EC] dark:border-[#354148]">
      <div className="p-4 bg-white dark:bg-[#202A30] border-b border-[#E2E7EC] dark:border-[#354148]">
        <h2 className="text-xl font-bold text-[#202A30] dark:text-[#F4F5F2]">Calls</h2>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-[#E2E7EC] dark:divide-[#354148]">
        {mockCalls.map((c) => (
          <div
            key={c.id}
            onClick={() => showToast(`Calling ${c.name}...`, 'info')}
            className="flex items-center justify-between p-3.5 hover:bg-stone-100 dark:hover:bg-[#182026] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <RelayAvatar name={c.name} size={42} />
              <div>
                <div className={`text-sm font-semibold ${c.missed ? 'text-red-500' : 'text-[#202A30] dark:text-[#F4F5F2]'}`}>
                  {c.name}
                </div>
                <div className="flex items-center gap-1 text-xs text-[#8C9BA5]">
                  {c.type === 'incoming' ? (
                    <PhoneIncoming className="w-3 h-3 text-[#10B981]" />
                  ) : (
                    <PhoneOutgoing className="w-3 h-3 text-sky-500" />
                  )}
                  <span>{c.time}</span>
                </div>
              </div>
            </div>
            {c.video ? (
              <Video className="w-4 h-4 text-[#68747A]" />
            ) : (
              <Phone className="w-4 h-4 text-[#68747A]" />
            )}
          </div>
        ))}
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
  const { currentUser, showToast } = useApp();

  const statuses = [
    { name: 'Aisha Rahman', time: '18 minutes ago', text: 'Sunset over Sylhet 🌇' },
    { name: 'Rafi', time: '2 hours ago', text: 'Developing new film 🎞️' },
    { name: 'Sami Ahmed', time: 'Today, 10:00', text: 'In the recording studio 🎧' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8F8F5] dark:bg-[#141B20] border-r border-[#E2E7EC] dark:border-[#354148]">
      <div className="p-4 bg-white dark:bg-[#202A30] border-b border-[#E2E7EC] dark:border-[#354148]">
        <h2 className="text-xl font-bold text-[#202A30] dark:text-[#F4F5F2]">Status</h2>
      </div>
      <div className="p-3.5 border-b border-[#E2E7EC] dark:border-[#354148] flex items-center gap-3">
        <div className="relative">
          <RelayAvatar name={currentUser.displayName} size={44} />
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#F05D48] text-white rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white">
            +
          </span>
        </div>
        <div
          onClick={() => showToast('Status update published', 'check')}
          className="cursor-pointer"
        >
          <div className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
            My status
          </div>
          <div className="text-xs text-[#8C9BA5]">Tap to add status update</div>
        </div>
      </div>
      <div className="p-3 text-[11px] font-bold text-[#8C9BA5] uppercase tracking-wider">
        Recent updates
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-[#E2E7EC] dark:divide-[#354148]">
        {statuses.map((s) => (
          <div
            key={s.name}
            onClick={() => showToast(`Viewing ${s.name}’s status: "${s.text}"`, 'info')}
            className="flex items-center gap-3 p-3.5 hover:bg-stone-100 dark:hover:bg-[#182026] cursor-pointer"
          >
            <div className="ring-2 ring-[#F05D48] ring-offset-2 ring-offset-[#F8F8F5] dark:ring-offset-[#141B20] rounded-full">
              <RelayAvatar name={s.name} size={40} />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                {s.name}
              </div>
              <div className="text-xs text-[#8C9BA5]">{s.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
