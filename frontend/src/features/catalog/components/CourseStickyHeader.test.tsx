import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PublicCourseDetail } from '../types/courseDetailTypes';
import { CourseStickyHeader } from './CourseStickyHeader';

describe('CourseStickyHeader', () => {
  it('forwards the purchase action to the shared checkout flow', () => {
    const onPurchase = vi.fn();

    render(
      <CourseStickyHeader
        course={{
          title: 'Kanji N5',
          price: 250_000,
          currency: 'VND',
          isEnrolled: false,
        } as unknown as PublicCourseDetail}
        onPurchase={onPurchase}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mua ngay' }));

    expect(onPurchase).toHaveBeenCalledTimes(1);
  });
});
