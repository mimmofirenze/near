import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet } from "react-native";

import { Logos } from "../constants/theme";
import { useAppTheme } from "../contexts/themeContext";

// If Home never reports ready (no network, permission dialog left open...),
// fade out anyway after this long, so the user is never stuck.
const MAX_WAIT_AFTER_INTRO_MS = 8000;

type Props = {
  canExit: boolean; // true once the screen underneath has finished loading
  onDone: () => void; // called after the fade-out finishes
  holdMs?: number; // how long the finished logo + tagline stay on screen
};

/**
 * Plays as an overlay on top of the whole app.
 *   0-700 ms     logo fades in and settles
 *   700-1300 ms  tagline fades in and rises
 *   next holdMs  hold (default 1300 ms)
 *   then         waits until canExit is true, and fades out over 400 ms
 */
export default function AuthLoading({
  canExit,
  onDone,
  holdMs = 1300,
}: Props) {
  const { theme, colorScheme } = useAppTheme();
  const logo = Logos[colorScheme ?? "light"];

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textShift = useRef(new Animated.Value(12)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const [introDone, setIntroDone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const exiting = useRef(false);

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // 1) Intro
  useEffect(() => {
    const intro = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textShift, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(holdMs),
    ]);

    intro.start(({ finished }) => {
      if (finished) setIntroDone(true);
    });

    return () => intro.stop();
  }, [logoOpacity, logoScale, textOpacity, textShift, holdMs]);

  // 2) Safety net
  useEffect(() => {
    if (!introDone) return;

    const timer = setTimeout(
      () => setTimedOut(true),
      MAX_WAIT_AFTER_INTRO_MS
    );

    return () => clearTimeout(timer);
  }, [introDone]);

  // 3) Exit: only once the intro is over AND Home is ready
  useEffect(() => {
    if (!introDone || exiting.current) return;
    if (!canExit && !timedOut) return;

    exiting.current = true;

    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: 400,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDoneRef.current();
    });
  }, [introDone, canExit, timedOut, screenOpacity]);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.background, opacity: screenOpacity },
      ]}
    >
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <Animated.Text
        style={[
          styles.tagline,
          {
            color: theme.text,
            opacity: textOpacity,
            transform: [{ translateY: textShift }],
          },
        ]}
      >
        Putting you on the map.
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 140,
    height: 140,
  },
  tagline: {
    marginTop: 24,
    fontSize: 18,
    fontFamily: "alanRegular",
  },
});