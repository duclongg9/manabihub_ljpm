import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { ROUTES } from '../../../shared/constants/routes';
import { useWritingReviews } from '../hooks/useWritingReviews';
import type { WritingSubmissionSummary } from '../types/writingReviewTypes';

const PAGE_SIZE = 10;

type ReviewFilter = 'ALL' | 'PENDING' | 'REVIEWED';

export function TeacherWritingReviewsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState('');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('ALL');

  const reviewed = reviewFilter === 'ALL' ? undefined : reviewFilter === 'REVIEWED';
  const reviews = useWritingReviews({ page, size: PAGE_SIZE, query, reviewed });

  const submitSearch = () => {
    setPage(0);
    setQuery(searchDraft.trim());
  };

  const openSubmission = (submissionId: string) => {
    navigate(ROUTES.TEACHER.WRITING_REVIEW_DETAIL(submissionId));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Bài viết cần phản hồi</Typography>
          <Typography variant="body2" color="text.secondary">
            {reviews.data ? `${reviews.data.totalElements} bài nộp` : 'Danh sách bài nộp'}
          </Typography>
        </Box>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
          <TextField
            fullWidth
            size="small"
            label="Tìm theo học viên, khóa học hoặc bài học"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitSearch();
            }}
          />
          <FormControl size="small" sx={{ width: { xs: '100%', md: 220 }, flexShrink: 0 }}>
            <InputLabel id="review-status-label">Trạng thái phản hồi</InputLabel>
            <Select
              labelId="review-status-label"
              label="Trạng thái phản hồi"
              value={reviewFilter}
              onChange={(event) => {
                setPage(0);
                setReviewFilter(event.target.value as ReviewFilter);
              }}
            >
              <MenuItem value="ALL">Tất cả</MenuItem>
              <MenuItem value="PENDING">Chưa phản hồi</MenuItem>
              <MenuItem value="REVIEWED">Đã phản hồi</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={submitSearch}
            sx={{ minWidth: 120, flexShrink: 0 }}
          >
            Tìm kiếm
          </Button>
        </Stack>
      </Paper>

      {reviews.isPending && (
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 320 }}>
          <CircularProgress aria-label="Đang tải bài viết" />
        </Box>
      )}

      {reviews.isError && (
        <Alert
          severity="error"
          action={<Button color="inherit" onClick={() => reviews.refetch()}>Thử lại</Button>}
        >
          Không thể tải danh sách bài viết.
        </Alert>
      )}

      {reviews.data && reviews.data.content.length === 0 && (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
          <AssignmentOutlinedIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" gutterBottom>Không có bài viết phù hợp</Typography>
          <Typography variant="body2" color="text.secondary">
            Hãy thay đổi từ khóa hoặc bộ lọc trạng thái.
          </Typography>
        </Paper>
      )}

      {reviews.data && reviews.data.content.length > 0 && (
        <>
          <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Học viên</TableCell>
                  <TableCell>Khóa học / bài học</TableCell>
                  <TableCell>Ngày nộp</TableCell>
                  <TableCell>AI hỗ trợ</TableCell>
                  <TableCell>Phản hồi</TableCell>
                  <TableCell align="right">Mở</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviews.data.content.map((submission) => (
                  <TableRow hover key={submission.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{submission.studentName}</Typography>
                      <Typography variant="caption" color="text.secondary">{submission.studentEmail}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{submission.courseTitle}</Typography>
                      <Typography variant="caption" color="text.secondary">{submission.lessonTitle}</Typography>
                    </TableCell>
                    <TableCell>{formatDateTime(submission.submittedAt)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={submission.hasAiSuggestion ? 'info' : 'default'}
                        label={submission.hasAiSuggestion ? 'Có gợi ý' : 'Không có'}
                      />
                    </TableCell>
                    <TableCell>{renderReviewChip(submission)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Mở bài viết">
                        <IconButton onClick={() => openSubmission(submission.id)} aria-label="Mở bài viết">
                          <VisibilityOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
            {reviews.data.content.map((submission) => (
              <Paper
                variant="outlined"
                key={submission.id}
                sx={{ p: 2, cursor: 'pointer' }}
                onClick={() => openSubmission(submission.id)}
              >
                <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 700 }}>{submission.studentName}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{submission.courseTitle}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      {submission.lessonTitle}
                    </Typography>
                  </Box>
                  {renderReviewChip(submission)}
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(submission.submittedAt)}
                  </Typography>
                  {submission.hasAiSuggestion && <Chip size="small" label="Có gợi ý AI" variant="outlined" />}
                </Stack>
              </Paper>
            ))}
          </Stack>

          {reviews.data.totalPages > 1 && (
            <Stack sx={{ alignItems: 'center', mt: 3 }}>
              <Pagination
                page={page + 1}
                count={reviews.data.totalPages}
                onChange={(_, nextPage) => setPage(nextPage - 1)}
                color="primary"
              />
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}

function renderReviewChip(submission: WritingSubmissionSummary) {
  return submission.hasTeacherFeedback ? (
    <Chip size="small" color="success" label="Đã phản hồi" />
  ) : (
    <Chip size="small" color="warning" label="Chờ phản hồi" />
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
