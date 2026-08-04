import { describe, expect, it } from 'vitest';
import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import { ADMIN_MENU } from './adminMenu';

describe('ADMIN_MENU route permissions', () => {
  it.each([
    ROUTES.ADMIN.KYC_REVIEW,
    ROUTES.ADMIN.COURSE_APPROVAL,
  ])('allows both backend review roles to open %s', (path) => {
    const item = ADMIN_MENU.find((candidate) => candidate.path === path);

    expect(item?.roles).toEqual(expect.arrayContaining([
      ROLES.COURSE_MANAGER,
      ROLES.SYSTEM_ADMIN,
    ]));
  });
});
