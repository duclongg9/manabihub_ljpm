import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { systemAdministrationService } from '../services/systemAdministrationService';
import { InternalAdminAccountsPage } from './InternalAdminAccountsPage';

vi.mock('../services/systemAdministrationService', () => ({
  systemAdministrationService: {
    listInternalAdmins: vi.fn(),
    updateInternalAdminRole: vi.fn(),
  },
}));

const listInternalAdminsMock = vi.mocked(
  systemAdministrationService.listInternalAdmins,
);

afterEach(cleanup);

describe('InternalAdminAccountsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    listInternalAdminsMock.mockResolvedValue([
      {
        id: 'admin-1',
        email: 'course.manager@manabihub.local',
        fullName: 'Course Manager',
        status: 'ACTIVE',
        role: 'COURSE_MANAGER',
        lastLoginAt: null,
        updatedAt: null,
      },
    ]);
  });

  it('renders only public-safe account fields and the live-role warning', async () => {
    render(<InternalAdminAccountsPage />);

    expect(await screen.findByText('Course Manager')).toBeInTheDocument();
    expect(screen.getByText('course.manager@manabihub.local')).toBeInTheDocument();
    expect(screen.getByText(/JWT cũ sẽ bị từ chối/)).toBeInTheDocument();
    expect(screen.queryByText(/password/i)).not.toBeInTheDocument();
  });

  it('shows a retryable empty-safe error state', async () => {
    listInternalAdminsMock.mockRejectedValueOnce(new Error('offline'));

    render(<InternalAdminAccountsPage />);

    expect(await screen.findByText(
      'Không thể tải danh sách quản trị viên. Vui lòng thử lại.',
    )).toBeInTheDocument();
    expect(screen.queryByText('Course Manager')).not.toBeInTheDocument();
  });
});
