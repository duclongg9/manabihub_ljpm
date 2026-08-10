import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminKycService } from '../../admin-kyc/services/adminKycService';
import { courseApprovalService } from '../../admin-course-approval/services/courseApprovalService';
import { adminViolationService } from '../../admin-violation/services/adminViolationService';
import { AdminDashboardPage } from './AdminDashboardPage';

vi.mock('../../../shared/auth/authSession', () => ({
  getAuthSession: vi.fn(() => ({ roles: ['COURSE_MANAGER'] })),
  hasAnyRole: vi.fn((_: unknown, roles: string[]) => roles.includes('COURSE_MANAGER')),
}));

vi.mock('../../admin-kyc/services/adminKycService', () => ({
  adminKycService: { getPendingKycQueue: vi.fn() },
}));

vi.mock('../../admin-course-approval/services/courseApprovalService', () => ({
  courseApprovalService: { getQueue: vi.fn() },
}));

vi.mock('../../admin-violation/services/adminViolationService', () => ({
  adminViolationService: { getViolationQueue: vi.fn() },
}));

vi.mock('../../admin-payout/services/adminPayoutService', () => ({
  adminPayoutService: { getPayoutQueue: vi.fn() },
}));

vi.mock('../../admin-refund/api/adminRefundApi', () => ({
  adminRefundApi: { getPendingRefunds: vi.fn() },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  vi.mocked(adminKycService.getPendingKycQueue).mockResolvedValue([]);
  vi.mocked(courseApprovalService.getQueue).mockResolvedValue([]);
  vi.mocked(adminViolationService.getViolationQueue).mockResolvedValue({
    content: [],
    page: 0,
    size: 1,
    totalElements: 3,
    totalPages: 3,
    first: true,
    last: false,
  });
});

describe('AdminDashboardPage for Course Manager', () => {
  it('shows the pending violation queue as a third overview card', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Báo cáo vi phạm')).toBeTruthy();
    expect(screen.getByText('Báo cáo chờ xem xét')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Đến hàng đợi Vi phạm/i })).toBeTruthy();

    await waitFor(() => {
      expect(adminViolationService.getViolationQueue).toHaveBeenCalledWith({
        page: 0,
        size: 1,
        status: 'PENDING_REVIEW',
      });
    });
  });
});
