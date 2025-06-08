import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Alert } from "react-native";
import {
  LoveButton,
  LoadingIndicator,
  LoveBackground,
  LoveInput,
} from "../../components";
import { deleteUser } from "firebase/auth";
import { getCurrentUser, logOut } from "../../services/firebase/auth";

const UserDeleteScreen = ({ navigation }) => {
  const [confirmationText, setConfirmationText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUser = getCurrentUser();
  const requiredText = "DELETE MY ACCOUNT";

  const handleDeleteAccount = async () => {
    if (confirmationText.trim() !== requiredText) {
      setError("Please type the exact confirmation text");
      return;
    }

    Alert.alert(
      "💔 Final Confirmation",
      "This action cannot be undone. Your account and all your love memories will be permanently deleted.\n\nAre you absolutely sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: performAccountDeletion,
        },
      ]
    );
  };

  const performAccountDeletion = async () => {
    setLoading(true);
    setError("");

    try {
      if (!currentUser) {
        throw new Error("No user found");
      }

      // Delete the user account from Firebase Auth
      await deleteUser(currentUser);

      // Note: In a production app, you would also want to:
      // 1. Delete user data from Firestore
      // 2. Delete any uploaded files/images
      // 3. Clean up any couple connections
      // 4. Notify the partner if applicable

      Alert.alert(
        "Account Deleted 💔",
        "Your account has been permanently deleted. We're sorry to see you go.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigation will be handled by auth state listener
              // But we can also manually navigate to ensure it works
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            },
          },
        ]
      );
    } catch (err) {
      console.error("Error deleting account:", err);

      let errorMessage = "Failed to delete account. Please try again.";

      if (err.code === "auth/requires-recent-login") {
        errorMessage =
          "For security reasons, please sign out and sign back in before deleting your account.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <LoveBackground variant="secondary">
        <SafeAreaView style={styles.loadingContainer}>
          <LoadingIndicator
            message="Processing account deletion..."
            size="large"
          />
        </SafeAreaView>
      </LoveBackground>
    );
  }

  return (
    <LoveBackground variant="secondary">
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.warningEmoji}>⚠️💔⚠️</Text>
            <Text style={styles.title}>Delete Account</Text>
            <Text style={styles.subtitle}>This action cannot be undone</Text>
          </View>

          <View style={styles.warningContainer}>
            <Text style={styles.warningTitle}>⚠️ Warning</Text>
            <Text style={styles.warningText}>
              Deleting your account will permanently remove:
            </Text>
            <View style={styles.warningList}>
              <Text style={styles.warningItem}>
                • Your profile and personal information
              </Text>
              <Text style={styles.warningItem}>
                • All your love messages and memories
              </Text>
              <Text style={styles.warningItem}>
                • Your connection with your partner
              </Text>
              <Text style={styles.warningItem}>
                • All app data and preferences
              </Text>
            </View>
            <Text style={styles.warningFooter}>
              This action is irreversible and cannot be undone.
            </Text>
          </View>

          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationLabel}>
              To confirm deletion, please type:
            </Text>
            <Text style={styles.confirmationRequired}>{requiredText}</Text>

            <LoveInput
              value={confirmationText}
              onChangeText={setConfirmationText}
              placeholder="Type the confirmation text above"
              autoCapitalize="characters"
              autoCorrect={false}
              icon="warning-outline"
              error={error}
              style={styles.confirmationInput}
            />
          </View>

          <View style={styles.actionsContainer}>
            <LoveButton
              title="Delete My Account Forever 💔"
              onPress={handleDeleteAccount}
              variant="primary"
              size="large"
              icon="trash-outline"
              disabled={confirmationText.trim() !== requiredText}
              style={[
                styles.deleteButton,
                confirmationText.trim() !== requiredText &&
                  styles.disabledButton,
              ]}
            />

            <LoveButton
              title="Cancel - Keep My Account 💕"
              onPress={handleCancel}
              variant="secondary"
              size="medium"
              icon="heart-outline"
              style={styles.cancelButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Need help? Consider reaching out to support before deleting your
              account.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LoveBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
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
  warningEmoji: {
    fontSize: 48,
    marginBottom: 16,
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
  warningContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: "#FF6B6B",
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 12,
  },
  warningText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
    fontWeight: "500",
  },
  warningList: {
    marginBottom: 16,
  },
  warningItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    lineHeight: 20,
  },
  warningFooter: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "bold",
    fontStyle: "italic",
  },
  confirmationContainer: {
    marginBottom: 32,
  },
  confirmationLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  confirmationRequired: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B6B",
    textAlign: "center",
    backgroundColor: "#FFF0F0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFB6B6",
  },
  confirmationInput: {
    marginBottom: 0,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  deleteButton: {
    backgroundColor: "#FF6B6B",
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButton: {
    borderColor: "#E91E63",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#8D6E63",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 20,
  },
});

export default UserDeleteScreen;
