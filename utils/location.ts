import { Platform } from "react-native";

import * as Location from "expo-location";

import { supabase } from "../lib/supabase";
import {
  BACKGROUND_LOCATION_TASK,
} from "../tasks/backgroundLocation";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SETTINGS_KEYS } from "./settings";

export async function requestLocationPermission() {
  const { status } =
    await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    return {
      granted: false,
      error: new Error(
        "Location permission was denied."
      ),
    };
  }

  return {
    granted: true,
    error: null,
  };
}

export async function getCurrentLocation() {
  const permissionResult =
    await requestLocationPermission();

  if (!permissionResult.granted) {
    return {
      location: null,
      error: permissionResult.error,
    };
  }

  try {
    const location =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

    return {
      location,
      error: null,
    };
  } catch {
    return {
      location: null,
      error: new Error(
        "Could not get your current location."
      ),
    };
  }
}

export async function updateCurrentUserLocation() {
  const {
    location,
    error: locationError,
  } = await getCurrentLocation();

  if (locationError || !location) {
    return {
      location: null,
      error:
        locationError ??
        new Error("Location unavailable."),
    };
  }

  const shareLocation =
    await AsyncStorage.getItem(
      SETTINGS_KEYS.shareLocation
    );

  // Sharing OFF:
  // still return location for the user's own map,
  // but do NOT upload it to Supabase.
  if (shareLocation === "false") {
    return {
      location,
      error: null,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      location,
      error: userError,
    };
  }

  if (!user) {
    return {
      location,
      error: new Error(
        "No authenticated user."
      ),
    };
  }

  const {
    latitude,
    longitude,
    accuracy,
  } = location.coords;

  const { error } = await supabase
    .from("user_locations")
    .upsert({
      user_id: user.id,
      latitude,
      longitude,
      accuracy,
      updated_at: new Date().toISOString(),
    });

  return {
    location,
    error,
  };
}

export async function clearCurrentUserSharedLocation() {
  console.log("ENTERED clearCurrentUserSharedLocation");

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("CLEAR USER:", user?.id);
    console.log("CLEAR USER ERROR:", userError);

    if (userError) {
      return { error: userError };
    }

    if (!user) {
      return {
        error: new Error("No authenticated user."),
      };
    }

    console.log("ABOUT TO UPDATE SUPABASE");

    const { data, error } = await supabase
      .from("user_locations")
      .update({
        latitude: null,
        longitude: null,
        accuracy: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select("user_id, latitude, longitude, accuracy");

    console.log("SUPABASE UPDATE FINISHED");
    console.log("CLEAR LOCATION DATA:", data);
    console.log("CLEAR LOCATION ERROR:", error);

    return { error };
  } catch (error) {
    console.error(
      "CLEAR LOCATION THREW:",
      error
    );

    return {
      error:
        error instanceof Error
          ? error
          : new Error("Unknown clear location error"),
    };
  }
}

/* -------------------------------- */
/* BACKGROUND LOCATION              */
/* -------------------------------- */

export async function startBackgroundLocationTracking() {
  try {

    const foregroundPermission =
      await Location.getForegroundPermissionsAsync();

    let foregroundStatus =
      foregroundPermission.status;

    if (foregroundStatus !== "granted") {
      const requestedForegroundPermission =
        await Location.requestForegroundPermissionsAsync();

      foregroundStatus =
        requestedForegroundPermission.status;
    }

    if (foregroundStatus !== "granted") {
      return {
        started: false,
        error: new Error(
          "Foreground location permission was denied."
        ),
      };
    }

    const backgroundPermission =
      await Location.getBackgroundPermissionsAsync();

    let backgroundStatus =
      backgroundPermission.status;

    if (backgroundStatus !== "granted") {
      const requestedBackgroundPermission =
        await Location.requestBackgroundPermissionsAsync();

      backgroundStatus =
        requestedBackgroundPermission.status;
    }

    if (backgroundStatus !== "granted") {
      return {
        started: false,
        error: new Error(
          "Background location permission was denied."
        ),
      };
    }

    const alreadyStarted =
      await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK
      );

    if (alreadyStarted) {
      return {
        started: true,
        error: null,
      };
    }

    await Location.startLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK,
      {
        accuracy: Location.Accuracy.Balanced,

        // Allow location updates without requiring a minimum movement distance.
        distanceInterval: 0,

        // Primarily used by Android.
        timeInterval: 120_000,

        // iOS can pause tracking when it believes movement stopped.
        pausesUpdatesAutomatically: true,

        // Shows the blue location indicator on iOS.
        showsBackgroundLocationIndicator: true,

        activityType:
          Location.ActivityType.OtherNavigation,

        foregroundService:
          Platform.OS === "android"
            ? {
                notificationTitle:
                  "Near location sharing",
                notificationBody:
                  "Near is updating your location in the background.",
                notificationColor: "#2563EB",
              }
            : undefined,
      }
    );

    return {
      started: true,
      error: null,
    };
  } catch (error) {
    return {
      started: false,
      error:
        error instanceof Error
          ? error
          : new Error(
              "Could not start background location tracking."
            ),
    };
  }
}

export async function stopBackgroundLocationTracking() {
  try {
    const started =
      await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK
      );

    if (started) {
      await Location.stopLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK
      );
    }

    return {
      stopped: true,
      error: null,
    };
  } catch (error) {
    return {
      stopped: false,
      error:
        error instanceof Error
          ? error
          : new Error(
              "Could not stop background location tracking."
            ),
    };
  }
}

export async function isBackgroundLocationTrackingEnabled() {
  try {
    const enabled =
      await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK
      );

    return {
      enabled,
      error: null,
    };
  } catch (error) {
    return {
      enabled: false,
      error:
        error instanceof Error
          ? error
          : new Error(
              "Could not check background tracking status."
            ),
    };
  }
}

/* -------------------------------- */
/* FRIEND LOCATIONS                 */
/* -------------------------------- */

type FriendLocationProfile = {
  id: string;
  first_name: string;
  username: string | null;
  avatar_url: string | null;
  country_code: string | null;
};

export type FriendLocation = {
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updated_at: string;
  profile: FriendLocationProfile;
};

export async function getFriendLocations() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      friends: [] as FriendLocation[],
      error: userError,
    };
  }

  if (!user) {
    return {
      friends: [] as FriendLocation[],
      error: new Error(
        "No authenticated user."
      ),
    };
  }

  const {
    data: friendships,
    error: friendshipsError,
  } = await supabase
    .from("friendships")
    .select("sender_id, receiver_id")
    .eq("status", "accepted")
    .or(
      `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
    );

  if (friendshipsError) {
    return {
      friends: [] as FriendLocation[],
      error: friendshipsError,
    };
  }

  const friendIds = (
    friendships ?? []
  ).map((friendship) =>
    friendship.sender_id === user.id
      ? friendship.receiver_id
      : friendship.sender_id
  );

  if (friendIds.length === 0) {
    return {
      friends: [] as FriendLocation[],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("user_locations")
    .select(`
      user_id,
      latitude,
      longitude,
      accuracy,
      updated_at,
      profile:profiles!user_locations_user_id_fkey (
        id,
        first_name,
        username,
        avatar_url,
        country_code
      )
    `)
    .in("user_id", friendIds)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  return {
    friends:
      (data ?? []) as unknown as FriendLocation[],
    error,
  };
}

export function subscribeToFriendLocationUpdates(
  onLocationChange: () => void
) {
  const channel = supabase
  .channel(
    `friend-location-updates-${Date.now()}-${Math.random()}`
  )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_locations",
      },
      () => {
        onLocationChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function removeCurrentUserLocation() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { error: userError };
  }

  if (!user) {
    return {
      error: new Error("No authenticated user."),
    };
  }

  const { data, error } = await supabase
  .from("user_locations")
  .update({
    latitude: null,
    longitude: null,
    accuracy: null,
    updated_at: new Date().toISOString(),
  })
  .eq("user_id", user.id)
  .select("user_id, latitude, longitude, accuracy");

console.log("CLEAR LOCATION DATA:", data);
console.log("CLEAR LOCATION ERROR:", error);

return { error };
}

export async function watchCurrentUserLocation(
  onLocationChange: (
    location: Location.LocationObject
  ) => void
) {
  const permissionResult =
    await requestLocationPermission();

  if (!permissionResult.granted) {
    return {
      subscription: null,
      error: permissionResult.error,
    };
  }

  const subscription =
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 10,
        timeInterval: 120_000,
      },
      async (location) => {
        onLocationChange(location);

        const shareLocation =
          await AsyncStorage.getItem(
            SETTINGS_KEYS.shareLocation
          );

        if (shareLocation === "false") {
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        const {
          latitude,
          longitude,
          accuracy,
        } = location.coords;

        await supabase
          .from("user_locations")
          .upsert({
            user_id: user.id,
            latitude,
            longitude,
            accuracy,
            updated_at: new Date().toISOString(),
          });
      }
    );

  return {
    subscription,
    error: null,
  };
}

export type LastSeenLocation = {
  place: string | null;
  updatedAt: string | null;
};

export async function getUserLastSeenLocation(
  userId?: string
): Promise<{
  lastSeen: LastSeenLocation;
  error: Error | null;
}> {
  try {
    let targetUserId = userId;

    if (!targetUserId) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        return {
          lastSeen: {
            place: null,
            updatedAt: null,
          },
          error: userError,
        };
      }

      if (!user) {
        return {
          lastSeen: {
            place: null,
            updatedAt: null,
          },
          error: new Error("No authenticated user"),
        };
      }

      targetUserId = user.id;
    }

    const { data, error } = await supabase
      .from("user_locations")
      .select("latitude, longitude, updated_at")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (error) {
      return {
        lastSeen: {
          place: null,
          updatedAt: null,
        },
        error,
      };
    }

    if (
      !data ||
      data.latitude === null ||
      data.longitude === null
    ) {
      return {
        lastSeen: {
          place: null,
          updatedAt: null,
        },
        error: null,
      };
    }

    const places = await Location.reverseGeocodeAsync({
      latitude: data.latitude,
      longitude: data.longitude,
    });

    const location = places[0];

    const city =
      location?.city ??
      location?.subregion ??
      location?.region ??
      null;

    const country = location?.country ?? null;

    const place = [city, country]
      .filter(Boolean)
      .join(", ");

    return {
      lastSeen: {
        place: place || null,
        updatedAt: data.updated_at,
      },
      error: null,
    };
  } catch (error) {
    return {
      lastSeen: {
        place: null,
        updatedAt: null,
      },
      error:
        error instanceof Error
          ? error
          : new Error(
              "Could not load last seen location."
            ),
    };
  }
}