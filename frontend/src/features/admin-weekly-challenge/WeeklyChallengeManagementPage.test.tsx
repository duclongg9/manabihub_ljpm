import { cleanup, render, screen, waitFor } from '@testing-library/react';
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
});
