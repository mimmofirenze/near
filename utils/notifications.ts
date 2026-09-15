import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function registerForPushNotifications() {
  try {
    if (!Device.isDevice) {
      return {
        token: null,
        error: new Error(
          "Push notifications require a physical device."
        ),
      };
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        "default",
        {
          name: "Default",
          importance:
            Notifications.AndroidImportance.DEFAULT,
        }
      );
    }

    const existingPermissions =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingPermissions.status;

    if (finalStatus !== "granted") {
      const requestedPermissions =
        await Notifications.requestPermissionsAsync();

      finalStatus = requestedPermissions.status;
    }

    if (finalStatus !== "granted") {
      return {
        token: null,
        error: new Error(
          "Notification permission was not granted."
        ),
      };
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      return {
        token: null,
        error: new Error(
          "EAS project ID could not be found."
        ),
      };
    }

    const token =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    return {
      token: token.data,
      error: null,
    };
  } catch (error) {
    return {
      token: null,
      error:
        error instanceof Error
          ? error
          : new Error(
              "Could not register for push notifications."
            ),
    };
  }
}