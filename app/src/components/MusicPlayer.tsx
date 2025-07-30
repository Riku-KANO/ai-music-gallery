import { useState, useRef, useEffect } from 'react';
import type { Track } from '../types/music';
import { useAudioLoader } from '../hooks/useAudioLoader';
import './MusicPlayer.css';

interface MusicPlayerProps {
  track: Track;
  isPlaying: boolean;
  onTrackEnd?: () => void;
  onPlayingChange?: (playing: boolean) => void;
  onAudioElement?: (element: HTMLAudioElement | null) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  track,
  isPlaying,
  onTrackEnd,
  onPlayingChange,
  onAudioElement,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { error: loadError, retry } = useAudioLoader(audioRef.current);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      if (onPlayingChange) onPlayingChange(false);
      if (onTrackEnd) {
        onTrackEnd();
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [onTrackEnd, onPlayingChange]);

  // 楽曲変更時の処理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 現在の再生を停止
    audio.pause();
    audio.src = track.url;
    audio.load();
    setCurrentTime(0);
    setIsLoading(true);
  }, [track]);

  // 再生状態の同期
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    const handlePlayPause = async () => {
      try {
        if (isPlaying && audio.paused) {
          await audio.play();
        } else if (!isPlaying && !audio.paused) {
          audio.pause();
        }
      } catch (error) {
        console.error('Playback error:', error);
        if (onPlayingChange) onPlayingChange(false);
      }
    };

    handlePlayPause();
  }, [isPlaying, isLoading, onPlayingChange]);

  useEffect(() => {
    if (onAudioElement) {
      onAudioElement(audioRef.current);
    }
  }, [onAudioElement]);

  const togglePlayPause = () => {
    if (onPlayingChange) {
      onPlayingChange(!isPlaying);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = track.duration > 0 ? (currentTime / track.duration) * 100 : 0;

  return (
    <div className="music-player">
      <audio ref={audioRef} />

      <div className="track-info">
        <h3>{track.title}</h3>
        <p>{track.aiTool}</p>
        <p>{track.genre}</p>
      </div>

      <div className="player-controls">
        {loadError ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#ff6b6b', fontSize: '0.8rem', margin: '0.5rem 0' }}>
              Failed to load audio
            </p>
            <button
              onClick={retry}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem',
                background: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <button
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
          </button>
        )}
      </div>

      <div className="progress-section">
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(track.duration)}</span>
        </div>
      </div>
    </div>
  );
};
