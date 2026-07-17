import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, Button } from '@mui/material';
import type { ChipProps } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { StudentCourseSummary } from '../types/studentTypes';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';

interface StudentCourseCardProps {
  course: StudentCourseSummary;
}

export const StudentCourseCard: React.FC<StudentCourseCardProps> = ({ course }) => {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);

  const getStatusColor = (status: StudentCourseSummary['enrollmentStatus']): ChipProps['color'] => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'COMPLETED':
        return 'primary';
      case 'REFUNDED':
      case 'REVOKED':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleViewCourse = () => {
    navigate(`/courses/${course.courseId}`);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      {course.thumbnailUrl && !imageFailed ? (
        <Box
          component="img"
          src={course.thumbnailUrl}
          alt={course.courseTitle}
          onError={() => setImageFailed(true)}
          sx={{ width: '100%', height: 180, objectFit: 'cover', bgcolor: 'grey.100' }}
        />
      ) : (
        <Box
          role="img"
          aria-label={`No cover image for ${course.courseTitle}`}
          sx={{
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.100',
            color: 'text.disabled',
          }}
        >
          <ImageNotSupportedOutlinedIcon sx={{ fontSize: 48 }} />
        </Box>
      )}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography gutterBottom variant="h6" component="h2" sx={{
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.3,
            minHeight: '2.6em',
          }}>
            {course.courseTitle}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
          <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
          <Typography variant="body2" sx={{ flexGrow: 1 }} noWrap>
            {course.teacherName || 'Unknown Instructor'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary' }}>
          <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
          <Typography variant="body2">
            Enrolled: {new Date(course.enrolledAt).toLocaleDateString()}
          </Typography>
        </Box>

        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip
              label={course.enrollmentStatus}
              size="small"
              color={getStatusColor(course.enrollmentStatus)}
              variant="outlined"
            />
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleViewCourse}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              View Course
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
