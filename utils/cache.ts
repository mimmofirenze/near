import AsyncStorage from
  "@react-native-async-storage/async-storage";

const memoryCache = new Map<
  string,
  unknown
>();

export function getMemoryCachedData<T>(
  key: string
): T | null {
  return (
    (memoryCache.get(key) as T | undefined) ??
    null
  );
}

export async function getCachedData<T>(
  key: string
): Promise<T | null> {
  try {
    const memoryValue =
      memoryCache.get(key);

    if (memoryValue !== undefined) {
      return memoryValue as T;
    }

    const value =
      await AsyncStorage.getItem(key);

    if (!value) {
      return null;
    }

    const parsed =
      JSON.parse(value) as T;

    memoryCache.set(
      key,
      parsed
    );

    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedData(
  key: string,
  value: unknown
) {
  memoryCache.set(
    key,
    value
  );

  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch {}
}

export async function removeCachedData(
  key: string
) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export function setMemoryCachedData(
  key: string,
  value: unknown
) {
  memoryCache.set(key, value);
}