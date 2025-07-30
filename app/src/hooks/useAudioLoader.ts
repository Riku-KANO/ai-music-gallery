import { useState, useEffect, useCallback } from 'react';

interface UseAudioLoaderResult {
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}

export const useAudioLoader = (audioElement: HTMLAudioElement | null): UseAudioLoaderResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback((e: Event) => {
    const target = e.target as HTMLAudioElement;
    const errorMessage = `Failed to load audio: ${target.src}`;
    console.error(errorMessage);

    setError(new Error(errorMessage));
    setIsLoading(false);
  }, []);

  const retry = useCallback(() => {
    if (audioElement && audioElement.src) {
      setError(null);
      audioElement.load();
    }
  }, [audioElement]);

  useEffect(() => {
    if (!audioElement) return;

    audioElement.addEventListener('loadstart', handleLoadStart);
    audioElement.addEventListener('loadeddata', handleLoadEnd);
    audioElement.addEventListener('error', handleError);

    return () => {
      audioElement.removeEventListener('loadstart', handleLoadStart);
      audioElement.removeEventListener('loadeddata', handleLoadEnd);
      audioElement.removeEventListener('error', handleError);
    };
  }, [audioElement, handleLoadStart, handleLoadEnd, handleError]);

  return { isLoading, error, retry };
};
