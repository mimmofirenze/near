import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "../contexts/themeContext";
import { getCurrentProfile } from "../utils/profile";

type Profile = {
  id: string;
  first_name: string;
  username: string | null;
  avatar_url: string | null;
};

export default function QRScreen() {
  const { theme, colorScheme } = useAppTheme();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);

  const defaultAvatar =
    colorScheme === "dark"
      ? require("../assets/images/Sample_User_Icon-dark.png")
      : require("../assets/images/Sample_User_Icon.png");

  useEffect(() => {
    const loadProfile = async () => {
      const { profile, error } =
        await getCurrentProfile();

      if (!error && profile) {
        setProfile(profile);
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
        }}
      >
        {/* Header */}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons
              name="chevron-back"
              size={30}
              color={theme.text}
            />
          </Pressable>

          <Text
            style={{
              color: theme.text,
              fontFamily: "alanRegular",
              fontSize: 28,
              marginLeft: 12,
            }}
          >
            My QR
          </Text>
        </View>

        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" />
          </View>
        ) : profile ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              paddingTop: 45,
            }}
          >
            {/* User */}

            <Image
              source={
                profile.avatar_url
                  ? { uri: profile.avatar_url }
                  : defaultAvatar
              }
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
              }}
            />

            <Text
              style={{
                color: theme.text,
                fontFamily: "alanRegular",
                fontSize: 24,
                marginTop: 12,
              }}
            >
              {profile.first_name}
            </Text>

            {profile.username ? (
              <Text
                style={{
                  color: theme.text,
                  fontFamily: "alanRegular",
                  fontSize: 15,
                  opacity: 0.6,
                  marginTop: 3,
                }}
              >
                ID: {profile.username}
              </Text>
            ) : null}

            {/* QR */}

            <View
              style={{
                marginTop: 32,
                backgroundColor: "#FFFFFF",
                padding: 22,
                borderRadius: 26,
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: 12,
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                elevation: 6,
              }}
            >
              <Image
                source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent(
                    `near://user/${profile.id}`
                    )}`,
                }}
                style={{
                    width: 220,
                    height: 220,
                }}
                resizeMode="contain"
                />
            </View>

            <Text
              style={{
                color: theme.text,
                fontFamily: "alanRegular",
                fontSize: 15,
                opacity: 0.6,
                textAlign: "center",
                marginTop: 22,
                paddingHorizontal: 30,
              }}
            >
              Let someone scan your QR code to find you on Near.
            </Text>

            {/* Scanner button */}

            <Pressable
              onPress={() => router.push("/qr-scanner")}
              style={({ pressed }) => ({
                marginTop: 30,
                width: "100%",
                maxWidth: 330,
                paddingVertical: 15,
                borderRadius: 18,
                backgroundColor: "#2563EB",
                opacity: pressed ? 0.75 : 1,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 9,
              })}
            >
              <Ionicons
                name="scan-outline"
                size={23}
                color="#FFFFFF"
              />

              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "alanRegular",
                  fontSize: 17,
                }}
              >
                Scan a QR code
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: theme.text,
                fontFamily: "alanRegular",
              }}
            >
              Could not load your profile.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}