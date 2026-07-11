import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Box, Typography, Chip, TextField, MenuItem, Select,
  FormControl, InputLabel, Pagination, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { courseApprovalService } from '../services/courseApprovalService';
import type { CourseApproval } from '../types';
import ErrorIcon from '@mui/icons-material/Error';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';
import MenuBookIcon from '@mui/icons-material/MenuBook';

// Helper function to format "Time Waiting"
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
};

export const CourseApprovalQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<CourseApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Search, Filter, Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1); // MUI Pagination is 1-indexed
  const rowsPerPage = 10;

  useEffect(() => {
    courseApprovalService.getQueue()
      .then((data) => {
        setQueue(data);
        setLoading(false);
      })
      .catch((err: any) => {
        if (err.response?.data?.messageCode === 'ADMIN_PERMISSION_DENIED' || err.response?.data?.messageCode === 'COURSE_MANAGER_REQUIRED') {
          setError('ACCESS_DENIED');
        } else if (err.response?.status === 401) {
          setError('UNAUTHORIZED');
        } else {
          setError('ERROR');
        }
        setLoading(false);
      });
  }, []);

  const filteredAndSearchedQueue = useMemo(() => {
    return queue.filter((course) => {
      const matchesSearch = course.courseName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || course.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [queue, searchTerm, statusFilter]);

  const paginatedQueue = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filteredAndSearchedQueue.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSearchedQueue, page]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  if (error === 'ACCESS_DENIED') {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fef2f2', borderRadius: 2, color: '#991b1b', border: '1px solid #fecaca', mt: 4 }}>
        <ErrorIcon sx={{ fontSize: 48, mb: 2, color: '#dc2626' }} />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>Access Denied</Typography>
        <Typography>Finance Manager access to course approval is blocked.</Typography>
      </Box>
    );
  }

  if (error === 'UNAUTHORIZED') {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fffbeb', borderRadius: 2, color: '#b45309', border: '1px solid #fde68a', mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>Phiên đăng nhập không hợp lệ</Typography>
        <Typography>Vui lòng đăng nhập lại với tư cách Course Manager.</Typography>
      </Box>
    );
  }

  if (error === 'ERROR') {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fef2f2', borderRadius: 2, color: '#991b1b', border: '1px solid #fecaca', mt: 4 }}>
        <Typography>Không thể tải danh sách chờ duyệt. Vui lòng kiểm tra lại backend hoặc đảm bảo các endpoints giả định đã được cấu hình đúng.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold',  mb: 4 }}>
        Task Queue
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Tìm kiếm theo tên khóa học"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          sx={{ flexGrow: 1, maxWidth: 400, bgcolor: 'white', borderRadius: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 1 }}>
          <InputLabel id="status-filter-label">Trạng thái</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Trạng thái"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="ALL">Tất cả</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}
        elevation={0}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon sx={{ color: 'text.secondary' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Operation Queue</Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            sx={{ borderRadius: 8, textTransform: 'none', color: 'text.primary', borderColor: '#cbd5e1' }}
          >
            Filter
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', py: 2 }}>Task ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', py: 2 }}>Type / Request</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', py: 2 }}>Requester</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', py: 2 }}>Time Waiting</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', py: 2 }} align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>Đang tải dữ liệu...</TableCell>
                </TableRow>
              ) : paginatedQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>Không có dữ liệu phù hợp.</TableCell>
                </TableRow>
              ) : (
                paginatedQueue.map((row) => {
                  const taskId = `TSK-${row.id.substring(0, 8).toUpperCase()}`;
                  let statusColor = '#e2e8f0';
                  let statusTextColor = '#475569';

                  if (row.status === 'PENDING') {
                    statusColor = '#f1f5f9';
                    statusTextColor = '#475569';
                  } else if (row.status === 'APPROVED' || row.status === 'PUBLISHED') {
                    statusColor = '#dcfce7';
                    statusTextColor = '#166534';
                  } else if (row.status === 'REJECTED') {
                    statusColor = '#fee2e2';
                    statusTextColor = '#991b1b';
                  } else if (row.status === 'REQUEST_CORRECTION') {
                    statusColor = '#fef3c7';
                    statusTextColor = '#92400e';
                  }

                  return (
                    <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{taskId}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <MenuBookIcon sx={{ color: 'text.secondary', mt: 0.5 }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold',  color: '#475569' }}>
                              Khóa học: {row.courseName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              Course Approval
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold',  color: '#334155' }}>
                          Teacher: {row.teacherName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                          {formatTimeAgo(row.submittedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status === 'REQUEST_CORRECTION' ? 'Correction' : row.status}
                          sx={{
                            bgcolor: statusColor,
                            color: statusTextColor,
                            fontWeight: 'bold',
                            borderRadius: '16px',
                            height: '24px',
                            fontSize: '0.75rem',
                            textTransform: 'capitalize'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          sx={{
                            bgcolor: '#0f172a',
                            color: 'white',
                            borderRadius: 8,
                            textTransform: 'none',
                            px: 3,
                            '&:hover': { bgcolor: '#1e293b' }
                          }}
                          onClick={() => navigate(`/admin/courses/approvals/${row.id}`)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && queue.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3, borderTop: '1px solid #f1f5f9' }}>
            <Pagination
              count={Math.ceil(filteredAndSearchedQueue.length / rowsPerPage)}
              page={page}
              onChange={handlePageChange}
              shape="rounded"
              sx={{
                '& .MuiPaginationItem-root': {
                  fontWeight: 'bold',
                  color: 'text.secondary'
                },
                '& .Mui-selected': {
                  bgcolor: 'transparent',
                  color: 'text.primary',
                  border: '1px solid #cbd5e1'
                }
              }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};
