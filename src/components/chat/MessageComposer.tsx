import React, { useState, useRef, useEffect } from 'react';
import { MessageReply } from '../../types';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  X,
  Trash2,
  Lock,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MessageComposerProps {
  conversationId: string;
  replyTarget: MessageReply | null;
  onClearReply: () => void;
  onOpenImagePreview: (imageUrl: string) => void;
}

const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😜', '🤪', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'] },
  { name: 'Gestures', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'] },
  { name: 'Objects', emojis: ['🔥', '✨', '⚡', '💥', '🎉', '🎊', '🎈', '🎁', '🏆', '☕', '🍵', '🍕', '🍔', '🚀', '✈️', '📸', '🎧', '💻', '📱', '🔒', '🔑', '💡', '⏰'] },
];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  conversationId,
  replyTarget,
  onClearReply,
  onOpenImagePreview,
}) => {
  const { sendTextMessage, sendVoiceMessage, settings } = useApp();
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingLocked, setRecordingLocked] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleSendText = () => {
    if (!text.trim()) return;
    sendTextMessage(conversationId, text.trim(), replyTarget || undefined);
    setText('');
    onClearReply();
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && (settings.enterToSend || !e.shiftKey)) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingLocked(false);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    setRecordingLocked(false);
    setRecordingSeconds(0);
  };

  const handleFinishRecording = () => {
    const finalSec = Math.max(1, recordingSeconds);
    sendVoiceMessage(conversationId, finalSec);
    setIsRecording(false);
    setRecordingLocked(false);
    setRecordingSeconds(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onOpenImagePreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const formatRecordingTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative border-t border-[#E2E7EC] dark:border-[#354148] bg-[#F8F8F5] dark:bg-[#141B20] px-3 py-2 z-20">
      {/* Replied Message Header */}
      {replyTarget && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-white dark:bg-[#202A30] rounded-xl border border-[#E2E7EC] dark:border-[#354148] text-xs">
          <div className="flex-1 min-w-0 pr-2 border-l-2 border-[#F05D48] pl-2">
            <div className="font-semibold text-[#F05D48] dark:text-[#F17D6C]">
              Replying to {replyTarget.senderName}
            </div>
            <div className="text-[#68747A] dark:text-[#ACB7BD] truncate">
              {replyTarget.kind === 'voice'
                ? '🎤 Voice message'
                : replyTarget.kind === 'image'
                ? '📷 Photo'
                : replyTarget.text}
            </div>
          </div>
          <button
            onClick={onClearReply}
            className="p-1 text-[#68747A] hover:text-[#202A30] dark:hover:text-white rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-3 right-3 sm:right-auto sm:w-80 mb-2 max-h-72 bg-white dark:bg-[#202A30] rounded-2xl shadow-xl border border-[#E2E7EC] dark:border-[#354148] p-3 overflow-y-auto z-40">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#E2E7EC] dark:border-[#354148]">
            <span className="text-xs font-semibold text-[#68747A] dark:text-[#ACB7BD]">
              Emojis
            </span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 text-[#68747A] hover:text-[#202A30] dark:hover:text-white rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {EMOJI_CATEGORIES.map((cat) => (
            <div key={cat.name} className="mb-3">
              <div className="text-[11px] font-semibold text-[#8C9BA5] mb-1">
                {cat.name}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cat.emojis.map((em) => (
                  <button
                    key={em}
                    onClick={() => handleEmojiSelect(em)}
                    className="text-xl p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attachment Popover */}
      {showAttachMenu && (
        <div className="absolute bottom-full left-12 mb-2 w-48 bg-white dark:bg-[#202A30] rounded-2xl shadow-xl border border-[#E2E7EC] dark:border-[#354148] p-2 flex flex-col gap-1 z-40">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#202A30] dark:text-[#F4F5F2] hover:bg-black/5 dark:hover:bg-white/5 text-left"
          >
            <ImageIcon className="w-4 h-4 text-[#F05D48]" />
            <span>Photos & Videos</span>
          </button>
          <button
            onClick={() => {
              onOpenImagePreview('/assets/images/sylhet_evening.png');
              setShowAttachMenu(false);
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#202A30] dark:text-[#F4F5F2] hover:bg-black/5 dark:hover:bg-white/5 text-left"
          >
            <FileText className="w-4 h-4 text-sky-500" />
            <span>Sample photo</span>
          </button>
        </div>
      )}

      {/* Main Composer Controls Bar */}
      {isRecording ? (
        /* Active Recording State UI */
        <div className="flex items-center gap-3 bg-white dark:bg-[#202A30] px-4 py-2.5 rounded-2xl border border-red-500/30 animate-in fade-in">
          <button
            onClick={handleCancelRecording}
            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-full cursor-pointer"
            title="Cancel recording"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 flex-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 recording-pulse" />
            <span className="font-mono text-xs font-semibold text-red-600 dark:text-red-400">
              {formatRecordingTime(recordingSeconds)}
            </span>
            {/* Pulsing visual sound wave simulation */}
            <div className="flex items-center gap-0.5 h-4 ml-2">
              {[12, 24, 18, 28, 14, 20, 26, 16, 22].map((h, idx) => (
                <div
                  key={idx}
                  className="w-1 bg-[#F05D48] rounded-full animate-pulse"
                  style={{
                    height: `${h * 0.7}px`,
                    animationDelay: `${idx * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {!recordingLocked ? (
            <button
              onClick={() => setRecordingLocked(true)}
              className="flex items-center gap-1 text-xs text-[#68747A] dark:text-[#ACB7BD] hover:text-[#202A30] px-2 py-1 rounded-lg hover:bg-black/5"
            >
              <Lock className="w-3 h-3" />
              <span>Lock</span>
            </button>
          ) : (
            <span className="text-xs text-[#10B981] font-medium">Locked</span>
          )}

          <button
            onClick={handleFinishRecording}
            className="w-8 h-8 rounded-full bg-[#F05D48] hover:bg-[#C83E2B] text-white flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
            title="Send voice note"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Normal Typing State UI */
        <div className="flex items-end gap-2">
          {/* Emoji Toggle */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 text-[#68747A] dark:text-[#ACB7BD] hover:text-[#202A30] dark:hover:text-white rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            aria-label="Toggle emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attachment Toggle */}
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2.5 text-[#68747A] dark:text-[#ACB7BD] hover:text-[#202A30] dark:hover:text-white rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            aria-label="Add attachment"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Auto-growing Text Input */}
          <div className="flex-1 min-w-0 bg-white dark:bg-[#202A30] rounded-2xl border border-[#E2E7EC] dark:border-[#354148] px-3.5 py-2 focus-within:border-[#F05D48] transition-colors">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Message"
              rows={1}
              className="w-full bg-transparent border-none outline-none resize-none text-[14.5px] leading-snug text-[#202A30] dark:text-[#F4F5F2] placeholder-[#8C9BA5] max-h-32 overflow-y-auto"
            />
          </div>

          {/* Send or Push-to-talk Mic Button */}
          {text.trim() ? (
            <button
              onClick={handleSendText}
              className="w-10 h-10 rounded-full bg-[#F05D48] hover:bg-[#C83E2B] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#F05D48]/25 transition-transform active:scale-95 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          ) : (
            <button
              onClick={handleStartRecording}
              className="w-10 h-10 rounded-full bg-stone-200 dark:bg-[#202A30] hover:bg-[#F05D48] hover:text-white text-[#68747A] dark:text-[#ACB7BD] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              aria-label="Record voice note"
              title="Click or hold to record"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
