import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ROLES } from '../constants/roles';
import { getHeaderBrand } from './headerBrand';
import { Header } from './Header';

vi.mock('../../features/notifications/hooks/useNotifications', () => ({
  useUnreadCount: () => ({ data: 0 }),
}));

describe('getHeaderBrand', () => {
  it('uses role-specific branding for teacher and admin sessions', () => {
    expect(getHeaderBrand({ kind: 'public', roles: [ROLES.TEACHER] })).toBe('ManabiTeacher');
    expect(getHeaderBrand({ kind: 'admin', roles: [ROLES.COURSE_MANAGER] })).toBe('ManabiAdmin');
  });

  it('keeps the public brand for students and guests', () => {
    expect(getHeaderBrand({ kind: 'public', roles: [ROLES.STUDENT] })).toBe('ManabiHub');
    expect(getHeaderBrand()).toBe('ManabiHub');
  });

  it('keeps the Admin Portal brand static instead of linking to the public landing page', () => {
    render(createElement(
      MemoryRouter,
      { initialEntries: ['/admin/system-settings'] },
      createElement(Header, {
        session: {
          kind: 'admin',
          token: 'token',
          subject: 'admin-1',
          email: 'admin@example.com',
          roles: [ROLES.SYSTEM_ADMIN],
          expiresAt: Date.now() + 60_000,
        },
      }),
    ));

    const brand = screen.getByLabelText('ManabiAdmin');
    expect(brand.tagName).toBe('DIV');
    expect(brand).not.toHaveAttribute('href');
  });
});
