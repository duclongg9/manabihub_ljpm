import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrderHistory } from '../hooks/useOrderHistory';
import { useStudentRefunds } from '../../refunds/hooks/useStudentRefunds';
import { StudentPaymentsPage } from './StudentPaymentsPage';

vi.mock('../hooks/useOrderHistory', () => ({
  useOrderHistory: vi.fn(),
}));

vi.mock('../../refunds/hooks/useStudentRefunds', () => ({
  useStudentRefunds: vi.fn(),
  useCreateStudentRefund: vi.fn(() => ({
    reset: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useCancelStudentRefund: vi.fn(() => ({
    reset: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('../../wallet/services/studentWalletService', () => ({
  getStudentWallet: vi.fn(() => Promise.resolve({
    availableBalance: 500000,
    availableWithdrawableBalance: 500000,
    escrowBalance: 0,
    currency: 'VND',
  })),
  getStudentWithdrawals: vi.fn(() => Promise.resolve({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  })),
}));

vi.mock('../../wallet/services/studentIdentityVerificationService', () => ({
  getStudentIdentityVerificationStatus: vi.fn(() => Promise.resolve({
    verified: false,
    status: 'NOT_VERIFIED',
  })),
}));

vi.mock('../../help-center/hooks/useCommercialPolicy', () => ({
  useCommercialPolicy: vi.fn(() => ({
    data: {
      refundWindowDays: 14,
      refundProgressLimitPercent: 20,
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })),
}));

afterEach(() => {
  cleanup();
});

describe('StudentPaymentsPage', () => {
  beforeEach(() => {
    vi.mocked(useStudentRefunds).mockReturnValue({
      data: {
        content: [], page: 0, size: 100, totalElements: 0, totalPages: 0, first: true, last: true,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useStudentRefunds>);
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
                id: 'order-item-1',
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
    expect(screen.getByTestId('decorative-kanji-watermark')).toHaveTextContent('履歴');
    expect(screen.getByText('JLPT N2 chuyên sâu')).toBeInTheDocument();
    expect(screen.getAllByText(/799\.000/).length).toBeGreaterThan(0);
    expect(screen.getByText('Đã thanh toán')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Vào học/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yêu cầu hoàn tiền/i })).toBeInTheDocument();
    expect(screen.getByText('Ví học viên')).toBeInTheDocument();
    expect(screen.getByText('Ví doanh thu giảng viên')).toBeInTheDocument();
    expect(screen.getByText('Tiền nạp, hoàn tiền và thưởng học tập')).toBeInTheDocument();
    expect(screen.getByText(/không bao gồm hoa hồng giảng viên/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Nạp tiền/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xác minh SĐT & CCCD để rút hoa hồng' })).toBeInTheDocument();
  });

  it('opens CCCD verification with a safe return path to Ví & Thanh toán', async () => {
    render(
      <MemoryRouter initialEntries={['/student/payments']}>
        <StudentPaymentsPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Xác minh SĐT & CCCD để rút hoa hồng' }));
    expect(screen.getByTestId('current-location')).toHaveTextContent(
      '/student/identity-verification',
    );
  });

  it('filters out top-up orders from course order history', () => {
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

    expect(screen.getByText('Chưa có đơn hàng nào')).toBeInTheDocument();
    expect(screen.queryByText('MHB-TOPUP-001')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Vào học/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Yêu cầu hoàn tiền/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Xem chi tiết hoàn tiền/i })).not.toBeInTheDocument();
  });

  it('does not offer refund actions for a free course', () => {
    vi.mocked(useOrderHistory).mockReturnValue({
      data: {
        content: [
          {
            id: 'free-order-1',
            orderCode: 'MHB-FREE-001',
            totalAmount: 0,
            currency: 'VND',
            status: 'PAID',
            type: 'COURSE',
            createdAt: '2026-08-03T08:00:00Z',
            items: [
              {
                id: 'free-order-item-1',
                courseId: 'free-course-1',
                courseTitle: 'Free Japanese Course',
                price: 0,
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

    render(
      <MemoryRouter>
        <StudentPaymentsPage />
      </MemoryRouter>,
    );

    const courseTitle = screen.getByText('Free Japanese Course');
    const freeCourseRow = courseTitle.closest('.MuiBox-root');

    expect(screen.getByText('MHB-FREE-001')).toBeInTheDocument();
    expect(freeCourseRow).not.toBeNull();
    expect(within(freeCourseRow as HTMLElement).queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders withdrawal history when the withdrawal tab is selected', async () => {
    render(
      <MemoryRouter>
        <StudentPaymentsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Lịch sử rút hoa hồng' }));

    expect(await screen.findByText('Bạn chưa có Ví doanh thu')).toBeInTheDocument();
    expect(screen.queryByText('MHB-20260729-001')).not.toBeInTheDocument();
  });
});

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="current-location">{location.pathname}{location.search}</span>;
}
