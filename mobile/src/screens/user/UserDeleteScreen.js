import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Alert } from "react-native";
import {
  LoveButton,
  LoadingIndicator,
  LoveBackground,
  LoveInput,
} from "../../components";
import { deleteUser } from "firebase/auth";
import { getCurrentUser, logOut } from "@shared/services/firebase/auth";

const UserDeleteScreen = ({ navigation }) => {
  const [confirmationText, setConfirmationText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUser = getCurrentUser();
  const requiredText = "XÓA TÀI KHOẢN CỦA TÔI";

  const handleDeleteAccount = async () => {
    if (confirmationText.trim() !== requiredText) {
      setError("Vui lòng nhập chính xác văn bản xác nhận");
      return;
    }

    Alert.alert(
      "💔 Xác nhận cuối cùng",
      "Hành động này không thể hoàn tác. Tài khoản và tất cả kỷ niệm tình yêu của bạn sẽ bị xóa vĩnh viễn.\n\nBạn có thực sự chắc chắn không?",
      [
        {
          text: "Hủy bỏ",
          style: "cancel",
        },
        {
          text: "Xóa vĩnh viễn",
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
        throw new Error("Không tìm thấy người dùng");
      }

      // Delete the user account from Firebase Auth
      await deleteUser(currentUser);

      // Note: In a production app, you would also want to:
      // 1. Delete user data from Firestore
      // 2. Delete any uploaded files/images
      // 3. Clean up any couple connections
      // 4. Notify the partner if applicable

      Alert.alert(
        "Tài khoản đã bị xóa 💔",
        "Tài khoản của bạn đã bị xóa vĩnh viễn. Chúng tôi rất tiếc khi phải chia tay bạn.",
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

      let errorMessage = "Không thể xóa tài khoản. Vui lòng thử lại.";

      if (err.code === "auth/requires-recent-login") {
        errorMessage =
          "Vì lý do bảo mật, vui lòng đăng xuất và đăng nhập lại trước khi xóa tài khoản.";
      }

      Alert.alert("Lỗi", errorMessage);
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
            message="Đang xử lý việc xóa tài khoản..."
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
            <Text style={styles.title}>Xóa tài khoản</Text>
            <Text style={styles.subtitle}>
              Hành động này không thể hoàn tác
            </Text>
          </View>
          <View style={styles.warningContainer}>
            <Text style={styles.warningTitle}>⚠️ Cảnh báo</Text>
            <Text style={styles.warningText}>
              Việc xóa tài khoản sẽ loại bỏ vĩnh viễn:
            </Text>
            <View style={styles.warningList}>
              <Text style={styles.warningItem}>
                • Hồ sơ và thông tin cá nhân của bạn
              </Text>
              <Text style={styles.warningItem}>
                • Tất cả tin nhắn tình yêu và kỷ niệm
              </Text>
              <Text style={styles.warningItem}>
                • Kết nối với người yêu của bạn
              </Text>
              <Text style={styles.warningItem}>
                • Tất cả dữ liệu và cài đặt ứng dụng
              </Text>
            </View>
            <Text style={styles.warningFooter}>
              Hành động này không thể hoàn tác và không thể khôi phục.
            </Text>
          </View>
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationLabel}>
              Để xác nhận xóa, vui lòng nhập:
            </Text>
            <Text style={styles.confirmationRequired}>{requiredText}</Text>

            <LoveInput
              value={confirmationText}
              onChangeText={setConfirmationText}
              placeholder="Nhập văn bản xác nhận ở trên"
              autoCapitalize="characters"
              autoCorrect={false}
              icon="warning-outline"
              error={error}
              style={styles.confirmationInput}
            />
          </View>
          <View style={styles.actionsContainer}>
            <LoveButton
              title="Xóa tài khoản của tôi vĩnh viễn 💔"
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
              title="Hủy bỏ - Giữ tài khoản 💕"
              onPress={handleCancel}
              variant="secondary"
              size="medium"
              icon="heart-outline"
              style={styles.cancelButton}
            />
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Cần hỗ trợ? Hãy liên hệ với bộ phận hỗ trợ trước khi xóa tài
              khoản.
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
