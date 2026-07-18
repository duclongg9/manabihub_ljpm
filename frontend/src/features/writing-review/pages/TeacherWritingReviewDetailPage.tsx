import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { ROUTES } from '../../../shared/constants/routes';
import {
  useSaveWritingFeedback,
  useWritingReviewDetail,
} from '../hooks/useWritingReviews';

export function TeacherWritingReviewDetailPage() {
  const navigate = useNavigate();
  const { submissionId = '' } = useParams();
  const detail = useWritingReviewDetail(submissionId);
  const saveFeedback = useSaveWritingFeedback(submissionId);
  const [score, setScore] = useState('');
  const [comment, setComment] = useState('');
  const [savedNoticeOpen, setSavedNoticeOpen] = useState(false);

  useEffect(() => {
    if (!detail.data) return;
    setScore(detail.data.teacherFeedback?.score?.toString() ?? '');
    setComment(detail.data.teacherFeedback?.comment ?? '');
  }, [detail.data]);

  const scoreError = useMemo(() => {
    if (!score.trim()) return '';
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 10) {
      return 'Điểm phải nằm trong khoảng 0 đến 10.';
    }
    return '';
  }, [score]);

  const submitFeedback = async () => {
    if (!comment.trim() || scoreError) return;
    await saveFeedback.mutateAsync({
      score: score.trim() ? Number(score) : null,
      comment: comment.trim(),
    });
    setSavedNoticeOpen(true);
  };

  if (detail.isPending) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 420 }}>
        <CircularProgress aria-label="Đang tải bài viết" />
      </Box>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert
          severity="error"
          action={<Button color="inherit" onClick={() => detail.refetch()}>Thử lại</Button>}
        >
          Không thể tải bài viết hoặc bạn không có quyền truy cập.
        </Alert>
      </Box>
    );
  }

  const submission = detail.data;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(ROUTES.TEACHER.WRITING_REVIEWS)}
        sx={{ mb: 2 }}
      >
        Danh sách bài viết
      </Button>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 3 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{submission.studentName}</Typography>
          <Typography color="text.secondary">
            {submission.courseTitle} · {submission.lessonTitle}
          </Typography>
        </Box>
        <Chip
          color={submission.teacherFeedback ? 'success' : 'warning'}
          label={submission.teacherFeedback ? 'Đã phản hồi' : 'Chờ phản hồi'}
        />
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ justifyContent: 'space-between', mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Bài viết của học viên</Typography>
                  <Typography variant="body2" color="text.secondary">{submission.studentEmail}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Nộp lúc {formatDateTime(submission.submittedAt)}
                </Typography>
              </Stack>
              <Divider sx={{ mb: 3 }} />
              <Typography
                component="div"
                sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.9 }}
              >
                {submission.content}
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                <AutoAwesomeOutlinedIcon color="info" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Gợi ý AI tham khảo</Typography>
              </Stack>

              {!submission.aiSuggestion && (
                <Typography variant="body2" color="text.secondary">
                  Bài viết này không có gợi ý AI.
                </Typography>
              )}

              {submission.aiSuggestion?.status === 'FAILED' && (
                <Alert severity="warning">
                  Gợi ý AI không khả dụng. Giáo viên vẫn có thể phản hồi bài viết độc lập.
                </Alert>
              )}

              {submission.aiSuggestion?.status === 'READY' && (
                <Stack spacing={2}>
                  <Alert severity="info">
                    Nội dung dưới đây chỉ là gợi ý sơ bộ. Phản hồi của giáo viên là kết quả có thẩm quyền.
                  </Alert>
                  <SuggestionGroup title="Ngữ pháp" value={submission.aiSuggestion.grammarSuggestions} />
                  <SuggestionGroup title="Từ vựng" value={submission.aiSuggestion.vocabularySuggestions} />
                  <SuggestionGroup title="Cấu trúc" value={submission.aiSuggestion.structureSuggestions} />
                  {submission.aiSuggestion.revisionGuidance && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Hướng chỉnh sửa</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                        {submission.aiSuggestion.revisionGuidance}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </Paper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2, md: 3 }, position: { lg: 'sticky' }, top: { lg: 24 } }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Phản hồi của giáo viên</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Điểm số là tùy chọn; nhận xét là bắt buộc.
            </Typography>

            <Stack spacing={2.5}>
              <TextField
                label="Điểm (0–10)"
                type="number"
                value={score}
                onChange={(event) => setScore(event.target.value)}
                error={Boolean(scoreError)}
                helperText={scoreError || 'Có thể để trống nếu bài học không yêu cầu điểm.'}
                slotProps={{ htmlInput: { min: 0, max: 10, step: 0.25 } }}
              />
              <TextField
                label="Nhận xét"
                multiline
                minRows={8}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                error={comment.length > 5000}
                helperText={`${comment.length}/5000`}
                slotProps={{ htmlInput: { maxLength: 5000 } }}
              />

              {saveFeedback.isError && (
                <Alert severity="error">Không thể lưu phản hồi. Vui lòng thử lại.</Alert>
              )}

              <Button
                variant="contained"
                size="large"
                startIcon={<SaveOutlinedIcon />}
                disabled={!comment.trim() || Boolean(scoreError) || saveFeedback.isPending}
                onClick={submitFeedback}
              >
                {saveFeedback.isPending ? 'Đang lưu...' : 'Lưu phản hồi'}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={savedNoticeOpen}
        autoHideDuration={3500}
        onClose={() => setSavedNoticeOpen(false)}
        message="Đã lưu phản hồi và gửi thông báo cho học viên."
      />
    </Box>
  );
}

function SuggestionGroup({ title, value }: { title: string; value: unknown }) {
  const items = normalizeSuggestions(value);
  if (items.length === 0) return null;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
      <List dense disablePadding>
        {items.map((item, index) => (
          <ListItem key={`${title}-${index}`} disableGutters alignItems="flex-start">
            <ListItemText
              primary={getSuggestionPrimary(item)}
              secondary={getSuggestionSecondary(item)}
              slotProps={{ primary: { variant: 'body2' }, secondary: { sx: { mt: 0.5 } } }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

function normalizeSuggestions(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> => typeof item === 'object' && item !== null,
  );
}

function getSuggestionPrimary(item: Record<string, unknown>) {
  const suggestion = item.suggestion;
  const aspect = item.aspect;
  if (typeof suggestion === 'string') return suggestion;
  if (typeof aspect === 'string') return aspect.replaceAll('_', ' ');
  return 'Gợi ý chỉnh sửa';
}

function getSuggestionSecondary(item: Record<string, unknown>) {
  const explanation = item.explanation;
  const original = item.original;
  if (typeof explanation === 'string' && typeof original === 'string') {
    return `${original} · ${explanation}`;
  }
  if (typeof explanation === 'string') return explanation;
  if (typeof original === 'string') return original;
  return undefined;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
