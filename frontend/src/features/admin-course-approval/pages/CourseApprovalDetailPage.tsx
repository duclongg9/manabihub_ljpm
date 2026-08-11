import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Paper, Avatar, TextField, Snackbar, Alert, Slide, Link } from '@mui/material';
import { courseApprovalService } from '../services/courseApprovalService';
import type { CourseApprovalDetail } from '../types';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import EditNoteIcon from '@mui/icons-material/EditNote';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { ROUTES } from '../../../shared/constants/routes';
import { RichTextContent } from '../../../shared/components/RichTextContent/RichTextContent';
import {
  getCourseApprovalStatusLabel,
  localizePolicyEvidence,
} from '../courseApprovalLocalization';

function SlideTransition(props: any) {
  return <Slide {...props} direction="left" />;
}

export const CourseApprovalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<CourseApprovalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' | 'warning' } | null>(null);

  useEffect(() => {
    if (id) {
      courseApprovalService.getDetail(id)
        .then(data => {
          setDetail(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Đang tải dữ liệu...</Typography></Box>;
  if (!detail) return <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fef2f2', borderRadius: 2, color: '#991b1b', border: '1px solid #fecaca' }}><Typography>Không tìm thấy khóa học hoặc không thể kết nối tới máy chủ.</Typography></Box>;

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION') => {
    if ((action === 'REJECT' || action === 'REQUEST_CORRECTION') && !reason.trim()) {
      setFeedback({ message: "Vui lòng nhập lý do/ghi chú.", severity: 'warning' });
      return;
    }
    try {
      await courseApprovalService.reviewCourse(id!, { action, reason });
      setFeedback({ message: "Xử lý thành công!", severity: 'success' });
      setTimeout(() => navigate(ROUTES.ADMIN.COURSE_APPROVAL), 1000);
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || "Có lỗi xảy ra khi xử lý.";
      setFeedback({ message: `Lỗi: ${errorMessage}`, severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold',  mb: 1 }}>
        Duyệt khóa học
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Duyệt khóa học: {detail.courseName}
        </Typography>
        <Box
          sx={{
            bgcolor: '#fef3c7',
            color: '#b45309',
            px: 2, py: 0.5,
            borderRadius: 4,
            fontWeight: 'bold',
            fontSize: '0.875rem'
          }}
        >
          {getCourseApprovalStatusLabel(detail.status)}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        {/* Left Panel: Course Details & Teacher Info */}
        <Box sx={{ width: { xs: '100%', md: '67%' }, maxWidth: { md: '650px' }, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              mb: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
              <MenuBookIcon sx={{ color: 'text.secondary' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Thông tin khóa học và giảng viên</Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2, fontWeight: 'bold' }}>
              Thông tin giảng viên
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Avatar sx={{ bgcolor: '#0f172a', width: 56, height: 56 }}>
                {detail.teacherName.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{detail.teacherName}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {detail.teacherEmail}
                </Typography>
              </Box>
            </Box>

            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2, fontWeight: 'bold' }}>
              Thông tin nội dung
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>(a) Số lượng bài học</Typography>
                <Box sx={{ bgcolor: '#dcfce7', color: '#166534', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {detail.lessonBlocksCount} nội dung
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>(b) Bài kiểm tra cuối khóa</Typography>
                <Box sx={{ bgcolor: detail.finalTestIncluded ? '#dcfce7' : '#f1f5f9', color: detail.finalTestIncluded ? '#166534' : '#475569', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {detail.finalTestIncluded ? 'Có' : 'Không'}
                </Box>
              </Box>
            </Box>

            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2, fontWeight: 'bold' }}>
              Tóm tắt chương trình học
            </Typography>
            <Box sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2, mb: 4, bgcolor: '#f8fafc' }}>
              {detail.curriculumSummary ? (
                <RichTextContent value={detail.curriculumSummary} className="text-sm text-slate-900" />
              ) : (
                <Typography variant="body2" sx={{ color: 'text.primary' }}>Không có tóm tắt.</Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                Minh chứng tuân thủ
              </Typography>
              <Link
                component={RouterLink}
                to="/help/instructors/course-review-and-unpublishing"
                target="_blank"
                sx={{ fontSize: '0.875rem', fontWeight: 500 }}
              >
                Xem quy định xuất bản
              </Link>
            </Box>
            <Box sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc' }}>
              <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-line' }}>
                {localizePolicyEvidence(detail.policyEvidence)}
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Right Panel: Decision Panel */}
        <Box sx={{ width: { xs: '100%', md: '33%' }, maxWidth: { md: '320px' } }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              position: 'sticky',
              top: 24
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold',  mb: 3 }}>Xử lý yêu cầu</Typography>

            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder="Nhập lý do / Ghi chú (Bắt buộc khi từ chối hoặc yêu cầu sửa đổi)..."
              variant="outlined"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f8fafc'
                }
              }}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={() => handleAction('APPROVE')}
                sx={{
                  bgcolor: '#65a30d',
                  color: 'white',
                  borderRadius: 2,
                  textTransform: 'none',
                  py: 1.5,
                  fontWeight: 'bold',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#4d7c0f', boxShadow: 'none' }
                }}
              >
                Phê duyệt
              </Button>
              <Button
                variant="contained"
                startIcon={<HighlightOffIcon />}
                onClick={() => handleAction('REJECT')}
                sx={{
                  bgcolor: '#ef4444',
                  color: 'white',
                  borderRadius: 2,
                  textTransform: 'none',
                  py: 1.5,
                  fontWeight: 'bold',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#b91c1c', boxShadow: 'none' }
                }}
              >
                Từ chối và trả lại
              </Button>
            </Box>

            <Button
              fullWidth
              variant="contained"
              startIcon={<EditNoteIcon />}
              onClick={() => handleAction('REQUEST_CORRECTION')}
              sx={{
                bgcolor: '#eab308',
                color: 'white',
                borderRadius: 2,
                textTransform: 'none',
                py: 1.5,
                fontWeight: 'bold',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#ca8a04', boxShadow: 'none' }
              }}
            >
              Yêu cầu chỉnh sửa
            </Button>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={!!feedback}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        // @ts-expect-error: TransitionComponent typing issue with React 19 and MUI v5
        TransitionComponent={SlideTransition}
      >
        <Alert
          severity={feedback?.severity}
          onClose={() => setFeedback(null)}
          variant="filled"
          sx={{
            width: '100%',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            borderRadius: 2,
            fontWeight: 500,
            fontSize: '0.95rem',
            alignItems: 'center',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
              opacity: 0.9
            }
          }}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

