import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "../lib/supabase";

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

export async function registerAndSavePushToken() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        token: null,
        error:
          userError ??
          new Error("No authenticated user found."),
      };
    }

    const { token, error } =
      await registerForPushNotifications();

    if (error || !token) {
      return {
        token: null,
        error:
          error ??
          new Error("Could not get Expo push token."),
      };
    }

    const { error: saveError } = await supabase
      .from("push_tokens")
      .upsert(
        {
          user_id: user.id,
          expo_push_token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,expo_push_token",
        }
      );

    if (saveError) {
      return {
        token,
        error: saveError,
      };
    }

    console.log("PUSH TOKEN SAVED:", {
      platform: Platform.OS,
    });

    return {
      token,
      error: null,
    };
  } catch (error) {
    return {
      token: null,
      error:
        error instanceof Error
          ? error
          : new Error("Could not save push token."),
    };
  }
}