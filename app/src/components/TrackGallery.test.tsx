import { render, screen, fireEvent } from '@testing-library/react';
import { TrackGallery } from './TrackGallery';
import type { Track } from '../types/music';

const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Track 1',
    aiTool: 'AI Tool 1',
    genre: 'Genre 1',
    url: '/track1.mp3',
    duration: 180,
  },
  {
    id: '2',
    title: 'Track 2',
    aiTool: 'AI Tool 2',
    genre: 'Genre 2',
    url: '/track2.mp3',
    duration: 240,
  },
  {
    id: '3',
    title: 'Track 3',
    aiTool: 'AI Tool 3',
    genre: 'Genre 3',
    url: '/track3.mp3',
    duration: 300,
  },
];

describe('TrackGallery', () => {
  const mockOnTrackChange = vi.fn();

  beforeEach(() => {
    mockOnTrackChange.mockClear();
  });

  it('should render all tracks', () => {
    render(
      <TrackGallery tracks={mockTracks} currentTrackIndex={0} onTrackChange={mockOnTrackChange} />,
    );

    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Track 2')).toBeInTheDocument();
    expect(screen.getByText('Track 3')).toBeInTheDocument();
  });

  it('should show navigation buttons', () => {
    render(
      <TrackGallery tracks={mockTracks} currentTrackIndex={1} onTrackChange={mockOnTrackChange} />,
    );

    expect(screen.getByLabelText('Previous track')).toBeInTheDocument();
    expect(screen.getByLabelText('Next track')).toBeInTheDocument();
  });

  it('should disable previous button on first track', () => {
    render(
      <TrackGallery tracks={mockTracks} currentTrackIndex={0} onTrackChange={mockOnTrackChange} />,
    );

    expect(screen.getByLabelText('Previous track')).toBeDisabled();
    expect(screen.getByLabelText('Next track')).not.toBeDisabled();
  });

  it('should disable next button on last track', () => {
    render(
      <TrackGallery tracks={mockTracks} currentTrackIndex={2} onTrackChange={mockOnTrackChange} />,
    );

    expect(screen.getByLabelText('Previous track')).not.toBeDisabled();
    expect(screen.getByLabelText('Next track')).toBeDisabled();
  });

  it('should call onTrackChange when clicking navigation buttons', () => {
    render(
      <TrackGallery tracks={mockTracks} currentTrackIndex={1} onTrackChange={mockOnTrackChange} />,
    );

    fireEvent.click(screen.getByLabelText('Previous track'));
    expect(mockOnTrackChange).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByLabelText('Next track'));
    expect(mockOnTrackChange).toHaveBeenCalledWith(2);
  });

  it('should handle keyboard navigation', () => {
    render(
      <TrackGallery tracks={mockTracks} currentTrackIndex={1} onTrackChange={mockOnTrackChange} />,
    );

    const gallery = screen.getByRole('region', { name: 'Track gallery' });

    fireEvent.keyDown(gallery, { key: 'ArrowLeft' });
    expect(mockOnTrackChange).toHaveBeenCalledWith(0);

    fireEvent.keyDown(gallery, { key: 'ArrowRight' });
    expect(mockOnTrackChange).toHaveBeenCalledWith(2);
  });

  it('should show track indicators', () => {
    render(
      <TrackGallery tracks={mockTracks} currentTrackIndex={0} onTrackChange={mockOnTrackChange} />,
    );

    expect(screen.getByLabelText('Go to track 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to track 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to track 3')).toBeInTheDocument();
  });

  it('should navigate to specific track when clicking indicator', () => {
    render(
      <TrackGallery tracks={mockTracks} currentTrackIndex={0} onTrackChange={mockOnTrackChange} />,
    );

    fireEvent.click(screen.getByLabelText('Go to track 3'));
    expect(mockOnTrackChange).toHaveBeenCalledWith(2);
  });
});
