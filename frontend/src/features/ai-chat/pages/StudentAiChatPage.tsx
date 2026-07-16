import { Alert, Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { AiChatPanel } from '../components/AiChatPanel';

export function StudentAiChatPage() {
  const { courseId, lessonBlockId } = useParams<{ courseId: string; lessonBlockId: string }>();

  if (!courseId || !lessonBlockId) {
    return <Alert severity="error">The course and lesson context are required for AI chat.</Alert>;
  }

  return (
    <Box sx={{ py: 2, maxWidth: 860 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 2, fontWeight: 700 }}>
        Ask about this lesson
      </Typography>
      <AiChatPanel courseId={courseId} lessonBlockId={lessonBlockId} />
    </Box>
  );
}
