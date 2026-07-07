import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { ROUTES } from '../../../shared/constants/routes';
import {
  type CourseDraftResponse,
  type JlptLevel,
  courseDraftErrorMessage,
  createCourseDraft,
} from '../services/courseDraftService';

interface CourseDraftForm {
  title: string;
  introduction: string;
  jlptLevel: JlptLevel;
  category: string;
  thumbnailUrl: string;
  outcomes: string;
  price: string;
  prerequisites: string;
  targetStudents: string;
  learningGoals: string[];
}

const jlptLevels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const initialForm: CourseDraftForm = {
  title: '',
  introduction: '',
  jlptLevel: 'N5',
  category: '',
  thumbnailUrl: '',
  outcomes: '',
  price: '',
  prerequisites: '',
  targetStudents: '',
  learningGoals: ['', '', '', ''],
};

export function CourseDraftPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CourseDraftForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedDraft, setSavedDraft] = useState<CourseDraftResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField(field: keyof CourseDraftForm) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: '' }));
    };
  }

  function updateGoal(index: number, value: string) {
    setForm((current) => {
      const learningGoals = [...current.learningGoals];
      learningGoals[index] = value;
      return { ...current, learningGoals };
    });
    setErrors((current) => ({ ...current, learningGoals: '', [`goal-${index}`]: '' }));
  }

  function addGoal() {
    setForm((current) => ({ ...current, learningGoals: [...current.learningGoals, ''] }));
  }

  function removeGoal(index: number) {
    setForm((current) => {
      const learningGoals = current.learningGoals.filter((_, currentIndex) => currentIndex !== index);
      return { ...current, learningGoals: learningGoals.length === 0 ? [''] : learningGoals };
    });
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};
    const priceValue = Number.parseFloat(form.price);
    const normalizedGoals = form.learningGoals.map((goal) => goal.trim()).filter(Boolean);

    if (!form.title.trim()) {
      nextErrors.title = 'Title is required.';
    }
    if (!form.introduction.trim()) {
      nextErrors.introduction = 'Introduction is required.';
    }
    if (!form.category.trim()) {
      nextErrors.category = 'Category is required.';
    }
    if (!form.outcomes.trim()) {
      nextErrors.outcomes = 'Outcomes are required.';
    }
    if (!form.prerequisites.trim()) {
      nextErrors.prerequisites = 'Prerequisites are required.';
    }
    if (!form.targetStudents.trim()) {
      nextErrors.targetStudents = 'Target students are required.';
    }
    if (Number.isNaN(priceValue) || priceValue < 0) {
      nextErrors.price = 'Price must be zero or greater.';
    }
    if (normalizedGoals.length < 4) {
      nextErrors.learningGoals = 'At least 4 learning goals are required.';
    }

    form.learningGoals.forEach((goal, index) => {
      if (goal.trim().length > 160) {
        nextErrors[`goal-${index}`] = 'Each learning goal must be at most 160 characters.';
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    setSubmitError(null);
    setSavedDraft(null);

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const draft = await createCourseDraft({
        title: form.title.trim(),
        introduction: form.introduction.trim(),
        jlptLevel: form.jlptLevel,
        category: form.category.trim(),
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        outcomes: form.outcomes.trim(),
        price: Number.parseFloat(form.price),
        prerequisites: form.prerequisites.trim(),
        targetStudents: form.targetStudents.trim(),
        learningGoals: form.learningGoals.map((goal) => goal.trim()).filter(Boolean),
      });
      setSavedDraft(draft);
    } catch (error) {
      setSubmitError(courseDraftErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <PageHeader
        title="Create Course Draft"
        breadcrumbs={[
          { label: 'Teacher' },
          { label: 'Courses', href: ROUTES.TEACHER.COURSES },
          { label: 'New Draft' },
        ]}
        action={(
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(ROUTES.TEACHER.COURSES)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Back
          </Button>
        )}
      />

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: { xs: 2, md: 4 },
        }}
      >
        <Stack spacing={3}>
          {savedDraft && (
            <Alert severity="success">
              Course draft saved with status {savedDraft.status}.
            </Alert>
          )}

          {submitError && (
            <Alert severity="error">
              {submitError}
            </Alert>
          )}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              required
              label="Course Title"
              value={form.title}
              onChange={updateField('title')}
              error={Boolean(errors.title)}
              helperText={errors.title}
            />
            <TextField
              required
              select
              label="JLPT Level"
              value={form.jlptLevel}
              onChange={updateField('jlptLevel')}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            >
              {jlptLevels.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              required
              label="Category"
              value={form.category}
              onChange={updateField('category')}
              error={Boolean(errors.category)}
              helperText={errors.category}
            />
            <TextField
              fullWidth
              label="Thumbnail URL"
              value={form.thumbnailUrl}
              onChange={updateField('thumbnailUrl')}
            />
          </Stack>

          <TextField
            fullWidth
            required
            multiline
            minRows={4}
            label="Introduction"
            value={form.introduction}
            onChange={updateField('introduction')}
            error={Boolean(errors.introduction)}
            helperText={errors.introduction}
          />

          <TextField
            fullWidth
            required
            multiline
            minRows={3}
            label="Outcomes"
            value={form.outcomes}
            onChange={updateField('outcomes')}
            error={Boolean(errors.outcomes)}
            helperText={errors.outcomes}
          />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              required
              label="Prerequisites"
              value={form.prerequisites}
              onChange={updateField('prerequisites')}
              error={Boolean(errors.prerequisites)}
              helperText={errors.prerequisites}
            />
            <TextField
              fullWidth
              required
              label="Target Students"
              value={form.targetStudents}
              onChange={updateField('targetStudents')}
              error={Boolean(errors.targetStudents)}
              helperText={errors.targetStudents}
            />
          </Stack>

          <TextField
            required
            label="Price"
            type="number"
            value={form.price}
            onChange={updateField('price')}
            error={Boolean(errors.price)}
            helperText={errors.price}
            sx={{ maxWidth: 320 }}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">VND</InputAdornment>,
              },
            }}
          />

          <Box>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Learning Goals
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addGoal}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Add Goal
              </Button>
            </Stack>

            <Stack spacing={1.5}>
              {form.learningGoals.map((goal, index) => (
                <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    required={index < 4}
                    label={`Goal ${index + 1}`}
                    value={goal}
                    onChange={(event) => updateGoal(index, event.target.value)}
                    error={Boolean(errors[`goal-${index}`])}
                    helperText={errors[`goal-${index}`] ?? `${goal.trim().length}/160`}
                  />
                  <Tooltip title="Remove goal">
                    <span>
                      <IconButton
                        aria-label="Remove goal"
                        disabled={form.learningGoals.length <= 4}
                        onClick={() => removeGoal(index)}
                        sx={{ mt: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              ))}
            </Stack>

            {errors.learningGoals && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {errors.learningGoals}
              </Typography>
            )}
          </Box>

          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveOutlinedIcon />}
              disabled={saving}
              onClick={handleSubmit}
              sx={{ minWidth: 180, textTransform: 'none', fontWeight: 700 }}
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
