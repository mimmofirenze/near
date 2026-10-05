import { View, 
  Image, 
  Text, 
  TextInput,
  Pressable,
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
      setLoginError("Incorrect email or password.");
      return;
    }

    router.replace("/(tabs)/home"); // no waiting, Home loads under the animation
    authFlowInProgress = false;
  } catch (error) {
    console.error("Login error:", error);
    cancelTransition();
    authFlowInProgress = false;
    setLoginError("Something went wrong. Please try again.");
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
          setLoginError(error.message);
          return;
        }

        startTransition();
        router.replace("/(tabs)/home");
      } catch (error) {
        console.error("Google login error:", error);
        setLoginError("Google login failed.");
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
      setLoginError(error.message);
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
      "Facebook login failed."
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

          <Image
            source={logo}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={[ styles.title, { color: theme.text }]}>Welcome back!</Text>

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
            Forgot your password? Click{" "}
            <Text
              style={styles.linkText}
              onPress={() => {
                router.push('/forgot-password');
              }}
            >
              here
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
              {loading ? "Logging in..." : "Continue"}
            </Text>
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
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
              <Text style={[styles.socialButtonText, { color: theme.text }]}>Continue with Google</Text>
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
                Continue with Facebook
              </Text>
            </Pressable>
          </LinearGradient>

          <Pressable style={styles.createAccountButton}
          onPress={() => router.push("/register")}>
            <Text style={styles.createAccountText}>Create new account</Text>
          </Pressable>

        </View>

      </TouchableWithoutFeedback>

    </SafeAreaView>

  );
}
