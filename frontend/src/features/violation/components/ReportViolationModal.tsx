import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { submitViolationReport, type ViolationReportRequest } from '../api/violationApi';
import { toast } from 'react-hot-toast';

interface ReportFormValues {
  reason: string;
}

interface ReportViolationModalProps {
  open: boolean;
  onClose: () => void;
  targetType: 'COURSE' | 'LESSON' | 'LESSON_BLOCK' | 'REVIEW' | 'USER';
  targetId: string;
}

export const ReportViolationModal = ({ open, onClose, targetType, targetId }: ReportViolationModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportFormValues>();

  const mutation = useMutation({
    mutationFn: (data: ViolationReportRequest) => submitViolationReport(data),
    onSuccess: () => {
      toast.success('Báo cáo vi phạm đã được gửi.');
      reset();
      onClose();
    },
    onError: (error: any) => {
      const msgCode = error.response?.data?.messageCode;
      if (msgCode === 'MSG-REP-002') {
        toast.error('Bạn đã gửi báo cáo tương tự trong thời gian gần đây.');
      } else {
        toast.error('Không thể lưu thông tin. Vui lòng thử lại.');
      }
    },
  });

  const onSubmit = (data: ReportFormValues) => {
    mutation.mutate({
      targetType,
      targetId,
      reason: data.reason,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Báo cáo vi phạm</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Vui lòng cung cấp chi tiết về vi phạm bạn nhận thấy. Thông tin này sẽ được gửi tới quản trị viên để xem xét.
          </Typography>
          <TextField
            {...register('reason', {
              required: 'Vui lòng nhập lý do',
              minLength: { value: 10, message: 'Vui lòng nhập ít nhất 10 ký tự' },
              maxLength: { value: 1000, message: 'Lý do không được quá 1000 ký tự' }
            })}
            label="Lý do báo cáo"
            multiline
            rows={4}
            fullWidth
            required
            error={!!errors.reason}
            helperText={errors.reason?.message}
            margin="normal"
            disabled={mutation.isPending}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={mutation.isPending}>
            Hủy
          </Button>
          <Button type="submit" variant="contained" color="error" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
