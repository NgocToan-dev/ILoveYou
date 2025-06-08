import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  LoveButton,
  LoadingIndicator,
  LoveBackground,
  LanguageSwitcher,
} from "../components";
import { logOut } from "../services/firebase/auth";

const SettingsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out 💔",
      "Are you sure you want to sign out? We'll miss you!",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await logOut();
              if (error) {
                Alert.alert("Error", error);
              }
              // Navigation will be handled by auth state listener
            } catch (err) {
              Alert.alert("Error", "Failed to sign out. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "About ILoveYou 💕",
      "ILoveYou v1.0.0\n\nA beautiful app designed to celebrate love and connection between couples.\n\nMade with 💖 for love.",
      [{ text: "OK" }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      "Help & Support 🆘",
      "Need help? Here are some quick tips:\n\n• Update your profile to personalize your experience\n• Use the couple section to connect with your partner\n• Messages feature coming soon!\n\nFor more support, contact us at support@iloveyou.app",
      [{ text: "Got it!" }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Privacy Policy 🔒",
      "Your privacy is important to us. We collect minimal data necessary for the app to function and never share your personal information with third parties.\n\nAll your love data stays secure! 💝",
      [{ text: "Understood" }]
    );
  };

  if (loading) {
    return (
      <LoveBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <LoadingIndicator message="Signing you out..." size="large" />
        </SafeAreaView>
      </LoveBackground>
    );
  }

  return (
    <LoveBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Settings ⚙️</Text>
            <Text style={styles.subtitle}>Customize your love experience</Text>
          </View>

          <LanguageSwitcher />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences 💕</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Love Notifications</Text>
                <Text style={styles.settingDescription}>
                  Get notified about love updates
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "#F8BBD9", true: "#E91E63" }}
                thumbColor={notifications ? "#C2185B" : "#f4f3f4"}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Coming soon! 🌙</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                disabled={true}
                trackColor={{ false: "#F8BBD9", true: "#E91E63" }}
                thumbColor={darkMode ? "#C2185B" : "#f4f3f4"}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Private Profile</Text>
                <Text style={styles.settingDescription}>
                  Hide your profile from other users
                </Text>
              </View>
              <Switch
                value={privateProfile}
                onValueChange={setPrivateProfile}
                trackColor={{ false: "#F8BBD9", true: "#E91E63" }}
                thumbColor={privateProfile ? "#C2185B" : "#f4f3f4"}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information 📖</Text>

            <LoveButton
              title="Help & Support"
              onPress={handleHelp}
              variant="secondary"
              size="medium"
              icon="help-circle-outline"
              style={styles.actionButton}
            />

            <LoveButton
              title="About ILoveYou"
              onPress={handleAbout}
              variant="secondary"
              size="medium"
              icon="information-circle-outline"
              style={styles.actionButton}
            />

            <LoveButton
              title="Privacy Policy"
              onPress={handlePrivacy}
              variant="secondary"
              size="medium"
              icon="shield-checkmark-outline"
              style={styles.actionButton}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account 👤</Text>

            <LoveButton
              title="Sign Out"
              onPress={handleLogout}
              variant="danger"
              size="medium"
              icon="log-out-outline"
              style={styles.logoutButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Made with 💝 for couples in love
            </Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#C2185B",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6D4C41",
    textAlign: "center",
    fontStyle: "italic",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#C2185B",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A01050",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#4F2E24",
  },
  actionButton: {
    marginBottom: 12,
  },
  logoutButton: {
    marginBottom: 12,
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#FFE4E6",
  },
  footerText: {
    fontSize: 14,
    color: "#5D4037",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: "#7D6E63",
    textAlign: "center",
  },
});

export default SettingsScreen;
