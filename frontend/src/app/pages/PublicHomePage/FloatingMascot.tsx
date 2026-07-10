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
        bottom: { xs: 20, md: 40 },
        left: { xs: 20, md: 40 },
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        cursor: 'pointer',
        '&:hover .mascot-img': {
          transform: 'scale(1.15) rotate(-10deg)' // Cute interaction on hover
        },
        '&:hover .mascot-bubble': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
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
            px: 2.5,
            py: 1.5,
            borderRadius: 3,
            borderBottomLeftRadius: 4, // Tail points to mascot
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            mb: 2,
            ml: 2,
            transition: 'all 0.3s ease',
            border: '2px solid #eff6ff',
            maxWidth: 200,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -10,
              left: 20,
              borderWidth: '10px 10px 0 0',
              borderStyle: 'solid',
              borderColor: '#ffffff transparent transparent transparent',
            }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#3b82f6', fontSize: '0.9rem', lineHeight: 1.4 }}>
            {MESSAGES[messageIndex]}
          </Typography>
        </Box>
      </Fade>

      {/* Mascot Image inside a circle */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: '#ffffff',
          boxShadow: '0 8px 25px rgba(37,99,235,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: '4px solid #fff',
          animation: 'float 3s ease-in-out infinite',
          '@keyframes float': {
            '0%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-10px)' },
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
            width: '120%', // Zoom in slightly to hide background edges
            height: '120%',
            objectFit: 'cover',
            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transformOrigin: 'bottom center',
          }}
        />
      </Box>
    </Box>
  );
};
