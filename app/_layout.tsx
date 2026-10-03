import { Stack, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
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

    useEffect(() => {
  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    const data =
      response.notification.request.content.data;

    if (
      (data?.type === "friend_request" ||
        data?.type === "friend_request_accepted") &&
      typeof data.userId === "string"
    ) {
      router.push({
        pathname: "/user/[id]",
        params: {
          id: data.userId,
        },
      });
    }
  };

  // Notification tapped while app is running/backgrounded
  const subscription =
    Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

  // App launched by tapping a notification
  Notifications.getLastNotificationResponseAsync().then(
    (response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    }
  );

  return () => {
    subscription.remove();
  };
}, []);

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