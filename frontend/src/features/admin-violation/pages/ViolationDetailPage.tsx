import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GavelIcon from '@mui/icons-material/Gavel';
import HistoryIcon from '@mui/icons-material/History';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { useResolveViolation } from '../hooks/useResolveViolation';
import { useViolationDetail } from '../hooks/useViolationDetail';
import type { ModerationActionType, ModerationDecisionType, ResolveViolationRequest } from '../types/violation.types';
import { toast } from 'react-hot-toast';

const statusColorMap: Record<string, { label: string; color: string; bgcolor: string }> = {
  PENDING_REVIEW: { label: 'Chờ duyệt', color: '#d97706', bgcolor: '#fef3c7' },
  IN_REVIEW: { label: 'Đang xem xét', color: '#2563eb', bgcolor: '#dbeafe' },
  PENDING_EVIDENCE: { label: 'Chờ bằng chứng', color: '#7c3aed', bgcolor: '#ede9fe' },
  CORRECTION_REQUIRED: { label: 'Yêu cầu sửa đổi', color: '#059669', bgcolor: '#d1fae5' },
  RESOLVED_UPHELD: { label: 'Vi phạm', color: '#dc2626', bgcolor: '#fee2e2' },
  RESOLVED_NO_VIOLATION: { label: 'Không vi phạm', color: '#16a34a', bgcolor: '#dcfce3' },
  INVALID: { label: 'Báo cáo sai', color: '#6b7280', bgcolor: '#f3f4f6' },
  CANCELLED: { label: 'Đã hủy', color: '#4b5563', bgcolor: '#e5e7eb' },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ViolationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: response, isLoading, isError } = useViolationDetail(id!);
  const { mutate: resolveViolation, isPending } = useResolveViolation();

  const [decision, setDecision] = useState<ModerationDecisionType>('UPHELD');
  const [decisionNote, setDecisionNote] = useState('');
  const [selectedActions, setSelectedActions] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const detail = response;
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !detail) {
    return <Alert severity="error">Không thể tải thông tin báo cáo</Alert>;
  }

  const isResolved = ['RESOLVED_UPHELD', 'RESOLVED_NO_VIOLATION', 'CANCELLED'].includes(detail.status);
  
  const handleActionToggle = (action: ModerationActionType) => {
    setSelectedActions(prev => ({
      ...prev,
      [action]: !prev[action]
    }));
  };

  const hasSevereAction = selectedActions['BAN_ACCOUNT'] || selectedActions['FREEZE_BALANCE'];

  const handleSubmit = () => {
    if (!decisionNote.trim()) {
      toast.error('Vui lòng nhập ghi chú quyết định');
      return;
    }
    
    if (decision === 'UPHELD') {
      const actions = Object.entries(selectedActions)
        .filter(([_, value]) => value)
        .map(([key]) => key as ModerationActionType);
        
      if (actions.length === 0) {
        toast.error('Vui lòng chọn ít nhất một hình thức xử lý khi xác nhận vi phạm');
        return;
      }
      
      if (hasSevereAction && !confirmOpen) {
        setConfirmOpen(true);
        return;
      }
    }
    
    executeResolve();
  };
  
  const executeResolve = () => {
    const payload: ResolveViolationRequest = {
      decision,
      decisionNote,
    };
    
    if (decision === 'UPHELD') {
      payload.actions = Object.entries(selectedActions)
        .filter(([_, value]) => value)
        .map(([key]) => key as ModerationActionType);
    }
    
    resolveViolation({ id: id!, data: payload }, {
      onSuccess: () => {
        toast.success('Đã xử lý báo cáo thành công');
        setConfirmOpen(false);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý báo cáo');
        setConfirmOpen(false);
      }
    });
  };

  const statusConfig = statusColorMap[detail.status] || statusColorMap['PENDING_REVIEW'];

  return (
    <Box>
      <PageHeader
        title="Chi tiết báo cáo"
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Vi phạm', path: '/admin/violations' },
          { label: 'Chi tiết' },
        ]}
      />
      
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/admin/violations')}
        sx={{ mb: 3 }}
      >
        Quay lại hàng đợi
      </Button>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardHeader title="Thông tin vi phạm" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Trạng thái</Typography>
                  <Chip
                    size="small"
                    label={statusConfig.label}
                    sx={{ bgcolor: statusConfig.bgcolor, color: statusConfig.color, fontWeight: 700, mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Ngày báo cáo</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(detail.submittedAt)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Người báo cáo</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {detail.reporter?.displayName || 'Ẩn danh'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Lý do vi phạm</Typography>
                  <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                    {detail.reason}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Card variant="outlined">
            <CardHeader title="Đối tượng bị báo cáo" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Loại đối tượng</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {detail.target.targetType === 'COURSE' ? 'Khóa học' : detail.target.targetType}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">ID Đối tượng</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {detail.target.targetId}
                  </Typography>
                </Grid>
                {detail.target.courseTitle && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Tên khóa học</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {detail.target.courseTitle}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
          
          {detail.moderationHistory && detail.moderationHistory.length > 0 && (
            <Card variant="outlined" sx={{ mt: 3 }}>
              <CardHeader title="Lịch sử xử lý" avatar={<HistoryIcon color="action" />} />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  {detail.moderationHistory.map((history, i) => (
                    <Box key={i} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1 }}>
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {history.decisionType}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(history.decidedAt)} bởi {history.decidedBy}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" mb={1}>{history.decisionNote}</Typography>
                      {history.actions && history.actions.length > 0 && (
                        <Stack direction="row" spacing={1}>
                          {history.actions.map((act, j) => (
                            <Chip key={j} label={act} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      )}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ position: 'sticky', top: 24 }}>
            <CardHeader 
              title="Xử lý vi phạm" 
              avatar={<GavelIcon color="primary" />}
              sx={{ bgcolor: '#f8fafc' }}
            />
            <Divider />
            <CardContent>
              {isResolved ? (
                <Alert severity="info">
                  Báo cáo này đã được xử lý và đóng.
                </Alert>
              ) : (
                <Stack spacing={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Quyết định</InputLabel>
                    <Select
                      value={decision}
                      label="Quyết định"
                      onChange={(e) => setDecision(e.target.value as ModerationDecisionType)}
                    >
                      <MenuItem value="UPHELD">Xác nhận vi phạm</MenuItem>
                      <MenuItem value="DISMISSED">Bác bỏ (Không vi phạm)</MenuItem>
                      <MenuItem value="CORRECTION_REQUIRED">Yêu cầu sửa đổi</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {decision === 'UPHELD' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                        Hình thức xử lý (Chọn nhiều)
                      </Typography>
                      <FormGroup>
                        <FormControlLabel 
                          control={<Switch checked={!!selectedActions['FORCE_DRAFT']} onChange={() => handleActionToggle('FORCE_DRAFT')} />} 
                          label="Chuyển khóa học về bản nháp (Ẩn)" 
                        />
                        <FormControlLabel 
                          control={<Switch checked={!!selectedActions['BAN_ACCOUNT']} onChange={() => handleActionToggle('BAN_ACCOUNT')} color="error" />} 
                          label="Khóa tài khoản Giáo viên" 
                        />
                        <FormControlLabel 
                          control={<Switch checked={!!selectedActions['FREEZE_BALANCE']} onChange={() => handleActionToggle('FREEZE_BALANCE')} color="error" />} 
                          label="Đóng băng ví Giáo viên" 
                        />
                      </FormGroup>
                    </Box>
                  )}
                  
                  <TextField
                    label="Ghi chú quyết định"
                    multiline
                    rows={4}
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder="Giải thích lý do xử lý để lưu vết..."
                    required
                  />
                  
                  <Button 
                    variant="contained" 
                    color={decision === 'UPHELD' && hasSevereAction ? 'error' : 'primary'}
                    fullWidth
                    size="large"
                    onClick={handleSubmit}
                    disabled={isPending}
                  >
                    {isPending ? <CircularProgress size={24} color="inherit" /> : 'Xác nhận xử lý'}
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>Xác nhận hành động nghiêm trọng</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn đang áp dụng các hình thức xử lý nghiêm trọng:
            {selectedActions['BAN_ACCOUNT'] && <b> Khóa tài khoản</b>}
            {selectedActions['BAN_ACCOUNT'] && selectedActions['FREEZE_BALANCE'] && <b> và</b>}
            {selectedActions['FREEZE_BALANCE'] && <b> Đóng băng ví</b>}.
            <br /><br />
            Hành động này sẽ ngăn giáo viên đăng nhập hoặc rút tiền ngay lập tức. Bạn có chắc chắn muốn tiếp tục?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={isPending}>Hủy</Button>
          <Button onClick={executeResolve} color="error" variant="contained" disabled={isPending}>
            {isPending ? 'Đang xử lý...' : 'Đồng ý xử lý'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
