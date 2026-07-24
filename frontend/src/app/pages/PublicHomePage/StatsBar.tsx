import React, { useRef, useState, useEffect } from 'react';
import { Box, Container, Typography } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const STATS = [
  { icon: <GroupsIcon sx={{ fontSize: 28 }} />, value: '500+', label: 'Học viên', color: '#C41E3A' },
  { icon: <AutoStoriesIcon sx={{ fontSize: 28 }} />, value: '50+', label: 'Khóa học', color: '#D4A017' },
  { icon: <SchoolIcon sx={{ fontSize: 28 }} />, value: '10+', label: 'Giảng viên', color: '#5B8C5A' },
  { icon: <EmojiEventsIcon sx={{ fontSize: 28 }} />, value: 'N5→N1', label: 'Đầy đủ cấp độ', color: '#1B2A4A' },
];

export const StatsBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        bgcolor: '#ffffff',
        py: { xs: 4, md: 5 },
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid #e8e0d8',
      }}
    >
      {/* Subtle top border accent */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #C41E3A, #D4A017, #5B8C5A, #1B2A4A)' }} />

      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-around',
            alignItems: 'center',
            gap: { xs: 3, sm: 2 },
          }}
        >
          {STATS.map((stat, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s`,
              }}
            >
              <Box
                sx={{
                  width: 52, height: 52,
                  borderRadius: '14px',
                  bgcolor: `${stat.color}18`,
                  color: stat.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${stat.color}30`,
                }}
              >
                {stat.icon}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography sx={{ color: '#1A1A2E', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.2 }}>
                  {stat.value}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
                  {stat.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};
