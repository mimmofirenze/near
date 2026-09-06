import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";

import { Colors } from "../constants/theme";

export type ThemePreference =
  | "system"
  | "light"
  | "dark";

type ThemeContextValue = {
  themePreference: ThemePreference;
  setThemePreference: (
    preference: ThemePreference
  ) => void;
  colorScheme: "light" | "dark";
  theme: typeof Colors.light;
};

const ThemeContext =
  createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "near-theme-preference";

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const systemColorScheme = useColorScheme();

  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>("system");

  useEffect(() => {
    const loadThemePreference = async () => {
      const savedPreference =
        await AsyncStorage.getItem(STORAGE_KEY);

      if (
        savedPreference === "system" ||
        savedPreference === "light" ||
        savedPreference === "dark"
      ) {
        setThemePreferenceState(savedPreference);
      }
    };

    loadThemePreference();
  }, []);

  const setThemePreference = (
    preference: ThemePreference
  ) => {
    setThemePreferenceState(preference);

    AsyncStorage.setItem(
      STORAGE_KEY,
      preference
    ).catch((error) => {
      console.log(
        "Could not save theme preference:",
        error
      );
    });
  };

  const colorScheme: "light" | "dark" =
    themePreference === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themePreference;

  const value = useMemo(
    () => ({
      themePreference,
      setThemePreference,
      colorScheme,
      theme: Colors[colorScheme],
    }),
    [themePreference, colorScheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useAppTheme must be used inside ThemeProvider"
    );
  }

  return context;
}