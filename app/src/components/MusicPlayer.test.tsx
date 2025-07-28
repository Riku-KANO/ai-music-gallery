import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MusicPlayer } from './MusicPlayer';
import type { Track } from '../types/music';

const mockTrack: Track = {
  id: '1',
  title: 'Test Track',
  aiTool: 'Test AI',
  genre: 'Test Genre',
  url: '/test.mp3',
  duration: 180,
};

describe('MusicPlayer', () => {
  beforeEach(() => {
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = vi.fn();
    HTMLMediaElement.prototype.load = vi.fn();
  });

  it('should display track information', () => {
    render(<MusicPlayer track={mockTrack} isPlaying={false} />);

    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test AI')).toBeInTheDocument();
    expect(screen.getByText('Test Genre')).toBeInTheDocument();
  });

  it('should have play/pause button', async () => {
    render(<MusicPlayer track={mockTrack} isPlaying={false} />);

    // Wait for loading to complete
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();
  });

  it('should toggle play/pause when button is clicked', async () => {
    const mockOnPlayingChange = vi.fn();
    const { getByRole, rerender } = render(
      <MusicPlayer track={mockTrack} isPlaying={false} onPlayingChange={mockOnPlayingChange} />,
    );

    // Wait for loading to complete
    await waitFor(() => {
      const button = getByRole('button');
      expect(button).not.toBeDisabled();
    });

    const playButton = getByRole('button', { name: /play/i });
    await userEvent.click(playButton);

    expect(mockOnPlayingChange).toHaveBeenCalledWith(true);

    // Simulate parent component updating the prop
    rerender(
      <MusicPlayer track={mockTrack} isPlaying={true} onPlayingChange={mockOnPlayingChange} />,
    );

    // Wait for button to update
    await waitFor(() => {
      expect(getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });

  it('should display progress bar', () => {
    render(<MusicPlayer track={mockTrack} isPlaying={false} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should display current time and duration', () => {
    render(<MusicPlayer track={mockTrack} isPlaying={false} />);

    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
  });

  it('should emit onTrackEnd event when track ends', async () => {
    const onTrackEnd = vi.fn();
    render(<MusicPlayer track={mockTrack} isPlaying={false} onTrackEnd={onTrackEnd} />);

    const audioElement = document.querySelector('audio') as HTMLAudioElement;

    fireEvent(audioElement, new Event('ended'));

    await waitFor(() => {
      expect(onTrackEnd).toHaveBeenCalled();
    });
  });
});
