import { describe, expect, it } from 'vitest';
import { ROLES } from '../constants/roles';
import { getHeaderBrand } from './headerBrand';

describe('getHeaderBrand', () => {
  it('uses role-specific branding for teacher and admin sessions', () => {
    expect(getHeaderBrand({ kind: 'public', roles: [ROLES.TEACHER] })).toBe('ManabiTeacher');
    expect(getHeaderBrand({ kind: 'admin', roles: [ROLES.COURSE_MANAGER] })).toBe('ManabiAdmin');
  });

  it('keeps the public brand for students and guests', () => {
    expect(getHeaderBrand({ kind: 'public', roles: [ROLES.STUDENT] })).toBe('ManabiHub');
    expect(getHeaderBrand()).toBe('ManabiHub');
  });
});
