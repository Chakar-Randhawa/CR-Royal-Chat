import React, { useState, useRef, useEffect } from 'react';
import { Conversation, MessageReply } from '../../types';
import { RoyalChatAvatar } from '../common/RoyalChatAvatar';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { ContactProfileModal } from './ContactProfileModal';
import { GroupDetailsModal } from './GroupDetailsModal';
import { MediaPreviewModal } from './MediaPreviewModal';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ConversationViewProps {
  conversation: Conversation;
  onBack?: () => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  onBack,
}) => {
  const { messages, typingContacts, markConversationRead, sendImageMessage, startCall, showToast } =
    useApp();

  const [replyTarget, setReplyTarget] = useState<MessageReply | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [isSendingMedia, setIsSendingMedia] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessages = messages[conversation.id] || [];
  const isPeerTyping = !!typingContacts[conversation.id];

  // Auto scroll to bottom when messages or typing status updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length, isPeerTyping]);

  // Mark read when view mounts
  useEffect(() => {
    markConversationRead(conversation.id);
  }, [conversation.id, markConversationRead]);

  const handleAudioCall = () => {
    if (conversation.isGroup) {
      showToast('Group calling is not supported yet — only one-to-one calls.', 'info');
      return;
    }
    startCall(conversation.id, 'audio');
  };

  const handleVideoCall = () => {
    if (conversation.isGroup) {
      showToast('Group calling is not supported yet — only one-to-one calls.', 'info');
      return;
    }
    startCall(conversation.id, 'video');
  };

  const handleSendPhotoPreview = (imageUrl: string) => {
    setPreviewMediaUrl(imageUrl);
    setIsSendingMedia(true);
  };

  const handleOpenPhoto = (imageUrl: string) => {
    setPreviewMediaUrl(imageUrl);
    setIsSendingMedia(false);
  };

  const handleConfirmSendPhoto = (caption: string) => {
    if (previewMediaUrl) {
      sendImageMessage(conversation.id, previewMediaUrl, caption);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F8F5] dark:bg-[#141B20] relative">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#202A30] border-b border-[#E2E7EC] dark:border-[#354148] z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-[#68747A] dark:text-[#ACB7BD] hover:text-[#202A30] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5"
              aria-label="Back to chat list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Contact Avatar & Name info (Clickable to open profile / group info) */}
          <div
            onClick={() => setShowDetailsModal(true)}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 min-w-0"
          >
            <RoyalChatAvatar
              name={conversation.name}
              asset={conversation.avatarAsset}
              size={40}
              online={conversation.online}
            />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#202A30] dark:text-[#F4F5F2] truncate">
                {conversation.name}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-[#68747A] dark:text-[#ACB7BD] truncate">
                {isPeerTyping ? (
                  <span className="text-[#F05D48] dark:text-[#F17D6C] font-semibold animate-pulse">
                    typing...
                  </span>
                ) : conversation.isGroup ? (
                  <span>
                    {conversation.members?.length ?? 0} members
                  </span>
                ) : conversation.online ? (
                  <span className="text-[#10B981] font-medium">Online</span>
                ) : (
                  <span>Last seen recently</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleAudioCall}
            className="p-2 text-[#68747A] dark:text-[#ACB7BD] hover:text-[#202A30] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5"
            title="Audio call"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={handleVideoCall}
            className="p-2 text-[#68747A] dark:text-[#ACB7BD] hover:text-[#202A30] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5"
            title="Video call"
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowDetailsModal(true)}
            className="p-2 text-[#68747A] dark:text-[#ACB7BD] hover:text-[#202A30] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5"
            title="Details & settings"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 select-text">
        {/* Date pill */}
        <div className="flex justify-center my-2">
          <span className="px-2.5 py-0.5 bg-black/5 dark:bg-white/10 text-[10.5px] font-semibold text-[#68747A] dark:text-[#ACB7BD] rounded-full">
            Today
          </span>
        </div>

        {/* Message Bubbles */}
        {chatMessages.map((msg) => {
          if (msg.kind === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="px-3 py-1 bg-stone-200/70 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 text-xs rounded-full text-center max-w-xs">
                  {msg.text}
                </span>
              </div>
            );
          }

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              conversationId={conversation.id}
              onReplyTarget={(reply) => setReplyTarget(reply)}
              onOpenMedia={handleOpenPhoto}
              showSenderName={conversation.isGroup}
              senderName={
                conversation.isGroup && !msg.isMine
                  ? msg.senderName || 'Member'
                  : undefined
              }
            />
          );
        })}

        {/* Live Typing Indicator bubble */}
        {isPeerTyping && (
          <div className="flex items-center gap-1.5 p-2.5 bg-white dark:bg-[#202A30] w-16 rounded-2xl rounded-bl-xs shadow-2xs border border-[#E2E7EC] dark:border-[#354148] my-1 animate-in fade-in">
            <div className="w-2 h-2 rounded-full bg-[#8C9BA5] animate-bounce" />
            <div
              className="w-2 h-2 rounded-full bg-[#8C9BA5] animate-bounce"
              style={{ animationDelay: '0.15s' }}
            />
            <div
              className="w-2 h-2 rounded-full bg-[#8C9BA5] animate-bounce"
              style={{ animationDelay: '0.3s' }}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer Footer */}
      {conversation.blocked ? (
        <div className="border-t border-[#E2E7EC] dark:border-[#354148] bg-[#F8F8F5] dark:bg-[#141B20] px-4 py-3 text-center text-xs text-[#8C9BA5]">
          You blocked {conversation.name}. Unblock from their contact info to send messages.
        </div>
      ) : (
        <MessageComposer
          conversationId={conversation.id}
          replyTarget={replyTarget}
          onClearReply={() => setReplyTarget(null)}
          onOpenImagePreview={handleSendPhotoPreview}
        />
      )}

      {/* Modals */}
      {showDetailsModal &&
        (conversation.isGroup ? (
          <GroupDetailsModal
            conversation={conversation}
            onClose={() => setShowDetailsModal(false)}
          />
        ) : (
          <ContactProfileModal
            conversation={conversation}
            onClose={() => setShowDetailsModal(false)}
          />
        ))}

      {previewMediaUrl && (
        <MediaPreviewModal
          mediaUrl={previewMediaUrl}
          isSending={isSendingMedia}
          onSend={handleConfirmSendPhoto}
          onClose={() => setPreviewMediaUrl(null)}
        />
      )}
    </div>
  );
};
