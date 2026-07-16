import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Chip, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { StudentCourseSummary } from '../types/studentTypes';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface StudentCourseCardProps {
  course: StudentCourseSummary;
}

export const StudentCourseCard: React.FC<StudentCourseCardProps> = ({ course }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
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

  const handleCardClick = () => {
    navigate(`/courses/${course.courseId}`);
  };

  return (
    <Card 
      onClick={handleCardClick}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      <CardMedia
        component="img"
        height="180"
        image={course.thumbnailUrl || '/placeholder-course.png'}
        alt={course.courseTitle}
        sx={{ objectFit: 'cover' }}
      />
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
              color={getStatusColor(course.enrollmentStatus) as any} 
              variant="outlined" 
            />
            <Button 
              variant="contained" 
              color="primary" 
              size="small" 
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Continue Learning
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
