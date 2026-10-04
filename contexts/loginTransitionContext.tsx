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

type LoginTransitionContextType = {
  start: () => void; // show the animation over the whole app
  cancel: () => void; // hide it immediately (e.g. wrong password)
  markHomeReady: () => void; // Home calls this when it has finished loading
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
  const [visible, setVisible] = useState(false);
  const [homeReady, setHomeReady] = useState(false);

  const start = useCallback(() => {
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
            <AuthLoading canExit={homeReady} onDone={cancel} />
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