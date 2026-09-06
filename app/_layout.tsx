import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";

import "../tasks/backgroundLocation";

import {
  ThemeProvider,
  useAppTheme,
} from "../contexts/themeContext";

function RootNavigator() {
  const { theme, colorScheme } =
    useAppTheme();

  return (
    <>
      <StatusBar
        style={
          colorScheme === "dark"
            ? "light"
            : "dark"
        }
      />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor:
              theme.background,
          },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    alanRegular: require("../assets/fonts/AlanSans-Regular.ttf"),
    alanSemiBold: require("../assets/fonts/AlanSans-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}