import React, { useState } from 'react';
import { Conversation, InboxFilter } from '../../types';
import { RoyalChatAvatar } from '../common/RoyalChatAvatar';
import { RoyalChatMark } from '../common/RoyalChatMark';
import { RoyalChatReceipt } from '../common/RoyalChatReceipt';
import { NewChatModal } from './NewChatModal';
import {
  Search,
  X,
  Pin,
  PinOff,
  VolumeX,
  Volume2,
  Mic,
  Image as ImageIcon,
  SquarePen,
  Settings as SettingsIcon,
  MoreVertical,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ChatListPageProps {
  onOpenSettings?: () => void;
  isDesktopDetailEmpty?: boolean;
}

export const ChatListPage: React.FC<ChatListPageProps> = ({
  onOpenSettings,
}) => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    inboxFilter,
    setInboxFilter,
    searchQuery,
    setSearchQuery,
    togglePinConversation,
    toggleMuteConversation,
    markConversationRead,
  } = useApp();

  const [showNewChat, setShowNewChat] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Compute unread and group counts
  const totalUnreadCount = conversations.reduce(
    (sum, c) => sum + (c.unread > 0 ? 1 : 0),
    0
  );
  const totalGroupsCount = conversations.filter((c) => c.isGroup).length;

  // Filter conversations
  const filteredList = conversations.filter((c) => {
    // Filter by tab
    if (inboxFilter === 'unread' && c.unread === 0) return false;
    if (inboxFilter === 'groups' && !c.isGroup) return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchMsg = c.lastMessage.toLowerCase().includes(q);
      return matchName || matchMsg;
    }
    return true;
  });

  // Sort by pinned first, then by most recent activity (a chat list that
  // doesn't reorder on new messages is a real usability bug, not a
  // stylistic choice).
  const sortedList = [...filteredList].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.lastMessageAt || 0) - (a.lastMessageAt || 0);
  });

  const handleSelectChat = (conversation: Conversation) => {
    setActiveConversationId(conversation.id);
    markConversationRead(conversation.id);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F8F5] dark:bg-[#141B20] border-r border-[#E2E7EC] dark:border-[#354148] relative">
      {/* Top Header */}
      <div className="p-4 pb-2 bg-white dark:bg-[#202A30] border-b border-[#E2E7EC] dark:border-[#354148] z-10 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <RoyalChatMark size={32} />
            <h1 className="text-xl font-extrabold tracking-tight text-[#202A30] dark:text-[#F4F5F2]">
              Royal Chat
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 text-[#68747A] dark:text-[#ACB7BD] hover:text-[#202A30] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              title="New Royal Chat"
            >
              <SquarePen className="w-5 h-5" />
            </button>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2 text-[#68747A] dark:text-[#ACB7BD] hover:text-[#202A30] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                title="Settings"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center bg-[#F8F8F5] dark:bg-[#141B20] rounded-xl px-3 py-2 border border-[#E2E7EC] dark:border-[#354148]">
          <Search className="w-4 h-4 text-[#8C9BA5] shrink-0 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-transparent text-sm text-[#202A30] dark:text-[#F4F5F2] outline-none placeholder-[#8C9BA5]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-0.5 text-[#8C9BA5] hover:text-[#202A30] dark:hover:text-white rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setInboxFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
              inboxFilter === 'all'
                ? 'bg-[#202A30] text-white dark:bg-white dark:text-[#202A30]'
                : 'bg-stone-200/70 dark:bg-[#182026] text-[#68747A] dark:text-[#ACB7BD] hover:bg-stone-300/60'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setInboxFilter('unread')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
              inboxFilter === 'unread'
                ? 'bg-[#202A30] text-white dark:bg-white dark:text-[#202A30]'
                : 'bg-stone-200/70 dark:bg-[#182026] text-[#68747A] dark:text-[#ACB7BD] hover:bg-stone-300/60'
            }`}
          >
            <span>Unread</span>
            {totalUnreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#F05D48] text-white text-[10px] flex items-center justify-center font-bold">
                {totalUnreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setInboxFilter('groups')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
              inboxFilter === 'groups'
                ? 'bg-[#202A30] text-white dark:bg-white dark:text-[#202A30]'
                : 'bg-stone-200/70 dark:bg-[#182026] text-[#68747A] dark:text-[#ACB7BD] hover:bg-stone-300/60'
            }`}
          >
            <span>Groups</span>
            <span className="text-[10px] text-[#8C9BA5]">({totalGroupsCount})</span>
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#E2E7EC]/70 dark:divide-[#354148]/70">
        {sortedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6">
            <p className="text-sm font-medium text-[#68747A] dark:text-[#ACB7BD]">
              No conversations found
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="mt-3 text-xs font-semibold text-[#F05D48] hover:underline"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          sortedList.map((convo) => {
            const isSelected = convo.id === activeConversationId;
            const isMenuOpen = openMenuId === convo.id;
            return (
              <div
                key={convo.id}
                onClick={() => handleSelectChat(convo)}
                className={`group relative flex items-center gap-3.5 p-3.5 cursor-pointer transition-colors select-none ${
                  isSelected
                    ? 'bg-stone-200/80 dark:bg-[#25323A]'
                    : 'hover:bg-stone-100/70 dark:hover:bg-[#182026]'
                }`}
              >
                {/* Avatar with live online green badge */}
                <RoyalChatAvatar
                  name={convo.name}
                  asset={convo.avatarAsset}
                  size={48}
                  online={convo.online}
                />

                {/* Conversation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[14.5px] font-semibold text-[#202A30] dark:text-[#F4F5F2] truncate">
                        {convo.name}
                      </span>
                      {convo.muted && (
                        <VolumeX className="w-3.5 h-3.5 text-[#8C9BA5] shrink-0" />
                      )}
                    </div>
                    <span
                      className={`text-xs shrink-0 ${
                        convo.unread > 0
                          ? 'font-bold text-[#F05D48] dark:text-[#F17D6C]'
                          : 'text-[#8C9BA5]'
                      }`}
                    >
                      {convo.timeLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#68747A] dark:text-[#ACB7BD] truncate">
                      {convo.delivery && (
                        <RoyalChatReceipt stage={convo.delivery} size={14} />
                      )}
                      {convo.previewKind === 'voice' && (
                        <Mic className="w-3.5 h-3.5 text-[#F05D48] shrink-0" />
                      )}
                      {convo.previewKind === 'image' && (
                        <ImageIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      )}
                      <span className="truncate">{convo.lastMessage}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {convo.pinned && (
                        <Pin className="w-3.5 h-3.5 fill-[#8C9BA5] text-[#8C9BA5] shrink-0" />
                      )}
                      {convo.unread > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#F05D48] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                          {convo.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row menu (pin / mute) */}
                <div className="relative shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : convo.id);
                    }}
                    className={`p-1.5 rounded-full text-[#8C9BA5] hover:bg-black/10 dark:hover:bg-white/10 hover:text-[#202A30] dark:hover:text-white transition-opacity ${
                      isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    aria-label="Chat options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                        }}
                      />
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#202A30] rounded-xl shadow-xl border border-[#E2E7EC] dark:border-[#354148] py-1 z-40"
                      >
                        <button
                          onClick={() => {
                            togglePinConversation(convo.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#202A30] dark:text-[#F4F5F2] hover:bg-black/5 dark:hover:bg-white/5 text-left"
                        >
                          {convo.pinned ? (
                            <PinOff className="w-3.5 h-3.5" />
                          ) : (
                            <Pin className="w-3.5 h-3.5" />
                          )}
                          <span>{convo.pinned ? 'Unpin chat' : 'Pin chat'}</span>
                        </button>
                        <button
                          onClick={() => {
                            toggleMuteConversation(convo.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#202A30] dark:text-[#F4F5F2] hover:bg-black/5 dark:hover:bg-white/5 text-left"
                        >
                          {convo.muted ? (
                            <Volume2 className="w-3.5 h-3.5" />
                          ) : (
                            <VolumeX className="w-3.5 h-3.5" />
                          )}
                          <span>{convo.muted ? 'Unmute' : 'Mute notifications'}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (for mobile quick compose) */}
      <button
        onClick={() => setShowNewChat(true)}
        className="md:hidden absolute bottom-5 right-5 w-13 h-13 rounded-full bg-[#F05D48] hover:bg-[#C83E2B] text-white flex items-center justify-center shadow-xl shadow-[#F05D48]/30 transition-transform active:scale-95 cursor-pointer z-30"
        title="New Chat"
      >
        <SquarePen className="w-6 h-6" />
      </button>

      {/* New Royal Chat Compose Modal */}
      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} />
      )}
    </div>
  );
};
