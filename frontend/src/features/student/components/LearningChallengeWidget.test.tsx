import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { weeklyChallengeService } from '../services/weeklyChallengeService';
import { LearningChallengeWidget } from './LearningChallengeWidget';

vi.mock('../services/weeklyChallengeService', () => ({
  weeklyChallengeService: {
    current: vi.fn(),
    start: vi.fn(),
    match: vi.fn(),
  },
}));

const challenge = {
  id: 'challenge-1', weekStart: '2026-08-10', weekEnd: '2026-08-16',
  title: 'Manabi Match · Kanji N5', description: 'Ghép thuật ngữ', jlptLevel: 'N5' as const,
  status: 'PUBLISHED' as const, dailyRankedLimit: 3, wrongPenaltySeconds: 2,
  dailyAttendanceReward: 1000, firstPrize: 30000, secondPrize: 20000, thirdPrize: 10000,
  personalBestMillis: null, rankedAttemptsToday: 0,
};

const attempt = {
  attemptId: 'attempt-1', ranked: true, remainingRankedAttempts: 2,
  cards: Array.from({ length: 8 }, (_, index) => ({
    id: `card-${index + 1}`, value: `Nội dung ${index + 1}`, position: index, matched: false,
  })),
  matchedPairs: 0, totalPairs: 4, penaltyMillis: 0, totalMillis: null,
  expiresAt: '2026-08-11T10:20:00Z', completed: false,
};

describe('LearningChallengeWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(weeklyChallengeService.current).mockResolvedValue(challenge);
    vi.mocked(weeklyChallengeService.start).mockResolvedValue(attempt);
  });

  afterEach(cleanup);

  it('loads server-managed content and starts a ranked attempt', async () => {
    render(<LearningChallengeWidget accountKey="student-1" />);

    expect(await screen.findByText('Manabi Match · Kanji N5')).toBeInTheDocument();
    expect(screen.getByText('3/3 hôm nay')).toBeInTheDocument();
    expect(screen.getByText(/Xếp hạng chốt sau Chủ Nhật/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Vào chơi ngay' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByRole('button', { name: 'Thẻ đang úp' })).toHaveLength(8);
    expect(weeklyChallengeService.start).toHaveBeenCalledWith('challenge-1');
    await waitFor(() => expect(screen.getByText('2/3 hôm nay')).toBeInTheDocument());
  });

  it('renders nothing when no challenge is published for the current week', async () => {
    vi.mocked(weeklyChallengeService.current).mockResolvedValue(null);
    const { container } = render(<LearningChallengeWidget />);
    await waitFor(() => expect(weeklyChallengeService.current).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
