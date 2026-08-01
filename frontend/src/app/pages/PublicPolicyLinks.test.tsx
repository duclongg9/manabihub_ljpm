import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { PublicLoginPage } from './PublicLoginPage';
import { BecomeTeacherBanner } from './PublicHomePage/BecomeTeacherBanner';
import { LandingFooter } from './PublicHomePage/LandingFooter';

const renderInRouter = (component: React.ReactNode) => render(
  <MemoryRouter>{component}</MemoryRouter>,
);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('public policy links', () => {
  it('routes every footer policy label to a real policy/help destination', () => {
    renderInRouter(<LandingFooter />);

    expect(screen.getByRole('link', { name: 'Điều khoản sử dụng' }).getAttribute('href'))
      .toBe(ROUTES.PUBLIC.TERMS);
    expect(screen.getByRole('link', { name: 'Chính sách bảo mật' }).getAttribute('href'))
      .toBe(ROUTES.PUBLIC.PRIVACY);
    expect(screen.getByRole('link', { name: 'Trung tâm trợ giúp' }).getAttribute('href'))
      .toBe(ROUTES.PUBLIC.HELP);
    expect(screen.getByRole('link', { name: 'Điều khoản giảng viên' }).getAttribute('href'))
      .toBe(ROUTES.PUBLIC.INSTRUCTOR_TERMS);
    expect(screen.getByRole('link', { name: 'Chính sách chia sẻ doanh thu' }).getAttribute('href'))
      .toBe(ROUTES.PUBLIC.INSTRUCTOR_REVENUE_SHARE);
    expect(screen.queryByText(/97%/)).toBeNull();
    expect(screen.queryByText('Sitemap')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('uses policy links and no unsupported revenue percentage in the teacher banner', () => {
    renderInRouter(<BecomeTeacherBanner />);

    expect(screen.getByRole('link', {
      name: 'Xem chính sách chia sẻ doanh thu hiện hành',
    }).getAttribute('href')).toBe(ROUTES.PUBLIC.INSTRUCTOR_REVENUE_SHARE);
    expect(screen.getByRole('link', { name: 'Bắt đầu giảng dạy ngay' }).getAttribute('href'))
      .toBe(ROUTES.TEACHER.KYC);
    expect(screen.queryByText(/97%/)).toBeNull();
  });

  it('shows navigable terms and privacy references before public login', () => {
    renderInRouter(<PublicLoginPage />);

    expect(screen.getByRole('link', { name: 'Điều khoản sử dụng' }).getAttribute('href'))
      .toBe(ROUTES.PUBLIC.TERMS);
    expect(screen.getByRole('link', { name: 'Chính sách bảo mật' }).getAttribute('href'))
      .toBe(ROUTES.PUBLIC.PRIVACY);
    expect(screen.queryByText(/bạn đồng ý/i)).toBeNull();
    expect(screen.queryByText(/hàng đầu|500\+ học viên/i)).toBeNull();
  });
});
