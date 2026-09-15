import AsyncStorage from "@react-native-async-storage/async-storage";


export const SETTINGS_KEYS = {
  shareLocation: "near:share-location",
  backgroundLocation: "near:background-location",
  nearbyNotifications: "near:nearby-notifications",
} as const;

export type NearSettings = {
  shareLocation: boolean;
  backgroundLocation: boolean;
  nearbyNotifications: boolean;
};

const DEFAULT_SETTINGS: NearSettings = {
  shareLocation: true,
  backgroundLocation: true,
  nearbyNotifications: true,
};

export async function getNearSettings(): Promise<NearSettings> {
  const values = await AsyncStorage.multiGet(
    Object.values(SETTINGS_KEYS)
  );

  const stored = Object.fromEntries(values);

  return {
    shareLocation:
      stored[SETTINGS_KEYS.shareLocation] === null
        ? DEFAULT_SETTINGS.shareLocation
        : stored[SETTINGS_KEYS.shareLocation] === "true",

    backgroundLocation:
      stored[SETTINGS_KEYS.backgroundLocation] === null
        ? DEFAULT_SETTINGS.backgroundLocation
        : stored[SETTINGS_KEYS.backgroundLocation] === "true",

    nearbyNotifications:
      stored[SETTINGS_KEYS.nearbyNotifications] === null
        ? DEFAULT_SETTINGS.nearbyNotifications
        : stored[SETTINGS_KEYS.nearbyNotifications] === "true",
  };
}

export async function setShareLocation(value: boolean) {
  await AsyncStorage.setItem(
    SETTINGS_KEYS.shareLocation,
    String(value)
  );
}

export async function setBackgroundLocation(value: boolean) {
  await AsyncStorage.setItem(
    SETTINGS_KEYS.backgroundLocation,
    String(value)
  );
}

export async function setNearbyNotifications(value: boolean) {
  await AsyncStorage.setItem(
    SETTINGS_KEYS.nearbyNotifications,
    String(value)
  );
}