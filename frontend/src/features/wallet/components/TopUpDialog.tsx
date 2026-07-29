import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { formatMoney } from '../utils';

/** Mirrors the server-side bounds in WalletTopUpServiceImpl — the server re-checks both. */
const MIN_AMOUNT = 10_000;
const MAX_AMOUNT = 50_000_000;
const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000];

interface TopUpDialogProps {
  open: boolean;
  currency: string;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}

/**
 * Collects the top-up amount and hands it to the caller, which creates the request and
 * redirects to the payment provider (UC-17 alternative flow 4a).
 */
export const TopUpDialog = ({
  open,
  currency,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: TopUpDialogProps) => {
  const [amount, setAmount] = useState<string>('');

  const parsed = Number(amount.replace(/\D/g, ''));
  const validation = validate(parsed);

  const handleClose = () => {
    if (isSubmitting) return;
    setAmount('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Nạp tiền vào ví</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>
          Bạn sẽ được chuyển tới cổng thanh toán. Số dư chỉ được cộng sau khi cổng thanh toán
          xác nhận giao dịch.
        </Typography>

        <TextField
          autoFocus
          fullWidth
          label="Số tiền"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          error={Boolean(amount) && Boolean(validation)}
          helperText={
            (amount && validation) ||
            `Tối thiểu ${formatMoney(MIN_AMOUNT, currency)} — tối đa ${formatMoney(MAX_AMOUNT, currency)}`
          }
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">{currency}</InputAdornment>,
            },
            htmlInput: { inputMode: 'numeric' },
          }}
        />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          {QUICK_AMOUNTS.map((quick) => (
            <Button
              key={quick}
              size="small"
              variant={parsed === quick ? 'contained' : 'outlined'}
              onClick={() => setAmount(String(quick))}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              {quick.toLocaleString('vi-VN')}
            </Button>
          ))}
        </Box>

        {errorMessage && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="error">{errorMessage}</Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting} sx={{ textTransform: 'none' }}>
          Huỷ
        </Button>
        <Button
          variant="contained"
          disabled={isSubmitting || Boolean(validation)}
          onClick={() => onSubmit(parsed)}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {isSubmitting ? 'Đang tạo yêu cầu…' : 'Tiếp tục thanh toán'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

function validate(amount: number): string | null {
  if (!amount || Number.isNaN(amount)) return 'Vui lòng nhập số tiền.';
  if (amount < MIN_AMOUNT) return `Số tiền tối thiểu là ${MIN_AMOUNT.toLocaleString('vi-VN')}.`;
  if (amount > MAX_AMOUNT) return `Số tiền tối đa là ${MAX_AMOUNT.toLocaleString('vi-VN')}.`;
  return null;
}
