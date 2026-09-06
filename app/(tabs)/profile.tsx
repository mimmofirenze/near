import {
  Image,
  Pressable,
  Text,
  View,
  ScrollView,
} from "react-native";

import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "../../styles/profileStyles";
import {
  getCurrentProfile,
  getVisitedCountries,
} from "../../utils/profile";
import { countryCodeToFlag } from "../../utils/countries";

import { useAppTheme } from "../../contexts/themeContext";

type Profile = {
  id: string;
  first_name: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  country_code: string | null;
  created_at: string;
  updated_at: string;
};

export default function ProfileScreen() {

  const { theme, colorScheme } =
  useAppTheme();

  const defaultAvatar =
  colorScheme === "dark"
    ? require("../../assets/images/Sample_User_Icon-dark.png")
    : require("../../assets/images/Sample_User_Icon.png");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [visitedCountries, setVisitedCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadProfile = async () => {
        setProfile((currentProfile) => {
          if (!currentProfile) {
            setLoading(true);
          }

          return currentProfile;
        });

        setProfileError("");

        const [
          { profile: updatedProfile, error: profileLoadError },
          { countries, error: countriesError },
        ] = await Promise.all([
          getCurrentProfile(),
          getVisitedCountries(),
        ]);

        if (!isActive) {
          return;
        }

        if (profileLoadError) {
          setProfileError(profileLoadError.message);
          setLoading(false);
          return;
        }

        if (countriesError) {
          setProfileError(countriesError.message);
        } else {
          setVisitedCountries(countries);
        }

        setProfile(updatedProfile);
        setLoading(false);
      };

      loadProfile();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-GB")
    : "";

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
      edges={["top"]}
    >

      <ScrollView
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
            },
          ]}
        >
          Profile
        </Text>
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              {
                backgroundColor: theme.background,
                borderColor: theme.text,
              },
            ]}
            onPress={() => router.push("/edit-profile")}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>
              Edit profile
            </Text>
          </Pressable>
        </View>

        <Image
          source={
            profile?.avatar_url
              ? { uri: profile.avatar_url }
              : defaultAvatar
          }
          style={styles.profileImage}
        />

        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.text }]}>
            {profile?.first_name ?? (loading ? "Loading..." : "")}
          </Text>

          <Text style={styles.mainFlag}>
            {countryCodeToFlag(profile?.country_code)}
          </Text>
        </View>

        <Text style={[styles.username, { color: theme.text }]}>
          {profile?.username ? `ID: ${profile.username}` : ""}
        </Text>

        {profileError ? (
          <Text style={[styles.bio, { color: theme.text }]}>
            {profileError}
          </Text>
        ) : (
          <Text style={[styles.bio, { color: theme.text }]}>
            {profile?.bio || "No bio yet"}
          </Text>
        )}

        <View style={styles.locationSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Last seen in:
          </Text>

          <Text style={[styles.location, { color: theme.text }]}>
            Florence, Italy
          </Text>

          <Text style={[styles.lastUpdate, { color: theme.text }]}>
            (Last update: 2h ago)
          </Text>
        </View>

        <View style={styles.countriesSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {visitedCountries.length} Countries visited:
          </Text>

          <View style={styles.flagsRow}>
            {visitedCountries.map((countryCode) => (
              <View key={countryCode} style={styles.flagContainer}>
                <Text style={styles.flag}>
                  {countryCodeToFlag(countryCode)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.memberSince, { color: theme.text }]}>
          {memberSince
            ? `Near member since ${memberSince}`
            : "Near member since"}
        </Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}