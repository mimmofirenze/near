import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Colors } from "../constants/theme";
import { useFonts } from "expo-font";
import "../tasks/backgroundLocation";

// app/_layout.tsx

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [fontsLoaded] = useFonts({
    alanRegular: require("../assets/fonts/AlanSans-Regular.ttf"),
    alanSemiBold: require("../assets/fonts/AlanSans-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      />
    </>
  );
}