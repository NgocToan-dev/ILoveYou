import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import {
  LoveInput,
  LoveButton,
  LoadingIndicator,
  LoveBackground,
} from "../../components";
import { updateProfile } from "firebase/auth";
import { getCurrentUser } from "../../services/firebase/auth";
import {
  updateUserWithSync,
  getOrCreateUser,
} from "../../services/firebase/firestore";
import { Timestamp } from "firebase/firestore";

const UserEditScreen = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const user = route.params?.user;

  useEffect(() => {
    loadUserData();
  }, []);
  const loadUserData = async () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        // Load user profile from Firestore using getOrCreateUser
        const { user: profile, error } = await getOrCreateUser(
          currentUser.uid,
          currentUser
        );

        setFormData({
          displayName: currentUser.displayName || profile?.displayName || "",
          bio: profile?.bio || "",
          phoneNumber: profile?.phoneNumber || "",
        });

        if (error) {
          console.warn("Warning loading user data:", error);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert(
        "Lỗi tải thông tin",
        "Không thể tải dữ liệu hồ sơ của bạn. Sử dụng giá trị mặc định.",
        [{ text: "OK" }]
      );
    } finally {
      setInitialLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };
  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Tên là bắt buộc";
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = "Tên phải có ít nhất 2 ký tự";
    }

    if (formData.bio.length > 200) {
      newErrors.bio = "Giới thiệu phải ít hơn 200 ký tự";
    }

    if (
      formData.phoneNumber &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phoneNumber.replace(/\s/g, ""))
    ) {
      newErrors.phoneNumber = "Vui lòng nhập số điện thoại hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        Alert.alert(
          "Lỗi xác thực",
          "Bạn cần đăng nhập để cập nhật hồ sơ. Vui lòng đăng nhập lại.",
          [
            {
              text: "OK",
              onPress: () =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                }),
            },
          ]
        );
        return;
      } // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: formData.displayName.trim(),
      });

      // Update Firestore user document with sync to related collections
      const userData = {
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        updatedAt: Timestamp.now(),
      };
      const { error } = await updateUserWithSync(currentUser.uid, userData);

      if (error) {
        Alert.alert("Lỗi", error);
      } else {
        Alert.alert(
          "Cập nhật hồ sơ thành công! 💕",
          "Hồ sơ xinh đẹp của bạn đã được cập nhật thành công và đồng bộ trên tất cả dữ liệu.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      Alert.alert("Lỗi", "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };
  if (initialLoading) {
    return (
      <LoveBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <LoadingIndicator message="Đang tải hồ sơ của bạn..." size="large" />
        </SafeAreaView>
      </LoveBackground>
    );
  }

  if (loading) {
    return (
      <LoveBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <LoadingIndicator
            message="Đang lưu những thay đổi đáng yêu..."
            size="large"
          />
        </SafeAreaView>
      </LoveBackground>
    );
  }

  return (
    <LoveBackground variant="soft">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Chỉnh sửa hồ sơ 💕</Text>
              <Text style={styles.subtitle}>
                Cập nhật thông tin đáng yêu của bạn
              </Text>
            </View>
            <View style={styles.form}>
              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>📝 Thông tin cơ bản</Text>
                <LoveInput
                  value={formData.displayName}
                  onChangeText={(value) => updateFormData("displayName", value)}
                  placeholder="Tên đáng yêu của bạn"
                  autoCapitalize="words"
                  icon="person-outline"
                  error={errors.displayName}
                />
              </View>
              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>💕 Về bạn</Text>
                <View style={styles.inputWithLabel}>
                  <LoveInput
                    value={formData.bio}
                    onChangeText={(value) => updateFormData("bio", value)}
                    placeholder="Kể một điều ngọt ngào về bản thân..."
                    multiline
                    numberOfLines={4}
                    maxLength={200}
                    icon="heart-outline"
                    error={errors.bio}
                  />
                  <Text style={styles.characterCount}>
                    {formData.bio.length}/200 ký tự
                  </Text>
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>📞 Thông tin liên hệ</Text>
                <LoveInput
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateFormData("phoneNumber", value)}
                  placeholder="Số điện thoại (Không bắt buộc)"
                  keyboardType="phone-pad"
                  icon="call-outline"
                  error={errors.phoneNumber}
                />
              </View>
            </View>
            <View style={styles.buttonsContainer}>
              <LoveButton
                title="Lưu thay đổi"
                onPress={handleSave}
                variant="primary"
                size="large"
                icon="checkmark-circle-outline"
              />

              <LoveButton
                title="Hủy bỏ"
                onPress={handleCancel}
                variant="outline"
                size="medium"
                icon="close-outline"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LoveBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  inputSection: {},
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B0000",
    marginBottom: 16,
    paddingLeft: 4,
  },
  inputWithLabel: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B0000",
    marginBottom: 8,
    marginLeft: 4,
  },
  characterCount: {
    fontSize: 12,
    color: "#666666",
    textAlign: "right",
    marginTop: 4,
    marginRight: 4,
  },
  buttonsContainer: {
    gap: 16,
  },
  saveButton: {
    // LoveButton will handle its own styling
  },
  cancelButton: {
    // LoveButton will handle its own styling
  },
});

export default UserEditScreen;
