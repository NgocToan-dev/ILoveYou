import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  subscribeToLoveDays,
  initializeLoveDays,
  updateLoveDaysStartDate,
  getLoveMilestones,
  getNextMilestone,
  formatLoveDuration
} from '@shared/services/firebase/loveDays';
import { formatDateString, toDate } from '@shared/utils/dateUtils';

const LoveDaysCounter = ({ coupleId, userId, style }) => {
  const [loveDaysData, setLoveDaysData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [startDay, setStartDay] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  
  // Animation values
  const scaleValue = new Animated.Value(1);
  const pulseValue = new Animated.Value(1);
  const heartValue = new Animated.Value(1);

  useEffect(() => {
    // Set default date to today
    const today = new Date();
    setStartDay(today.getDate().toString());
    setStartMonth((today.getMonth() + 1).toString());
    setStartYear(today.getFullYear().toString());
  }, []);

  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToLoveDays(coupleId, (data) => {
      setLoveDaysData(data);
      setLoading(false);
      
      // If no data exists, show setup modal
      if (!data) {
        setShowSetupModal(true);
      }
    });

    return unsubscribe;
  }, [coupleId]);

  useEffect(() => {
    // Continuous pulse animation for the heart
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseAnimation.start();

    // Heart beat animation
    const heartAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(heartValue, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(heartValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    heartAnimation.start();

    return () => {
      pulseAnimation.stop();
      heartAnimation.stop();
    };
  }, []);

  const validateDate = (day, month, year) => {
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
      return false;
    }
    
    if (dayNum < 1 || dayNum > 31) return false;
    if (monthNum < 1 || monthNum > 12) return false;
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) return false;
    
    // Create date and check if it's valid
    const date = new Date(yearNum, monthNum - 1, dayNum);
    return date.getDate() === dayNum && 
           date.getMonth() === monthNum - 1 && 
           date.getFullYear() === yearNum &&
           date <= new Date();
  };

  const handleSetupLoveDays = async () => {
    if (!coupleId) return;

    if (!validateDate(startDay, startMonth, startYear)) {
      Alert.alert('Ngày không hợp lệ', 'Vui lòng nhập ngày hợp lệ (DD/MM/YYYY)');
      return;
    }

    try {
      const selectedDate = new Date(
        parseInt(startYear),
        parseInt(startMonth) - 1,
        parseInt(startDay)
      );

      const result = await initializeLoveDays(coupleId, selectedDate);
      if (result.success) {
        setShowSetupModal(false);        Alert.alert(
          'Thiết lập thành công! 💕',
          `Đã thiết lập ngày bắt đầu yêu là ${formatDateString(selectedDate, 'short', 'vi-VN')}`
        );
      } else {
        Alert.alert('Lỗi', 'Không thể thiết lập ngày yêu. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error setting up love days:', error);
      Alert.alert('Lỗi', 'Không thể thiết lập ngày yêu. Vui lòng thử lại.');
    }
  };

  const handleUpdateStartDate = async () => {
    if (!coupleId) return;

    if (!validateDate(startDay, startMonth, startYear)) {
      Alert.alert('Ngày không hợp lệ', 'Vui lòng nhập ngày hợp lệ (DD/MM/YYYY)');
      return;
    }

    try {
      const newDate = new Date(
        parseInt(startYear),
        parseInt(startMonth) - 1,
        parseInt(startDay)
      );

      const result = await updateLoveDaysStartDate(coupleId, newDate);
      if (result.success) {        Alert.alert(
          'Cập nhật thành công! 💕',
          `Đã cập nhật ngày bắt đầu yêu thành ${formatDateString(newDate, 'short', 'vi-VN')}`
        );
      } else {
        Alert.alert('Lỗi', 'Không thể cập nhật ngày yêu. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error updating start date:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật ngày yêu. Vui lòng thử lại.');
    }
  };
  const showDateUpdateDialog = () => {
    if (loveDaysData) {
      const currentDate = toDate(loveDaysData.startDate);
      if (currentDate) {
        setStartDay(currentDate.getDate().toString());
        setStartMonth((currentDate.getMonth() + 1).toString());
        setStartYear(currentDate.getFullYear().toString());
      }
    }
    
    Alert.alert(
      'Cập nhật ngày yêu',
      'Bạn có muốn thay đổi ngày bắt đầu yêu không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Thay đổi', 
          onPress: () => {
            setShowSetupModal(true);
          }
        }
      ]
    );
  };

  const handleCounterPress = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Show options
    if (loveDaysData) {
      const milestones = getLoveMilestones(loveDaysData.daysTogether);
      const nextMilestone = getNextMilestone(loveDaysData.daysTogether);
      
      let message = `Chúng ta đã yêu nhau được ${formatLoveDuration(loveDaysData.daysTogether)}!\n\n`;
      
      if (milestones.length > 0) {
        message += `🏆 Các mốc đã đạt được:\n`;
        milestones.slice(-3).forEach(milestone => {
          message += `• ${milestone.title}\n`;
        });
        message += '\n';
      }
      
      if (nextMilestone) {
        message += `🎯 Mốc tiếp theo: ${nextMilestone.title}\n`;
        message += `Còn ${nextMilestone.daysLeft} ngày nữa!`;
      }

      Alert.alert('Hành trình tình yêu 💕', message, [
        { text: 'Đóng' },
        { text: 'Đổi ngày bắt đầu', onPress: showDateUpdateDialog }
      ]);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!coupleId) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.noDataContainer}>
          <Ionicons name="heart-outline" size={48} color="#F8BBD9" />
          <Text style={styles.noDataTitle}>Chưa kết nối với người yêu</Text>
          <Text style={styles.noDataSubtitle}>
            Hãy kết nối với người yêu để bắt đầu đếm ngày yêu nhau!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Animated.View 
        style={[
          styles.container, 
          style,
          { 
            transform: [{ scale: pulseValue }]
          }
        ]}
      >
        {/* Main Counter Display */}
        <TouchableOpacity 
          style={styles.counterSection}
          onPress={handleCounterPress}
          activeOpacity={0.8}
        >
          <Animated.View 
            style={[
              styles.iconContainer,
              { transform: [{ scale: heartValue }] }
            ]}
          >
            <Ionicons name="heart" size={40} color="#E91E63" />
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <Text style={styles.counterNumber}>
              {loveDaysData?.daysTogether || 0}
            </Text>
          </Animated.View>
          
          <Text style={styles.counterLabel}>
            {loveDaysData?.daysTogether === 1 ? 'ngày yêu' : 'ngày yêu nhau'}
          </Text>
            {loveDaysData?.startDate && (
            <Text style={styles.startDateText}>
              Từ {formatDateString(loveDaysData.startDate, 'short', 'vi-VN')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {loveDaysData?.monthsTogether || 0}
            </Text>
            <Text style={styles.statLabel}>
              Tháng
            </Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {loveDaysData?.yearsTogether || 0}
            </Text>
            <Text style={styles.statLabel}>
              Năm
            </Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {loveDaysData ? getLoveMilestones(loveDaysData.daysTogether).length : 0}
            </Text>
            <Text style={styles.statLabel}>
              Cột mốc
            </Text>
          </View>
        </View>

        {/* Next Milestone */}
        {loveDaysData && (() => {
          const nextMilestone = getNextMilestone(loveDaysData.daysTogether);
          return nextMilestone ? (
            <View style={styles.milestoneContainer}>
              <Text style={styles.milestoneTitle}>🎯 Mốc tiếp theo</Text>
              <Text style={styles.milestoneText}>{nextMilestone.title}</Text>
              <Text style={styles.milestoneCountdown}>
                Còn {nextMilestone.daysLeft} ngày
              </Text>
            </View>
          ) : null;
        })()}
      </Animated.View>

      {/* Setup Modal */}
      <Modal
        visible={showSetupModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !loveDaysData && setShowSetupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {loveDaysData ? 'Cập nhật ngày yêu 💕' : 'Thiết lập ngày yêu 💕'}
            </Text>
            <Text style={styles.modalText}>
              {loveDaysData ? 
                'Chọn ngày bắt đầu yêu mới:' : 
                'Chọn ngày bắt đầu yêu nhau để đếm ngày yêu!'
              }
            </Text>
            
            {/* Date Input */}
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>Ngày bắt đầu yêu:</Text>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={styles.dateInput}
                  value={startDay}
                  onChangeText={setStartDay}
                  placeholder="DD"
                  maxLength={2}
                  keyboardType="numeric"
                />
                <Text style={styles.dateSeparator}>/</Text>
                <TextInput
                  style={styles.dateInput}
                  value={startMonth}
                  onChangeText={setStartMonth}
                  placeholder="MM"
                  maxLength={2}
                  keyboardType="numeric"
                />
                <Text style={styles.dateSeparator}>/</Text>
                <TextInput
                  style={[styles.dateInput, styles.yearInput]}
                  value={startYear}
                  onChangeText={setStartYear}
                  placeholder="YYYY"
                  maxLength={4}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowSetupModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>
                  {loveDaysData ? 'Hủy' : 'Bỏ qua'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalButtonSave}
                onPress={loveDaysData ? handleUpdateStartDate : handleSetupLoveDays}
              >
                <Text style={styles.modalButtonSaveText}>
                  {loveDaysData ? 'Cập nhật' : 'Lưu'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginVertical: 16,
    shadowColor: '#E91E63',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  counterSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 8,
  },
  counterNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#E91E63',
    textAlign: 'center',
    fontFamily: 'System',
  },
  counterLabel: {
    fontSize: 18,
    color: '#8E24AA',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  startDateText: {
    fontSize: 14,
    color: '#C2185B',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C2185B',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E24AA',
    marginTop: 4,
    fontWeight: '500',
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: '#F8BBD9',
    marginHorizontal: 16,
  },
  milestoneContainer: {
    backgroundColor: '#FCE4EC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 4,
  },
  milestoneText: {
    fontSize: 14,
    color: '#8E24AA',
    marginBottom: 4,
  },
  milestoneCountdown: {
    fontSize: 12,
    color: '#E91E63',
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#8E24AA',
    fontSize: 16,
    fontStyle: 'italic',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C2185B',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtitle: {
    fontSize: 14,
    color: '#8E24AA',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#8E24AA',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  dateInputContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 16,
    color: '#C2185B',
    fontWeight: '600',
    marginBottom: 12,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#F8BBD9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#FAFAFA',
    width: 50,
  },
  yearInput: {
    width: 70,
  },
  dateSeparator: {
    fontSize: 18,
    color: '#C2185B',
    marginHorizontal: 8,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalButtonSave: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#E91E63',
  },
  modalButtonSaveText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default LoveDaysCounter;