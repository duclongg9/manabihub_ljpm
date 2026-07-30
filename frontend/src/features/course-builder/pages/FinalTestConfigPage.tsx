import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Typography, TextField, MenuItem, CircularProgress, Alert, Snackbar, InputAdornment, Paper } from '@mui/material';
import { finalTestService } from '../services/finalTestService';
import type { UpdateFinalTestRequest } from '../services/finalTestService';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { FinalTestQuestionsEditor } from './FinalTestQuestionsEditor';

const jlptLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];

type FinalTestFormState = Omit<UpdateFinalTestRequest, 'timeLimitMinutes' | 'passingScore' | 'maxRetakes' | 'jlptLevel'> & {
  timeLimitMinutes: number | '';
  passingScore: number | '';
  maxRetakes: number | '';
  jlptLevel: string;
  skillFocus: string;
};

export const FinalTestConfigPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<number | false>(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  const notify = (msg: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message: msg, severity });
  };

  const [form, setForm] = useState<FinalTestFormState>({
    timeLimitMinutes: '',
    passingScore: '',
    maxRetakes: '',
    jlptLevel: '',
    skillFocus: 'Tổng hợp',
    questions: [],
  });

  useEffect(() => {
    if (!courseId) return;

    finalTestService.getFinalTest(courseId)
      .then((config) => {
        if (config) {
          const loadedForm: FinalTestFormState = {
            timeLimitMinutes: config.timeLimitMinutes || '',
            passingScore: config.passingScore ?? '',
            maxRetakes: config.maxRetakes || '',
            jlptLevel: config.jlptLevel || '',
            skillFocus: config.skillFocus || '',
            questions: config.questions || [],
          };
          setForm(loadedForm);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [courseId]);

  const handleSave = async (shouldExit: boolean = false) => {
    if (!courseId) return;

    const showError = (msg: string) => {
      setSnackbar({ open: true, message: msg, severity: 'error' });
    };

    if (form.questions.length < 20) {
      showError('Final Test cần có tối thiểu 20 câu hỏi đang hoạt động');
      return;
    }

    if (form.timeLimitMinutes === '' || Number(form.timeLimitMinutes) < 1 || Number(form.timeLimitMinutes) > 180) {
      showError('Vui lòng nhập thời gian làm bài (từ 1 đến 180 phút).');
      return;
    }

    if (form.passingScore === '' || Number(form.passingScore) < 0 || Number(form.passingScore) > 100) {
      showError('Vui lòng nhập điểm đạt (từ 0 đến 100%).');
      return;
    }

    if (form.maxRetakes === '' || Number(form.maxRetakes) < 1 || Number(form.maxRetakes) > 10) {
      showError('Vui lòng nhập số lần thi lại (từ 1 đến 10 lần).');
      return;
    }

    if (!form.jlptLevel) {
      showError('Vui lòng chọn trình độ JLPT.');
      return;
    }

    if (!form.skillFocus || !form.skillFocus.trim()) {
      showError('Vui lòng nhập kỹ năng tập trung.');
      return;
    }

    if (form.skillFocus.length > 50) {
      showError('Kỹ năng tập trung không được vượt quá 50 ký tự.');
      return;
    }

    // Validate empty fields in questions
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      const validateError = (msg: string) => {
        showError(msg);
        setExpanded(i);
        setTimeout(() => {
          document.getElementById(`question-accordion-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      };

      if (!q.content.trim()) { validateError(`Lỗi ở Câu ${i + 1}: Nội dung câu hỏi không được để trống.`); return; }
      if (!q.explanation.trim()) { validateError(`Lỗi ở Câu ${i + 1}: Vui lòng điền giải thích đáp án.`); return; }
      for (let j = 0; j < q.choices.length; j++) {
        if (!q.choices[j].content.trim()) { validateError(`Lỗi ở Câu ${i + 1}: Lựa chọn số ${j + 1} đang bị bỏ trống.`); return; }
      }
      if (!q.choices.some(c => c.isCorrect)) { validateError(`Lỗi ở Câu ${i + 1}: Chưa có đáp án đúng nào được chọn.`); return; }
    }

    setSaving(true);

    try {
      const request: UpdateFinalTestRequest = {
        ...form,
        timeLimitMinutes: Number(form.timeLimitMinutes),
        passingScore: Number(form.passingScore),
        maxRetakes: Number(form.maxRetakes),
      };

      await finalTestService.updateFinalTest(courseId, request);
      setSnackbar({
        open: true,
        message: 'Lưu cấu hình thành công!',
        severity: 'success',
      });
      if (shouldExit) {
        setTimeout(() => {
          navigate('/teacher/courses');
        }, 1500);
      }
    } catch (err: any) {
      if (err.response?.data?.errors?.length > 0) {
        showError(err.response.data.errors[0].message);
      } else if (err.response?.data?.message) {
        showError(err.response.data.message);
      } else {
        showError('Có lỗi xảy ra, vui lòng thử lại.');
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
        title="Cấu hình Bài thi cuối khóa"
        breadcrumbs={[
          { label: 'Khóa học của tôi', href: '/teacher/courses' },
          { label: 'Bài thi cuối khóa' },
        ]}
      />

      <Box sx={{ mt: 3, maxWidth: 800 }}>
        <Stack spacing={3}>
          <Typography variant="h6">Cấu hình chung</Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              variant="outlined"
              label="Thời gian làm bài (phút)"
              type="number"
              fullWidth
              value={form.timeLimitMinutes as number}
              onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value === '' ? '' : Number(e.target.value) })}
              slotProps={{ htmlInput: { min: 1, max: 180 } }}
            />
            <TextField
              variant="outlined"
              label="Điểm đạt (%)"
              type="number"
              fullWidth
              value={form.passingScore as number}
              onChange={(e) => setForm({ ...form, passingScore: e.target.value === '' ? '' : Number(e.target.value) })}
              slotProps={{
                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
                htmlInput: { min: 0, max: 100 }
              }}
            />
            <TextField
              variant="outlined"
              label="Số lần thi lại tối đa"
              type="number"
              fullWidth
              value={form.maxRetakes as number}
              onChange={(e) => setForm({ ...form, maxRetakes: e.target.value === '' ? '' : Number(e.target.value) })}
              slotProps={{ htmlInput: { min: 1, max: 10 } }}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              variant="outlined"
              select
              required
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
              variant="outlined"
              label="Kỹ năng tập trung"
              fullWidth
              value={form.skillFocus}
              onChange={(e) => setForm({ ...form, skillFocus: e.target.value })}
              placeholder="VD: Từ vựng, Ngữ pháp, Nghe hiểu..."
            />
          </Stack>

          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
            <Typography variant="h6">Danh sách câu hỏi ({form.questions.length}/20 tối thiểu)</Typography>
          </Stack>

          <FinalTestQuestionsEditor
            questions={form.questions}
            onChange={(q) => setForm({ ...form, questions: q })}
            expanded={expanded}
            setExpanded={setExpanded}
            onNotify={notify}
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

      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, zIndex: 1000, display: 'flex', justifyContent: 'flex-end', gap: 2, borderTop: '1px solid #e0e0e0' }} elevation={3}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => {
            if (window.confirm("Bạn có những thay đổi chưa được lưu. Bạn có chắc chắn muốn rời đi không?")) {
              navigate('/teacher/courses');
            }
          }}
        >
          Hủy
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => handleSave(false)}
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu & Tiếp tục'}
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => handleSave(true)}
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu & Thoát'}
        </Button>
      </Paper>
    </Box>
  );
};
