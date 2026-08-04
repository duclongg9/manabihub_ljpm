import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { systemAdministrationService } from '../services/systemAdministrationService';
import { InternalAdminAccountsPage } from './InternalAdminAccountsPage';

vi.mock('../services/systemAdministrationService', () => ({
  systemAdministrationService: {
    listInternalAdmins: vi.fn(),
    updateInternalAdminRole: vi.fn(),
    inviteInternalAdmin: vi.fn(),
    resendInternalAdminInvitation: vi.fn(),
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
        invitationStatus: 'NONE',
        invitationExpiresAt: null,
      },
    ]);
  });

  it('renders safe account fields and invitation guidance', async () => {
    render(<InternalAdminAccountsPage />);

    expect(await screen.findByText('Course Manager')).toBeInTheDocument();
    expect(screen.getByText('course.manager@manabihub.local')).toBeInTheDocument();
    expect(screen.getByText(/Người nhận tự đặt mật khẩu/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mời tài khoản' })).toBeInTheDocument();
    expect(screen.queryByText(/password_hash/i)).not.toBeInTheDocument();
  });

  it('shows a retryable error state', async () => {
    listInternalAdminsMock.mockRejectedValueOnce(new Error('offline'));

    render(<InternalAdminAccountsPage />);

    expect(await screen.findByText(
      'Không thể tải danh sách quản trị viên. Vui lòng thử lại.',
    )).toBeInTheDocument();
    expect(screen.queryByText('Course Manager')).not.toBeInTheDocument();
  });
});
