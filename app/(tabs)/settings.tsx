import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";

import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "../../styles/settingsStyles";
import { signOut } from "../../utils/auth";

import {
  ThemePreference,
  useAppTheme,
} from "../../contexts/themeContext";

export default function Settings() {
  const {
  theme,
  themePreference,
  setThemePreference,
} = useAppTheme();

  const [shareLocation, setShareLocation] = useState(true);
  const [backgroundLocation, setBackgroundLocation] =
    useState(true);
  const [nearbyNotifications, setNearbyNotifications] =
    useState(true);

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
      "Log out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log out",
          style: "destructive",
          onPress: handleLogout,
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
  Alert.alert(
    "Delete account",
    "This will permanently delete your Near account and all associated data. This action cannot be undone.",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete account",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Coming soon",
            "Account deletion will be connected to the backend soon."
          );
        },
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
          Settings
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
            Location
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
                    Share my location
                  </Text>

                  <Text
                    style={[
                      styles.settingDescription,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    Let your friends see where you are.
                  </Text>
                </View>
              </View>

              <Switch
                value={shareLocation}
                onValueChange={setShareLocation}
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
                    Background location
                  </Text>

                  <Text
                    style={[
                      styles.settingDescription,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    Keep your location updated when Near is
                    in the background.
                  </Text>
                </View>
              </View>

              <Switch
                value={backgroundLocation}
                onValueChange={setBackgroundLocation}
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
            Notifications
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
                    Nearby friends
                  </Text>

                  <Text
                    style={[
                      styles.settingDescription,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    Get notified when a friend is nearby.
                  </Text>
                </View>
              </View>

              <Switch
                value={nearbyNotifications}
                onValueChange={setNearbyNotifications}
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
            Appearance
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
                  label: "System",
                  value: "system",
                  icon: "phone-portrait-outline",
                },
                {
                  label: "Light",
                  value: "light",
                  icon: "sunny-outline",
                },
                {
                  label: "Dark",
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
              {
                color: theme.text,
              },
            ]}
          >
            Account
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
              Log out
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
            Danger zone
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
              Delete account
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}