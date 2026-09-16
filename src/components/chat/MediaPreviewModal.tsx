import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

interface MediaPreviewModalProps {
  mediaUrl: string;
  isSending?: boolean;
  onSend?: (caption: string) => void;
  onClose: () => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  mediaUrl,
  isSending = false,
  onSend,
  onClose,
}) => {
  const [caption, setCaption] = useState('');

  const handleSend = () => {
    onSend?.(caption.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 text-white z-10">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <span className="text-sm font-semibold tracking-wide text-white/90">
          {isSending ? 'Preview photo' : 'Media'}
        </span>
        <div className="w-10" />
      </div>

      {/* Main Image Stage */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <img
          src={mediaUrl}
          alt="Preview"
          className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Caption & Send Footer (if sending mode) */}
      {isSending && (
        <div className="p-4 bg-black/60 border-t border-white/10 backdrop-blur-md flex items-center gap-3">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Add a caption..."
            className="flex-1 bg-white/15 text-white placeholder-white/50 px-4 py-2.5 rounded-2xl outline-none focus:ring-1 focus:ring-[#F05D48] text-sm"
            autoFocus
          />
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-full bg-[#F05D48] hover:bg-[#C83E2B] text-white flex items-center justify-center shrink-0 shadow-lg cursor-pointer"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      )}
    </div>
  );
};
