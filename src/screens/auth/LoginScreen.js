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
import { signIn } from "../../services/firebase/auth";

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = t("auth.validation.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t("auth.validation.emailInvalid");
    }

    if (!password) {
      newErrors.password = t("auth.validation.passwordRequired");
    } else if (password.length < 6) {
      newErrors.password = t("auth.validation.passwordMinLength");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const { user, error } = await signIn(email.trim(), password);

      if (error) {
        Alert.alert(t("auth.errors.loginFailed"), error);
      } else {
        // Navigation will be handled by the auth state listener
        console.log("Login successful:", user.email);
      }
    } catch (err) {
      Alert.alert(
        t("auth.errors.loginFailed"),
        t("auth.errors.unexpectedError")
      );
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate("SignUp");
  };

  if (loading) {
    return (
      <LoveBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <LoadingIndicator
            message={t("auth.login.loadingMessage")}
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
              <Text style={styles.title}>{t("auth.login.title")}</Text>
              <Text style={styles.subtitle}>{t("auth.login.subtitle")}</Text>
            </View>

            <View style={styles.form}>
              <LoveInput
                value={email}
                onChangeText={setEmail}
                placeholder={t("auth.login.emailPlaceholder")}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                icon="mail-outline"
                error={errors.email}
              />

              <LoveInput
                value={password}
                onChangeText={setPassword}
                placeholder={t("auth.login.passwordPlaceholder")}
                secureTextEntry
                icon="lock-closed-outline"
                error={errors.password}
              />

              <LoveButton
                title={t("auth.login.loginButton")}
                onPress={handleLogin}
                variant="primary"
                size="large"
                icon="heart"
                style={styles.loginButton}
              />

              {/* <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.login.or')}</Text>
                <View style={styles.dividerLine} />
              </View> */}

              {/* <LoveButton
                title={t('auth.login.createAccountButton')}
                onPress={navigateToSignUp}
                variant="secondary"
                size="medium"
                icon="person-add-outline"
              /> */}
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
  loginButton: {
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

export default LoginScreen;
