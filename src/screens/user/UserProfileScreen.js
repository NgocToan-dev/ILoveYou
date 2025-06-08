import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  LoveButton,
  LoadingIndicator,
  LoveBackground,
  UserProfileCard,
} from "../../components";
import { getCurrentUser, logOut } from "../../services/firebase/auth";
import { getOrCreateUser } from "../../services/firebase/firestore";

const UserProfileScreen = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);
  const loadUserProfile = async () => {
    try {
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);

        // Load additional user profile data from Firestore using getOrCreateUser
        const { user: profile, error } = await getOrCreateUser(user.uid, user);
        if (profile) {
          setUserProfile(profile);
        } else if (error) {
          console.error("Error loading user profile:", error);
          // Show a more user-friendly error message
          Alert.alert(
            "Profile Load Error",
            "We had trouble loading your profile. Please try refreshing or contact support if the problem persists.",
            [{ text: "OK" }]
          );
        }
      } else {
        // User is not authenticated, redirect to login
        console.log("No authenticated user found");
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      Alert.alert(
        "Connection Error",
        "Unable to connect to our servers. Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate("UserEdit", {
      user: currentUser,
      profile: userProfile,
    });
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? We'll miss you! 💔",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logOut();
              // Navigation will be handled by auth state listener
            } catch (error) {
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <LoveBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <LoadingIndicator
            message="Loading your lovely profile..."
            size="large"
          />
        </SafeAreaView>
      </LoveBackground>
    );
  }

  const displayUser = {
    ...currentUser,
    ...userProfile,
    displayName: currentUser?.displayName || userProfile?.displayName,
    email: currentUser?.email,
    photoURL: currentUser?.photoURL || userProfile?.photoURL,
  };

  return (
    <LoveBackground variant="soft">
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>My Profile 💕</Text>
            <Text style={styles.subtitle}>
              Your beautiful details at a glance
            </Text>
          </View>
          <UserProfileCard
            user={displayUser}
            isCurrentUser={true}
            showActions={false}
            style={styles.profileCard}
          />
          {/* Account Information Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>📱 Account Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color="#E91E63" />
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>
                  {displayUser?.email || "Not provided"}
                </Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Ionicons name="calendar-outline" size={20} color="#E91E63" />
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {userProfile?.createdAt
                    ? new Date(
                        userProfile.createdAt.seconds * 1000
                      ).toLocaleDateString()
                    : "Recently"}
                </Text>
              </View>
            </View>
          </View>
          {/* Quick Stats Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>💝 Love Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={24} color="#E91E63" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Notes Created</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="notifications" size={24} color="#FF6B6B" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Reminders Set</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="calendar" size={24} color="#4CAF50" />
                <Text style={styles.statNumber}>
                  {userProfile?.createdAt
                    ? Math.floor(
                        (Date.now() - userProfile.createdAt.seconds * 1000) /
                          (1000 * 60 * 60 * 24)
                      )
                    : 0}
                </Text>
                <Text style={styles.statLabel}>Days Active</Text>
              </View>
            </View>
          </View>
          <View style={styles.actionsContainer}>
            <LoveButton
              title="Edit My Profile"
              onPress={handleEditProfile}
              variant="primary"
              size="large"
              icon="create-outline"
            />

            <LoveButton
              title="View Couple Profile 👫"
              onPress={() => navigation.navigate("UserList")}
              variant="secondary"
              size="medium"
              icon="people-outline"
              style={styles.actionButton}
            />

            <LoveButton
              title="Sign Out"
              onPress={handleLogout}
              variant="outline"
              size="medium"
              icon="log-out-outline"
              style={styles.logoutButton}
            />
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Keep spreading love and kindness! 💝
            </Text>
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
  header: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8B0000",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#5A5A5A",
    textAlign: "center",
    fontStyle: "italic",
  },
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  infoSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B0000",
    marginBottom: 12,
    paddingLeft: 4,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F8BBD9",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F8BBD9",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B0000",
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  actionButton: {
    // Custom styles for secondary buttons if needed
  },
  logoutButton: {
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default UserProfileScreen;
