import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { adminKycService, KYC_STATUS_LABELS } from '../services/adminKycService';
import type { KycRequestResponse } from '../services/adminKycService';
import { PageSkeleton } from '../../../shared/components/PageSkeleton/PageSkeleton';
import { ErrorState } from '../../../shared/components/ErrorState/ErrorState';
import { EmptyState } from '../../../shared/components/EmptyState/EmptyState';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'success';
    case 'PENDING': return 'warning';
    case 'REJECTED': return 'error';
    case 'CORRECTION_REQUIRED': return 'warning';
    case 'REVOKED': return 'default';
    default: return 'default';
  }
};

const getRiskColor = (risk: string | undefined | null) => {
  if (!risk) return 'default';
  if (risk === 'LOW') return 'success';
  if (risk === 'MEDIUM') return 'warning';
  return 'error';
};

const getRiskLabel = (risk: string | undefined | null) => {
  if (!risk) return 'Chưa đánh giá';
  if (risk === 'LOW') return 'Thấp';
  if (risk === 'MEDIUM') return 'Trung bình';
  return 'Cao';
};

export function KycQueuePage() {
  const [queue, setQueue] = useState<KycRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setQueue(await adminKycService.getPendingKycQueue());
    } catch (requestError) {
      if (isAxiosError(requestError) && requestError.response?.status === 401) {
        setError('UNAUTHORIZED');
      } else if (isAxiosError(requestError) && requestError.response?.status === 403) {
        setError('ACCESS_DENIED');
      } else {
        setError('ERROR');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  if (loading) {
    return <PageSkeleton variant="table" />;
  }

  if (error) {
    if (error === 'UNAUTHORIZED') {
      return (
        <ErrorState 
          title="Phiên đăng nhập hết hạn" 
          message="Vui lòng đăng nhập lại để tiếp tục."
          retryLabel="Về trang chủ"
          onRetry={() => navigate('/')}
        />
      );
    }
    if (error === 'ACCESS_DENIED') {
      return (
        <ErrorState 
          title="Truy cập bị từ chối" 
          message="Bạn cần quyền Course Manager để xem danh sách này."
          retryLabel="Về trang chủ"
          onRetry={() => navigate('/')}
        />
      );
    }
    return (
      <ErrorState 
        message="Không thể tải hàng đợi KYC. Vui lòng kiểm tra lại kết nối backend."
        onRetry={loadQueue}
      />
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Chứng chỉ JLPT chờ xác minh</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              CCCD, OCR, đối chiếu danh tính và kiểm tra trùng đã đạt. Course Manager chỉ xác minh tính xác thực của chứng chỉ theo hướng dẫn chính thức của Japan Foundation.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip label={`Tổng ${queue.length} hồ sơ`} color="warning" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadQueue}
              disabled={loading}
              sx={{ textTransform: 'none', color: 'text.secondary' }}
            >
              Làm mới
            </Button>
          </Box>
        </Box>

        {queue.length === 0 ? (
          <Box sx={{ py: 8 }}>
            <EmptyState 
              icon={<FactCheckIcon />}
              title="Không có hồ sơ cần xử lý"
              description="Hậu kiểm hồ sơ đã duyệt phải bắt đầu từ báo cáo vi phạm hoặc tín hiệu rủi ro có căn cứ."
            />
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Họ và tên hiển thị</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email giáo viên</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ngày gửi</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Xác thực VNPT</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mức độ rủi ro</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queue.map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{req.displayName}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{req.teacherEmail}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {new Date(req.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small"
                        label={KYC_STATUS_LABELS[req.status] || req.status} 
                        color={getStatusColor(req.status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small"
                        label={req.vnptVerificationStatus === 'SDK_VERIFIED' ? 'Đã xác minh' : 'Cần kiểm tra'} 
                        color={req.vnptVerificationStatus === 'SDK_VERIFIED' ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small"
                        label={getRiskLabel(req.riskLevel)} 
                        color={getRiskColor(req.riskLevel)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        component={Link}
                        to={`/admin/kyc/${req.id}`}
                        variant="contained"
                        color="error"
                        size="small"
                        disableElevation
                        sx={{ textTransform: 'none' }}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
