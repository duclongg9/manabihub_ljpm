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
    skillFocus: 'Tá»•ng há»£p',
    questions: [],
  });

  useEffect(() => {
    if (!courseId) return;

    finalTestService.getFinalTest(courseId)
      .then((config) => {
        if (config) {
          setForm({
            timeLimitMinutes: config.timeLimitMinutes || '',
            passingScore: config.passingScore || '',
            maxRetakes: config.maxRetakes || '',
            jlptLevel: config.jlptLevel || '',
            skillFocus: config.skillFocus || '',
            questions: config.questions || [],
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

  const handleSave = async (shouldExit: boolean = false) => {
    if (!courseId) return;

    const showError = (msg: string) => {
      setSnackbar({ open: true, message: msg, severity: 'error' });
    };

    if (form.questions.length < 20) {
      showError('Final Test cáº§n cÃ³ tá»‘i thiá»ƒu 20 cÃ¢u há»i Ä‘ang hoáº¡t Ä‘á»™ng');
      return;
    }

    if (form.timeLimitMinutes === '' || Number(form.timeLimitMinutes) < 1 || Number(form.timeLimitMinutes) > 180) {
      showError('Vui lÃ²ng nháº­p thá»i gian lÃ m bÃ i (tá»« 1 Ä‘áº¿n 180 phÃºt).');
      return;
    }

    if (form.passingScore === '' || Number(form.passingScore) < 0 || Number(form.passingScore) > 100) {
      showError('Vui lÃ²ng nháº­p Ä‘iá»ƒm Ä‘áº¡t (tá»« 0 Ä‘áº¿n 100%).');
      return;
    }

    if (form.maxRetakes === '' || Number(form.maxRetakes) < 1 || Number(form.maxRetakes) > 10) {
      showError('Vui lÃ²ng nháº­p sá»‘ láº§n thi láº¡i (tá»« 1 Ä‘áº¿n 10 láº§n).');
      return;
    }

    if (!form.jlptLevel) {
      showError('Vui lÃ²ng chá»n trÃ¬nh Ä‘á»™ JLPT.');
      return;
    }

    if (!form.skillFocus || !form.skillFocus.trim()) {
      showError('Vui lÃ²ng nháº­p ká»¹ nÄƒng táº­p trung.');
      return;
    }

    if (form.skillFocus.length > 50) {
      showError('Ká»¹ nÄƒng táº­p trung khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 50 kÃ½ tá»±.');
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

      if (!q.content.trim()) { validateError(`Lá»—i á»Ÿ CÃ¢u ${i + 1}: Ná»™i dung cÃ¢u há»i khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.`); return; }
      if (!q.explanation.trim()) { validateError(`Lá»—i á»Ÿ CÃ¢u ${i + 1}: Vui lÃ²ng Ä‘iá»n giáº£i thÃ­ch Ä‘Ã¡p Ã¡n.`); return; }
      for (let j = 0; j < q.choices.length; j++) {
        if (!q.choices[j].content.trim()) { validateError(`Lá»—i á»Ÿ CÃ¢u ${i + 1}: Lá»±a chá»n sá»‘ ${j + 1} Ä‘ang bá»‹ bá» trá»‘ng.`); return; }
      }
      if (!q.choices.some(c => c.isCorrect)) { validateError(`Lá»—i á»Ÿ CÃ¢u ${i + 1}: ChÆ°a cÃ³ Ä‘Ã¡p Ã¡n Ä‘Ãºng nÃ o Ä‘Æ°á»£c chá»n.`); return; }
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
        message: 'LÆ°u cáº¥u hÃ¬nh thÃ nh cÃ´ng!',
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
        showError('CÃ³ lá»—i xáº£y ra, vui lÃ²ng thá»­ láº¡i.');
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
        title="Cáº¥u hÃ¬nh BÃ i thi cuá»‘i khÃ³a"
        breadcrumbs={[
          { label: 'KhÃ³a há»c cá»§a tÃ´i', href: '/teacher/courses' },
          { label: 'BÃ i thi cuá»‘i khÃ³a' },
        ]}
      />

      <Box sx={{ mt: 3, maxWidth: 800 }}>
        <Stack spacing={3}>
          <Typography variant="h6">Cáº¥u hÃ¬nh chung</Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              variant="outlined"
              label="Thá»i gian lÃ m bÃ i (phÃºt)"
              type="number"
              fullWidth
              value={form.timeLimitMinutes as number}
              onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value === '' ? '' : Number(e.target.value) })}
              slotProps={{ htmlInput: { min: 1, max: 180 } }}
            />
            <TextField
              variant="outlined"
              label="Äiá»ƒm Ä‘áº¡t (%)"
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
              label="Sá»‘ láº§n thi láº¡i tá»‘i Ä‘a"
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
              label="TrÃ¬nh Ä‘á»™ JLPT"
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
              label="Ká»¹ nÄƒng táº­p trung"
              fullWidth
              value={form.skillFocus}
              onChange={(e) => setForm({ ...form, skillFocus: e.target.value })}
              placeholder="VD: Tá»« vá»±ng, Ngá»¯ phÃ¡p, Nghe hiá»ƒu..."
            />
          </Stack>

          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
            <Typography variant="h6">Danh sÃ¡ch cÃ¢u há»i ({form.questions.length}/20 tá»‘i thiá»ƒu)</Typography>
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
            if (window.confirm("Báº¡n cÃ³ nhá»¯ng thay Ä‘á»•i chÆ°a Ä‘Æ°á»£c lÆ°u. Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n rá»i Ä‘i khÃ´ng?")) {
              navigate('/teacher/courses');
            }
          }}
        >
          Há»§y
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => handleSave(false)}
          disabled={saving}
        >
          {saving ? 'Äang lÆ°u...' : 'LÆ°u & Tiáº¿p tá»¥c'}
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => handleSave(true)}
          disabled={saving}
        >
          {saving ? 'Äang lÆ°u...' : 'LÆ°u & ThoÃ¡t'}
        </Button>
      </Paper>
    </Box>
  );
};
