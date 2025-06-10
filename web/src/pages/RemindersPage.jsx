import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Fab,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Tab,
  Tabs
} from '@mui/material';
import {
  Notifications,
  Add,
  Search,
  FilterList,
  Edit,
  Delete,
  Person,
  Favorite,
  Clear,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/layout/PageHeader';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  subscribeToUserPersonalReminders,
  subscribeToCoupleReminders,
  deleteReminder,
  completeReminder,
  uncompleteReminder,
  REMINDER_TYPES,
  REMINDER_CATEGORIES,
  REMINDER_PRIORITIES,
  getCategoryDisplayInfo,
  getPriorityDisplayInfo
} from '../../../shared/services/firebase/reminders';
import CreateReminderModal from '../components/reminders/CreateReminderModal';
import EditReminderModal from '../components/reminders/EditReminderModal';
import ReminderCard from '../components/reminders/ReminderCard';

const RemindersPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [personalReminders, setPersonalReminders] = useState([]);
  const [coupleReminders, setCoupleReminders] = useState([]);
  const [coupleId, setCoupleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [error, setError] = useState('');

  // Fetch user data and setup subscriptions
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
          setError('Không thể tải thông tin người dùng');
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  // Subscribe to personal reminders
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToUserPersonalReminders(
      user.uid,
      showCompleted,
      (reminders) => {
        setPersonalReminders(reminders || []);
      }
    );

    return unsubscribe;
  }, [user?.uid, showCompleted]);

  // Subscribe to couple reminders
  useEffect(() => {
    if (!coupleId) {
      setCoupleReminders([]);
      return;
    }

    const unsubscribe = subscribeToCoupleReminders(
      coupleId,
      showCompleted,
      (reminders) => {
        setCoupleReminders(reminders || []);
      }
    );

    return unsubscribe;
  }, [coupleId, showCompleted]);

  // Filter and search reminders
  const getFilteredReminders = (reminders) => {
    let filtered = [...reminders];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(reminder =>
        reminder.title?.toLowerCase().includes(searchLower) ||
        reminder.description?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(reminder => reminder.category === selectedCategory);
    }

    if (selectedPriority) {
      filtered = filtered.filter(reminder => reminder.priority === selectedPriority);
    }

    return filtered.sort((a, b) => {
      // Sort by due date
      const dateA = a.dueDate?.toDate?.() || new Date(a.dueDate);
      const dateB = b.dueDate?.toDate?.() || new Date(b.dueDate);
      return dateA - dateB;
    });
  };

  const handleDeleteReminder = async (reminderId) => {
    try {
      await deleteReminder(reminderId);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      setError('Không thể xóa nhắc nhở');
    }
  };

  const handleToggleComplete = async (reminder) => {
    try {
      if (reminder.completed) {
        await uncompleteReminder(reminder.id);
      } else {
        await completeReminder(reminder.id);
      }
    } catch (error) {
      console.error('Error toggling reminder completion:', error);
      setError('Không thể cập nhật trạng thái nhắc nhở');
    }
  };

  const handleEditReminder = (reminder) => {
    setSelectedReminder(reminder);
    setEditModalOpen(true);
  };

  const filteredPersonalReminders = getFilteredReminders(personalReminders);
  const filteredCoupleReminders = getFilteredReminders(coupleReminders);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <PageHeader
        title="Nhắc nhở tình yêu"
        subtitle="Quản lý những lời nhắc quan trọng cho bạn và người yêu"
        icon={<Notifications color="primary" />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm nhắc nhở..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>

            {/* Category Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Danh mục</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Danh mục"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {Object.values(REMINDER_CATEGORIES).map((category) => {
                    const info = getCategoryDisplayInfo(category);
                    return (
                      <MenuItem key={category} value={category}>
                        {info.emoji} {info.name}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Priority Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Độ ưu tiên</InputLabel>
                <Select
                  value={selectedPriority}
                  label="Độ ưu tiên"
                  onChange={(e) => setSelectedPriority(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {Object.values(REMINDER_PRIORITIES).map((priority) => {
                    const info = getPriorityDisplayInfo(priority);
                    return (
                      <MenuItem key={priority} value={priority}>
                        {info.emoji} {info.name}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Show Completed Toggle */}
            <Grid item xs={12} md={2}>
              <ToggleButtonGroup
                value={showCompleted ? 'completed' : 'pending'}
                exclusive
                onChange={(e, newValue) => setShowCompleted(newValue === 'completed')}
                size="small"
                fullWidth
              >
                <ToggleButton value="pending">
                  <Schedule sx={{ mr: 1, fontSize: 16 }} />
                  Đang chờ
                </ToggleButton>
                <ToggleButton value="completed">
                  <CheckCircle sx={{ mr: 1, fontSize: 16 }} />
                  Hoàn thành
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab 
            label={`Cá nhân (${filteredPersonalReminders.length})`}
            icon={<Person />}
            iconPosition="start"
          />
          {coupleId && (
            <Tab 
              label={`Cặp đôi (${filteredCoupleReminders.length})`}
              icon={<Favorite />}
              iconPosition="start"
            />
          )}
        </Tabs>
      </Box>

      {/* Reminders Grid */}
      {activeTab === 0 && (
        <>
          {filteredPersonalReminders.length > 0 ? (
            <Grid container spacing={2}>
              {filteredPersonalReminders.map((reminder) => (
                <Grid item xs={12} sm={6} md={4} key={reminder.id}>
                  <ReminderCard
                    reminder={reminder}
                    onEdit={handleEditReminder}
                    onDelete={handleDeleteReminder}
                    onToggleComplete={handleToggleComplete}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Notifications sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {searchTerm || selectedCategory || selectedPriority 
                    ? 'Không tìm thấy nhắc nhở nào'
                    : showCompleted 
                      ? 'Chưa có nhắc nhở đã hoàn thành'
                      : 'Chưa có nhắc nhở cá nhân nào'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm || selectedCategory || selectedPriority 
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                    : 'Tạo nhắc nhở đầu tiên của bạn!'}
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === 1 && coupleId && (
        <>
          {filteredCoupleReminders.length > 0 ? (
            <Grid container spacing={2}>
              {filteredCoupleReminders.map((reminder) => (
                <Grid item xs={12} sm={6} md={4} key={reminder.id}>
                  <ReminderCard
                    reminder={reminder}
                    onEdit={handleEditReminder}
                    onDelete={handleDeleteReminder}
                    onToggleComplete={handleToggleComplete}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Favorite sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {searchTerm || selectedCategory || selectedPriority 
                    ? 'Không tìm thấy nhắc nhở nào'
                    : showCompleted 
                      ? 'Chưa có nhắc nhở cặp đôi đã hoàn thành'
                      : 'Chưa có nhắc nhở cặp đôi nào'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm || selectedCategory || selectedPriority 
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                    : 'Tạo nhắc nhở đầu tiên cho cặp đôi!'}
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add reminder"
        sx={{
          position: 'fixed',
          bottom: { xs: 80, sm: 20 },
          right: 20,
        }}
        onClick={() => setCreateModalOpen(true)}
      >
        <Add />
      </Fab>

      {/* Create Reminder Modal */}
      <CreateReminderModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        userId={user?.uid}
        coupleId={coupleId}
        defaultType={activeTab === 1 ? REMINDER_TYPES.COUPLE : REMINDER_TYPES.PERSONAL}
      />

      {/* Edit Reminder Modal */}
      <EditReminderModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedReminder(null);
        }}
        reminder={selectedReminder}
      />
    </Box>
  );
};

export default RemindersPage;