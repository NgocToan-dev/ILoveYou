import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../context/AuthContext';
import { LoveBackground, LoveButton, LoadingIndicator } from '../components';
import { formatDateString } from '../utils/dateUtils';
import {
  createCoupleInvitation,
  getCoupleInvitationByCode,
  acceptCoupleInvitation,
  getUserPendingInvitations,
  cancelCoupleInvitation,
  getCoupleData,
  disconnectCouple,
  subscribeToCoupleData,
} from '../services/firebase/couples';
import { getUserProfile } from '../services/firebase/firestore';

const CoupleConnectionScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [userProfile, setUserProfile] = useState(null);
  const [coupleData, setCoupleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  useEffect(() => {
    let unsubscribe = null;
    
    if (userProfile?.coupleId) {
      // Subscribe to couple data changes
      unsubscribe = subscribeToCoupleData(userProfile.coupleId, (data) => {
        setCoupleData(data);
        setLoading(false);
      });
    } else {
      setCoupleData(null);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userProfile?.coupleId]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
      
      // Load pending invitations
      const invitations = await getUserPendingInvitations(user.uid);
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu người dùng.');
    }
  };

  const handleCreateInvitation = async () => {
    if (!userProfile?.displayName) {
      Alert.alert('Lỗi', 'Vui lòng cập nhật tên hiển thị trong hồ sơ trước.');
      return;
    }

    setIsCreating(true);
    try {
      const invitation = await createCoupleInvitation(user.uid, userProfile.displayName);
      setInvitationCode(invitation.code);
      
      // Refresh pending invitations
      const invitations = await getUserPendingInvitations(user.uid);
      setPendingInvitations(invitations);
      
      Alert.alert(
        'Thành công! 💕',
        `Mã kết nối của bạn là: ${invitation.code}\n\nHãy chia sẻ mã này với người yêu để kết nối!`,
        [
          { text: 'Chia sẻ', onPress: () => shareInvitationCode(invitation.code) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error creating invitation:', error);
      Alert.alert('Lỗi', 'Không thể tạo mã kết nối. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
      setShowCreateModal(false);
    }
  };

  const shareInvitationCode = async (code) => {
    try {
      await Share.share({
        message: `💕 Hãy kết nối với tôi trên ILoveYou!\n\nMã kết nối: ${code}\n\nTải app ILoveYou và nhập mã này để chúng ta bắt đầu hành trình tình yêu cùng nhau! 💖`,
        title: 'Kết nối với tôi trên ILoveYou 💕'
      });
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  };

  const handleJoinCouple = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã kết nối.');
      return;
    }

    if (!userProfile?.displayName) {
      Alert.alert('Lỗi', 'Vui lòng cập nhật tên hiển thị trong hồ sơ trước.');
      return;
    }

    setIsJoining(true);
    try {
      // Get invitation by code
      const invitation = await getCoupleInvitationByCode(joinCode.trim());
      
      if (!invitation) {
        Alert.alert('Lỗi', 'Mã kết nối không hợp lệ hoặc đã hết hạn.');
        return;
      }

      if (invitation.createdBy === user.uid) {
        Alert.alert('Lỗi', 'Bạn không thể kết nối với chính mình.');
        return;
      }

      // Accept the invitation
      const result = await acceptCoupleInvitation(
        invitation.id,
        user.uid,
        userProfile.displayName
      );

      Alert.alert(
        'Kết nối thành công! 💕',
        `Bạn đã kết nối với ${invitation.createdByName}. Hãy bắt đầu hành trình tình yêu cùng nhau!`,
        [{ text: 'Tuyệt vời! 💖' }]
      );

      // Reload user data to get new coupleId
      await loadUserData();
      
    } catch (error) {
      console.error('Error joining couple:', error);
      Alert.alert('Lỗi', 'Không thể kết nối. Vui lòng thử lại.');
    } finally {
      setIsJoining(false);
      setShowJoinModal(false);
      setJoinCode('');
    }
  };

  const handleDisconnectCouple = () => {
    if (!coupleData) return;

    const partnerName = coupleData.user1.id === user.uid 
      ? coupleData.user2.name 
      : coupleData.user1.name;

    Alert.alert(
      'Ngắt kết nối',
      `Bạn có chắc chắn muốn ngắt kết nối với ${partnerName}?\n\nHành động này sẽ xóa tất cả dữ liệu chung của cặp đôi.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Ngắt kết nối',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectCouple(coupleData.id, user.uid);
              Alert.alert('Thành công', 'Đã ngắt kết nối thành công.');
              await loadUserData();
            } catch (error) {
              console.error('Error disconnecting couple:', error);
              Alert.alert('Lỗi', 'Không thể ngắt kết nối. Vui lòng thử lại.');
            }
          }
        }
      ]
    );
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      await cancelCoupleInvitation(invitationId);
      Alert.alert('Thành công', 'Đã hủy lời mời.');
      
      // Refresh pending invitations
      const invitations = await getUserPendingInvitations(user.uid);
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      Alert.alert('Lỗi', 'Không thể hủy lời mời.');
    }
  };

  if (loading) {
    return (
      <LoveBackground>
        <View style={styles.loadingContainer}>
          <LoadingIndicator message="Đang tải thông tin kết nối..." />
        </View>
      </LoveBackground>
    );
  }

  return (
    <LoveBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Kết nối cặp đôi 💕</Text>
          <Text style={styles.subtitle}>
            Kết nối với người yêu để chia sẻ những khoảnh khắc tuyệt vời
          </Text>
        </View>

        {coupleData ? (
          /* Connected State */
          <View style={styles.connectedSection}>
            <View style={styles.connectedCard}>
              <Ionicons name="heart" size={48} color="#E91E63" />
              <Text style={styles.connectedTitle}>Đã kết nối! 💕</Text>
              
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerLabel}>Bạn đã kết nối với:</Text>
                <Text style={styles.partnerName}>
                  {coupleData.user1.id === user.uid ? coupleData.user2.name : coupleData.user1.name}
                </Text>
                  <Text style={styles.connectionDate}>
                  Kết nối từ: {formatDateString(coupleData.createdAt, 'default', 'vi-VN')}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={handleDisconnectCouple}
                activeOpacity={0.8}
              >
                <Ionicons name="unlink" size={20} color="#FF5722" />
                <Text style={styles.disconnectButtonText}>Ngắt kết nối</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Not Connected State */
          <View style={styles.notConnectedSection}>
            <View style={styles.actionCard}>
              <Ionicons name="add-circle" size={48} color="#E91E63" />
              <Text style={styles.actionTitle}>Tạo kết nối mới</Text>
              <Text style={styles.actionDescription}>
                Tạo mã kết nối để mời người yêu tham gia
              </Text>
              
              <LoveButton
                title="Tạo mã kết nối"
                onPress={() => setShowCreateModal(true)}
                style={styles.actionButton}
              />
            </View>

            <View style={styles.actionCard}>
              <Ionicons name="link" size={48} color="#8E24AA" />
              <Text style={styles.actionTitle}>Tham gia kết nối</Text>
              <Text style={styles.actionDescription}>
                Nhập mã kết nối từ người yêu của bạn
              </Text>
              
              <LoveButton
                title="Nhập mã kết nối"
                onPress={() => setShowJoinModal(true)}
                style={styles.actionButton}
                variant="secondary"
              />
            </View>
          </View>
        )}

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <View style={styles.pendingSection}>
            <Text style={styles.sectionTitle}>Lời mời đang chờ</Text>
            
            {pendingInvitations.map((invitation) => (
              <View key={invitation.id} style={styles.invitationCard}>
                <View style={styles.invitationInfo}>
                  <Text style={styles.invitationCode}>Mã: {invitation.code}</Text>                  <Text style={styles.invitationDate}>
                    Tạo: {formatDateString(invitation.createdAt, 'default', 'vi-VN')}
                  </Text>
                  <Text style={styles.invitationExpiry}>
                    Hết hạn: {formatDateString(invitation.expiresAt, 'default', 'vi-VN')}
                  </Text>
                </View>
                
                <View style={styles.invitationActions}>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => shareInvitationCode(invitation.code)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share" size={20} color="#E91E63" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelInvitation(invitation.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={20} color="#FF5722" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Invitation Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tạo mã kết nối 💕</Text>
            <Text style={styles.modalDescription}>
              Mã kết nối sẽ có hiệu lực trong 7 ngày. Chia sẻ mã này với người yêu để kết nối!
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCreateModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleCreateInvitation}
                disabled={isCreating}
                activeOpacity={0.8}
              >
                {isCreating ? (
                  <LoadingIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Tạo mã</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Couple Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập mã kết nối 💖</Text>
            <Text style={styles.modalDescription}>
              Nhập mã kết nối mà người yêu đã chia sẻ với bạn
            </Text>
            
            <TextInput
              style={styles.codeInput}
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="Nhập mã 6 ký tự"
              placeholderTextColor="#C2185B"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowJoinModal(false);
                  setJoinCode('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleJoinCouple}
                disabled={isJoining || !joinCode.trim()}
                activeOpacity={0.8}
              >
                {isJoining ? (
                  <LoadingIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Kết nối</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 32,
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
  connectedSection: {
    marginBottom: 32,
  },
  connectedCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  connectedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C2185B',
    marginTop: 16,
    marginBottom: 24,
  },
  partnerInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  partnerLabel: {
    fontSize: 16,
    color: '#8E24AA',
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 8,
  },
  connectionDate: {
    fontSize: 14,
    color: '#8E24AA',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF5722',
    backgroundColor: '#FFF',
  },
  disconnectButtonText: {
    color: '#FF5722',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  notConnectedSection: {
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C2185B',
    marginTop: 16,
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    color: '#8E24AA',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 8,
  },
  pendingSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 16,
  },
  invitationCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  invitationInfo: {
    flex: 1,
  },
  invitationCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 4,
  },
  invitationDate: {
    fontSize: 12,
    color: '#8E24AA',
    marginBottom: 2,
  },
  invitationExpiry: {
    fontSize: 12,
    color: '#FF6F00',
  },
  invitationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    padding: 8,
    marginRight: 8,
  },
  cancelButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C2185B',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#8E24AA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#F8BBD9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#C2185B',
    backgroundColor: '#FCE4EC',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#E91E63',
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  modalConfirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CoupleConnectionScreen;