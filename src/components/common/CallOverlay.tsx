import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoyalChatAvatar } from './RoyalChatAvatar';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

function useCallDuration(connectedAt?: number): string {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!connectedAt) return;
    const tick = () => setElapsed(Math.floor((Date.now() - connectedAt) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [connectedAt]);
  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export const CallOverlay: React.FC = () => {
  const {
    activeCall,
    localCallStream,
    remoteCallStream,
    acceptCall,
    declineCall,
    endCall,
    toggleCallMute,
    toggleCallCamera,
  } = useApp();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const duration = useCallDuration(activeCall?.connectedAt);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localCallStream;
  }, [localCallStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteCallStream;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteCallStream;
  }, [remoteCallStream]);

  if (!activeCall) return null;

  const isVideo = activeCall.type === 'video';
  const isIncomingRinging = activeCall.direction === 'incoming' && activeCall.status === 'ringing';

  const statusLabel =
    activeCall.status === 'ringing'
      ? activeCall.direction === 'outgoing'
        ? 'Ringing...'
        : `Incoming ${isVideo ? 'video' : 'voice'} call`
      : activeCall.status === 'connecting'
      ? 'Connecting...'
      : activeCall.status === 'connected'
      ? duration
      : 'Call ended';

  return (
    <div className="fixed inset-0 z-[60] bg-[#141B20] flex flex-col text-white select-none">
      {/* Remote video (full screen for video calls) */}
      {isVideo && remoteCallStream && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover bg-black"
        />
      )}
      {/* Remote audio element (always mounted so audio plays even in audio-only calls) */}
      {!isVideo && <audio ref={remoteAudioRef} autoPlay />}

      {/* Dark gradient overlay for legibility over video */}
      {isVideo && remoteCallStream && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
      )}

      {/* Top: peer info */}
      <div className="relative z-10 flex flex-col items-center pt-16 px-6">
        {(!isVideo || !remoteCallStream) && (
          <RoyalChatAvatar name={activeCall.peerName} asset={activeCall.peerAvatar} size={104} />
        )}
        <h2 className="text-xl font-bold mt-4">{activeCall.peerName}</h2>
        <p className="text-sm text-white/70 mt-1">{statusLabel}</p>
      </div>

      {/* Local video preview (small corner, video calls only) */}
      {isVideo && localCallStream && !activeCall.isCameraOff && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-4 right-4 w-28 h-40 sm:w-32 sm:h-44 rounded-2xl object-cover shadow-xl border border-white/20 z-20"
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom controls */}
      <div className="relative z-10 pb-12 px-6">
        {isIncomingRinging ? (
          <div className="flex items-center justify-center gap-16">
            <button
              onClick={declineCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl active:scale-95 transition-transform cursor-pointer"
              aria-label="Decline call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-[#10B981] hover:bg-emerald-600 flex items-center justify-center shadow-xl active:scale-95 transition-transform cursor-pointer animate-pulse"
              aria-label="Accept call"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={toggleCallMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer ${
                activeCall.isMuted ? 'bg-white text-[#141B20]' : 'bg-white/15 hover:bg-white/25'
              }`}
              aria-label={activeCall.isMuted ? 'Unmute' : 'Mute'}
            >
              {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {isVideo && (
              <button
                onClick={toggleCallCamera}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer ${
                  activeCall.isCameraOff ? 'bg-white text-[#141B20]' : 'bg-white/15 hover:bg-white/25'
                }`}
                aria-label={activeCall.isCameraOff ? 'Turn camera on' : 'Turn camera off'}
              >
                {activeCall.isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl active:scale-95 transition-transform cursor-pointer"
              aria-label="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
