import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../context/AuthContext';
import { LoveBackground, LoadingIndicator } from '../components';
import { formatDateString, toDate } from '../utils/dateUtils';
import {
  deleteReminder,
  completeReminder,
  uncompleteReminder,
  getCategoryDisplayInfo,
  getPriorityColor,
  getPriorityName,
  REMINDER_TYPES
} from '../services/firebase/reminders';

const ReminderDetailScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { reminder } = route.params || {};
  
  const [loading, setLoading] = useState(false);

  const handleDeleteReminder = () => {
    Alert.alert(
      'Xóa nhắc nhở',
      `Bạn có chắc chắn muốn xóa nhắc nhở "${reminder.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteReminder(reminder.id);
              Alert.alert('Thành công', 'Đã xóa nhắc nhở.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Lỗi', 'Không thể xóa nhắc nhở.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCompleteToggle = async () => {
    setLoading(true);
    try {
      if (reminder.completed) {
        await uncompleteReminder(reminder.id);
      } else {
        await completeReminder(reminder.id);
      }
      
      Alert.alert(
        'Thành công',
        reminder.completed ? 'Đã đánh dấu chưa hoàn thành.' : 'Đã đánh dấu hoàn thành!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error toggling reminder completion:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái nhắc nhở.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReminder = () => {
    navigation.navigate('EditReminder', {
      reminder
    });
  };

  const handleShareReminder = async () => {
    try {
      const categoryInfo = getCategoryDisplayInfo(reminder.category);
      const shareContent = `⏰ ${reminder.title}\n\n${reminder.description ? reminder.description + '\n\n' : ''}📅 Hạn: ${formatDateString(reminder.dueDate, 'due')}\n🏷️ Danh mục: ${categoryInfo.name}\n\n💕 Từ ILoveYou App`;
      
      await Share.share({
        message: shareContent,
        title: reminder.title,
      });
    } catch (error) {
      console.error('Error sharing reminder:', error);
      Alert.alert('Lỗi', 'Không thể chia sẻ nhắc nhở.');
    }
  };

  if (!reminder) {
    return (
      <LoveBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Không tìm thấy nhắc nhở</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </LoveBackground>
    );
  }

  const categoryInfo = getCategoryDisplayInfo(reminder.category);
  const priorityColor = getPriorityColor(reminder.priority);
  const priorityName = getPriorityName(reminder.priority);
    let isOverdue = false;
  if (reminder.dueDate && !reminder.completed) {
    try {
      const dueDate = toDate(reminder.dueDate);
      isOverdue = dueDate && dueDate < new Date();
    } catch (error) {
      console.error('Error checking if reminder is overdue in detail screen:', error);
      isOverdue = false;
    }
  }

  return (
    <LoveBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#C2185B" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Chi tiết nhắc nhở</Text>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShareReminder}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={24} color="#C2185B" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleEditReminder}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={24} color="#C2185B" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDeleteReminder}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <LoadingIndicator size="small" color="#FF5722" />
              ) : (
                <Ionicons name="trash-outline" size={24} color="#FF5722" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Alert */}
          {reminder.completed && (
            <View style={styles.completedAlert}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.completedText}>Đã hoàn thành!</Text>
            </View>
          )}
          
          {isOverdue && (
            <View style={styles.overdueAlert}>
              <Ionicons name="warning" size={24} color="#FF5722" />
              <Text style={styles.overdueText}>Quá hạn!</Text>
            </View>
          )}

          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20' }]}>
            <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
            <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
              {categoryInfo.name}
            </Text>
          </View>

          {/* Reminder Content */}
          <View style={styles.reminderCard}>
            {/* Title */}
            <Text style={[
              styles.reminderTitle,
              reminder.completed && styles.completedTitle
            ]}>
              {reminder.title}
            </Text>
            
            {/* Meta Info */}
            <View style={styles.metaInfo}>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons 
                    name={reminder.type === REMINDER_TYPES.COUPLE ? 'people' : 'person'} 
                    size={16} 
                    color="#8E24AA" 
                  />
                  <Text style={styles.metaText}>
                    {reminder.type === REMINDER_TYPES.COUPLE ? 'Nhắc nhở cặp đôi' : 'Nhắc nhở cá nhân'}
                  </Text>
                </View>
                
                <View style={styles.metaItem}>
                  <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                  <Text style={styles.metaText}>{priorityName}</Text>
                </View>
              </View>
              
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color="#8E24AA" />
                <Text style={[
                  styles.metaText,
                  isOverdue && styles.overdueMetaText
                ]}>
                  Hạn: {formatDateString(reminder.dueDate, 'due', 'vi-VN')}
                </Text>
              </View>
                <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#8E24AA" />
                <Text style={styles.metaText}>
                  Tạo: {formatDateString(reminder.createdAt, 'relative', 'vi-VN')}
                </Text>
              </View>
            </View>
            
            {/* Description */}
            {reminder.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionLabel}>Mô tả:</Text>
                <Text style={[
                  styles.reminderDescription,
                  reminder.completed && styles.completedDescription
                ]}>
                  {reminder.description}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                reminder.completed ? styles.uncompleteButton : styles.completeButton
              ]}
              onPress={handleCompleteToggle}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <LoadingIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons 
                  name={reminder.completed ? "refresh" : "checkmark"} 
                  size={20} 
                  color="#FFF" 
                />
              )}
              <Text style={styles.actionButtonText}>
                {reminder.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShareReminder}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={20} color="#E91E63" />
              <Text style={[styles.actionButtonText, { color: '#E91E63' }]}>
                Chia sẻ
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEditReminder}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color="#8E24AA" />
              <Text style={[styles.actionButtonText, { color: '#8E24AA' }]}>
                Chỉnh sửa
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </LoveBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FCE4EC',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C2185B',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  completedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 12,
  },
  overdueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  overdueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5722',
    marginLeft: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reminderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  reminderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 16,
    lineHeight: 32,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  metaInfo: {
    marginBottom: 20,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    fontSize: 14,
    color: '#8E24AA',
    marginLeft: 8,
  },
  overdueMetaText: {
    color: '#FF5722',
    fontWeight: 'bold',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  descriptionSection: {
    borderTopWidth: 1,
    borderTopColor: '#FCE4EC',
    paddingTop: 20,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 8,
  },
  reminderDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  completedDescription: {
    color: '#999',
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCE4EC',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  uncompleteButton: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
});

export default ReminderDetailScreen;