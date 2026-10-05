import {
  Image,
  Pressable,
  Text,
  TextInput,
  View,
  Keyboard, 
  TouchableWithoutFeedback

} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { styles } from "../styles/registerStyles";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { validateEmail, validateFirstName, validatePassword, } from "../utils/validation";

import {
  signUp,
  signInWithGoogle,
  signInWithFacebook,
} from "../utils/auth";

import { useAppTheme } from "../contexts/themeContext";

import { useLoginTransition } from "../contexts/loginTransitionContext";

export default function RegisterScreen() {

  const { theme, colorScheme } =
  useAppTheme();

  const { start: startTransition } = useLoginTransition();

  const [showPassword, setShowPassword] = useState(false); //roba dell'occhio
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); //roba dell'occhio

  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState(""); 

   // Valori degli input
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Messaggi di errore
  const [firstNameError, setFirstNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Il pulsante si attiva solo quando tutti i campi contengono qualcosa
  const isFormComplete =
    firstName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0;

  const handleRegister = async () => {
    const newFirstNameError = validateFirstName(firstName);
    const newEmailError = validateEmail(email);
    const newPasswordError = validatePassword(password);

    const newConfirmPasswordError = !confirmPassword
      ? "Confirm your password"
      : password !== confirmPassword
        ? "Passwords do not match"
        : "";

    setFirstNameError(newFirstNameError);
    setEmailError(newEmailError);
    setPasswordError(newPasswordError);
    setConfirmPasswordError(newConfirmPasswordError);
    setRegisterError("");

    if (
      newFirstNameError ||
      newEmailError ||
      newPasswordError ||
      newConfirmPasswordError
    ) {
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await signUp(
        firstName.trim(),
        email,
        password
      );

      if (error) {
        setRegisterError(error.message);
        return;
      }

      console.log("User created:", data.user);
      console.log("Session:", data.session);

      if (data.session) {
        startTransition();
        router.replace("/(tabs)/home");
      } else {
        setRegisterError(
          "Account created. Check your email to confirm your account."
        );
      }
    } catch (error) {
      console.error(error);
      setRegisterError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
  try {
    setLoading(true);
    setRegisterError("");

    const { error } = await signInWithGoogle();

    if (error) {
      setRegisterError(error.message);
      return;
    }
    startTransition();
    router.replace("/(tabs)/home");
  } catch (error) {
    console.error("Google login error:", error);
    setRegisterError("Google login failed.");
  } finally {
    setLoading(false);
  }
};

const handleFacebookLogin = async () => {
  try {
    setLoading(true);
    setRegisterError("");

    const { error } =
      await signInWithFacebook();

    if (error) {
      setRegisterError(error.message);
      return;
    }
    startTransition();
    router.replace("/(tabs)/home");
  } catch (error) {
    console.error(
      "Facebook login error:",
      error
    );

    setRegisterError(
      "Facebook login failed."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.background },
      ]}
    >

    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

      <View style={styles.container}>

        <Text
          style={[
            styles.title,
            { color: theme.text },
          ]}
        >
          Welcome traveller!
        </Text>

        <TextInput
            style={[
              styles.input,
              firstNameError ? styles.inputError : null,
            ]}
            placeholder="Enter first name"
            placeholderTextColor="#8F8F8F"
            autoCapitalize="words"
            autoCorrect={false}
            value={firstName}
            maxLength={20}
            onChangeText={(text) => {
              setFirstName(text);
              setFirstNameError("");
            }}
          />

          {firstNameError ? (
            <Text style={styles.errorText}>
              {firstNameError}
            </Text>
          ) : null}

          <TextInput
            style={[
              styles.input,
              emailError ? styles.inputError : null,
            ]}
            placeholder="Enter email"
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
              placeholder="Enter password"
              placeholderTextColor="#8F8F8F"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError("");
                setConfirmPasswordError("");
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
            <Text style={styles.errorText}>
              {passwordError}
            </Text>
          ) : null}

          <View
            style={[
              styles.passwordContainer,
              confirmPasswordError ? styles.inputError : null,
            ]}
          >
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm password"
              placeholderTextColor="#8F8F8F"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setConfirmPasswordError("");
              }}
            />

            <Pressable
              style={styles.eyeButton}
              onPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
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

          {confirmPasswordError ? (
            <Text style={styles.errorText}>
              {confirmPasswordError}
            </Text>
          ) : null}

          <Pressable
            style={[
              styles.continueButton,
              isFormComplete
                ? styles.continueButtonActive
                : styles.continueButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={!isFormComplete || loading}
          >
            <Text style={styles.continueButtonText}>
              {loading ? "Creating account..." : "Continue"}
            </Text>
          </Pressable>

          {registerError ? (
              <Text style={styles.errorText}>
                {registerError}
              </Text>
          ) : null}

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />

          <Text style={styles.dividerText}>
            or
          </Text>

          <View style={styles.divider} />
        </View>

        <LinearGradient
          colors={["#EA4335", "#FBBC05", "#34A853"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.socialBorder}
        >
          <Pressable
            style={[styles.socialButton, { backgroundColor: theme.background }]}
            onPress={handleGoogleLogin}
          >
            <Image
              source={require("@/assets/images/google-logo.png")}
              style={styles.socialIcon}
              resizeMode="contain"
            />

            <Text
              style={[
                styles.socialButtonText,
                { color: theme.text },
              ]}
            >
              Continue with Google
            </Text>
          </Pressable>
        </LinearGradient>

        <LinearGradient
          colors={["#0d26c9", "#7378ff", "#95b2ff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.socialBorder}
        >
          <Pressable
            style={[styles.socialButton, { backgroundColor: theme.background }]}
            onPress={handleFacebookLogin}
          >
            <Image
              source={require('@/assets/images/facebook-logo.png')}
              style={styles.socialIcon}
              resizeMode="contain"
            />

            <Text
              style={[
                styles.socialButtonText,
                { color: theme.text },
              ]}
            >
              Continue with Facebook
            </Text>
          </Pressable>
        </LinearGradient>

        <Pressable
          style={styles.loginButton}
          onPress={() => router.back()}
        >
          <Text style={styles.loginButtonText}>
            Already a user? Login
          </Text>
        </Pressable>

      </View>

      </TouchableWithoutFeedback>

    </SafeAreaView>
  );
}