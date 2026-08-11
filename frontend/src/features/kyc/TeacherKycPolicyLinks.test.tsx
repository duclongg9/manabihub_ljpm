import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { TeacherKycPage } from './TeacherKycPage';

const apiMocks = vi.hoisted(() => ({
  getTeacherKycStatus: vi.fn(),
  restartTeacherVerification: vi.fn(),
  submitTeacherCertificate: vi.fn(),
  verifyTeacherIdentity: vi.fn(),
}));

vi.mock('./teacherKycApi', () => apiMocks);
vi.mock('./certificateOcr', () => ({ recognizeJlptCertificate: vi.fn() }));
vi.mock('./vnptIdentitySdk', () => ({
  launchVnptIdentitySdk: vi.fn(),
  resetVnptIdentitySdkRuntime: vi.fn(),
}));

beforeEach(() => {
  apiMocks.getTeacherKycStatus.mockResolvedValue({
    teacherId: 'teacher-1',
    userId: 'user-1',
    teacherKycStatus: 'IDENTITY_VERIFIED',
    teacherKycStatusLabel: 'Đã xác minh danh tính',
    canPublishCourse: false,
    identityVerification: {
      status: 'VERIFIED',
      statusLabel: 'Đã xác minh',
      canInteract: false,
    },
    certificateVerification: {
      status: 'NOT_STARTED',
      statusLabel: 'Chưa nộp',
      canInteract: true,
    },
    latestRequest: null,
    srsTrace: {},
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('TeacherKycPage policy links', () => {
  it('links KYC guidance and the copyright confirmation to the matching terms', async () => {
    render(
      <MemoryRouter>
        <TeacherKycPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', {
      name: 'Tìm hiểu thêm về chính sách KYC',
    }).getAttribute('href')).toBe(`${ROUTES.PUBLIC.HELP}/instructors/verification`);
    expect((await screen.findByRole('link', {
      name: 'Điều khoản dành cho giảng viên',
    })).getAttribute('href')).toBe(ROUTES.PUBLIC.INSTRUCTOR_TERMS);
    expect(screen.getByRole('link', { name: 'Điều khoản sử dụng' }).getAttribute('href'))
      .toBe(ROUTES.PUBLIC.TERMS);
    expect(screen.getByRole('checkbox', {
      name: 'Tôi đã đọc Điều khoản dành cho giảng viên và chấp nhận cam kết trách nhiệm bản quyền: tôi có quyền sử dụng hợp lệ đối với nội dung số mình gửi lên ManabiHub.',
    }).hasAttribute('disabled')).toBe(false);
  });
});
