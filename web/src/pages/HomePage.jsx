import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Favorite, Note, Notifications, Person } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import LoveDaysCounter from '../components/ui/LoveDaysCounter';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coupleId, setCoupleId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCoupleId(userData.coupleId || null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  const quickActions = [
    {
      title: 'Ghi chú tình yêu',
      description: 'Viết lên những cảm xúc của bạn',
      icon: <Note sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary.light',
      path: '/notes',
    },
    {
      title: 'Nhắc nhở',
      description: 'Đặt lời nhắc cho những khoảnh khắc đặc biệt',
      icon: <Notifications sx={{ fontSize: 40, color: 'secondary.main' }} />,
      color: 'secondary.light',
      path: '/reminders',
    },
    {
      title: 'Kết nối',
      description: 'Kết nối với người bạn yêu thương',
      icon: <Favorite sx={{ fontSize: 40, color: 'error.main' }} />,
      color: 'error.light',
      path: '/couple',
    },
    {
      title: 'Hồ sơ',
      description: 'Quản lý thông tin cá nhân',
      icon: <Person sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info.light',
      path: '/profile',
    },
  ];

  const handleActionClick = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Welcome Section */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Favorite sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 'bold', color: 'primary.main' }}
        >
          Chào mừng {user?.displayName || 'bạn'} đến với ILoveYou
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Ứng dụng dành cho những cặp đôi yêu thương 💕
        </Typography>
      </Box>

      {/* Love Days Counter */}
      {!loading && (
        <LoveDaysCounter coupleId={coupleId} />
      )}

      {/* Quick Actions Grid */}
      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              onClick={() => handleActionClick(action.path)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 3,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: action.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Welcome Message */}
      <Card sx={{ mt: 4, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h5" gutterBottom>
            Bắt đầu hành trình tình yêu của bạn! 💖
          </Typography>
          <Typography variant="body1">
            Khám phá những tính năng tuyệt vời giúp bạn ghi lại và chia sẻ những khoảnh khắc đặc biệt với người mình yêu thương.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HomePage;