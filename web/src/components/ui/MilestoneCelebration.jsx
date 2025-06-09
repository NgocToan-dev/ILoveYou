import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  IconButton,
  Paper,
  Fade,
  Zoom
} from '@mui/material';
import {
  Close,
  Favorite,
  Star,
  Celebration,
  Share
} from '@mui/icons-material';
import Lottie from 'lottie-react';
import { useTranslation } from 'react-i18next';

// Lottie animation data (simplified heart animation)
const heartAnimationData = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "Heart",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Heart",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [100, 100, 100] },
            { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 30, s: [120, 120, 100] },
            { t: 60, s: [100, 100, 100] }
          ]
        }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ind: 0,
              ty: "sh",
              ks: {
                a: 0,
                k: {
                  i: [[0, 0], [0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0], [0, 0]],
                  v: [[-20, -10], [0, 20], [20, -10], [0, -20]],
                  c: true
                }
              }
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.91, 0.11, 0.38, 1] },
              o: { a: 0, k: 100 }
            }
          ]
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    }
  ]
};

const confettiColors = ['#e91e63', '#ff4081', '#f50057', '#c51162', '#ad1457'];

const ConfettiPiece = ({ x, y, color, delay }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: x,
        top: y,
        width: 8,
        height: 8,
        backgroundColor: color,
        borderRadius: '50%',
        animation: `confettiFall 3s ease-in-out ${delay}s forwards`,
        '@keyframes confettiFall': {
          '0%': {
            transform: 'translateY(0) rotate(0deg)',
            opacity: 1
          },
          '100%': {
            transform: 'translateY(400px) rotate(360deg)',
            opacity: 0
          }
        }
      }}
    />
  );
};

const Confetti = ({ show }) => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (show) {
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 400,
        y: Math.random() * 100,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        delay: Math.random() * 2
      }));
      setPieces(newPieces);
    }
  }, [show]);

  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      {pieces.map(piece => (
        <ConfettiPiece key={piece.id} {...piece} />
      ))}
    </Box>
  );
};

const MilestoneCelebration = ({ 
  open, 
  onClose, 
  milestone, 
  daysCount,
  coupleNames = []
}) => {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setAnimationComplete(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
      setAnimationComplete(false);
    }
  }, [open]);

  const getMilestoneIcon = (type) => {
    switch (type) {
      case 'monthly':
        return <Star sx={{ fontSize: 60, color: '#ffd700' }} />;
      case 'yearly':
        return <Celebration sx={{ fontSize: 60, color: '#e91e63' }} />;
      case 'special':
        return <Favorite sx={{ fontSize: 60, color: '#e91e63' }} />;
      default:
        return <Favorite sx={{ fontSize: 60, color: '#e91e63' }} />;
    }
  };

  const getMilestoneMessage = () => {
    if (!milestone) return '';
    
    switch (milestone.type) {
      case 'monthly':
        return t('milestones.monthlyMessage', { 
          months: Math.floor(daysCount / 30),
          days: daysCount 
        });
      case 'yearly':
        return t('milestones.yearlyMessage', { 
          years: Math.floor(daysCount / 365),
          days: daysCount 
        });
      case 'special':
        return t('milestones.specialMessage', { 
          milestone: milestone.name,
          days: daysCount 
        });
      default:
        return t('milestones.defaultMessage', { days: daysCount });
    }
  };

  const handleShare = async () => {
    const message = `🎉 ${getMilestoneMessage()} 💕`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ILoveYou Milestone',
          text: message,
          url: window.location.origin
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(message);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(message);
        // Show toast or notification
      } catch (error) {
        console.error('Failed to copy to clipboard');
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'visible',
          position: 'relative'
        }
      }}
    >
      <Confetti show={showConfetti} />
      
      <DialogContent sx={{ p: 4, textAlign: 'center', position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'grey.500'
          }}
        >
          <Close />
        </IconButton>

        {/* Main Animation */}
        <Zoom in={open} timeout={500}>
          <Box sx={{ mb: 3 }}>
            {milestone && getMilestoneIcon(milestone.type)}
          </Box>
        </Zoom>

        {/* Heart Animation */}
        <Fade in={animationComplete} timeout={800}>
          <Box sx={{ mb: 3 }}>
            <Lottie 
              animationData={heartAnimationData}
              style={{ width: 100, height: 100 }}
              loop={true}
            />
          </Box>
        </Fade>

        {/* Milestone Text */}
        <Fade in={animationComplete} timeout={1000}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              🎉 {t('milestones.congratulations')} 🎉
            </Typography>
            
            <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
              {getMilestoneMessage()}
            </Typography>

            {coupleNames.length === 2 && (
              <Typography variant="h6" sx={{ color: 'text.secondary', mt: 2 }}>
                {coupleNames[0]} 💕 {coupleNames[1]}
              </Typography>
            )}
          </Box>
        </Fade>

        {/* Milestone Details */}
        {milestone && (
          <Fade in={animationComplete} timeout={1200}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                mb: 3, 
                background: 'linear-gradient(45deg, #e91e63 30%, #f06292 90%)',
                color: 'white'
              }}
            >
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {daysCount}
              </Typography>
              <Typography variant="subtitle1">
                {t('milestones.daysOfLove')}
              </Typography>
              
              {milestone.description && (
                <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                  {milestone.description}
                </Typography>
              )}
            </Paper>
          </Fade>
        )}

        {/* Action Buttons */}
        <Fade in={animationComplete} timeout={1400}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleShare}
              startIcon={<Share />}
              sx={{
                background: 'linear-gradient(45deg, #e91e63 30%, #f06292 90%)',
                px: 3
              }}
            >
              {t('milestones.share')}
            </Button>
            
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ px: 3 }}
            >
              {t('milestones.continue')}
            </Button>
          </Box>
        </Fade>

        {/* Floating Hearts Animation */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'hidden'
          }}
        >
          {[...Array(5)].map((_, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                left: `${20 + i * 15}%`,
                animation: `floatUp 4s ease-in-out ${i * 0.5}s infinite`,
                '@keyframes floatUp': {
                  '0%': {
                    bottom: '-50px',
                    opacity: 0,
                    transform: 'translateX(0) rotate(0deg)'
                  },
                  '10%': {
                    opacity: 1
                  },
                  '90%': {
                    opacity: 1
                  },
                  '100%': {
                    bottom: '100%',
                    opacity: 0,
                    transform: 'translateX(20px) rotate(15deg)'
                  }
                }
              }}
            >
              <Favorite sx={{ color: 'rgba(233, 30, 99, 0.3)', fontSize: 20 }} />
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MilestoneCelebration;