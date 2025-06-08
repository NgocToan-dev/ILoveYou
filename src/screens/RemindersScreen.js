import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../context/AuthContext';
import { LoveBackground, LoadingIndicator } from '../components';
import {
  REMINDER_TYPES,
  subscribeToUserPersonalReminders,
  subscribeToCoupleReminders,
  getRemindersStats,
  getUpcomingReminders,
  getOverdueReminders,
  completeReminder,
  uncompleteReminder,
  deleteReminder,
  getPriorityColor,
  getPriorityName
} from '../services/firebase/reminders';
import { getUserProfile } from '../services/firebase/firestore';
import { formatDateString, toDate } from '../utils/dateUtils';

const RemindersScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Reminders data
  const [personalReminders, setPersonalReminders] = useState([]);
  const [coupleReminders, setCoupleReminders] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [overdueReminders, setOverdueReminders] = useState([]);
  const [stats, setStats] = useState(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'personal', 'couple'
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  useEffect(() => {
    let personalUnsubscribe = null;
    let coupleUnsubscribe = null;

    if (user) {
      // Subscribe to personal reminders
      personalUnsubscribe = subscribeToUserPersonalReminders(
        user.uid,
        showCompleted,
        setPersonalReminders
      );

      // Subscribe to couple reminders if user has a couple
      if (userProfile?.coupleId) {
        coupleUnsubscribe = subscribeToCoupleReminders(
          userProfile.coupleId,
          showCompleted,
          setCoupleReminders
        );
      }
    }

    return () => {
      if (personalUnsubscribe) personalUnsubscribe();
      if (coupleUnsubscribe) coupleUnsubscribe();
    };
  }, [user, userProfile?.coupleId, showCompleted]);

  useEffect(() => {
    loadAdditionalData();
  }, [user, userProfile?.coupleId]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdditionalData = async () => {
    if (!user) return;

    try {
      // Load upcoming reminders
      const upcoming = await getUpcomingReminders(user.uid, userProfile?.coupleId);
      setUpcomingReminders(upcoming);

      // Load overdue reminders
      const overdue = await getOverdueReminders(user.uid, userProfile?.coupleId);
      setOverdueReminders(overdue);

      // Load stats
      const statistics = await getRemindersStats(user.uid, userProfile?.coupleId);
      setStats(statistics);
    } catch (error) {
      console.error('Error loading additional data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await loadAdditionalData();
    setRefreshing(false);
  };

  const handleCompleteToggle = async (reminder) => {
    try {
      if (reminder.completed) {
        await uncompleteReminder(reminder.id);
      } else {
        await completeReminder(reminder.id);
      }
      
      // Reload additional data to update stats
      await loadAdditionalData();
    } catch (error) {
      console.error('Error toggling reminder completion:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái nhắc nhở.');
    }
  };

  const handleDeleteReminder = (reminder) => {
    Alert.alert(
      'Xóa nhắc nhở',
      `Bạn có chắc chắn muốn xóa nhắc nhở "${reminder.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReminder(reminder.id);
              await loadAdditionalData();
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Lỗi', 'Không thể xóa nhắc nhở.');
            }
          }
        }
      ]
    );
  };

  const navigateToCreateReminder = (type) => {
    navigation.navigate('CreateReminder', {
      type,
      coupleId: userProfile?.coupleId
    });
  };

  const navigateToReminderDetail = (reminder) => {
    navigation.navigate('ReminderDetail', {
      reminder
    });
  };

  const renderStatsCard = () => {
    if (!stats) return null;

    const totalPersonal = stats.personal.total;
    const totalCouple = stats.couple.total;
    const totalOverdue = stats.personal.overdue + stats.couple.overdue;
    const totalUpcoming = upcomingReminders.length;

    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Thống kê nhắc nhở</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalPersonal}</Text>
            <Text style={styles.statLabel}>Cá nhân</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalCouple}</Text>
            <Text style={styles.statLabel}>Cặp đôi</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF5722' }]}>{totalOverdue}</Text>
            <Text style={styles.statLabel}>Quá hạn</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>{totalUpcoming}</Text>
            <Text style={styles.statLabel}>Sắp tới</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderReminderCard = (reminder) => {
    const priorityColor = getPriorityColor(reminder.priority);
    
        let isOverdue = false;
    if (reminder.dueDate && !reminder.completed) {
      try {
        const dueDate = toDate(reminder.dueDate);
        isOverdue = dueDate && dueDate < new Date();
      } catch (error) {
        console.error('Error checking if reminder is overdue:', error);
        isOverdue = false;
      }
    }

    return (
      <TouchableOpacity
        key={reminder.id}
        style={[
          styles.reminderCard,
          reminder.completed && styles.completedCard,
          isOverdue && styles.overdueCard
        ]}
        onPress={() => navigateToReminderDetail(reminder)}
        activeOpacity={0.8}
      >
        <View style={styles.reminderHeader}>
          <TouchableOpacity
            style={[styles.checkbox, reminder.completed && styles.checkedBox]}
            onPress={() => handleCompleteToggle(reminder)}
            activeOpacity={0.8}
          >
            {reminder.completed && (
              <Ionicons name="checkmark" size={16} color="#FFF" />
            )}
          </TouchableOpacity>
          
          <View style={styles.reminderInfo}>
            <Text style={[
              styles.reminderTitle,
              reminder.completed && styles.completedTitle
            ]} numberOfLines={1}>
              {reminder.title || 'Không có tiêu đề'}
            </Text>
            
            <View style={styles.reminderMeta}>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
              <Text style={styles.priorityText}>{getPriorityName(reminder.priority)}</Text>
              
              <Ionicons 
                name={reminder.type === REMINDER_TYPES.COUPLE ? 'people' : 'person'} 
                size={14} 
                color="#8E24AA" 
                style={styles.typeIcon}
              />
            </View>
          </View>
          
          <View style={styles.reminderActions}>
            <Text style={[
              styles.dueDateText,
              isOverdue && styles.overdueText
            ]}>
              {formatDateString(reminder.dueDate, 'due', 'vi-VN')}
            </Text>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteReminder(reminder)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color="#FF5722" />
            </TouchableOpacity>
          </View>
        </View>
        
        {reminder.description && (
          <Text style={[
            styles.reminderDescription,
            reminder.completed && styles.completedDescription
          ]} numberOfLines={2}>
            {reminder.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderCreateButtons = () => (
    <View style={styles.createSection}>
      <Text style={styles.sectionTitle}>Tạo nhắc nhở mới</Text>
      
      <View style={styles.createButtons}>
        <TouchableOpacity
          style={[styles.createButton, styles.personalButton]}
          onPress={() => navigateToCreateReminder(REMINDER_TYPES.PERSONAL)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={24} color="#FFF" />
          <Text style={styles.createButtonText}>Cá nhân</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.createButton, 
            styles.coupleButton,
            !userProfile?.coupleId && styles.disabledButton
          ]}
          onPress={() => {
            if (userProfile?.coupleId) {
              navigateToCreateReminder(REMINDER_TYPES.COUPLE);
            } else {
              Alert.alert(
                'Chưa kết nối',
                'Bạn cần kết nối với người yêu để tạo nhắc nhở cho cặp đôi.',
                [
                  { text: 'Hủy' },
                  { text: 'Kết nối ngay', onPress: () => navigation.navigate('Couple') }
                ]
              );
            }
          }}
          disabled={!userProfile?.coupleId}
          activeOpacity={0.8}
        >
          <Ionicons name="people" size={24} color="#FFF" />
          <Text style={styles.createButtonText}>Cặp đôi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LoveBackground>
        <View style={styles.loadingContainer}>
          <LoadingIndicator message="Đang tải nhắc nhở..." />
        </View>
      </LoveBackground>
    );
  }

  const getCurrentReminders = () => {
    switch (activeTab) {
      case 'upcoming':
        return upcomingReminders;
      case 'personal':
        return personalReminders;
      case 'couple':
        return coupleReminders;
      default:
        return [];
    }
  };

  const currentReminders = getCurrentReminders();

  return (
    <LoveBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E91E63']}
            tintColor="#E91E63"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nhắc nhở tình yêu ⏰</Text>
          <Text style={styles.subtitle}>
            Đừng quên những điều quan trọng nhất
          </Text>
        </View>

        {/* Stats Card */}
        {renderStatsCard()}

        {/* Create Buttons */}
        {renderCreateButtons()}

        {/* Overdue Alert */}
        {overdueReminders.length > 0 && (
          <TouchableOpacity
            style={styles.overdueAlert}
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.8}
          >
            <Ionicons name="warning" size={24} color="#FF5722" />
            <Text style={styles.overdueAlertText}>
              Bạn có {overdueReminders.length} nhắc nhở quá hạn
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FF5722" />
          </TouchableOpacity>
        )}

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.tabText, 
              activeTab === 'upcoming' && styles.activeTabText
            ]}>
              Sắp tới ({upcomingReminders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
            onPress={() => setActiveTab('personal')}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.tabText, 
              activeTab === 'personal' && styles.activeTabText
            ]}>
              Cá nhân ({personalReminders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'couple' && styles.activeTab]}
            onPress={() => setActiveTab('couple')}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.tabText, 
              activeTab === 'couple' && styles.activeTabText
            ]}>
              Cặp đôi ({coupleReminders.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Show Completed Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowCompleted(!showCompleted)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={showCompleted ? 'eye-off' : 'eye'} 
              size={20} 
              color="#8E24AA" 
            />
            <Text style={styles.toggleText}>
              {showCompleted ? 'Ẩn đã hoàn thành' : 'Hiện đã hoàn thành'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reminders List */}
        <View style={styles.remindersSection}>
          {currentReminders.length > 0 ? (
            <View style={styles.remindersContainer}>
              {currentReminders.map(reminder => renderReminderCard(reminder))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="alarm-outline" size={48} color="#F06292" />
              <Text style={styles.emptyTitle}>
                {activeTab === 'upcoming' ? 'Không có nhắc nhở sắp tới' : 'Chưa có nhắc nhở nào'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'upcoming' ? 
                  'Tuyệt vời! Bạn đã hoàn thành tất cả nhắc nhở sắp tới.' :
                  'Hãy tạo nhắc nhở đầu tiên của bạn!'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </LoveBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: 60,
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#C2185B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E24AA',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E24AA',
    marginTop: 4,
  },
  createSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 16,
  },
  createButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  personalButton: {
    backgroundColor: '#8E24AA',
  },
  coupleButton: {
    backgroundColor: '#E91E63',
  },
  disabledButton: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  overdueAlert: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  overdueAlertText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5722',
    marginLeft: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#E91E63',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E24AA',
  },
  activeTabText: {
    color: '#FFF',
  },
  toggleContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F8BBD9',
  },
  toggleText: {
    fontSize: 14,
    color: '#8E24AA',
    marginLeft: 8,
  },
  remindersSection: {
    marginBottom: 32,
  },
  remindersContainer: {
    gap: 12,
  },
  reminderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  completedCard: {
    opacity: 0.7,
    backgroundColor: '#F5F5F5',
  },
  overdueCard: {
    borderColor: '#FF5722',
    borderWidth: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E91E63',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkedBox: {
    backgroundColor: '#E91E63',
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    color: '#8E24AA',
    marginRight: 12,
  },
  typeIcon: {
    marginLeft: 4,
  },
  reminderActions: {
    alignItems: 'flex-end',
  },
  dueDateText: {
    fontSize: 12,
    color: '#8E24AA',
    marginBottom: 8,
  },
  overdueText: {
    color: '#FF5722',
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
  completedDescription: {
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C2185B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E24AA',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RemindersScreen;