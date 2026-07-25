import React, { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { formatMoney } from '../utils/walletFormat';

/** Kept in sync with WALLET_MIN_TOP_UP_AMOUNT (V030 system setting). */
const MIN_TOP_UP = 50000;
const MAX_TOP_UP = 50000000;
const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000];

interface TopUpDialogProps {
  open: boolean;
  currency: string;
  isSubmitting: boolean;
  /** Server-side error already mapped to Vietnamese via messageCode. */
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}

/**
 * UC-17 alternative flow 4a: the Student starts a top-up.
 *
 * The dialog validates locally for fast feedback, but the amount rules are
 * enforced again on the server — the client result is never trusted
 * (NFR-SEC-14).
 */
export const TopUpDialog: React.FC<TopUpDialogProps> = ({
  open,
  currency,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
}) => {
  const [rawAmount, setRawAmount] = useState('');
  const [touched, setTouched] = useState(false);

  const amount = Number(rawAmount);
  const localError = validate(rawAmount);
  const showError = touched && localError !== null;

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    setRawAmount('');
    setTouched(false);
    onClose();
  };

  const handleSubmit = () => {
    setTouched(true);
    if (localError !== null) {
      return;
    }
    onSubmit(amount);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Nạp tiền vào ví</DialogTitle>

      <DialogContent>
        <Stack sx={{ gap: 2, pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Số tiền nạp tối thiểu là {formatMoney(MIN_TOP_UP, currency)}. Số dư chỉ được cộng sau
            khi hệ thống nhận xác nhận thanh toán.
          </Typography>

          <TextField
            autoFocus
            fullWidth
            label="Số tiền"
            value={rawAmount}
            onChange={(event) => setRawAmount(event.target.value.replace(/[^\d]/g, ''))}
            onBlur={() => setTouched(true)}
            error={showError}
            helperText={showError ? localError : ' '}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          />

          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            {QUICK_AMOUNTS.map((quickAmount) => (
              <Button
                key={quickAmount}
                size="small"
                variant="outlined"
                onClick={() => {
                  setRawAmount(String(quickAmount));
                  setTouched(true);
                }}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                {formatMoney(quickAmount, currency)}
              </Button>
            ))}
          </Stack>

          {serverError && <Alert severity="error">{serverError}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} disabled={isSubmitting} sx={{ textTransform: 'none' }}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
          sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#C41E3A', '&:hover': { bgcolor: '#a01830' } }}
        >
          {isSubmitting ? 'Đang tạo yêu cầu...' : 'Tạo yêu cầu nạp'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

function validate(rawAmount: string): string | null {
  if (!rawAmount) {
    return 'Vui lòng nhập số tiền.';
  }

  const value = Number(rawAmount);
  if (!Number.isFinite(value) || value <= 0) {
    return 'Số tiền không hợp lệ.';
  }
  if (value < MIN_TOP_UP) {
    return `Số tiền tối thiểu là ${formatMoney(MIN_TOP_UP)}.`;
  }
  if (value > MAX_TOP_UP) {
    return `Số tiền tối đa là ${formatMoney(MAX_TOP_UP)}.`;
  }

  return null;
}
