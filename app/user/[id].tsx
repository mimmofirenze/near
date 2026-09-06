import {
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useEffect, useState } from "react";
import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { styles } from "../../styles/profileStyles";

import {
  getProfileById,
  getVisitedCountriesByUserId,
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

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { theme, colorScheme } =
    useAppTheme();

  const defaultAvatar =
  colorScheme === "dark"
    ? require("../../assets/images/Sample_User_Icon-dark.png")
    : require("../../assets/images/Sample_User_Icon.png");

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [visitedCountries, setVisitedCountries] =
    useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!id) {
        setErrorMessage("Invalid user.");
        setLoading(false);
        return;
      }

      const [
        { profile, error: profileError },
        {
          countries,
          error: countriesError,
        },
      ] = await Promise.all([
        getProfileById(id),
        getVisitedCountriesByUserId(id),
      ]);

      if (profileError) {
        setErrorMessage(profileError.message);
        setLoading(false);
        return;
      }

      if (countriesError) {
        setErrorMessage(countriesError.message);
      } else {
        setVisitedCountries(countries);
      }

      setProfile(profile);
      setLoading(false);
    };

    loadUserProfile();
  }, [id]);

  const memberSince = profile?.created_at
    ? new Date(
        profile.created_at
      ).toLocaleDateString("en-GB")
    : "";

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.screen,
          {
            backgroundColor:
              theme.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: theme.text }}>
          Loading...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor:
            theme.background,
        },
      ]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: "100%",
            marginBottom: 20,
          }}
        >
          <Ionicons
            name="arrow-back-outline"
            size={30}
            color={theme.text}
            onPress={() => router.back()}
          />
        </View>

        {errorMessage ? (
          <Text
            style={[
              styles.bio,
              { color: "#E53935" },
            ]}
          >
            {errorMessage}
          </Text>
        ) : null}

        <Image
          source={
            profile?.avatar_url
              ? {
                  uri: profile.avatar_url,
                }
              : defaultAvatar
          }
          style={styles.profileImage}
        />

        <View style={styles.nameRow}>
          <Text
            style={[
              styles.name,
              { color: theme.text },
            ]}
          >
            {profile?.first_name}
          </Text>

          <Text style={styles.mainFlag}>
            {countryCodeToFlag(
              profile?.country_code
            )}
          </Text>
        </View>

        <Text
          style={[
            styles.username,
            { color: theme.text },
          ]}
        >
          {profile?.username
            ? `ID: ${profile.username}`
            : ""}
        </Text>

        <Text
          style={[
            styles.bio,
            { color: theme.text },
          ]}
        >
          {profile?.bio || "No bio yet"}
        </Text>

        <View style={styles.countriesSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text },
            ]}
          >
            {visitedCountries.length} Countries
            visited:
          </Text>

          <View style={styles.flagsRow}>
            {visitedCountries.map(
              (countryCode) => (
                <View
                  key={countryCode}
                  style={styles.flagContainer}
                >
                  <Text style={styles.flag}>
                    {countryCodeToFlag(
                      countryCode
                    )}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        <Text
          style={[
            styles.memberSince,
            { color: theme.text },
          ]}
        >
          {memberSince
            ? `Near member since ${memberSince}`
            : ""}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}