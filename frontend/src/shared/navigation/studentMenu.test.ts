import { describe, expect, it } from 'vitest';
import { ROUTES } from '../constants/routes';
import { STUDENT_MENU } from './studentMenu';

describe('STUDENT_MENU', () => {
  it('keeps wallet top-up and payment history as separate destinations', () => {
    expect(STUDENT_MENU).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Ví của tôi', path: ROUTES.STUDENT.WALLET }),
      expect.objectContaining({ title: 'Lịch sử thanh toán', path: ROUTES.STUDENT.PAYMENTS }),
    ]));
  });
});
