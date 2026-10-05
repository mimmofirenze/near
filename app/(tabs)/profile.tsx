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
import Skeleton from "../../components/Skeleton";

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

  const [lastSeenPlace, setLastSeenPlace] =
  useState<string | null>(null);

  const [lastSeenAt, setLastSeenAt] =
  useState<string | null>(null);

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
        <View
          style={[
            styles.topBar,
            {
              justifyContent: "center",
            },
          ]}
        >
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

{loading && !profile ? (
  <>
    {/* Same layout as real avatar/name section */}
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginTop: 10,
        marginBottom: 18,
      }}
    >
      <Skeleton
        style={[
          styles.profileImage,
          {
            marginRight: 22,
          },
        ]}
      />

      <View
        style={{
          flex: 1,
          alignItems: "flex-start",
        }}
      >
        <Skeleton
          width={140}
          height={24}
          borderRadius={6}
        />

        <Skeleton
          width={100}
          height={16}
          borderRadius={5}
          style={{
            marginTop: 4,
          }}
        />
      </View>
    </View>

    {/* Bio - same area */}
    <Skeleton
      width="75%"
      height={18}
      borderRadius={5}
    />

    {/* Countries - same spacing */}
    <View style={styles.countriesSection}>
      <Skeleton
        width={155}
        height={20}
        borderRadius={5}
      />

      <View
        style={[
          styles.flagsRow,
          {
            marginTop: 8,
          },
        ]}
      >
        <Skeleton
          width={34}
          height={26}
          borderRadius={5}
        />

        <Skeleton
          width={34}
          height={26}
          borderRadius={5}
        />

        <Skeleton
          width={34}
          height={26}
          borderRadius={5}
        />
      </View>
    </View>

    {/* Member since */}
    <Skeleton
      width={175}
      height={16}
      borderRadius={5}
      style={{
        marginTop: 20,
      }}
    />
  </>
) : (
            <>
              {/* AVATAR + NAME + USERNAME */}

              <View
                style={{
                  flexDirection:
                    "row",
                  alignItems:
                    "center",
                  width: "100%",
                  marginTop: 10,
                  marginBottom: 18,
                }}
              >
                <Image
                  source={
                    profile?.avatar_url
                      ? {
                          uri: profile.avatar_url,
                        }
                      : defaultAvatar
                  }
                  style={[
                    styles.profileImage,
                    {
                      marginRight: 22,
                    },
                  ]}
                />

                <View
                  style={{
                    flex: 1,
                    alignItems:
                      "flex-start",
                  }}
                >
                  <View
                    style={{
                      flexDirection:
                        "row",
                      alignItems:
                        "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={[
                        styles.name,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    >
                      {profile?.first_name ??
                        ""}
                    </Text>

                    <Text
                      style={
                        styles.mainFlag
                      }
                    >
                      {countryCodeToFlag(
                        profile?.country_code
                      )}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.username,
                      {
                        color:
                          theme.text,
                        marginTop: 4,
                      },
                    ]}
                  >
                    {profile?.username
                      ? `ID: ${profile.username}`
                      : ""}
                  </Text>
                </View>
              </View>

              {/* BIO */}

              {profileError ? (
                <Text
                  style={[
                    styles.bio,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  {profileError}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.bio,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  {profile?.bio ||
                    "No bio yet"}
                </Text>
              )}

              {/* COUNTRIES */}

              <View
                style={
                  styles.countriesSection
                }
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  {
                    visitedCountries.length
                  }{" "}
                  Countries visited:
                </Text>

                <View
                  style={
                    styles.flagsRow
                  }
                >
                  {visitedCountries.map(
                    (countryCode) => (
                      <View
                        key={
                          countryCode
                        }
                        style={
                          styles.flagContainer
                        }
                      >
                        <Text
                          style={
                            styles.flag
                          }
                        >
                          {countryCodeToFlag(
                            countryCode
                          )}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              </View>

              {/* MEMBER SINCE */}

              <Text
                style={[
                  styles.memberSince,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                {memberSince
                  ? `Near member since ${memberSince}`
                  : "Near member since"}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}