import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../context/AuthContext";
import { LoveBackground } from "../components";
import LoveDaysCounter from "../components/ui/LoveDaysCounter";
import { getUserProfile } from "../services/firebase/firestore";

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [userProfile, setUserProfile] = useState(null);
  const [coupleData, setCoupleData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);

      // Get couple data if user is in a couple
      if (profile?.coupleId) {
        // You might want to add a getCoupleData function to your firestore service
        // For now, we'll use the coupleId directly
        setCoupleData({ id: profile.coupleId });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert(
        "Lỗi",
        "Không thể tải dữ liệu người dùng. Vui lòng thử lại.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const navigateToFeature = (feature) => {
    switch (feature) {
      case "notes":
        navigation.navigate("Notes");
        break;
      case "reminders":
        navigation.navigate("Reminders");
        break;
      case "couple":
        navigation.navigate("Couple");
        break;
      case "profile":
        navigation.navigate("Profile");
        break;
      default:
        break;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = userProfile?.displayName || "em yêu";

    if (hour < 12) {
      return `Chào buổi sáng, ${name}! ☀️`;
    } else if (hour < 18) {
      return `Chào buổi chiều, ${name}! 🌤️`;
    } else {
      return `Chào buổi tối, ${name}! 🌙`;
    }
  };

  if (loading) {
    return (
      <LoveBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải trang chủ...</Text>
        </View>
      </LoveBackground>
    );
  }

  return (
    <LoveBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#E91E63"]}
            tintColor="#E91E63"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subtitle}>
            Chào mừng đến với không gian tình yêu của chúng ta 💕
          </Text>
        </View>

        {/* Love Days Counter - Main Feature */}
        <LoveDaysCounter
          coupleId={userProfile?.coupleId}
          userId={user?.uid}
          style={styles.loveDaysCounter}
        />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Truy cập nhanh</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.notesAction]}
              onPress={() => navigateToFeature("notes")}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text" size={32} color="#8E24AA" />
              <Text style={styles.actionTitle}>Ghi chú</Text>
              <Text style={styles.actionSubtitle}>Kỷ niệm yêu thương</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, styles.remindersAction]}
              onPress={() => navigateToFeature("reminders")}
              activeOpacity={0.8}
            >
              <Ionicons name="alarm" size={32} color="#FF6F00" />
              <Text style={styles.actionTitle}>Nhắc nhở</Text>
              <Text style={styles.actionSubtitle}>Đừng quên yêu thương</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, styles.coupleAction]}
              onPress={() => navigateToFeature("couple")}
              activeOpacity={0.8}
            >
              <Ionicons name="heart" size={32} color="#E91E63" />
              <Text style={styles.actionTitle}>Kết nối</Text>
              <Text style={styles.actionSubtitle}>Liên kết với người yêu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, styles.profileAction]}
              onPress={() => navigateToFeature("profile")}
              activeOpacity={0.8}
            >
              <Ionicons name="person" size={32} color="#9C27B0" />
              <Text style={styles.actionTitle}>Cá nhân</Text>
              <Text style={styles.actionSubtitle}>Thông tin của bạn</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Love Quote */}
        <View style={styles.quoteCard}>
          <Ionicons
            name="heart"
            size={24}
            color="#E91E63"
            style={styles.quoteIcon}
          />
          <Text style={styles.quote}>
            "Tình yêu không phải là nhìn vào mắt nhau, mà là cùng nhau nhìn về
            một hướng."
          </Text>
          <Text style={styles.quoteAuthor}>- Antoine de Saint-Exupéry</Text>
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#8E24AA",
    fontSize: 16,
    fontStyle: "italic",
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#C2185B",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E24AA",
    lineHeight: 24,
  },
  peacefulDaysCounter: {
    marginVertical: 16,
  },
  noCoupleCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginVertical: 16,
    shadowColor: "#F06292",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#FCE4EC",
  },
  noCoupleTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#C2185B",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  noCoupleSubtitle: {
    fontSize: 16,
    color: "#8E24AA",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  connectButton: {
    backgroundColor: "#E91E63",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#E91E63",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  connectButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  quickActions: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#C2185B",
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#E91E63",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#FCE4EC",
  },
  notesAction: {
    borderLeftColor: "#8E24AA",
    borderLeftWidth: 4,
  },
  remindersAction: {
    borderLeftColor: "#FF6F00",
    borderLeftWidth: 4,
  },
  coupleAction: {
    borderLeftColor: "#E91E63",
    borderLeftWidth: 4,
  },
  profileAction: {
    borderLeftColor: "#9C27B0",
    borderLeftWidth: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C2185B",
    marginTop: 12,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#8E24AA",
    textAlign: "center",
  },
  quoteCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: "#E91E63",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#FCE4EC",
  },
  quoteIcon: {
    alignSelf: "center",
    marginBottom: 16,
  },
  quote: {
    fontSize: 16,
    color: "#8E24AA",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 24,
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 14,
    color: "#C2185B",
    textAlign: "center",
    fontWeight: "600",
  },
});

export default HomeScreen;
