import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Favorite,
  PersonAdd,
  ContentCopy,
  Close,
  Share,
  QrCode,
  CheckCircle,
  AccessTime,
  PersonRemove
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  createCoupleInvitation,
  getCoupleInvitationByCode,
  acceptCoupleInvitation,
  getCoupleData,
  subscribeToCoupleData,
  disconnectCouple,
  getUserPendingInvitations,
  cancelCoupleInvitation
} from '../../../shared/services/firebase/couples';
import LoveDaysCounter from '../components/ui/LoveDaysCounter';

const CouplePage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [coupleData, setCoupleData] = useState(null);
  const [coupleId, setCoupleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch user data and couple info
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCoupleId(userData.coupleId || null);
          }

          // Fetch pending invitations
          const invitations = await getUserPendingInvitations(user.uid);
          setPendingInvitations(invitations);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Không thể tải thông tin người dùng');
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  // Subscribe to couple data
  useEffect(() => {
    if (!coupleId) {
      setCoupleData(null);
      return;
    }

    const unsubscribe = subscribeToCoupleData(coupleId, (data) => {
      setCoupleData(data);
    });

    return unsubscribe;
  }, [coupleId]);

  const handleCreateInvitation = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const invitation = await createCoupleInvitation(user.uid, user.displayName || user.email);
      setInviteCode(invitation.code);
      setShowInviteDialog(true);
      
      // Refresh pending invitations
      const invitations = await getUserPendingInvitations(user.uid);
      setPendingInvitations(invitations);
      
      setSuccess('Đã tạo lời mời thành công!');
    } catch (error) {
      console.error('Error creating invitation:', error);
      setError('Không thể tạo lời mời');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinCouple = async () => {
    if (!inputCode.trim()) {
      setError('Vui lòng nhập mã mời');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      // Get invitation data
      const invitation = await getCoupleInvitationByCode(inputCode.trim());
      
      if (!invitation) {
        setError('Mã mời không hợp lệ hoặc đã hết hạn');
        return;
      }

      if (invitation.createdBy === user.uid) {
        setError('Bạn không thể chấp nhận lời mời của chính mình');
        return;
      }

      // Accept invitation
      const result = await acceptCoupleInvitation(
        invitation.id, 
        user.uid, 
        user.displayName || user.email
      );

      setCoupleId(result.coupleId);
      setShowJoinDialog(false);
      setInputCode('');
      setSuccess('Đã kết nối thành công với người yêu!');

      // Update local user data
      await updateDoc(doc(db, 'users', user.uid), {
        coupleId: result.coupleId
      });

    } catch (error) {
      console.error('Error joining couple:', error);
      setError('Không thể kết nối với người yêu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnectCouple = async () => {
    setActionLoading(true);
    setError('');

    try {
      await disconnectCouple(coupleId, user.uid);
      setCoupleId(null);
      setCoupleData(null);
      setShowDisconnectDialog(false);
      setSuccess('Đã ngắt kết nối thành công');

      // Update local user data
      await updateDoc(doc(db, 'users', user.uid), {
        coupleId: null
      });

    } catch (error) {
      console.error('Error disconnecting couple:', error);
      setError('Không thể ngắt kết nối');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      await cancelCoupleInvitation(invitationId);
      const invitations = await getUserPendingInvitations(user.uid);
      setPendingInvitations(invitations);
      setSuccess('Đã hủy lời mời');
    } catch (error) {
      console.error('Error canceling invitation:', error);
      setError('Không thể hủy lời mời');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Đã sao chép mã mời!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setError('Không thể sao chép mã mời');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Favorite color="primary" />
          Kết nối tình yêu
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Kết nối với người bạn yêu thương để chia sẻ những khoảnh khắc đặc biệt
        </Typography>
      </Box>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Connected State */}
      {coupleData && (
        <>
          {/* Love Days Counter */}
          <LoveDaysCounter coupleId={coupleId} />

          {/* Couple Info Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" />
                  Đã kết nối
                </Typography>
                <Chip 
                  label="Đang hoạt động" 
                  color="success" 
                  size="small" 
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        mx: 'auto', 
                        mb: 1,
                        bgcolor: 'primary.main'
                      }}
                    >
                      {coupleData.user1?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Typography variant="h6">{coupleData.user1?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tham gia {new Date(coupleData.user1?.joinedAt?.toDate?.() || coupleData.user1?.joinedAt).toLocaleDateString('vi-VN')}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        mx: 'auto', 
                        mb: 1,
                        bgcolor: 'secondary.main'
                      }}
                    >
                      {coupleData.user2?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Typography variant="h6">{coupleData.user2?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tham gia {new Date(coupleData.user2?.joinedAt?.toDate?.() || coupleData.user2?.joinedAt).toLocaleDateString('vi-VN')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Kết nối từ {new Date(coupleData.createdAt?.toDate?.() || coupleData.createdAt).toLocaleDateString('vi-VN')}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<PersonRemove />}
                  onClick={() => setShowDisconnectDialog(true)}
                  disabled={actionLoading}
                >
                  Ngắt kết nối
                </Button>
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {/* Not Connected State */}
      {!coupleData && (
        <>
          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime color="warning" />
                  Lời mời đang chờ
                </Typography>
                {pendingInvitations.map((invitation) => (
                  <Box 
                    key={invitation.id}
                    sx={{ 
                      p: 2, 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Mã mời: {invitation.code}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tạo {new Date(invitation.createdAt?.toDate?.() || invitation.createdAt).toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<ContentCopy />}
                          onClick={() => copyToClipboard(invitation.code)}
                        >
                          Sao chép
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          Hủy
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Connection Options */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <PersonAdd sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Mời người yêu
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Tạo mã mời để gửi cho người bạn yêu thương
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Share />}
                    onClick={handleCreateInvitation}
                    disabled={actionLoading}
                    fullWidth
                  >
                    Tạo lời mời
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <QrCode sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Tham gia
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Nhập mã mời từ người yêu để kết nối
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PersonAdd />}
                    onClick={() => setShowJoinDialog(true)}
                    disabled={actionLoading}
                    fullWidth
                  >
                    Nhập mã mời
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onClose={() => setShowInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Mã mời của bạn</Typography>
          <IconButton onClick={() => setShowInviteDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h3" sx={{ 
              fontWeight: 'bold', 
              color: 'primary.main', 
              mb: 2,
              letterSpacing: 2
            }}>
              {inviteCode}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Chia sẻ mã này với người bạn yêu thương
            </Typography>
            <Button
              variant="contained"
              startIcon={<ContentCopy />}
              onClick={() => copyToClipboard(inviteCode)}
              fullWidth
            >
              Sao chép mã mời
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Join Dialog */}
      <Dialog open={showJoinDialog} onClose={() => setShowJoinDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tham gia kết nối</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Mã mời"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã mời 6 ký tự"
            sx={{ mt: 2 }}
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowJoinDialog(false)}>Hủy</Button>
          <Button 
            onClick={handleJoinCouple} 
            variant="contained"
            disabled={!inputCode.trim() || actionLoading}
          >
            {actionLoading ? 'Đang kết nối...' : 'Kết nối'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Disconnect Dialog */}
      <Dialog open={showDisconnectDialog} onClose={() => setShowDisconnectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Xác nhận ngắt kết nối</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn ngắt kết nối với người yêu không? 
            Hành động này sẽ xóa tất cả dữ liệu chia sẻ giữa hai bạn.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisconnectDialog(false)}>Hủy</Button>
          <Button 
            onClick={handleDisconnectCouple} 
            color="error" 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? 'Đang ngắt kết nối...' : 'Ngắt kết nối'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CouplePage;