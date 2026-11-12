import {
  Alert,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "../lib/supabase";
import { styles } from "../styles/loginStyles";
import { useAppTheme } from "../contexts/themeContext";
import { validateEmail } from "../utils/validation";

import { useTranslation } from "react-i18next";

export default function ForgotPasswordScreen() {
  const { theme } = useAppTheme();

  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    const newEmailError = validateEmail(email);

    setEmailError(newEmailError);

    if (newEmailError) {
      return;
    }

    try {
      setLoading(true);

      const redirectTo =
        Linking.createURL("reset-password");

      console.log(
        "Password reset redirect:",
        redirectTo
      );

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          {
            redirectTo,
          }
        );

      if (error) {
        console.error(
          "Reset password error:",
          error.message
        );

        Alert.alert(
          t("settings.error"),
          t("forgotPassword.sendError")
        );

        return;
      }

      Alert.alert(
        t("forgotPassword.checkEmail"),
        t("forgotPassword.successMessage"),
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      Alert.alert(
        t("settings.error"),
        t("login.genericError")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
          flex: 1,
        },
      ]}
    >
      {/* Back arrow */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{
          position: "absolute",
          top: 50,
          left: 20,
          zIndex: 10,
          padding: 8,
        }}
      >
        <Ionicons
          name="arrow-back"
          size={28}
          color={theme.text}
        />
      </Pressable>

      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
      >
        <View
          style={[
            styles.container,
            {
              flex: 1,
              justifyContent: "center",
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              {
                color: theme.text,
              },
            ]}
          >
            {t("forgotPassword.title")}
          </Text>

          <Text
            style={{
              color: theme.text,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            {t("forgotPassword.description")}
          </Text>

          <TextInput
            style={[
              styles.input,
              emailError
                ? styles.inputError
                : null,
            ]}
            placeholder={t("login.email")}
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

          <Pressable
            style={[
              styles.continueButton,
              email.trim().length > 0 &&
              !loading
                ? styles.continueButtonActive
                : styles.continueButtonDisabled,
            ]}
            disabled={
              !email.trim().length ||
              loading
            }
            onPress={handleResetPassword}
          >
            <Text
              style={[
                styles.continueButtonText,
                {
                  textAlign: "center",
                  flexShrink: 1,
                  paddingHorizontal: 10,
                },
              ]}
            >
              {loading
                ? t("forgotPassword.sending")
                : t("forgotPassword.sendEmail")}
            </Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}