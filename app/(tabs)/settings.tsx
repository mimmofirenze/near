import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";

import {
  getNearSettings,
  setShareLocation as saveShareLocation,
  setBackgroundLocation as saveBackgroundLocation,
  setNearbyNotifications as saveNearbyNotifications,
} from "../../utils/settings";

import {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  clearCurrentUserSharedLocation,
  updateCurrentUserLocation,
} from "../../utils/location";

import {
  Alert,
  Pressable,
  Linking,
  ScrollView,
  Modal,
  Switch,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "../../styles/settingsStyles";
import { signOut } from "../../utils/auth";
import { supabase } from "../../lib/supabase";

import {
  ThemePreference,
  useAppTheme,
} from "../../contexts/themeContext";

import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Settings() {
  const {
    theme,
    themePreference,
    setThemePreference,
  } = useAppTheme();

const { t, i18n } = useTranslation();

const [languageModalVisible, setLanguageModalVisible] =
  useState(false);

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

const changeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem("near_language", language);
    await i18n.changeLanguage(language);
    setLanguageModalVisible(false);
  } catch (error) {
    console.error("Could not change language:", error);
  }
};

  const [shareLocation, setShareLocation] =
    useState(true);

  const [backgroundLocation, setBackgroundLocation] =
    useState(true);

  const [nearbyNotifications, setNearbyNotifications] =
    useState(true);

  const [settingsLoaded, setSettingsLoaded] =
    useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getNearSettings();

        setShareLocation(settings.shareLocation);

        setBackgroundLocation(
          settings.backgroundLocation
        );

        setNearbyNotifications(
          settings.nearbyNotifications
        );
      } catch (error) {
        console.error(
          "Could not load settings:",
          error
        );
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  const handleShareLocationChange = async (
  value: boolean
) => {
  console.log("SHARE SWITCH CHANGED:", value);
  setShareLocation(value);

  await saveShareLocation(value);

  if (!value) {
    setBackgroundLocation(false);

    await saveBackgroundLocation(false);

    await stopBackgroundLocationTracking();

    console.log("ABOUT TO CLEAR LOCATION");

    await clearCurrentUserSharedLocation();

    return;
  }

  const { error } =
    await updateCurrentUserLocation();

  if (error) {
    Alert.alert(
      "Location",
      error.message
    );
  }
};

  const handleBackgroundLocationChange = async (
    value: boolean
  ) => {
    if (!shareLocation && value) {
      Alert.alert(
        t("settings.locationSharingOff"),
        t("settings.locationSharingOffDescription")
      );

      return;
    }

    if (value) {
      const { started, error } =
        await startBackgroundLocationTracking();

      if (error || !started) {
        Alert.alert(
          t("settings.backgroundLocation"),
          error?.message ?? t("settings.backgroundLocationError")
        );

        return;
      }
    } else {
      await stopBackgroundLocationTracking();
    }

    setBackgroundLocation(value);

    await saveBackgroundLocation(value);
  };

  const handleNearbyNotificationsChange = async (
    value: boolean
  ) => {
    setNearbyNotifications(value);

    await saveNearbyNotifications(value);
  };

  const handleLogout = async () => {
    const { error } = await signOut();

    if (error) {
      console.error(error.message);
      return;
    }

    router.replace("/");
  };

  const confirmLogout = () => {
    Alert.alert(
        t("settings.logout"),
        t("settings.logoutConfirmation"),
        [
          {
            text: t("settings.cancel"),
            style: "cancel",
          },
          {
            text: t("settings.logout"),
            style: "destructive",
            onPress: handleLogout,
          },
        ]
      );
  };

const deleteAccount = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      Alert.alert(
        t("settings.error"),
        t("settings.notLoggedIn")
      );
      return;
    }

    const { data, error } =
      await supabase.functions.invoke("delete-account");

    if (error) {
      console.error("Delete account error:", error);

      Alert.alert(
        t("settings.error"),
        t("settings.deleteAccountError")
      );

      return;
    }

    console.log("Account deleted:", data);

    // Clear local Supabase session
    await supabase.auth.signOut();
    router.replace("/");

    // Your auth listener / router should send them back to login.
  } catch (error) {
    console.error("Delete account failed:", error);

    Alert.alert(
      t("settings.error"),
      t("settings.deleteAccountError")
    );
  }
};

const confirmDeleteAccount = () => {
  Alert.alert(
    t("settings.deleteAccount"),
    t("settings.deleteAccountConfirmation"),
    [
      {
        text: t("settings.cancel"),
        style: "cancel",
      },
      {
        text: t("settings.delete"),
        style: "destructive",
        onPress: deleteAccount,
      },
    ]
  );
};

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
        },
      ]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
            },
          ]}
        >
          {t("settings.title")}
        </Text>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {t("settings.location")}
          </Text>

          <View
            style={[
              styles.settingCard,
              {
                borderColor: theme.text,
              },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons
                  name="location-outline"
                  size={24}
                  color={theme.text}
                />

                <View style={styles.settingTextContainer}>
                  <Text
                    style={[
                      styles.settingTitle,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    {t("settings.shareLocation")}
                  </Text>

                  <Text
                    style={[
                      styles.settingDescription,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    {t("settings.shareLocationDescription")}
                  </Text>
                </View>
              </View>

              <Switch
                value={shareLocation}
                onValueChange={handleShareLocationChange}
                disabled={!settingsLoaded}
                trackColor={{
                  false: "#767577",
                  true: "#81B0FF",
                }}
                thumbColor={
                  shareLocation ? "#2563EB" : "#F4F3F4"
                }
              />
            </View>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.text,
                },
              ]}
            />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons
                  name="navigate-outline"
                  size={24}
                  color={theme.text}
                />

                <View style={styles.settingTextContainer}>
                  <Text
                    style={[
                      styles.settingTitle,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    {t("settings.backgroundLocation")}
                  </Text>

                  <Text
                    style={[
                      styles.settingDescription,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    {t("settings.backgroundLocationDescription")}
                  </Text>
                </View>
              </View>

              <Switch
                value={backgroundLocation}
                onValueChange={handleBackgroundLocationChange}
                disabled={!settingsLoaded || !shareLocation}
                trackColor={{
                  false: "#767577",
                  true: "#81B0FF",
                }}
                thumbColor={
                  backgroundLocation
                    ? "#2563EB"
                    : "#F4F3F4"
                }
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {t("settings.notifications")}
          </Text>

          <View
            style={[
              styles.settingCard,
              {
                borderColor: theme.text,
              },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={theme.text}
                />

                <View style={styles.settingTextContainer}>
                  <Text
                    style={[
                      styles.settingTitle,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    {t("settings.nearbyFriends")}
                  </Text>

                  <Text
                    style={[
                      styles.settingDescription,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    {t("settings.nearbyFriendsDescription")}
                  </Text>
                </View>
              </View>

              <Switch
                value={nearbyNotifications}
                onValueChange={handleNearbyNotificationsChange}
                disabled={!settingsLoaded}
                trackColor={{
                  false: "#767577",
                  true: "#81B0FF",
                }}
                thumbColor={
                  nearbyNotifications
                    ? "#2563EB"
                    : "#F4F3F4"
                }
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text },
            ]}
          >
            {t("settings.appearance")}
          </Text>

          <View
            style={[
              styles.settingCard,
              {
                borderColor: theme.text,
              },
            ]}
          >
            {(
              [
                {
                  label: t("settings.system"),
                  value: "system",
                  icon: "phone-portrait-outline",
                },
                {
                  label: t("settings.light"),
                  value: "light",
                  icon: "sunny-outline",
                },
                {
                  label: t("settings.dark"),
                  value: "dark",
                  icon: "moon-outline",
                },
              ] as {
                label: string;
                value: ThemePreference;
                icon:
                  | "phone-portrait-outline"
                  | "sunny-outline"
                  | "moon-outline";
              }[]
            ).map((option, index) => (
              <View key={option.value}>
                <Pressable
                  onPress={() =>
                    setThemePreference(
                      option.value
                    )
                  }
                  style={({ pressed }) => [
                    styles.themeRow,
                    pressed && {
                      opacity: 0.6,
                    },
                  ]}
                >
                  <View style={styles.settingInfo}>
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={theme.text}
                    />

                    <Text
                      style={[
                        styles.settingTitle,
                        {
                          color: theme.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>

                  {themePreference ===
                  option.value ? (
                    <Ionicons
                      name="checkmark-outline"
                      size={25}
                      color="#2563EB"
                    />
                  ) : null}
                </Pressable>

                {index < 2 ? (
                  <View
                    style={[
                      styles.divider,
                      {
                        backgroundColor:
                          theme.text,
                      },
                    ]}
                  />
                ) : null}
              </View>
            ))}
          </View>
        </View>

        
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text },
            ]}
          >
            {t("language.select")}
          </Text>

          <View
            style={[
              styles.settingCard,
              { borderColor: theme.text },
            ]}
          >
            <Pressable
              style={styles.settingRow}
              onPress={() => setLanguageModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t("language.select")}
            >
              <View style={styles.settingInfo}>
                <Ionicons
                  name="globe-outline"
                  size={24}
                  color={theme.text}
                />

                <View style={styles.settingTextContainer}>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: theme.text },
                    ]}
                  >
                    {t("settings.language")}
                  </Text>

                  <Text
                    style={[
                      styles.settingDescription,
                      { color: theme.text },
                    ]}
                  >
                    {t("settings.languageDescription")}
                  </Text>
                </View>
              </View>

              <Text style={{ color: theme.text, fontWeight: "600" }}>
                {i18n.resolvedLanguage?.toUpperCase() ?? "EN"}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.text}
              />
            </Pressable>
          </View>
        </View>


        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {t("settings.account")}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
              {
                backgroundColor: theme.background,
                borderColor: "#E53935",
              },
            ]}
            onPress={confirmLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color="#E53935"
            />

            <Text
              style={[
                styles.logoutButtonText,
                {
                  color: "#E53935",
                },
              ]}
            >
              {t("settings.account")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {t("settings.support")}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
              {
                backgroundColor: theme.background,
                borderColor: "#2563EB",
              },
            ]}
            onPress={() =>
              Linking.openURL(
                "mailto:support@app-near.me?subject=Near%20Support"
              )
            }
          >
            <Ionicons
              name="mail-outline"
              size={22}
              color="#2563EB"
            />

            <Text
              style={[
                styles.logoutButtonText,
                {
                  color: "#2563EB",
                },
              ]}
            >
              {t("settings.contactSupport")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: "#E53935",
              },
            ]}
          >
            {t("settings.dangerZone")}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
              {
                backgroundColor: theme.background,
                borderColor: "#E53935",
              },
            ]}
            onPress={confirmDeleteAccount}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color="#E53935"
            />

            <Text
              style={[
                styles.logoutButtonText,
                {
                  color: "#E53935",
                },
              ]}
            >
              {t("settings.deleteAccount")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

    
<Modal
  visible={languageModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setLanguageModalVisible(false)}
>
  <Pressable
    onPress={() => setLanguageModalVisible(false)}
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      paddingHorizontal: 32,
    }}
  >
    <Pressable
      onPress={(event) => event.stopPropagation()}
      style={{
        backgroundColor: theme.background,
        borderRadius: 18,
        padding: 20,
        gap: 8,
      }}
    >
      <Text
        style={{
          color: theme.text,
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        {t("language.select")}
      </Text>

      {languages.map((language) => (
        <Pressable
          key={language.code}
          onPress={() => changeLanguage(language.code)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 14,
            paddingHorizontal: 10,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 22 }}>
            {language.flag}
          </Text>

          <Text
            style={{
              color: theme.text,
              fontSize: 16,
              flex: 1,
            }}
          >
            {language.label}
          </Text>

          {i18n.resolvedLanguage === language.code && (
            <Ionicons
              name="checkmark-circle"
              color="#2563EB"
              size={22}
            />
          )}
        </Pressable>
      ))}
    </Pressable>
  </Pressable>
</Modal>


    </SafeAreaView>
  );
}