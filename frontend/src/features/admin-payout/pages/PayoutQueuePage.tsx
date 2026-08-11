import FilterListIcon from '@mui/icons-material/FilterList';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { PayoutStatusBadge } from '../components/PayoutStatusBadge';
import { usePayoutQueue } from '../hooks/usePayoutQueue';
import { getPayoutErrorMessage } from '../services/payoutError';
import type {
  PayoutQueueParams,
  ReconciliationStatus,
  WithdrawalStatus,
} from '../types/payout.types';

const PAGE_SIZE = 10;

interface FilterValues {
  teacherKeyword: string;
  status: '' | WithdrawalStatus;
  reconciliationStatus: '' | ReconciliationStatus;
  requestedFrom: string;
  requestedTo: string;
}

const EMPTY_FILTERS: FilterValues = {
  reconciliationStatus: '',
  requestedFrom: '',
  requestedTo: '',
  status: '',
  teacherKeyword: '',
};

export function PayoutQueuePage() {
  const [page, setPage] = useState(0);
  const [draftFilters, setDraftFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const params = useMemo<PayoutQueueParams>(() => ({
    page,
    size: PAGE_SIZE,
    sort: 'requestedAt,desc',
    ...(filters.teacherKeyword.trim() && { teacherKeyword: filters.teacherKeyword.trim() }),
    ...(filters.status && { status: filters.status }),
    ...(filters.reconciliationStatus && {
      reconciliationStatus: filters.reconciliationStatus,
    }),
    ...(filters.requestedFrom && { requestedFrom: `${filters.requestedFrom}T00:00:00` }),
    ...(filters.requestedTo && { requestedTo: `${filters.requestedTo}T23:59:59` }),
  }), [filters, page]);
  const queue = usePayoutQueue(params);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const applyFilters = () => {
    setPage(0);
    setFilters(draftFilters);
  };

  const clearFilters = () => {
    setPage(0);
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  return (
    <Box>
      <PageHeader
        title="Quyết toán doanh thu"
        subtitle="Đối soát và xử lý yêu cầu rút tiền của giáo viên và học viên"
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Quyết toán' },
        ]}
      />

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'stretch', sm: 'center' },
            borderBottom: '1px solid',
            borderColor: 'divider',
            justifyContent: 'space-between',
            p: { xs: 2, md: 3 },
          }}
        >
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <PaymentsOutlinedIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Hàng đợi quyết toán
              </Typography>
              {!queue.isLoading && (
                <Chip
                  size="small"
                  label={`${queue.data?.totalElements ?? 0} yêu cầu`}
                  sx={{ bgcolor: '#fef2f2', color: 'primary.main', fontWeight: 700 }}
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Kiểm tra đối soát trước khi phê duyệt, thử lại hoặc ghi nhận chuyển khoản.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={queue.isFetching
              ? <CircularProgress size={16} color="inherit" />
              : <RefreshIcon />}
            disabled={queue.isFetching}
            onClick={() => void queue.refetch()}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Tải lại
          </Button>
        </Stack>

        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', p: { xs: 2, md: 3 } }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
            <TextField
              label="Tìm chủ ví"
              placeholder="Tên hoặc email giáo viên/học viên"
              size="small"
              value={draftFilters.teacherKeyword}
              onChange={(event) => setDraftFilters((current) => ({
                ...current,
                teacherKeyword: event.target.value,
              }))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyFilters();
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: { lg: 260 } }}
            />
            <TextField
              select
              label="Trạng thái yêu cầu"
              size="small"
              value={draftFilters.status}
              onChange={(event) => setDraftFilters((current) => ({
                ...current,
                status: event.target.value as FilterValues['status'],
              }))}
              sx={{ minWidth: { lg: 190 } }}
            >
              <MenuItem value="">Tất cả trạng thái</MenuItem>
              <MenuItem value="PENDING">Chờ xử lý</MenuItem>
              <MenuItem value="APPROVED">Đã duyệt</MenuItem>
              <MenuItem value="FAILED">Thất bại</MenuItem>
              <MenuItem value="EXECUTED">Đã thanh toán</MenuItem>
              <MenuItem value="REJECTED">Đã từ chối</MenuItem>
              <MenuItem value="CANCELLED">Đã hủy</MenuItem>
            </TextField>
            <TextField
              select
              label="Đối soát"
              size="small"
              value={draftFilters.reconciliationStatus}
              onChange={(event) => setDraftFilters((current) => ({
                ...current,
                reconciliationStatus: event.target.value as FilterValues['reconciliationStatus'],
              }))}
              sx={{ minWidth: { lg: 190 } }}
            >
              <MenuItem value="">Tất cả đối soát</MenuItem>
              <MenuItem value="MATCHED">Khớp</MenuItem>
              <MenuItem value="WARNING">Có cảnh báo</MenuItem>
              <MenuItem value="CRITICAL_MISMATCH">Sai lệch nghiêm trọng</MenuItem>
              <MenuItem value="RESOLVED">Đã xử lý</MenuItem>
            </TextField>
            <TextField
              type="date"
              label="Từ ngày"
              size="small"
              value={draftFilters.requestedFrom}
              onChange={(event) => setDraftFilters((current) => ({
                ...current,
                requestedFrom: event.target.value,
              }))}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: { lg: 155 } }}
            />
            <TextField
              type="date"
              label="Đến ngày"
              size="small"
              value={draftFilters.requestedTo}
              onChange={(event) => setDraftFilters((current) => ({
                ...current,
                requestedTo: event.target.value,
              }))}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: { lg: 155 } }}
            />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: 2 }}>
            <Button
              color="inherit"
              disabled={!activeFilterCount && !Object.values(draftFilters).some(Boolean)}
              onClick={clearFilters}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Xóa lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Button>
            <Button
              variant="contained"
              startIcon={<FilterListIcon />}
              onClick={applyFilters}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Áp dụng
            </Button>
          </Stack>
        </Box>

        {queue.isError ? (
          <Alert
            severity="error"
            action={(
              <Button color="inherit" onClick={() => void queue.refetch()}>
                Thử lại
              </Button>
            )}
            sx={{ m: 3 }}
          >
            {getPayoutErrorMessage(queue.error)}
          </Alert>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 980 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={headerCellSx}>Chủ ví</TableCell>
                  <TableCell sx={headerCellSx}>Số tiền</TableCell>
                  <TableCell sx={headerCellSx}>Yêu cầu</TableCell>
                  <TableCell sx={headerCellSx}>Quyết toán</TableCell>
                  <TableCell sx={headerCellSx}>Đối soát</TableCell>
                  <TableCell sx={headerCellSx}>Ngày tạo</TableCell>
                  <TableCell align="right" sx={headerCellSx}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queue.isLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 7 }, (__, cellIndex) => (
                          <TableCell key={cellIndex}><Skeleton /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : queue.data?.content.length === 0
                    ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <Box sx={{ py: 7, textAlign: 'center' }}>
                              <PaymentsOutlinedIcon sx={{ color: 'text.disabled', fontSize: 42 }} />
                              <Typography sx={{ fontWeight: 700, mt: 1 }}>
                                Không có yêu cầu phù hợp
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Hãy thay đổi bộ lọc hoặc tải lại dữ liệu.
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )
                    : queue.data?.content.map((item) => (
                        <TableRow key={item.withdrawalRequestId} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {item.ownerName ?? item.teacherName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', maxWidth: 180 }}
                              noWrap
                            >
                              {item.ownerType === 'STUDENT' ? 'Học viên' : 'Giáo viên'} · {item.ownerId ?? item.teacherId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {formatVnd(item.requestedAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell><PayoutStatusBadge status={item.status} /></TableCell>
                          <TableCell>
                            {item.settlementStatus
                              ? <PayoutStatusBadge status={item.settlementStatus} />
                              : <Typography variant="body2" color="text.secondary">Chưa tạo</Typography>}
                          </TableCell>
                          <TableCell><PayoutStatusBadge status={item.reconciliationStatus} /></TableCell>
                          <TableCell>
                            <Typography variant="body2">{formatDate(item.requestedAt)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              component={RouterLink}
                              to={`/admin/payouts/${item.withdrawalRequestId}`}
                              variant="outlined"
                              size="small"
                              startIcon={<VisibilityOutlinedIcon />}
                              sx={{ fontWeight: 700, textTransform: 'none', whiteSpace: 'nowrap' }}
                            >
                              Chi tiết
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            alignItems: 'center',
            borderTop: '1px solid',
            borderColor: 'divider',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {queue.data?.totalElements ?? 0} yêu cầu · Trang {page + 1}/{Math.max(queue.data?.totalPages ?? 1, 1)}
          </Typography>
          <Pagination
            color="primary"
            count={Math.max(queue.data?.totalPages ?? 1, 1)}
            page={page + 1}
            onChange={(_, value) => setPage(value - 1)}
            disabled={queue.isFetching}
            size="small"
          />
        </Stack>
      </Paper>
    </Box>
  );
}

const headerCellSx = {
  color: 'text.secondary',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    currency: 'VND',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
