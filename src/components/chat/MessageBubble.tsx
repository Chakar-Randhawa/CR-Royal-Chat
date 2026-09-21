import React, { useState } from 'react';
import { Message, MessageReply } from '../../types';
import { RoyalChatReceipt } from '../common/RoyalChatReceipt';
import { LiveWaveform } from './LiveWaveform';
import { MessageContextMenu } from './MessageContextMenu';
import { MoreVertical, Star, Ban, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MessageBubbleProps {
  message: Message;
  conversationId: string;
  onReplyTarget: (target: MessageReply) => void;
  onOpenMedia?: (assetUrl: string) => void;
  senderName?: string;
  showSenderName?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  conversationId,
  onReplyTarget,
  onOpenMedia,
  senderName,
  showSenderName = false,
}) => {
  const { addReaction, deleteMessage, toggleStarMessage, showToast } = useApp();
  const [contextOpen, setContextOpen] = useState(false);

  const mine = message.isMine;
  const isDeleted = message.isDeleted;

  const reactionCounts: Record<string, number> = {};
  if (message.reactions) {
    Object.values(message.reactions).forEach((emoji) => {
      reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
    });
  }

  const handleDoubleTap = () => {
    if (!isDeleted) {
      addReaction(conversationId, message.id, '❤️');
      showToast('Reacted ❤️', 'check');
    }
  };

  const copyText = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      showToast('Text copied to clipboard', 'copy');
    }
  };

  return (
    <div
      className={`group relative flex flex-col my-1 ${
        mine ? 'items-end' : 'items-start'
      }`}
      onDoubleClick={handleDoubleTap}
    >
      {/* Sender name for group chats */}
      {showSenderName && !mine && senderName && (
        <span className="text-[11px] font-semibold text-[#F05D48] dark:text-[#F17D6C] ml-3 mb-1">
          {senderName}
        </span>
      )}

      {/* Bubble container */}
      <div className="relative max-w-[82%] sm:max-w-[72%]">
        <div
          className={`relative px-3.5 py-2.5 shadow-xs transition-colors select-text ${
            mine
              ? 'bg-[#F9DFD8] dark:bg-[#593D38] text-[#202A30] dark:text-[#F4F5F2] rounded-2xl rounded-br-xs'
              : 'bg-white dark:bg-[#202A30] text-[#202A30] dark:text-[#F4F5F2] rounded-2xl rounded-bl-xs border border-[#E2E7EC]/60 dark:border-[#354148]/60'
          }`}
        >
          {/* Replied message quote banner */}
          {message.replyTo && (
            <div
              className={`mb-2 pl-2.5 py-1 text-xs border-l-2 rounded-r-md ${
                mine
                  ? 'border-[#F05D48] bg-black/5 dark:bg-white/10'
                  : 'border-[#2563EB] bg-stone-100 dark:bg-stone-800'
              }`}
            >
              <div className="font-semibold text-[11px] text-[#F05D48] dark:text-[#F17D6C]">
                {message.replyTo.senderName}
              </div>
              <div className="text-[#68747A] dark:text-[#ACB7BD] truncate">
                {message.replyTo.kind === 'voice'
                  ? '🎤 Voice note'
                  : message.replyTo.kind === 'image'
                  ? '📷 Photo'
                  : message.replyTo.text}
              </div>
            </div>
          )}

          {/* Deleted state */}
          {isDeleted ? (
            <div className="flex items-center gap-1.5 text-xs italic text-[#8C9BA5] py-0.5">
              <Ban className="w-3.5 h-3.5" />
              <span>This message was deleted</span>
            </div>
          ) : message.decryptFailed ? (
            <div className="flex items-center gap-1.5 text-xs italic text-[#8C9BA5] py-0.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Unable to decrypt this message</span>
            </div>
          ) : (
            <>
              {/* Image attachment */}
              {message.kind === 'image' && message.asset && (
                <div className="mb-1.5 -mx-1.5 -mt-1 rounded-xl overflow-hidden cursor-pointer">
                  <img
                    src={message.asset}
                    alt="Photo attachment"
                    onClick={() => onOpenMedia?.(message.asset!)}
                    className="w-full max-h-72 object-cover rounded-xl hover:opacity-95 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Voice note */}
              {message.kind === 'voice' && (
                <LiveWaveform
                  asset={message.asset}
                  durationSeconds={message.voiceDuration || 0}
                  isMine={mine}
                />
              )}

              {/* Text content */}
              {message.text && (
                <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              )}
            </>
          )}

          {/* Metadata footer: time, starred, delivery status */}
          <div className="flex items-center justify-end gap-1.5 mt-1 -mb-0.5 text-[10.5px] text-[#68747A] dark:text-[#ACB7BD] select-none font-mono">
            {message.isStarred && (
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            )}
            <span>{message.sentAt}</span>
            {mine && <RoyalChatReceipt stage={message.delivery || 'sent'} size={13} />}
          </div>
        </div>

        {/* Hover action trigger */}
        <button
          onClick={() => setContextOpen(true)}
          className={`absolute top-1 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-white dark:bg-[#202A30] shadow-md border border-[#E2E7EC] dark:border-[#354148] text-[#68747A] hover:text-[#202A30] dark:hover:text-white transition-opacity cursor-pointer ${
            mine ? '-left-8' : '-right-8'
          }`}
          title="More actions"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {/* Reactions floating pill */}
        {Object.keys(reactionCounts).length > 0 && !isDeleted && (
          <div
            className={`absolute -bottom-2.5 flex items-center gap-1 bg-white dark:bg-[#202A30] px-1.5 py-0.5 rounded-full shadow-sm border border-[#E2E7EC] dark:border-[#354148] text-xs cursor-pointer select-none ${
              mine ? 'right-2' : 'left-2'
            }`}
            onClick={() => setContextOpen(true)}
          >
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <span key={emoji} className="flex items-center gap-0.5">
                <span>{emoji}</span>
                {count > 1 && (
                  <span className="text-[10px] font-bold text-[#68747A] dark:text-[#ACB7BD]">
                    {count}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Context Action Overlay */}
      {contextOpen && (
        <MessageContextMenu
          message={message}
          onClose={() => setContextOpen(false)}
          onReact={(emoji) => addReaction(conversationId, message.id, emoji)}
          onReply={() =>
            onReplyTarget({
              id: message.id,
              senderName: mine ? 'You' : senderName || 'Contact',
              text: message.text,
              kind: message.kind,
            })
          }
          onCopy={copyText}
          onStar={() => toggleStarMessage(conversationId, message.id)}
          onDelete={(forEveryone) =>
            deleteMessage(conversationId, message.id, forEveryone)
          }
        />
      )}
    </div>
  );
};
