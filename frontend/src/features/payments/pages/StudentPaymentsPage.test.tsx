import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrderHistory } from '../hooks/useOrderHistory';
import { StudentPaymentsPage } from './StudentPaymentsPage';

vi.mock('../hooks/useOrderHistory', () => ({
  useOrderHistory: vi.fn(),
}));

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

  it('renders API-backed payment data and paid-course action', () => {
    render(
      <MemoryRouter>
        <StudentPaymentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('MHB-20260729-001')).toBeInTheDocument();
    expect(screen.getByText('JLPT N2 chuyên sâu')).toBeInTheDocument();
    expect(screen.getByText(/799\.000/)).toBeInTheDocument();
    expect(screen.getByText('Đã thanh toán')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vào học/i })).toBeInTheDocument();
  });
});
