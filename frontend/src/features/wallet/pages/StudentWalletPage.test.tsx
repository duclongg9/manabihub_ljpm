import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStudentWallet } from '../services/studentWalletService';
import { StudentWalletPage } from './StudentWalletPage';

vi.mock('../services/studentWalletService', () => ({
  getStudentWallet: vi.fn(),
}));

describe('StudentWalletPage', () => {
  beforeEach(() => {
    vi.mocked(getStudentWallet).mockResolvedValue({
      balance: 0,
      frozenBalance: 0,
      availableBalance: 0,
      currency: 'VND',
    });
  });

  it('renders a non-interactive wallet kanji watermark behind the page content', async () => {
    render(<StudentWalletPage />);

    const watermark = screen.getByTestId('decorative-kanji-watermark');
    expect(watermark).toHaveTextContent('財布');
    expect(watermark).toHaveAttribute('aria-hidden', 'true');
    expect((await screen.findAllByText('0 VND')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('heading', { name: 'Ví của tôi' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nạp tiền qua VNPay' })).not.toBeInTheDocument();
    expect(screen.getByText('ManabiHub không hỗ trợ nạp tiền trực tiếp vào ví để hạn chế rủi ro rửa tiền.')).toBeInTheDocument();
  });
});
