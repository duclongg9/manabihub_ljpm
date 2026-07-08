import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Typography, TextField, MenuItem, CircularProgress, Alert, Snackbar } from '@mui/material';
import { finalTestService } from '../services/finalTestService';
import type { UpdateFinalTestRequest } from '../services/finalTestService';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { FinalTestQuestionsEditor } from './FinalTestQuestionsEditor';

const jlptLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const FinalTestConfigPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  
  const [form, setForm] = useState<UpdateFinalTestRequest>({
    timeLimitMinutes: 60,
    passingScore: 50,
    maxRetakes: 3,
    jlptLevel: 'N5',
    skillFocus: 'Tổng hợp (Từ vựng, Ngữ pháp, Đọc hiểu)',
    questions: [],
  });

  useEffect(() => {
    if (!courseId) return;

    finalTestService.getFinalTest(courseId)
      .then((config) => {
        if (config) {
          setForm({
            timeLimitMinutes: config.timeLimitMinutes,
            passingScore: config.passingScore,
            maxRetakes: config.maxRetakes,
            jlptLevel: config.jlptLevel,
            skillFocus: config.skillFocus,
            questions: config.questions,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [courseId]);

  const handleSave = async () => {
    if (!courseId) return;

    if (form.questions.length < 20) {
      setError('Final Test cần có tối thiểu 20 câu hỏi đang hoạt động');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await finalTestService.updateFinalTest(courseId, form);
      setSnackbar({
        open: true,
        message: 'Lưu cấu hình thành công!',
        severity: 'success',
      });
      setTimeout(() => {
        navigate('/teacher/courses');
      }, 1500);
    } catch (err: any) {
      if (err.response?.data?.messageCode) {
        // Here we could map MessageCodes to actual strings if we had i18n
        setError(err.response.data.message || 'Có lỗi xảy ra khi lưu cấu hình.');
      } else {
        setError('Có lỗi xảy ra, vui lòng thử lại.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ pb: 10 }}>
      <PageHeader
        title="Cấu hình Final Test"
        breadcrumbs={[
          { label: 'Khóa học của tôi', href: '/teacher/courses' },
          { label: 'Final Test' },
        ]}
        action={
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        }
      />

      <Box sx={{ mt: 3, maxWidth: 800 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack spacing={3}>
          <Typography variant="h6">Cấu hình chung</Typography>
          
          <Stack direction="row" spacing={2}>
            <TextField
              label="Thời gian làm bài (phút)"
              type="number"
              fullWidth
              value={form.timeLimitMinutes}
              onChange={(e) => setForm({ ...form, timeLimitMinutes: Number(e.target.value) })}
            />
            <TextField
              label="Điểm đạt"
              type="number"
              fullWidth
              value={form.passingScore}
              onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })}
            />
            <TextField
              label="Số lần thi lại tối đa"
              type="number"
              fullWidth
              value={form.maxRetakes}
              onChange={(e) => setForm({ ...form, maxRetakes: Number(e.target.value) })}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Trình độ JLPT"
              fullWidth
              value={form.jlptLevel}
              onChange={(e) => setForm({ ...form, jlptLevel: e.target.value })}
            >
              {jlptLevels.map((lvl) => (
                <MenuItem key={lvl} value={lvl}>{lvl}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Kỹ năng tập trung"
              fullWidth
              value={form.skillFocus}
              onChange={(e) => setForm({ ...form, skillFocus: e.target.value })}
            />
          </Stack>

          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
            <Typography variant="h6">Danh sách câu hỏi ({form.questions.length}/20 tối thiểu)</Typography>
            {form.questions.length === 0 && (
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={() => {
                  const sampleQuestions = Array.from({ length: 20 }).map((_, i) => ({
                    content: `Câu hỏi mẫu số ${i + 1}: Kanji của từ "Điện thoại" là gì?`,
                    explanation: `Giải thích cho câu số ${i + 1}: Điện thoại là 電話 (Denwa)`,
                    choices: [
                      { content: '電話', isCorrect: true },
                      { content: '電車', isCorrect: false },
                      { content: '電気', isCorrect: false },
                      { content: '電話機', isCorrect: false }
                    ]
                  }));
                  setForm({ ...form, questions: sampleQuestions });
                }}
              >
                Tạo nhanh 20 câu hỏi mẫu
              </Button>
            )}
          </Stack>
          
          <FinalTestQuestionsEditor 
            questions={form.questions} 
            onChange={(q) => setForm({ ...form, questions: q })} 
          />
        </Stack>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={1500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
