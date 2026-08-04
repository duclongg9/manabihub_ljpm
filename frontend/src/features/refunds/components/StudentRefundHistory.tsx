import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import type { StudentRefundResponse } from '../types';

interface StudentRefundHistoryProps {
  refunds: StudentRefundResponse[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onOpen: (refund: StudentRefundResponse) => void;
}

export function StudentRefundHistory({ refunds, loading, error, onRetry, onOpen }: StudentRefundHistoryProps) {
  return (
    <Box sx={{ mt: 3, border: '1px solid #E1E5EA', borderRadius: 2, bgcolor: '#fff', p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 900 }}>Lịch sử yêu cầu hoàn tiền</Typography>
      {loading && <Typography color="text.secondary" sx={{ mt: 2 }}>Đang tải lịch sử…</Typography>}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} action={<Button onClick={onRetry}>Thử lại</Button>}>
          Không thể tải lịch sử yêu cầu hoàn tiền.
        </Alert>
      )}
      {!loading && !error && refunds.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>Bạn chưa có yêu cầu hoàn tiền nào.</Typography>
      )}
      <Stack spacing={1.25} sx={{ mt: refunds.length ? 2 : 0 }}>
        {refunds.map((refund) => (
          <Button
            key={refund.id}
            variant="outlined"
            onClick={() => onOpen(refund)}
            sx={{ justifyContent: 'space-between', textAlign: 'left', p: 1.5 }}
          >
            <Box>
              <Typography sx={{ fontWeight: 800 }}>{refund.courseTitle}</Typography>
              <Typography variant="caption" color="text.secondary">
                {refund.orderCode} · {new Date(refund.createdAt).toLocaleDateString('vi-VN')}
              </Typography>
            </Box>
            <Chip label={refund.status} size="small" />
          </Button>
        ))}
      </Stack>
    </Box>
  );
}
