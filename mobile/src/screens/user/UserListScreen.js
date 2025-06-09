import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  LoveButton,
  LoadingIndicator,
  LoveBackground,
  UserProfileCard,
} from "../../components";
import { getCurrentUser } from "@shared/services/firebase/auth";
import { getUserProfile } from "@shared/services/firebase/firestore";
import { getCoupleData } from "@shared/services/firebase/couples";
import { formatDate, formatDateString } from "@shared/utils";

const UserListScreen = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [coupleData, setCoupleData] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserAndCoupleData();
  }, []);

  const loadUserAndCoupleData = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUser(user);

      // Load user profile with couple information
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);

      // Load couple data if user has coupleId
      if (profile?.coupleId) {
        const couple = await getCoupleData(profile.coupleId);
        if (couple) {
          setCoupleData(couple);

          // Get partner information from couple data structure
          const partnerId =
            couple.user1?.id === user.uid ? couple.user2?.id : couple.user1?.id;

          const partnerInfo =
            couple.user1?.id === user.uid ? couple.user2 : couple.user1;

          if (partnerInfo) {
            setPartnerProfile({
              id: partnerId,
              displayName: partnerInfo.name,
              email: `${partnerInfo.name}@partner.love`,
              bio: `Joined our love story ${formatDate(partnerInfo.joinedAt)}`,
              joinedAt: partnerInfo.joinedAt,
              isPartner: true,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error loading user and couple data:", error);
      Alert.alert(
        "Lỗi kết nối",
        "Không thể tải thông tin kết nối. Vui lòng kiểm tra mạng và thử lại.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const handleRefresh = () => {
    setRefreshing(true);
    loadUserAndCoupleData();
  };
  const handleUserPress = (user, isCurrentUser) => {
    if (isCurrentUser) {
      navigation.navigate("UserProfile");
    } else {
      // Show partner profile details
      Alert.alert(
        `Hồ sơ của ${user.displayName || "Người yêu"} 💕`,
        user.bio || "Chưa có giới thiệu.",
        [{ text: "OK", style: "default" }]
      );
    }
  };

  const handleEditCurrentUser = () => {
    navigation.navigate("UserEdit", {
      user: currentUser,
      profile: null, // Will be loaded in UserEdit screen
    });
  };
  const handleConnectPartner = () => {
    Alert.alert(
      "Kết nối với người yêu 💕",
      "Tính năng sắp ra mắt! Bạn sẽ có thể gửi lời mời cho người yêu.",
      [{ text: "OK", style: "default" }]
    );
  };
  if (loading) {
    return (
      <LoveBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <LoadingIndicator
              message="Đang tải thông tin kết nối..."
              size="large"
            />
            <Text style={styles.loadingSubtext}>
              Vui lòng chờ trong giây lát 💕
            </Text>
          </View>
        </SafeAreaView>
      </LoveBackground>
    );
  }

  return (
    <LoveBackground variant="soft">
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF69B4"
              colors={["#FF69B4"]}
            />
          }
        >
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleEmoji}>💕</Text>
            </View>
            {coupleData && (
              <View style={styles.connectionStatus}>
                <View style={styles.statusIndicator} />
                <Text style={styles.statusText}>Đã kết nối</Text>
              </View>
            )}
          </View>
          {coupleData && (
            <View style={styles.coupleInfoCard}>
              <View style={styles.coupleInfoHeader}>
                <Ionicons name="heart" size={24} color="#E91E63" />
                <Text style={styles.coupleTitle}>Bên nhau từ</Text>
              </View>
              <Text style={styles.coupleDate}>
                {formatDateString(coupleData.createdAt, "DD/MM/YYYY")}
              </Text>
              <View style={styles.loveMeter}>
                <View style={styles.loveMeterFill} />
                <Text style={styles.loveMeterText}>
                  Mức độ yêu thương: 100%
                </Text>
              </View>
            </View>
          )}
          <View style={styles.usersContainer}>
            <Text style={styles.sectionTitle}>
              {coupleData ? "Hồ sơ của chúng ta" : "Hồ sơ của tôi"}
            </Text>
            {/* Current User Card */}
            <UserProfileCard
              user={currentUser}
              isCurrentUser={true}
              onPress={() => handleUserPress(currentUser, true)}
              onEdit={handleEditCurrentUser}
              style={styles.userCard}
            />
            {/* Partner Card */}
            {partnerProfile ? (
              <UserProfileCard
                user={partnerProfile}
                isCurrentUser={false}
                onPress={() => handleUserPress(partnerProfile, false)}
                showActions={false}
                style={styles.userCard}
              />
            ) : coupleData ? (
              <View style={styles.partnerPlaceholder}>
                <View style={styles.placeholderIcon}>
                  <Ionicons name="person-add" size={32} color="#E91E63" />
                </View>
                <Text style={styles.partnerPlaceholderText}>
                  Chờ người yêu tạo hồ sơ
                </Text>
                <Text style={styles.partnerPlaceholderSubtext}>
                  Nhắc nhở người yêu tạo hồ sơ để cùng chia sẻ những khoảnh khắc
                  ngọt ngào nhé! 💌
                </Text>
                <LoveButton
                  title="Nhắc nhở người yêu"
                  onPress={() =>
                    Alert.alert(
                      "Thông báo 💕",
                      "Tính năng nhắc nhở sẽ sớm được cập nhật. Hãy nhắn tin trực tiếp cho người yêu nhé! 💌",
                      [{ text: "OK", style: "default" }]
                    )
                  }
                  variant="secondary"
                  size="small"
                  icon="heart-outline"
                  style={styles.reminderButton}
                />
              </View>
            ) : (
              <View style={styles.partnerPlaceholder}>
                <View style={styles.placeholderIcon}>
                  <Ionicons name="heart-outline" size={32} color="#E91E63" />
                </View>
                <Text style={styles.partnerPlaceholderText}>
                  Chưa kết nối với người yêu
                </Text>
                <Text style={styles.partnerPlaceholderSubtext}>
                  Hãy mời người yêu tham gia để cùng viết nên câu chuyện tình
                  yêu của riêng mình! 💕
                </Text>
                <LoveButton
                  title="Kết nối ngay"
                  onPress={handleConnectPartner}
                  variant="primary"
                  size="medium"
                  icon="heart"
                  style={styles.connectButton}
                />
              </View>
            )}
          </View>
          <View style={styles.actionsContainer}>
            <LoveButton
              title="Làm mới kết nối"
              onPress={handleRefresh}
              variant="secondary"
              size="medium"
              icon="refresh-outline"
              style={styles.actionButton}
            />

            {coupleData && (
              <LoveButton
                title="Xem kỷ niệm"
                onPress={() =>
                  Alert.alert(
                    "Kỷ niệm của chúng mình 💕",
                    "Tính năng xem kỷ niệm sẽ sớm được cập nhật!",
                    [{ text: "OK", style: "default" }]
                  )
                }
                variant="primary"
                size="medium"
                icon="calendar-outline"
                style={styles.actionButton}
              />
            )}
          </View>
          <View style={styles.footer}>
            <View style={styles.footerContent}>
              <Ionicons name="heart" size={16} color="#E91E63" />
              <Text style={styles.footerText}>
                {coupleData
                  ? "Tình yêu ngày càng mạnh mẽ khi ở bên nhau! 💝"
                  : "Mỗi câu chuyện tình yêu đều bắt đầu từ một bước đi! 💕"}
              </Text>
              <Ionicons name="heart" size={16} color="#E91E63" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LoveBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingSubtext: {
    fontSize: 16,
    color: "#6D4C41",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#C2185B",
    textAlign: "center",
    marginRight: 8,
  },
  titleEmoji: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 16,
    color: "#6D4C41",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 12,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },
  coupleInfoCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#E91E63",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F8BBD9",
  },
  coupleInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  coupleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E91E63",
    marginLeft: 8,
  },
  coupleDate: {
    fontSize: 16,
    color: "#C2185B",
    fontWeight: "600",
    marginBottom: 16,
  },
  loveMeter: {
    width: "100%",
    height: 24,
    backgroundColor: "#F8BBD9",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  loveMeterFill: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#E91E63",
    borderRadius: 12,
  },
  loveMeterText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "bold",
    zIndex: 1,
  },
  usersContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#A01050",
    textAlign: "center",
    marginBottom: 20,
  },
  userCard: {
    marginBottom: 16,
  },
  partnerPlaceholder: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 32,
    marginHorizontal: 16,
    alignItems: "center",
    shadowColor: "#E91E63",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#F8BBD9",
    borderStyle: "dashed",
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FCE4EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#F8BBD9",
  },
  partnerPlaceholderEmoji: {
    fontSize: 48,
    marginBottom: 16,
    textAlign: "center",
  },
  partnerPlaceholderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#A01050",
    textAlign: "center",
    marginBottom: 12,
  },
  partnerPlaceholderSubtext: {
    fontSize: 14,
    color: "#4F2E24",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  reminderButton: {
    marginTop: 8,
    minWidth: 160,
  },
  connectButton: {
    marginTop: 8,
    minWidth: 140,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionButton: {
    marginBottom: 16,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 16,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCE4EC",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#F8BBD9",
  },
  footerText: {
    fontSize: 14,
    color: "#5D4037",
    textAlign: "center",
    fontStyle: "italic",
    marginHorizontal: 8,
    flex: 1,
  },
});

export default UserListScreen;
