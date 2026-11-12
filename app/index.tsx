import { View, 
  Image, 
  Text, 
  TextInput,
  Pressable,
  Modal,
  Keyboard, 
  TouchableWithoutFeedback

 } from 'react-native';

import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/loginStyles";
import { Logos } from "../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import {
  router,
  useFocusEffect,
} from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { validateEmail, validatePassword, } from "../utils/validation";

import { supabase } from "../lib/supabase";

import {
  signIn,
  signInWithGoogle,
  signInWithFacebook,
} from "../utils/auth";

import { useAppTheme } from "../contexts/themeContext";

import { useLoginTransition } from "../contexts/loginTransitionContext";

import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

let authFlowInProgress = false;


export default function LoginScreen() {

  const { start: startTransition, cancel: cancelTransition, markHomeReady } =
  useLoginTransition();

const { theme, colorScheme } =
  useAppTheme();

const logo = Logos[colorScheme ?? "light"];

const [showPassword, setShowPassword] = useState(false); //roba dell'occhio

// Valori scritti negli input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Messaggi di errore
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

const { t, i18n } = useTranslation();

const [languageModalVisible, setLanguageModalVisible] =
  useState(false);

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

const changeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem("near_language", language);
    await i18n.changeLanguage(language);
    setLanguageModalVisible(false);
  } catch (error) {
    console.error("Could not change language:", error);
  }
};


useFocusEffect(
  useCallback(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(
          "Session error:",
          error.message
        );

        setCheckingSession(false);
        return;
      }

      if (session && !authFlowInProgress) {
        router.replace("/(tabs)/home");
        return;
      }

      setCheckingSession(false);
    };

    checkSession();
  }, [])
);

useEffect(() => {
  if (!checkingSession) markHomeReady();
}, [checkingSession, markHomeReady]);

const handleLogin = async () => {
  Keyboard.dismiss();
  const newEmailError = validateEmail(email);
  const newPasswordError = validatePassword(password);

  setEmailError(newEmailError);
  setPasswordError(newPasswordError);
  setLoginError("");

  if (newEmailError || newPasswordError) {
    return;
  }

  authFlowInProgress = true;

  try {
    setLoading(true);
    startTransition(); // animation appears instantly

    const { error } = await signIn(email, password);

    if (error) {
      cancelTransition(); // wrong password: hide it again
      authFlowInProgress = false;
      setLoginError(t("login.incorrectCredentials"));
      return;
    }

    router.replace("/(tabs)/home"); // no waiting, Home loads under the animation
    authFlowInProgress = false;
  } catch (error) {
    console.error("Login error:", error);
    cancelTransition();
    authFlowInProgress = false;
    setLoginError(t("login.genericError"));
  } finally {
    setLoading(false);
  }
};

    const handleGoogleLogin = async () => {
      try {
        authFlowInProgress = true;
        setLoading(true);
        setLoginError("");

        const { error } = await signInWithGoogle();

        if (error) {
          setLoginError(t("login.googleFailed"));
          return;
        }

        startTransition();
        router.replace("/(tabs)/home");
      } catch (error) {
        console.error("Google login error:", error);
        setLoginError(t("login.googleFailed"));
      } finally {
        authFlowInProgress = false;
        setLoading(false);
      }
    };

    const handleFacebookLogin = async () => {
  try {
    setLoading(true);
    setLoginError("");

    const { error } =
      await signInWithFacebook();

    if (error) {
      setLoginError(t("login.facebookFailed"));
      return;
    }
    startTransition();
    router.replace("/(tabs)/home");
  } catch (error) {
    console.error(
      "Facebook login error:",
      error
    );

    setLoginError(
      t("login.facebookFailed")
    );
  } finally {
    setLoading(false);
  }
};

  const isFormComplete =
  email.trim().length > 0 &&
  password.length > 0;

  if (checkingSession) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: theme.background },
        ]}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

        <View style={styles.container}>

          
<View
  style={{
    position: "absolute",
    top: 20,
    right: 15,
    zIndex: 10,
  }}
>
  <Pressable
    onPress={() => setLanguageModalVisible(true)}
    accessibilityRole="button"
    accessibilityLabel={t("language.select")}
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.text,
      gap: 6,
    }}
  >
    <Ionicons
      name="globe-outline"
      size={18}
      color={theme.text}
    />

    <Text style={{ color: theme.text, fontWeight: "600" }}>
      {i18n.resolvedLanguage?.toUpperCase() ?? "EN"}
    </Text>

    <Ionicons
      name="chevron-down"
      size={16}
      color={theme.text}
    />
  </Pressable>
</View>

<Modal
  visible={languageModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setLanguageModalVisible(false)}
>
  <Pressable
    onPress={() => setLanguageModalVisible(false)}
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      paddingHorizontal: 32,
    }}
  >
    <Pressable
      onPress={(event) => event.stopPropagation()}
      style={{
        backgroundColor: theme.background,
        borderRadius: 18,
        padding: 20,
        gap: 8,
      }}
    >
      <Text
        style={{
          color: theme.text,
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        {t("language.select")}
      </Text>

      {languages.map((language) => (
        <Pressable
          key={language.code}
          onPress={() => changeLanguage(language.code)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 14,
            paddingHorizontal: 10,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 22 }}>
            {language.flag}
          </Text>

          <Text
            style={{
              color: theme.text,
              fontSize: 16,
              flex: 1,
            }}
          >
            {language.label}
          </Text>

          {i18n.resolvedLanguage === language.code && (
            <Ionicons
              name="checkmark-circle"
              color="#2563EB"
              size={22}
            />
          )}
        </Pressable>
      ))}
    </Pressable>
  </Pressable>
</Modal>


          <Image
            source={logo}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={[ styles.title, { color: theme.text }]}>{t("login.welcome")}</Text>

          <TextInput
            style={[
              styles.input,
              emailError ? styles.inputError : null,
            ]}
            placeholder="email"
            placeholderTextColor="#8F8F8F"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError("");
            }}
          />

          {emailError ? (
            <Text style={styles.errorText}>
              {emailError}
            </Text>
          ) : null}

          <View
            style={[
              styles.passwordContainer,
              passwordError ? styles.inputError : null,
            ]}
          >
            <TextInput
              style={styles.passwordInput}
              placeholder="password"
              placeholderTextColor="#8F8F8F"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError("");
              }}
            />

            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={10}
            >
              <Ionicons
                name={
                  showPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={22}
                color="#707070"
              />
            </Pressable>
          </View>

          {passwordError ? (
            <Text style={[styles.errorText, styles.errorTextBottom]}>
              {passwordError}
            </Text>
          ) : null}
          
          <Text style={[styles.forgotText , { color: theme.text }]}>
            {t("login.forgotPassword")}{" "}
            <Text
              style={styles.linkText}
              onPress={() => {
                router.push('/forgot-password');
              }}
            >
              {t("login.here")}
            </Text>
          </Text>

          {loginError ? (
            <Text style={styles.errorText}>
              {loginError}
            </Text>
          ) : null}
          
          <Pressable
            style={[
              styles.continueButton,
              isFormComplete && !loading
                ? styles.continueButtonActive
                : styles.continueButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!isFormComplete || loading}
          >
            <Text style={styles.continueButtonText}>
              {loading ? t("login.loggingIn") : t("login.continue")}
            </Text>
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{t("login.or")}</Text>
            <View style={styles.divider} />
          </View>
              
          <LinearGradient //Google login button
            colors={["#EA4335", "#FBBC05", "#34A853",]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.socialBorder}
          >
            <Pressable style={[styles.socialButton, { backgroundColor: theme.background }]}
            onPress={handleGoogleLogin}>
              <Image
                source={require('@/assets/images/google-logo.png')}
                style={styles.socialIcon}
                resizeMode="contain"
              />
              <Text style={[styles.socialButtonText, { color: theme.text }]}>{t("login.google")}</Text>
            </Pressable>
          </LinearGradient>

          <LinearGradient //fb login button
            colors={["#0d26c9", "#7378ff", "#95b2ff",]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.socialBorder}
          >
            <Pressable style={[styles.socialButton, { backgroundColor: theme.background }]}
            onPress={handleFacebookLogin}
              >
              <Image
                source={require('@/assets/images/facebook-logo.png')}
                style={styles.socialIcon}
                resizeMode="contain"
              />
              <Text style={[styles.socialButtonText, { color: theme.text }]}>
                {t("login.facebook")}
              </Text>
            </Pressable>
          </LinearGradient>

          <Pressable style={styles.createAccountButton}
          onPress={() => router.push("/register")}>
            <Text style={styles.createAccountText}>{t("login.createAccount")}</Text>
          </Pressable>

        </View>

      </TouchableWithoutFeedback>

    </SafeAreaView>

  );
}
