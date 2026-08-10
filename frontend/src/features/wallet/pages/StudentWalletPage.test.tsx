import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStudentWallet } from '../services/studentWalletService';
import { StudentWalletPage } from './StudentWalletPage';
import { getStudentIdentityVerificationStatus } from '../services/studentIdentityVerificationService';

vi.mock('../services/studentWalletService', () => ({
  getStudentWallet: vi.fn(),
}));

vi.mock('../services/studentIdentityVerificationService', () => ({
  getStudentIdentityVerificationStatus: vi.fn(),
}));

describe('StudentWalletPage', () => {
  beforeEach(() => {
    vi.mocked(getStudentWallet).mockResolvedValue({
      balance: 0,
      frozenBalance: 0,
      availableBalance: 0,
      currency: 'VND',
    });
    vi.mocked(getStudentIdentityVerificationStatus).mockResolvedValue({
      verified: false,
      status: 'NOT_VERIFIED',
    });
  });

  it('renders a non-interactive wallet kanji watermark behind the page content', async () => {
    render(<MemoryRouter><StudentWalletPage /></MemoryRouter>);

    const watermark = screen.getByTestId('decorative-kanji-watermark');
    expect(watermark).toHaveTextContent('財布');
    expect(watermark).toHaveAttribute('aria-hidden', 'true');
    expect((await screen.findAllByText('0 VND')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('heading', { name: 'Ví của tôi' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nạp tiền qua VNPay' })).not.toBeInTheDocument();
    expect(screen.getByText('ManabiHub không hỗ trợ nạp tiền trực tiếp vào ví để hạn chế rủi ro rửa tiền.')).toBeInTheDocument();
  });
});
