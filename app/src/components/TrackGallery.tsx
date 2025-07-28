import { useState, useRef, useEffect } from 'react';
import type { Track } from '../types/music';
import './TrackGallery.css';

interface TrackGalleryProps {
  tracks: Track[];
  currentTrackIndex: number;
  onTrackChange: (index: number) => void;
}

export const TrackGallery: React.FC<TrackGalleryProps> = ({
  tracks,
  currentTrackIndex,
  onTrackChange,
}) => {
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && itemsRef.current) {
      const itemWidth = containerRef.current.clientWidth;
      const targetScroll = currentTrackIndex * itemWidth;
      itemsRef.current.style.transform = `translateX(-${targetScroll}px)`;
    }
  }, [currentTrackIndex]);

  const handleStart = (clientX: number) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(clientX - scrollLeft);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !itemsRef.current) return;
    const x = clientX - startX;
    setScrollLeft(x);
    itemsRef.current.style.transform = `translateX(${x}px)`;
  };

  const handleEnd = () => {
    if (!isDragging || !containerRef.current || !itemsRef.current) return;
    setIsDragging(false);

    const itemWidth = containerRef.current.clientWidth;
    const threshold = itemWidth * 0.2;
    const currentTranslate = -currentTrackIndex * itemWidth;
    const diff = scrollLeft - currentTranslate;

    let newIndex = currentTrackIndex;
    if (diff < -threshold && currentTrackIndex < tracks.length - 1) {
      newIndex = currentTrackIndex + 1;
    } else if (diff > threshold && currentTrackIndex > 0) {
      newIndex = currentTrackIndex - 1;
    }

    setScrollLeft(0);
    onTrackChange(newIndex);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentTrackIndex > 0) {
      onTrackChange(currentTrackIndex - 1);
    } else if (e.key === 'ArrowRight' && currentTrackIndex < tracks.length - 1) {
      onTrackChange(currentTrackIndex + 1);
    }
  };

  return (
    <div
      ref={containerRef}
      className="track-gallery"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Track gallery"
    >
      <button
        className="nav-button nav-button-prev"
        onClick={() => onTrackChange(Math.max(0, currentTrackIndex - 1))}
        disabled={currentTrackIndex === 0}
        aria-label="Previous track"
      >
        ‹
      </button>

      <div className="track-gallery-viewport">
        <div
          ref={itemsRef}
          className="track-gallery-items"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className={`track-item ${index === currentTrackIndex ? 'active' : ''}`}
            >
              <div className="track-visual">
                <div className="track-placeholder">
                  <span>{track.genre}</span>
                </div>
              </div>
              <div className="track-details">
                <h3>{track.title}</h3>
                <p>{track.aiTool}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        className="nav-button nav-button-next"
        onClick={() => onTrackChange(Math.min(tracks.length - 1, currentTrackIndex + 1))}
        disabled={currentTrackIndex === tracks.length - 1}
        aria-label="Next track"
      >
        ›
      </button>

      <div className="track-indicators">
        {tracks.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentTrackIndex ? 'active' : ''}`}
            onClick={() => onTrackChange(index)}
            aria-label={`Go to track ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
