import AddIcon from '@mui/icons-material/Add';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { ROUTES } from '../../../shared/constants/routes';

export function TeacherCoursesPage() {
  const navigate = useNavigate();

  return (
    <Box>
      <PageHeader
        title="My Courses"
        breadcrumbs={[
          { label: 'Teacher' },
          { label: 'Courses' },
        ]}
        action={(
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.TEACHER.COURSE_CREATE)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            New Draft
          </Button>
        )}
      />

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 4,
        }}
      >
        <Stack spacing={2} sx={{ alignItems: 'center', py: 5, textAlign: 'center' }}>
          <MenuBookIcon color="primary" sx={{ fontSize: 48 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            No course drafts yet
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.TEACHER.COURSE_CREATE)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Create Course Draft
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
