import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { confirmVnPayReturn } from '../../checkout/services/checkoutService';
import { useTopUpStatus } from '../hooks/useWalletTopUp';
import { ROUTES } from '../../../shared/constants/routes';
import { formatMoney } from '../utils';

/**
 * Landing page for the payment provider's redirect after a wallet top-up (UC-17 alt. flow 4a).
 * <p>
 * The redirect is not evidence of payment. We forward the signed params so the backend can
 * verify the checksum and credit immediately (the server-to-server IPN cannot reach
 * localhost), then poll the owner-scoped top-up record for the authoritative status.
 */
export function WalletTopUpReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topUpId = searchParams.get('topUpId');

  // Hold off polling until the return params have been forwarded, so the first read is
  // not a guaranteed PENDING.
  const [confirmed, setConfirmed] = useState(false);
  const confirmStarted = useRef(false);

  useEffect(() => {
    if (confirmStarted.current) return;
    confirmStarted.current = true;

    const returnParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      returnParams[key] = value;
    });

    if (!('vnp_ResponseCode' in returnParams)) {
      setConfirmed(true);
      return;
    }

    confirmVnPayReturn(returnParams)
      .catch(() => {
        // Ignore — the authoritative IPN may still confirm it; polling will reveal the truth.
      })
      .finally(() => setConfirmed(true));
  }, [searchParams]);

  const { data: topUp, isError } = useTopUpStatus(topUpId, confirmed);

  const goToWallet = () => navigate(ROUTES.STUDENT.WALLET);

  if (!topUpId) {
    return (
      <Result
        title="Không tìm thấy yêu cầu nạp tiền"
        description="Liên kết trở về không hợp lệ. Vui lòng kiểm tra lại trong ví của bạn."
        onBack={goToWallet}
      />
    );
  }

  if (isError) {
    return (
      <Result
        title="Không thể kiểm tra trạng thái"
        description="Giao dịch có thể vẫn đang được xử lý. Hãy kiểm tra lại lịch sử nạp tiền sau ít phút."
        onBack={goToWallet}
      />
    );
  }

  if (!topUp || topUp.status === 'PENDING') {
    return (
      <Box sx={{ maxWidth: 520, mx: 'auto', px: 2, py: 10, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', mt: 3 }}>
          Đang xác nhận giao dịch nạp tiền…
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 1 }}>
          Vui lòng không đóng trang này.
        </Typography>
      </Box>
    );
  }

  if (topUp.status === 'SUCCESS') {
    return (
      <Result
        variant="success"
        title="Nạp tiền thành công"
        description={`Ví của bạn đã được cộng ${formatMoney(topUp.amount, topUp.currency)} (mã ${topUp.topUpCode}).`}
        onBack={goToWallet}
      />
    );
  }

  return (
    <Result
      variant="error"
      title="Nạp tiền không thành công"
      description={`Giao dịch ${topUp.topUpCode} chưa hoàn tất. Số dư của bạn không thay đổi. Vui lòng thử lại.`}
      onBack={goToWallet}
    />
  );
}

function Result({
  variant = 'pending',
  title,
  description,
  onBack,
}: {
  variant?: 'success' | 'error' | 'pending';
  title: string;
  description: string;
  onBack: () => void;
}) {
  const palette = {
    success: { bg: '#dcfce7', color: '#166534', symbol: '✓' },
    error: { bg: '#fee2e2', color: '#9f1239', symbol: '✕' },
    pending: { bg: '#fef3c7', color: '#92400e', symbol: '…' },
  }[variant];

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', px: 2, py: 10, textAlign: 'center' }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          mx: 'auto',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          fontWeight: 800,
          bgcolor: palette.bg,
          color: palette.color,
        }}
      >
        {palette.symbol}
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', mt: 3 }}>{title}</Typography>
      <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mt: 1 }}>
        {description}
      </Typography>
      <Button
        variant="contained"
        onClick={onBack}
        sx={{ mt: 4, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
      >
        Về ví của tôi
      </Button>
    </Box>
  );
}

export default WalletTopUpReturnPage;
