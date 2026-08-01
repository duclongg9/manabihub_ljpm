import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CourseStickyCard } from './CourseStickyCard';

vi.mock('../../wishlist/components/WishlistToggleButton', () => ({
  WishlistToggleButton: () => null,
}));

afterEach(cleanup);

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
});
