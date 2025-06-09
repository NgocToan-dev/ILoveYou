import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person,
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Language,
  Logout,
  DeleteForever,
  Close,
  Favorite,
  Email,
  DateRange,
  Settings
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../services/firebase';
import { getCoupleData } from '../../../shared/services/firebase/couples';
import { useTranslation } from 'react-i18next';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [userProfile, setUserProfile] = useState(null);
  const [coupleData, setCoupleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    birthday: '',
    bio: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(userData);
            setFormData({
              displayName: userData.displayName || user.displayName || '',
              email: userData.email || user.email || '',
              phone: userData.phone || '',
              birthday: userData.birthday || '',
              bio: userData.bio || ''
            });

            // Fetch couple data if connected
            if (userData.coupleId) {
              const couple = await getCoupleData(userData.coupleId);
              setCoupleData(couple);
            }
          } else {
            // Create initial profile if doesn't exist
            const initialProfile = {
              uid: user.uid,
              displayName: user.displayName || '',
              email: user.email || '',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            await updateDoc(doc(db, 'users', user.uid), initialProfile);
            setUserProfile(initialProfile);
            setFormData({
              displayName: user.displayName || '',
              email: user.email || '',
              phone: '',
              birthday: '',
              bio: ''
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setError('Không thể tải thông tin người dùng');
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update Firestore profile
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: new Date()
      });

      // Update Firebase Auth profile if displayName changed
      if (formData.displayName !== user.displayName) {
        await updateProfile(user, {
          displayName: formData.displayName
        });
      }

      setUserProfile(prev => ({ ...prev, ...formData }));
      setEditMode(false);
      setSuccess('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Không thể cập nhật thông tin');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      displayName: userProfile?.displayName || user.displayName || '',
      email: userProfile?.email || user.email || '',
      phone: userProfile?.phone || '',
      birthday: userProfile?.birthday || '',
      bio: userProfile?.bio || ''
    });
    setEditMode(false);
    setError('');
  };

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    setSuccess('Đã thay đổi ngôn ngữ thành công!');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Không thể đăng xuất');
    }
  };

  const getPartnerInfo = () => {
    if (!coupleData || !user?.uid) return null;
    
    if (coupleData.user1?.id === user.uid) {
      return coupleData.user2;
    } else {
      return coupleData.user1;
    }
  };

  const partnerInfo = getPartnerInfo();

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
          <Person color="primary" />
          Hồ sơ cá nhân
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý thông tin cá nhân và cài đặt tài khoản
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

      {/* Profile Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              Thông tin cá nhân
            </Typography>
            {!editMode ? (
              <Button
                startIcon={<Edit />}
                onClick={() => setEditMode(true)}
                variant="outlined"
              >
                Chỉnh sửa
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<Cancel />}
                  onClick={handleCancelEdit}
                  variant="outlined"
                  color="inherit"
                >
                  Hủy
                </Button>
                <Button
                  startIcon={<Save />}
                  onClick={handleSaveProfile}
                  variant="contained"
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </Box>
            )}
          </Box>

          <Grid container spacing={3}>
            {/* Avatar Section */}
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: 48
                  }}
                  src={user?.photoURL}
                >
                  {(formData.displayName || user?.email)?.charAt(0)?.toUpperCase()}
                </Avatar>
                {editMode && (
                  <Button
                    startIcon={<PhotoCamera />}
                    size="small"
                    variant="outlined"
                    disabled
                  >
                    Đổi ảnh (sắp có)
                  </Button>
                )}
              </Box>
            </Grid>

            {/* Profile Fields */}
            <Grid item xs={12} sm={8}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tên hiển thị"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "standard"}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData.email}
                    disabled={true}
                    variant="standard"
                    helperText="Email không thể thay đổi"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Số điện thoại"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "standard"}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ngày sinh"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => handleInputChange('birthday', e.target.value)}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "standard"}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Giới thiệu bản thân"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "standard"}
                    multiline
                    rows={editMode ? 3 : 2}
                    placeholder="Viết vài dòng về bản thân..."
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Account Info */}
          <Divider sx={{ my: 3 }} />
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Thông tin tài khoản
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Đăng ký: {new Date(user?.metadata?.creationTime).toLocaleDateString('vi-VN')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <DateRange sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Đăng nhập lần cuối: {new Date(user?.metadata?.lastSignInTime).toLocaleDateString('vi-VN')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Couple Connection Status */}
      {coupleData && partnerInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Favorite color="error" />
              Kết nối tình yêu
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                {partnerInfo.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Đã kết nối với {partnerInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Kể từ {new Date(coupleData.createdAt?.toDate?.() || coupleData.createdAt).toLocaleDateString('vi-VN')}
                </Typography>
              </Box>
              <Chip label="Đang hoạt động" color="success" size="small" />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Settings Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Settings color="primary" />
            Cài đặt
          </Typography>

          <Grid container spacing={3}>
            {/* Language Setting */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ngôn ngữ</InputLabel>
                <Select
                  value={i18n.language}
                  label="Ngôn ngữ"
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  <MenuItem value="vi">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🇻🇳 Tiếng Việt
                    </Box>
                  </MenuItem>
                  <MenuItem value="en">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🇺🇸 English
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Theme Setting (placeholder) */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled>
                <InputLabel>Giao diện</InputLabel>
                <Select value="light" label="Giao diện">
                  <MenuItem value="light">Sáng</MenuItem>
                  <MenuItem value="dark">Tối (sắp có)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
            Quản lý tài khoản
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Logout />}
                onClick={() => setShowLogoutDialog(true)}
                sx={{ py: 1.5 }}
              >
                Đăng xuất
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<DeleteForever />}
                onClick={() => setShowDeleteDialog(true)}
                sx={{ py: 1.5 }}
              >
                Xóa tài khoản
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onClose={() => setShowLogoutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Xác nhận đăng xuất</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogoutDialog(false)}>Hủy</Button>
          <Button onClick={handleLogout} color="primary" variant="contained">
            Đăng xuất
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>
          Xác nhận xóa tài khoản
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác!
            </Typography>
          </Alert>
          <Typography>
            Việc xóa tài khoản sẽ:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Xóa vĩnh viễn tất cả dữ liệu của bạn</li>
            <li>Ngắt kết nối với người yêu (nếu có)</li>
            <li>Xóa tất cả ghi chú và nhắc nhở</li>
            <li>Không thể khôi phục sau khi xóa</li>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Hủy</Button>
          <Button color="error" variant="contained" disabled>
            Xóa tài khoản (tính năng đang phát triển)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;