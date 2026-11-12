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
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";
import { styles } from "../styles/loginStyles";
import { useAppTheme } from "../contexts/themeContext";
import { validatePassword } from "../utils/validation";

import { useTranslation } from "react-i18next";

export default function ResetPasswordScreen() {
  const { theme } = useAppTheme();

  const { t } = useTranslation();

  const url = Linking.useLinkingURL();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [verifying, setVerifying] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (!url) {
      return;
    }

    const handleRecoveryLink = async () => {
      try {
        console.log(
          "Password recovery URL:",
          url
        );

        const parts = url.split("#");

        const hashParams =
          new URLSearchParams(
            parts[1] ?? ""
          );

        const queryString =
          parts[0].split("?")[1] ?? "";

        const queryParams =
          new URLSearchParams(
            queryString
          );

        const accessToken =
          hashParams.get("access_token");

        const refreshToken =
          hashParams.get("refresh_token");

        const code =
          queryParams.get("code");

        /*
         * Normal Supabase mobile recovery flow.
         * The recovery email usually returns
         * access_token + refresh_token.
         */
        if (
          accessToken &&
          refreshToken
        ) {
          const { error } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

          if (error) {
            throw error;
          }

          setVerifying(false);
          return;
        }

        /*
         * Also support PKCE-style links
         * in case Supabase returns a code.
         */
        if (code) {
          const { error } =
            await supabase.auth
              .exchangeCodeForSession(
                code
              );

          if (error) {
            throw error;
          }

          setVerifying(false);
          return;
        }

        throw new Error(
          "No recovery credentials found."
        );
      } catch (error) {
        console.error(
          "Recovery link error:",
          error
        );

        setVerifying(false);

        Alert.alert(
          t("resetPassword.invalidLink"),
          t("resetPassword.invalidLinkDescription"),
          [
            {
              text: t("resetPassword.backToLogin"),
              onPress: () => router.replace("/"),
            },
          ]
        );
      }
    };

    handleRecoveryLink();
  }, [url, t]);

  const handleUpdatePassword =
    async () => {
      Keyboard.dismiss();
      setPasswordError("");

      const newPasswordError =
        validatePassword(password);

      if (newPasswordError) {
        setPasswordError(
          newPasswordError
        );
        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setPasswordError(
          t("resetPassword.passwordMismatch")
        );
        return;
      }

      try {
        setLoading(true);

        const { error } =
          await supabase.auth.updateUser({
            password,
          });

        if (error) {
          console.error(
            "Update password error:",
            error.message
          );

          Alert.alert(
            t("settings.error"),
            t("resetPassword.updateError")
          );

          return;
        }

        await supabase.auth.signOut();

        Alert.alert(
          t("resetPassword.success"),
          t("resetPassword.successDescription"),
          [
            {
              text: t("resetPassword.login"),
              onPress: () => router.replace("/"),
            },
          ]
        );
      } catch (error) {
        console.error(
          "Update password error:",
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

  if (verifying) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor:
              theme.background,
            flex: 1,
          },
        ]}
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
            style={{
              color: theme.text,
              textAlign: "center",
            }}
          >
            {t("resetPassword.verifying")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor:
            theme.background,
          flex: 1,
        },
      ]}
    >
      <Pressable
        onPress={() =>
          router.replace("/")
        }
        hitSlop={12}
        style={{
          position: "absolute",
          top: 20,
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
            {t("resetPassword.title")}
          </Text>

          <Text
            style={{
              color: theme.text,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            {t("resetPassword.description")}
          </Text>

          <View
            style={[
              styles.passwordContainer,
              passwordError
                ? styles.inputError
                : null,
            ]}
          >
            <TextInput
              style={
                styles.passwordInput
              }
              placeholder={t("resetPassword.newPassword")}
              placeholderTextColor="#8F8F8F"
              secureTextEntry={
                !showPassword
              }
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError("");
              }}
            />

            <Pressable
              style={styles.eyeButton}
              onPress={() =>
                setShowPassword(
                  !showPassword
                )
              }
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

          <View
            style={[
              styles.passwordContainer,
              passwordError
                ? styles.inputError
                : null,
              {
                marginTop: 12,
              },
            ]}
          >
            <TextInput
              style={
                styles.passwordInput
              }
              placeholder={t("resetPassword.confirmPassword")}
              placeholderTextColor="#8F8F8F"
              secureTextEntry={
                !showConfirmPassword
              }
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(
                  text
                );
                setPasswordError("");
              }}
            />

            <Pressable
              style={styles.eyeButton}
              onPress={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
              hitSlop={10}
            >
              <Ionicons
                name={
                  showConfirmPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={22}
                color="#707070"
              />
            </Pressable>
          </View>

          {passwordError ? (
            <Text
              style={
                styles.errorText
              }
            >
              {passwordError}
            </Text>
          ) : null}

          <Pressable
            style={[
              styles.continueButton,
              password.length > 0 &&
              confirmPassword.length >
                0 &&
              !loading
                ? styles.continueButtonActive
                : styles.continueButtonDisabled,
            ]}
            disabled={
              !password ||
              !confirmPassword ||
              loading
            }
            onPress={
              handleUpdatePassword
            }
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
                ? t("resetPassword.updating")
                : t("resetPassword.updatePassword")}
            </Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}