import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminRefundApi } from '../api/adminRefundApi';
import { AdminRefundQueue } from './AdminRefundQueue';

vi.mock('../api/adminRefundApi', () => ({
  adminRefundApi: {
    getPendingRefunds: vi.fn(),
  },
}));

afterEach(cleanup);

describe('AdminRefundQueue', () => {
  it('shows the amount, payment provider and reconciliation state needed for triage', async () => {
    vi.mocked(adminRefundApi.getPendingRefunds).mockResolvedValue({
      content: [
        {
          id: 'refund-1',
          orderId: 'order-1',
          orderCode: 'ORD-001',
          studentId: 'student-1',
          studentName: 'Nguyễn An',
          studentEmail: 'an@example.com',
          reason: 'Provider timeout',
          status: 'RECONCILIATION_REQUIRED',
          courseTitle: 'Spring Boot thực chiến',
          currency: 'VND',
          grossAmount: 1_000_000,
          paymentStatus: 'SUCCESS',
          paymentProvider: 'VNPAY',
          providerStatus: 'UNKNOWN',
          reconciliationReasonCode: 'PROVIDER_RESULT_UNKNOWN',
          createdAt: '2026-07-29T08:00:00Z',
        },
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });

    render(
      <MemoryRouter>
        <AdminRefundQueue />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Spring Boot thực chiến')).toBeInTheDocument();
    expect(screen.getByText(/1\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
    expect(screen.getByText('VNPAY')).toBeInTheDocument();
    expect(screen.getByText('Cần đối soát')).toBeInTheDocument();
    expect(screen.getByText('Provider: UNKNOWN')).toBeInTheDocument();
    expect(screen.getByText('PROVIDER_RESULT_UNKNOWN')).toBeInTheDocument();
  });
});
