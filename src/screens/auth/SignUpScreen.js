import React, { useState } from "react";
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
import { useTranslation } from "react-i18next";
import {
  LoveInput,
  LoveButton,
  LoadingIndicator,
  LoveBackground,
} from "../../components";
import { signUp } from "../../services/firebase/auth";
import { createUser } from "../../services/firebase/firestore";
import { Timestamp } from "firebase/firestore";

const SignUpScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
      newErrors.displayName = t("auth.validation.nameRequired");
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = t("auth.validation.nameMinLength");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("auth.validation.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("auth.validation.emailInvalid");
    }

    if (!formData.password) {
      newErrors.password = t("auth.validation.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("auth.validation.passwordMinLength");
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("auth.validation.confirmPasswordRequired");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("auth.validation.passwordsNoMatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const { user, error } = await signUp(
        formData.email.trim(),
        formData.password,
        formData.displayName.trim()
      );
      if (error) {
        Alert.alert(t("auth.errors.signUpFailed"), error);
      } else if (user) {
        // Create user profile in Firestore
        const userData = {
          displayName: formData.displayName.trim(),
          email: formData.email.trim(),
          createdAt: Timestamp.now(),
          bio: "",
          phoneNumber: "",
        };

        const { error: createError } = await createUser(user.uid, userData);
        if (createError) {
          console.warn(
            "Warning: Failed to create user profile in Firestore:",
            createError
          );
          // Don't block sign up if Firestore creation fails - it will be created later
          Alert.alert(
            t("auth.signUp.welcomeTitle"),
            t("auth.signUp.welcomeMessage"),
            [{ text: t("common.ok") }]
          );
        } else {
          console.log("User profile created successfully in Firestore");
        }

        // Navigation will be handled by the auth state listener
        console.log("Sign up successful:", user.email);
      }
    } catch (err) {
      Alert.alert(
        t("auth.errors.signUpFailed"),
        t("auth.errors.unexpectedError")
      );
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <LoveBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <LoadingIndicator
            message={t("auth.signUp.loadingMessage")}
            size="large"
          />
        </SafeAreaView>
      </LoveBackground>
    );
  }

  return (
    <LoveBackground>
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
              <Text style={styles.title}>{t("auth.signUp.title")}</Text>
              <Text style={styles.subtitle}>{t("auth.signUp.subtitle")}</Text>
            </View>

            <View style={styles.form}>
              <LoveInput
                value={formData.displayName}
                onChangeText={(value) => updateFormData("displayName", value)}
                placeholder={t("auth.signUp.namePlaceholder")}
                autoCapitalize="words"
                icon="person-outline"
                error={errors.displayName}
              />

              <LoveInput
                value={formData.email}
                onChangeText={(value) => updateFormData("email", value)}
                placeholder={t("auth.signUp.emailPlaceholder")}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                icon="mail-outline"
                error={errors.email}
              />

              <LoveInput
                value={formData.password}
                onChangeText={(value) => updateFormData("password", value)}
                placeholder={t("auth.signUp.passwordPlaceholder")}
                secureTextEntry
                icon="lock-closed-outline"
                error={errors.password}
              />

              <LoveInput
                value={formData.confirmPassword}
                onChangeText={(value) =>
                  updateFormData("confirmPassword", value)
                }
                placeholder={t("auth.signUp.confirmPasswordPlaceholder")}
                secureTextEntry
                icon="checkmark-circle-outline"
                error={errors.confirmPassword}
              />

              <LoveButton
                title={t("auth.signUp.signUpButton")}
                onPress={handleSignUp}
                variant="primary"
                size="large"
                icon="heart"
                style={styles.signUpButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t("auth.signUp.or")}</Text>
                <View style={styles.dividerLine} />
              </View>

              <LoveButton
                title={t("auth.signUp.signInButton")}
                onPress={navigateToLogin}
                variant="secondary"
                size="medium"
                icon="log-in-outline"
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {t("auth.signUp.footerText")}
              </Text>
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
    justifyContent: "center",
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
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#A01050",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#4F2E24",
    textAlign: "center",
    fontStyle: "italic",
  },
  form: {
    marginBottom: 32,
  },
  signUpButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#F8BBD9",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#A01050",
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: "#5D4037",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default SignUpScreen;
