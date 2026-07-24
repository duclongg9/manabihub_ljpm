import React, { useState, useEffect } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { getAsset } from '../../../shared/utils/assets';

const MESSAGES = [
  "頑張って! Cố lên nhé! 🐾",
  "Bạn học tới đâu rồi? 🎌",
  "Khám phá các Sensei đỉnh cao! 🌟",
  "ManabiHub đồng hành cùng bạn! 🌸"
];

export const FloatingMascot: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showMessage, setShowMessage] = useState(true);

  // Rotate messages every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowMessage(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        setShowMessage(true);
      }, 500); // 0.5s fade out duration
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 16, md: 32 },
        left: { xs: 16, md: 32 },
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        cursor: 'pointer',
        opacity: 0.92,
        transition: 'opacity 0.3s ease',
        '&:hover': {
          opacity: 1,
        },
        '&:hover .mascot-img': {
          transform: 'scale(1.12) rotate(-8deg)'
        },
        '&:hover .mascot-bubble': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 20px rgba(196, 30, 58, 0.12)'
        }
      }}
      onClick={() => {
        // Change message on click
        setShowMessage(false);
        setTimeout(() => {
          setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
          setShowMessage(true);
        }, 300);
      }}
    >
      {/* Speech Bubble */}
      <Fade in={showMessage} timeout={500}>
        <Box
          className="mascot-bubble"
          sx={{
            bgcolor: '#ffffff',
            px: 2,
            py: 1.2,
            borderRadius: '12px',
            borderBottomLeftRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            mb: 1.5,
            ml: 1.5,
            transition: 'all 0.3s ease',
            border: '1.5px solid #FFF5F5',
            maxWidth: 180,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 16,
              borderWidth: '8px 8px 0 0',
              borderStyle: 'solid',
              borderColor: '#ffffff transparent transparent transparent',
            }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#C41E3A', fontSize: '0.8rem', lineHeight: 1.4 }}>
            {MESSAGES[messageIndex]}
          </Typography>
        </Box>
      </Fade>

      {/* Mascot Image inside a circle */}
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: '#ffffff',
          boxShadow: '0 6px 20px rgba(196, 30, 58, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: '3px solid #FFF5F5',
          animation: 'float 4s ease-in-out infinite',
          '@keyframes float': {
            '0%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-6px)' },
            '100%': { transform: 'translateY(0px)' }
          }
        }}
      >
        <Box
          className="mascot-img"
          component="img"
          src={getAsset('shiba_mascot.png')}
          alt="Shiba Mascot"
          sx={{
            width: '115%',
            height: '115%',
            objectFit: 'cover',
            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transformOrigin: 'bottom center',
          }}
        />
      </Box>
    </Box>
  );
};
