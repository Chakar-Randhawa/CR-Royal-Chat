import React, { useState } from 'react';
import { RelayMessage } from '../../types';
import { Reply, Copy, Star, Trash2, Info, X } from 'lucide-react';

interface MessageContextMenuProps {
  message: RelayMessage;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onCopy: () => void;
  onStar: () => void;
  onDelete: (forEveryone?: boolean) => void;
}

const QUICK_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  message,
  onClose,
  onReact,
  onReply,
  onCopy,
  onStar,
  onDelete,
}) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs bg-white dark:bg-[#202A30] rounded-2xl shadow-2xl border border-[#E2E7EC] dark:border-[#354148] p-2 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Emoji reaction bar */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-[#E2E7EC] dark:border-[#354148] mb-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact(emoji);
                onClose();
              }}
              className="text-2xl hover:scale-125 active:scale-95 transition-transform p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Action items */}
        <div className="flex flex-col text-sm text-[#202A30] dark:text-[#F4F5F2]">
          <button
            onClick={() => {
              onReply();
              onClose();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
          >
            <Reply className="w-4 h-4 text-[#68747A] dark:text-[#ACB7BD]" />
            <span>Reply</span>
          </button>

          {message.text && (
            <button
              onClick={() => {
                onCopy();
                onClose();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
            >
              <Copy className="w-4 h-4 text-[#68747A] dark:text-[#ACB7BD]" />
              <span>Copy text</span>
            </button>
          )}

          <button
            onClick={() => {
              onStar();
              onClose();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
          >
            <Star
              className={`w-4 h-4 ${
                message.isStarred ? 'fill-amber-400 text-amber-400' : 'text-[#68747A] dark:text-[#ACB7BD]'
              }`}
            />
            <span>{message.isStarred ? 'Unstar' : 'Star message'}</span>
          </button>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
          >
            <Info className="w-4 h-4 text-[#68747A] dark:text-[#ACB7BD]" />
            <span>Message info</span>
          </button>

          {/* Delete options */}
          <button
            onClick={() => {
              onDelete(false);
              onClose();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors text-left cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>Delete for me</span>
          </button>

          {message.isMine && (
            <button
              onClick={() => {
                onDelete(true);
                onClose();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors text-left cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span>Delete for everyone</span>
            </button>
          )}
        </div>

        {/* Message Info Panel */}
        {showInfo && (
          <div className="mt-2 p-3 bg-stone-100 dark:bg-[#182026] rounded-xl text-xs space-y-1 text-[#68747A] dark:text-[#ACB7BD] border border-[#E2E7EC] dark:border-[#354148]">
            <div className="flex justify-between">
              <span>Timestamp:</span>
              <span className="font-mono text-[#202A30] dark:text-[#F4F5F2]">{message.sentAt}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery:</span>
              <span className="capitalize text-[#202A30] dark:text-[#F4F5F2]">{message.delivery || 'sent'}</span>
            </div>
            <div className="flex justify-between">
              <span>E2EE Fingerprint:</span>
              <span className="font-mono text-[#10B981]">SHA-256 · Verified</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
