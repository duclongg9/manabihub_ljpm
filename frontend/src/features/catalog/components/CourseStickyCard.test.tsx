import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CourseStickyCard } from './CourseStickyCard';

const mocks = vi.hoisted(() => ({
  createCheckout: vi.fn(),
  getAuthSession: vi.fn(),
}));

vi.mock('../../checkout/services/checkoutService', () => ({
  createCheckout: mocks.createCheckout,
}));

vi.mock('../../../shared/auth/authSession', () => ({
  getAuthSession: mocks.getAuthSession,
}));

vi.mock('../../wishlist/components/WishlistToggleButton', () => ({
  WishlistToggleButton: () => null,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const course = {
  id: 'course-1',
  slug: 'kanji-n5',
  title: 'Kanji N5',
  thumbnailUrl: '/uploads/courses/kanji-n5.webp',
  price: 0,
  currency: 'VND',
  aiSupported: false,
  teacher: { id: 'teacher-1', name: 'An', verified: true },
  isEnrolled: false,
  totalDurationMinutes: 0,
  totalLessons: 0,
  modules: [],
};

describe('CourseStickyCard', () => {
  it('resolves relative thumbnail URLs through the backend origin', () => {
    render(
      <MemoryRouter>
        <CourseStickyCard course={course} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img', { name: 'Ảnh bìa khóa học Kanji N5' }))
      .toHaveAttribute('src', 'http://localhost:8081/uploads/courses/kanji-n5.webp');
  });

  it('shows an accessible fallback when the thumbnail cannot be loaded', () => {
    render(
      <MemoryRouter>
        <CourseStickyCard course={course} />
      </MemoryRouter>,
    );

    fireEvent.error(screen.getByRole('img', { name: 'Ảnh bìa khóa học Kanji N5' }));

    expect(screen.getByRole('img', { name: 'Khóa học Kanji N5 chưa có ảnh bìa' }))
      .toBeInTheDocument();
  });

  it('explains that an internal wallet-payment failure did not debit the balance', async () => {
    mocks.getAuthSession.mockReturnValue({ token: 'student-token' });
    mocks.createCheckout.mockRejectedValue({
      response: { data: { messageCode: 'COMMON_INTERNAL_ERROR' } },
    });

    render(
      <MemoryRouter>
        <CourseStickyCard course={{ ...course, price: 250_000 }} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Thanh toán bằng ví' }));

    expect(await screen.findByText(
      'Thanh toán chưa hoàn tất và số dư ví chưa bị trừ. Vui lòng thử lại.',
    )).toBeInTheDocument();
    expect(mocks.createCheckout).toHaveBeenCalledWith('course-1', 'WALLET');
  });
});
