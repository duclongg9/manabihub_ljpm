import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WeeklyChallengeManagementPage } from './WeeklyChallengeManagementPage';
import { mondayOfCurrentWeek } from './weeklyChallengeDate';
import { weeklyChallengeAdminService } from './weeklyChallengeAdminService';

vi.mock('./weeklyChallengeAdminService', () => ({
  weeklyChallengeAdminService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    remove: vi.fn(),
    leaderboard: vi.fn(),
  },
}));

describe('WeeklyChallengeManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(weeklyChallengeAdminService.list).mockResolvedValue([]);
  });

  afterEach(cleanup);

  it('uses the Vietnam business date when calculating the current Monday', () => {
    expect(mondayOfCurrentWeek(new Date('2026-08-09T17:30:00.000Z'))).toBe('2026-08-10');
  });

  it('shows how to activate the weekly game when no challenge exists', async () => {
    render(<WeeklyChallengeManagementPage />);

    expect(await screen.findByText('Chưa có thử thách tuần nào')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo thử thách tuần này' })).toBeInTheDocument();
    await waitFor(() => expect(weeklyChallengeAdminService.list).toHaveBeenCalledOnce());
  });

  it('lets the course manager inspect a challenge leaderboard', async () => {
    vi.mocked(weeklyChallengeAdminService.list).mockResolvedValue([{
      id: 'challenge-1', weekStart: '2026-08-10', weekEnd: '2026-08-16',
      title: 'Manabi Match · N5', description: 'Ghép thẻ', jlptLevel: 'N5',
      status: 'PUBLISHED', dailyRankedLimit: 3, wrongPenaltySeconds: 2,
      dailyAttendanceReward: 1000, firstPrize: 30000, secondPrize: 20000,
      thirdPrize: 10000, pairs: Array.from({ length: 4 }, (_, index) => ({
        id: `pair-${index}`, prompt: `Từ ${index}`, answer: `Nghĩa ${index}`,
      })), settledAt: null,
    }]);
    vi.mocked(weeklyChallengeAdminService.leaderboard).mockResolvedValue({
      challengeId: 'challenge-1', challengeTitle: 'Manabi Match · N5',
      weekStart: '2026-08-10', weekEnd: '2026-08-16', settled: false,
      generatedAt: '2026-08-12T10:00:00Z', totalParticipants: 1,
      entries: [{ rank: 1, displayName: 'Học viên A', avatarUrl: null,
        bestMillis: 10000, rewardAmount: 30000, currentStudent: false }],
      currentStudent: null,
    });
    render(<WeeklyChallengeManagementPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Bảng xếp hạng' }));

    expect(await screen.findByText('Học viên A')).toBeInTheDocument();
    expect(weeklyChallengeAdminService.leaderboard).toHaveBeenCalledWith('challenge-1');
  });
});
