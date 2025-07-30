import { useState, useCallback } from 'react';

interface UseTrackNavigationOptions {
  totalTracks: number;
  autoPlay?: boolean;
  onTrackChange?: (index: number) => void;
}

export const useTrackNavigation = ({
  totalTracks,
  autoPlay = true,
  onTrackChange,
}: UseTrackNavigationOptions) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const navigateToTrack = useCallback(
    (index: number, shouldAutoPlay: boolean = autoPlay) => {
      if (index >= 0 && index < totalTracks && index !== currentIndex) {
        const shouldPlayNext = isPlaying || shouldAutoPlay;
        setCurrentIndex(index);
        setIsPlaying(shouldPlayNext);
        onTrackChange?.(index);
      }
    },
    [currentIndex, isPlaying, autoPlay, totalTracks, onTrackChange],
  );

  const nextTrack = useCallback(() => {
    if (currentIndex < totalTracks - 1) {
      navigateToTrack(currentIndex + 1, true);
    } else {
      setIsPlaying(false);
    }
  }, [currentIndex, totalTracks, navigateToTrack]);

  const previousTrack = useCallback(() => {
    if (currentIndex > 0) {
      navigateToTrack(currentIndex - 1, isPlaying);
    }
  }, [currentIndex, isPlaying, navigateToTrack]);

  const randomTrack = useCallback(() => {
    if (totalTracks <= 1) return;

    let randomIndex = Math.floor(Math.random() * totalTracks);
    while (randomIndex === currentIndex) {
      randomIndex = Math.floor(Math.random() * totalTracks);
    }
    navigateToTrack(randomIndex, true);
  }, [currentIndex, totalTracks, navigateToTrack]);

  const playPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  return {
    currentIndex,
    isPlaying,
    setIsPlaying,
    navigateToTrack,
    nextTrack,
    previousTrack,
    randomTrack,
    playPause,
  };
};
