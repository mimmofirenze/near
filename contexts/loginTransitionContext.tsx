import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";

import AuthLoading from "../components/AuthLoading";

// Intro is 700 + 600 ms, then the logo and tagline stay for holdMs.
const LAUNCH_HOLD_MS = 800; // every app open: about 2.1 s minimum
const LOGIN_HOLD_MS = 1300; // after login / register: about 2.6 s minimum

type LoginTransitionContextType = {
  start: () => void; // show the animation over the whole app
  cancel: () => void; // hide it immediately (e.g. wrong password)
  markHomeReady: () => void; // the screen underneath calls this when loaded
};

const LoginTransitionContext =
  createContext<LoginTransitionContextType>({
    start: () => {},
    cancel: () => {},
    markHomeReady: () => {},
  });

export function LoginTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Starts visible, so the animation plays on every app launch.
  const [visible, setVisible] = useState(true);
  const [homeReady, setHomeReady] = useState(false);
  const [holdMs, setHoldMs] = useState(LAUNCH_HOLD_MS);

  const start = useCallback(() => {
    setHoldMs(LOGIN_HOLD_MS);
    setHomeReady(false);
    setVisible(true);
  }, []);

  const cancel = useCallback(() => setVisible(false), []);
  const markHomeReady = useCallback(() => setHomeReady(true), []);

  const value = useMemo(
    () => ({ start, cancel, markHomeReady }),
    [start, cancel, markHomeReady]
  );

  return (
    <LoginTransitionContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}

        {visible ? (
          <View style={styles.overlay}>
            <AuthLoading
              canExit={homeReady}
              onDone={cancel}
              holdMs={holdMs}
            />
          </View>
        ) : null}
      </View>
    </LoginTransitionContext.Provider>
  );
}

export function useLoginTransition() {
  return useContext(LoginTransitionContext);
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
  },
});