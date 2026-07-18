import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { Alert, Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import { AiChatPanel } from '../components/AiChatPanel';

export function StudentAiChatPage() {
  const { courseId, lessonBlockId } = useParams<{ courseId: string; lessonBlockId: string }>();

  if (!courseId || !lessonBlockId) {
    return <Alert severity="error">The course and lesson context are required for AI chat.</Alert>;
  }

  return (
    <Box sx={{ py: 2, maxWidth: 860 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
        <Tooltip title="Back to course">
          <IconButton
            component={Link}
            to={ROUTES.PUBLIC.COURSE_DETAIL.replace(':id', courseId)}
            aria-label="Back to course"
          >
            <ArrowBackOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          Ask about this lesson
        </Typography>
      </Stack>
      <AiChatPanel courseId={courseId} lessonBlockId={lessonBlockId} />
    </Box>
  );
}
