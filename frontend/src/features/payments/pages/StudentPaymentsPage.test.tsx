import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrderHistory } from '../hooks/useOrderHistory';
import { StudentPaymentsPage } from './StudentPaymentsPage';

vi.mock('../hooks/useOrderHistory', () => ({
  useOrderHistory: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe('StudentPaymentsPage', () => {
  beforeEach(() => {
    vi.mocked(useOrderHistory).mockReturnValue({
      data: {
        content: [
          {
            id: 'order-1',
            orderCode: 'MHB-20260729-001',
            totalAmount: 799000,
            currency: 'VND',
            status: 'PAID',
            createdAt: '2026-07-29T08:00:00Z',
            items: [
              {
                courseId: 'course-1',
                courseTitle: 'JLPT N2 chuyên sâu',
                price: 799000,
              },
            ],
          },
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useOrderHistory>);
  });

  it('renders API-backed payment data without a learning action', () => {
    render(
      <MemoryRouter>
        <StudentPaymentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('MHB-20260729-001')).toBeInTheDocument();
    expect(screen.getByText('JLPT N2 chuyên sâu')).toBeInTheDocument();
    expect(screen.getByText(/799\.000/)).toBeInTheDocument();
    expect(screen.getByText('Đã thanh toán')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Vào học/i })).not.toBeInTheDocument();
  });

  it('renders the top-up amount instead of a missing-course fallback', () => {
    vi.mocked(useOrderHistory).mockReturnValue({
      data: {
        content: [
          {
            id: 'top-up-order-1',
            orderCode: 'MHB-TOPUP-001',
            totalAmount: 100000,
            currency: 'VND',
            status: 'PAID',
            type: 'WALLET_TOPUP',
            createdAt: '2026-08-02T08:00:00Z',
            items: [],
          },
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useOrderHistory>);

    render(
      <MemoryRouter>
        <StudentPaymentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Nạp.*100\.000.*vào ví/)).toBeInTheDocument();
    expect(screen.queryByText('Đơn hàng chưa có thông tin khóa học')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Vào học/i })).not.toBeInTheDocument();
  });
});
