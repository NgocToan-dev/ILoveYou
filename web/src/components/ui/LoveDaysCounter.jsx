import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Favorite, 
  Close,
  EmojiEvents,
  CalendarToday,
  AutoAwesome
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  subscribeToLoveDays,
  getLoveMilestones,
  getNextMilestone,
  formatLoveDuration
} from '../../../../shared/services/firebase/loveDays';

// Milestone celebration component
const MilestoneCelebration = ({ milestone, open, onClose }) => {
  const theme = useTheme();
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: 'white',
          textAlign: 'center',
          borderRadius: 3
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <IconButton
          sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          onClick={onClose}
        >
          <Close />
        </IconButton>
        <Box sx={{ pt: 2 }}>
          <Zoom in={open}>
            <EmojiEvents sx={{ fontSize: 60, color: '#FFD700', mb: 2 }} />
          </Zoom>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
            🎉 Chúc mừng! 🎉
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
          {milestone?.title}
        </Typography>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {milestone?.description}
        </Typography>        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          {['💕', '🌹', '✨', '💖', '🥳'].map((emoji, index) => (
            <Typography 
              key={index} 
              sx={{ 
                fontSize: 30,
                '@keyframes bounce': {
                  '0%, 20%, 50%, 80%, 100%': {
                    transform: 'translateY(0)',
                  },
                  '40%': {
                    transform: 'translateY(-10px)',
                  },
                  '60%': {
                    transform: 'translateY(-5px)',
                  },
                },
                animation: `bounce 1s infinite ${index * 0.1}s`,
              }}
            >
              {emoji}
            </Typography>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const LoveDaysCounter = ({ coupleId, compact = false }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loveDaysData, setLoveDaysData] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [nextMilestone, setNextMilestone] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToLoveDays(coupleId, (data) => {
      if (data) {
        const daysTogether = data.daysTogether || 0;
        
        // Check for new milestones
        const currentMilestones = getLoveMilestones(daysTogether);
        const previousDays = loveDaysData?.daysTogether || 0;
        const previousMilestones = getLoveMilestones(previousDays);
        
        // If we have new milestones, show celebration
        if (currentMilestones.length > previousMilestones.length && loveDaysData) {
          const newMilestone = currentMilestones[currentMilestones.length - 1];
          setCelebrationMilestone(newMilestone);
          setShowCelebration(true);
        }
        
        setLoveDaysData(data);
        setMilestones(currentMilestones);
        setNextMilestone(getNextMilestone(daysTogether));
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [coupleId, loveDaysData?.daysTogether]);

  if (!coupleId) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <Favorite sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">
            Kết nối với người yêu để xem bộ đếm ngày yêu
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography color="text.secondary">Đang tải dữ liệu...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!loveDaysData) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <CalendarToday sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">
            Chưa có dữ liệu ngày yêu
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const daysTogether = loveDaysData.daysTogether || 0;
  const progressPercentage = nextMilestone 
    ? ((daysTogether / nextMilestone.days) * 100)
    : 100;

  if (compact) {
    return (
      <Card 
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.secondary.light}20)`,
          border: `1px solid ${theme.palette.primary.light}`,
          mb: 2
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <Favorite sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {daysTogether} ngày yêu
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {formatLoveDuration(daysTogether)}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)`,
          border: `2px solid ${theme.palette.primary.light}`,
          mb: 3,
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
          {/* Main Counter */}
          <Fade in timeout={1000}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <Favorite sx={{ color: 'primary.main', fontSize: { xs: 40, sm: 50 } }} />
                <Typography 
                  variant={isMobile ? "h3" : "h2"} 
                  component="h1" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {daysTogether}
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ color: 'primary.dark', fontWeight: 600 }}>
                ngày yêu thương
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                {formatLoveDuration(daysTogether)}
              </Typography>
            </Box>
          </Fade>

          {/* Next Milestone Progress */}
          {nextMilestone && (
            <Fade in timeout={1500}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                  <AutoAwesome sx={{ color: 'secondary.main', fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Mốc tiếp theo: {nextMilestone.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Còn {nextMilestone.daysLeft} ngày nữa
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progressPercentage}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {Math.round(progressPercentage)}% hoàn thành
                </Typography>
              </Box>
            </Fade>
          )}

          {/* Recent Milestones */}
          {milestones.length > 0 && (
            <Fade in timeout={2000}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Các mốc đã đạt được 🏆
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1, 
                  justifyContent: 'center',
                  maxHeight: 100,
                  overflowY: 'auto'
                }}>
                  {milestones.slice(-6).reverse().map((milestone, index) => (
                    <Chip
                      key={index}
                      label={milestone.title}
                      size="small"
                      sx={{
                        background: `linear-gradient(45deg, ${theme.palette.success.light}, ${theme.palette.success.main})`,
                        color: 'white',
                        fontWeight: 600,
                        '& .MuiChip-label': {
                          fontSize: '0.75rem'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Fade>
          )}
        </CardContent>
      </Card>      {/* Milestone Celebration Modal */}
      <MilestoneCelebration
        milestone={celebrationMilestone}
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </>
  );
};

export default LoveDaysCounter;