import React, { useState } from 'react';
import { Conversation } from '../../types';
import { RelayAvatar } from '../common/RelayAvatar';
import { SafetyNumberModal } from './SafetyNumberModal';
import {
  X,
  Phone,
  Video,
  ShieldCheck,
  Bell,
  BellOff,
  Clock,
  Trash2,
  Ban,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ContactProfileModalProps {
  conversation: Conversation;
  onClose: () => void;
}

export const ContactProfileModal: React.FC<ContactProfileModalProps> = ({
  conversation,
  onClose,
}) => {
  const { toggleMuteConversation, showToast } = useApp();
  const [showSafetyNumber, setShowSafetyNumber] = useState(false);

  const isMuted = conversation.muted;

  const handleCall = () => {
    showToast(`Calling ${conversation.name}... (Simulated call)`, 'info');
  };

  const handleClearChat = () => {
    showToast('Chat cleared', 'check');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F8F8F5] dark:bg-[#141B20] w-full max-w-md max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-[#E2E7EC] dark:border-[#354148] flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 border-b border-[#E2E7EC] dark:border-[#354148]">
          <span className="text-sm font-bold text-[#202A30] dark:text-[#F4F5F2]">
            Contact Info
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-[#68747A] hover:text-[#202A30] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Avatar and Info Header */}
          <div className="flex flex-col items-center text-center">
            <RelayAvatar
              name={conversation.name}
              asset={conversation.avatarAsset}
              size={84}
              online={conversation.online}
            />
            <h2 className="text-xl font-bold text-[#202A30] dark:text-[#F4F5F2] mt-3">
              {conversation.name}
            </h2>
            <p className="text-xs text-[#68747A] dark:text-[#ACB7BD] mt-0.5">
              {conversation.online ? 'Online' : 'Last seen recently'}
            </p>

            {/* Quick Call Action buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleCall}
                className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#202A30] hover:bg-[#E2E7EC] dark:hover:bg-[#2B3740] rounded-xl border border-[#E2E7EC] dark:border-[#354148] text-xs font-semibold text-[#202A30] dark:text-[#F4F5F2]"
              >
                <Phone className="w-4 h-4 text-[#F05D48]" />
                <span>Audio</span>
              </button>
              <button
                onClick={handleCall}
                className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#202A30] hover:bg-[#E2E7EC] dark:hover:bg-[#2B3740] rounded-xl border border-[#E2E7EC] dark:border-[#354148] text-xs font-semibold text-[#202A30] dark:text-[#F4F5F2]"
              >
                <Video className="w-4 h-4 text-[#F05D48]" />
                <span>Video</span>
              </button>
            </div>
          </div>

          {/* About / Status */}
          <div className="bg-white dark:bg-[#202A30] p-4 rounded-2xl border border-[#E2E7EC] dark:border-[#354148]">
            <div className="text-[11px] font-semibold text-[#8C9BA5] uppercase tracking-wider mb-1">
              About
            </div>
            <p className="text-sm text-[#202A30] dark:text-[#F4F5F2]">
              {conversation.description || 'Available on Relay'}
            </p>
          </div>

          {/* Security & Verification Tile */}
          <div
            onClick={() => setShowSafetyNumber(true)}
            className="flex items-center justify-between p-4 bg-white dark:bg-[#202A30] rounded-2xl border border-[#E2E7EC] dark:border-[#354148] cursor-pointer hover:bg-stone-50 dark:hover:bg-[#25323A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#10B981]/15 text-[#10B981] rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                  Encryption & Safety Number
                </div>
                <div className="text-xs text-[#68747A] dark:text-[#ACB7BD]">
                  X25519 ECDH + AES-GCM-256
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C9BA5]" />
          </div>

          {/* Settings / Options */}
          <div className="bg-white dark:bg-[#202A30] rounded-2xl border border-[#E2E7EC] dark:border-[#354148] divide-y divide-[#E2E7EC] dark:divide-[#354148]">
            <div
              onClick={() => toggleMuteConversation(conversation.id)}
              className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="flex items-center gap-3 text-sm text-[#202A30] dark:text-[#F4F5F2]">
                {isMuted ? (
                  <BellOff className="w-4 h-4 text-[#F05D48]" />
                ) : (
                  <Bell className="w-4 h-4 text-[#68747A]" />
                )}
                <span>Mute notifications</span>
              </div>
              <span className="text-xs text-[#8C9BA5] font-medium">
                {isMuted ? 'Muted' : 'Off'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
              <div className="flex items-center gap-3 text-sm text-[#202A30] dark:text-[#F4F5F2]">
                <Clock className="w-4 h-4 text-[#68747A]" />
                <span>Disappearing messages</span>
              </div>
              <span className="text-xs text-[#8C9BA5] font-medium">Off</span>
            </div>

            <div className="flex items-center justify-between p-3.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
              <div className="flex items-center gap-3 text-sm text-[#202A30] dark:text-[#F4F5F2]">
                <ImageIcon className="w-4 h-4 text-[#68747A]" />
                <span>Media, links, and docs</span>
              </div>
              <span className="text-xs text-[#8C9BA5] font-medium">1 photo</span>
            </div>
          </div>

          {/* Danger actions */}
          <div className="bg-white dark:bg-[#202A30] rounded-2xl border border-[#E2E7EC] dark:border-[#354148] divide-y divide-[#E2E7EC] dark:divide-[#354148]">
            <button
              onClick={handleClearChat}
              className="w-full flex items-center gap-3 p-3.5 text-sm text-red-500 hover:bg-red-500/10 text-left font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear chat history</span>
            </button>
            <button
              onClick={() => {
                showToast(`Blocked ${conversation.name}`, 'info');
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3.5 text-sm text-red-500 hover:bg-red-500/10 text-left font-medium"
            >
              <Ban className="w-4 h-4" />
              <span>Block {conversation.name}</span>
            </button>
          </div>
        </div>
      </div>

      {showSafetyNumber && (
        <SafetyNumberModal
          contactName={conversation.name}
          avatarAsset={conversation.avatarAsset}
          onClose={() => setShowSafetyNumber(false)}
        />
      )}
    </div>
  );
};
