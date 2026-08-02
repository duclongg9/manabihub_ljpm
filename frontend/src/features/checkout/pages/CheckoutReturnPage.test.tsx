import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CheckoutReturnPage } from './CheckoutReturnPage';

const mocks = vi.hoisted(() => ({
  getOrder: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock('../services/checkoutService', () => ({
  getOrder: mocks.getOrder,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CheckoutReturnPage', () => {
  it('asks before navigating to a paid course', async () => {
    mocks.getOrder.mockResolvedValue({
      id: 'order-1',
      orderCode: 'MHB-001',
      totalAmount: 250_000,
      currency: 'VND',
      status: 'PAID',
      type: 'COURSE',
      createdAt: '2026-08-02T00:00:00Z',
      items: [{ courseId: 'course-1', courseTitle: 'Kanji N5', price: 250_000 }],
    });

    render(
      <MemoryRouter initialEntries={['/checkout/return?orderId=order-1']}>
        <CheckoutReturnPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Thanh toán thành công!' }))
      .toBeInTheDocument();
    expect(screen.getByText('Bạn đã sở hữu khóa học này. Bạn có muốn bắt đầu học ngay không?'))
      .toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Học ngay' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/student/courses/course-1/learn');

    fireEvent.click(screen.getByRole('button', { name: 'Để sau' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/student/courses');
  });
});
