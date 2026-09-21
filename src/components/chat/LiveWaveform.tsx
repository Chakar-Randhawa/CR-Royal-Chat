import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';

interface LiveWaveformProps {
  asset?: string;
  durationSeconds?: number;
  isMine?: boolean;
}

// Decorative bar heights for the waveform track. Real per-message
// frequency analysis of a static audio file adds real complexity
// (decode + FFT) for a purely cosmetic effect — WhatsApp-style chat
// apps use a fixed visual pattern too. The important part, actual
// playback of the real recording below, is fully real.
const WAVEFORM_HEIGHTS = [
  20, 35, 60, 45, 80, 100, 75, 40, 65, 90, 55, 30, 45, 85, 95, 70, 50, 60, 40,
  25, 30, 50, 70, 90, 85, 60, 45, 35, 20, 15,
];

export const LiveWaveform: React.FC<LiveWaveformProps> = ({
  asset,
  durationSeconds = 0,
  isMine = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [duration, setDuration] = useState(durationSeconds);
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };
    const onTimeUpdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
    };
  }, [asset]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !asset) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio.playbackRate = speed;
    setIsLoading(true);
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  };

  const handleSeek = (index: number) => {
    const audio = audioRef.current;
    if (!audio || !duration || !asset) return;
    const frac = index / WAVEFORM_HEIGHTS.length;
    audio.currentTime = frac * duration;
    setProgress(frac);
  };

  const cycleSpeed = () => {
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const currentSeconds = Math.floor(progress * duration);
  const totalSeconds = Math.max(0, Math.round(duration));
  const timeDisplay = isPlaying
    ? `0:${currentSeconds.toString().padStart(2, '0')}`
    : `0:${totalSeconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[210px] max-w-[280px]">
      {asset && <audio ref={audioRef} src={asset} preload="metadata" />}

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        disabled={!asset}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isMine
            ? 'bg-[#F05D48] text-white'
            : 'bg-[#202A30] dark:bg-white text-white dark:text-[#202A30]'
        }`}
        aria-label={isPlaying ? 'Pause' : 'Play voice message'}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform track */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-[2.5px] h-7 cursor-pointer">
          {WAVEFORM_HEIGHTS.map((h, i) => {
            const barFraction = i / WAVEFORM_HEIGHTS.length;
            const isPlayed = barFraction <= progress;
            return (
              <div
                key={i}
                onClick={() => handleSeek(i)}
                className="flex-1 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.max(18, h * 0.28)}px`,
                  backgroundColor: isPlayed
                    ? isMine
                      ? '#F05D48'
                      : '#202A30'
                    : isMine
                    ? 'rgba(240, 93, 72, 0.28)'
                    : 'rgba(104, 116, 122, 0.3)',
                }}
              />
            );
          })}
        </div>

        {/* Time label and speed tag */}
        <div className="flex items-center justify-between text-[11px] font-mono font-medium text-[#68747A] dark:text-[#ACB7BD] mt-0.5">
          <span>{timeDisplay}</span>
          <button
            onClick={cycleSpeed}
            className="px-1 py-0.5 text-[10px] rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#68747A] dark:text-[#ACB7BD]"
          >
            {speed}x
          </button>
        </div>
      </div>
    </div>
  );
};
