import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface LiveWaveformProps {
  durationSeconds?: number;
  isMine?: boolean;
}

export const LiveWaveform: React.FC<LiveWaveformProps> = ({
  durationSeconds = 18,
  isMine = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 1
  const [speed, setSpeed] = useState<number>(1);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Deterministic heights for the voice waveform bars
  const waveformHeights = [
    20, 35, 60, 45, 80, 100, 75, 40, 65, 90,
    55, 30, 45, 85, 95, 70, 50, 60, 40, 25,
    30, 50, 70, 90, 85, 60, 45, 35, 20, 15
  ];

  useEffect(() => {
    let timer: number | null = null;
    if (isPlaying) {
      const stepMs = 100;
      const totalSteps = (durationSeconds * 1000) / (stepMs * speed);
      const increment = 1 / totalSteps;

      timer = window.setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            return 0;
          }
          return Math.min(1, prev + increment);
        });
      }, stepMs);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, durationSeconds, speed]);

  const togglePlay = () => {
    if (!isPlaying && playbackProgress >= 1) {
      setPlaybackProgress(0);
    }
    // Subtle web audio pop on toggle
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isPlaying ? 220 : 440, audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.08);
    } catch {}

    setIsPlaying(!isPlaying);
  };

  const handleSeek = (index: number) => {
    const frac = index / waveformHeights.length;
    setPlaybackProgress(frac);
  };

  const cycleSpeed = () => {
    if (speed === 1) setSpeed(1.5);
    else if (speed === 1.5) setSpeed(2);
    else setSpeed(1);
  };

  const currentSeconds = Math.floor(playbackProgress * durationSeconds);
  const remainingSeconds = durationSeconds - currentSeconds;
  const timeDisplay = isPlaying
    ? `0:${currentSeconds.toString().padStart(2, '0')}`
    : `0:${durationSeconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[210px] max-w-[280px]">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
          isMine
            ? 'bg-[#F05D48] text-white'
            : 'bg-[#202A30] dark:bg-white text-white dark:text-[#202A30]'
        }`}
        aria-label={isPlaying ? 'Pause' : 'Play voice message'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform track */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-[2.5px] h-7 cursor-pointer">
          {waveformHeights.map((h, i) => {
            const barFraction = i / waveformHeights.length;
            const isPlayed = barFraction <= playbackProgress;
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
