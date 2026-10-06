import {
  Image,
  ScrollView,
  Text,
  View,
  Pressable,
  Alert,
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

import {
  sendFriendRequest,
  getRelationshipStatuses,
  getIncomingFriendRequestFromUser,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriendByUserId,
  type RelationshipStatus,
} from "../../utils/friends";

import {
  getUserLastSeenLocation,
} from "../../utils/location";

import { openOrCreateDirectConversation } from "../../utils/chat";

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

  const [relationshipStatus, setRelationshipStatus] =
  useState<RelationshipStatus | null>(null);

  const [sendingRequest, setSendingRequest] =
  useState(false);

  const [incomingRequestId, setIncomingRequestId] =
  useState<string | null>(null);

  const [processingRequest, setProcessingRequest] =
  useState(false);

  const [lastSeenPlace, setLastSeenPlace] =
  useState<string | null>(null);

  const [lastSeenAt, setLastSeenAt] =
  useState<string | null>(null);

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
        {
          lastSeen,
          error: locationError,
        },
      ] = await Promise.all([
        getProfileById(id),
        getVisitedCountriesByUserId(id),
        getUserLastSeenLocation(id),
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

      if (locationError) {
        console.log(
          "Last seen location error:",
          locationError.message
        );
      }

      setLastSeenPlace(lastSeen.place);
      setLastSeenAt(lastSeen.updatedAt);

      setProfile(profile);

const {
  statuses,
  error: statusError,
} = await getRelationshipStatuses();

if (!statusError && id) {
  const status = statuses[id] ?? null;

  setRelationshipStatus(status);

  if (status === "incoming_pending") {
    const { request, error } =
      await getIncomingFriendRequestFromUser(id);

    if (!error && request) {
      setIncomingRequestId(request.id);
    }
  }
}
      setLoading(false);
    };

    loadUserProfile();
  }, [id]);

  const handleAddFriend = async () => {
  if (!id || sendingRequest) return;

  try {
    setSendingRequest(true);
    setErrorMessage("");

    const { error } =
      await sendFriendRequest(id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setRelationshipStatus(
      "outgoing_pending"
    );
  } catch {
    setErrorMessage(
      "Could not send friend request."
    );
  } finally {
    setSendingRequest(false);
  }
};

const handleAcceptRequest = async () => {
  if (!incomingRequestId || processingRequest) {
    return;
  }

  try {
    setProcessingRequest(true);
    setErrorMessage("");

    const { error } =
      await acceptFriendRequest(incomingRequestId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setRelationshipStatus("friend");
    setIncomingRequestId(null);
  } catch {
    setErrorMessage(
      "Could not accept the friend request."
    );
  } finally {
    setProcessingRequest(false);
  }
};

const handleDeclineRequest = async () => {
  if (!incomingRequestId || processingRequest) {
    return;
  }

  try {
    setProcessingRequest(true);
    setErrorMessage("");

    const { error } =
      await declineFriendRequest(incomingRequestId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setRelationshipStatus(null);
    setIncomingRequestId(null);
  } catch {
    setErrorMessage(
      "Could not decline the friend request."
    );
  } finally {
    setProcessingRequest(false);
  }
};

const handleRemoveFriend = () => {
  if (!id) return;

  Alert.alert(
    "Remove friend",
    `Remove ${profile?.first_name ?? "this user"} from your friends?`,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const { error } =
            await removeFriendByUserId(id);

          if (error) {
            setErrorMessage(error.message);
            return;
          }

          setRelationshipStatus(null);
        },
      },
    ]
  );
};

const handleSeeOnMap = () => {
  if (!id) return;

  router.push({
    pathname: "/(tabs)/home",
    params: {
      friendId: id,
    },
  });
};

const handleOpenChat = async () => {
  if (!id) return;

  const { conversationId, error } =
    await openOrCreateDirectConversation(id);

  if (error || !conversationId) {
    setErrorMessage(
      error?.message ?? "Could not open chat."
    );
    return;
  }

  router.push(`/chat/${conversationId}`);
};

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
          backgroundColor: theme.background,
        },
      ]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* BACK */}
        <View
          style={{
            width: "100%",
            marginTop: 34,
            marginBottom: 0,
          }}
        >
          <Ionicons
            name="arrow-back-outline"
            size={30}
            color={theme.text}
            onPress={() => router.back()}
          />
        </View>

        {/* AVATAR + NAME */}
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

            <Skeleton
              width={85}
              height={16}
              borderRadius={5}
              style={{
                marginTop: 8,
              }}
            />
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            gap: 12,
            marginTop: 10,
          }}
        >
          <Skeleton
            height={40}
            borderRadius={20}
            style={{ flex: 1 }}
          />

          <Skeleton
            height={40}
            borderRadius={20}
            style={{ flex: 1 }}
          />
        </View>

        {/* BIO */}
        <Skeleton
          width="75%"
          height={18}
          borderRadius={5}
          style={{
            marginTop: 24,
          }}
        />

        {/* LAST SEEN */}
        <View style={styles.locationSection}>
          <Skeleton
            width={100}
            height={20}
            borderRadius={5}
          />

          <Skeleton
            width={150}
            height={18}
            borderRadius={5}
            style={{
              marginTop: 8,
            }}
          />

          <Skeleton
            width={130}
            height={14}
            borderRadius={5}
            style={{
              marginTop: 6,
            }}
          />
        </View>

        {/* COUNTRIES */}
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

        {/* MEMBER SINCE */}
        <Skeleton
          width={175}
          height={16}
          borderRadius={5}
          style={{
            marginTop: 20,
          }}
        />
      </ScrollView>
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
            marginTop: 34,
            marginBottom: 0,
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

                <View
          style={{
            flexDirection: "row",
            alignItems: "center",
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
              alignItems: "flex-start",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text
                style={[
                  styles.name,
                  {
                    color: theme.text,
                  },
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
                {
                  color: theme.text,
                  marginTop: 4,
                },
              ]}
            >
              {profile?.username
                ? `ID: ${profile.username}`
                : ""}
            </Text>
            {relationshipStatus === "friend" ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 8,
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={theme.text}
                />

                <Text
                  style={{
                    color: theme.text,
                    fontFamily: "alanRegular",
                    fontSize: 15,
                  }}
                >
                  Friends
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {relationshipStatus === "incoming_pending" ? (
  <View
    style={{
      flexDirection: "row",
      gap: 10,
      marginTop: 16,
    }}
  >
    <Pressable
      disabled={processingRequest}
      onPress={handleAcceptRequest}
      style={({ pressed }) => ({
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#B8E6C1",
        opacity:
          processingRequest
            ? 0.5
            : pressed
            ? 0.7
            : 1,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Ionicons
          name="checkmark-outline"
          size={19}
          color="#224A2B"
        />

        <Text
          style={{
            color: "#224A2B",
            fontFamily: "alanRegular",
            fontSize: 15,
          }}
        >
          Accept
        </Text>
      </View>
    </Pressable>

    <Pressable
      disabled={processingRequest}
      onPress={handleDeclineRequest}
      style={({ pressed }) => ({
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#F1B8B8",
        opacity:
          processingRequest
            ? 0.5
            : pressed
            ? 0.7
            : 1,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Ionicons
          name="close-outline"
          size={19}
          color="#5A2020"
        />

        <Text
          style={{
            color: "#5A2020",
            fontFamily: "alanRegular",
            fontSize: 15,
          }}
        >
          Decline
        </Text>
      </View>
    </Pressable>
  </View>
  ) : relationshipStatus === "friend" ? null : (
    <Pressable
    disabled={
      sendingRequest ||
      relationshipStatus === "friend" ||
      relationshipStatus === "outgoing_pending"
    }
    onPress={handleAddFriend}
    style={({ pressed }) => [
      {
        marginTop: 16,
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.text,
        opacity:
          sendingRequest ||
          relationshipStatus === "friend" ||
          relationshipStatus === "outgoing_pending"
            ? 0.55
            : pressed
            ? 0.65
            : 1,
      },
    ]}
  >
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      {relationshipStatus === "friend" && (
        <Ionicons
          name="checkmark-circle"
          size={18}
          color={theme.text}
        />
      )}

      <Text
        style={{
          color: theme.text,
          fontFamily: "alanRegular",
          fontSize: 15,
        }}
      >
        {sendingRequest
          ? "Sending..."
          : relationshipStatus === "friend"
          ? "Friends"
          : relationshipStatus === "outgoing_pending"
          ? "Requested"
          : "Add friend"}
      </Text>
    </View>
  </Pressable>
)}

        {relationshipStatus === "friend" ? (
  <View
    style={{
      flexDirection: "row",
      width: "100%",
      gap: 12,
      marginTop: 10,
    }}
  >
    <Pressable
      onPress={handleSeeOnMap}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: theme.text,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Ionicons
          name="map-outline"
          size={18}
          color={theme.background}
        />

        <Text
          style={{
            color: theme.background,
            fontFamily: "alanRegular",
            fontSize: 15,
          }}
        >
          See on map
        </Text>
      </View>
    </Pressable>

    <Pressable
      onPress={handleOpenChat}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.text,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Ionicons
          name="chatbubble-outline"
          size={18}
          color={theme.text}
        />

        <Text
          style={{
            color: theme.text,
            fontFamily: "alanRegular",
            fontSize: 15,
          }}
        >
          Chat
        </Text>
      </View>
    </Pressable>
  </View>
) : null}

        <Text
          style={[
            styles.bio,
            { color: theme.text },
          ]}
        >
          {profile?.bio || "No bio yet"}
        </Text>

        <View style={styles.locationSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text },
            ]}
          >
            Last seen in:
          </Text>

          <Text
            style={[
              styles.location,
              { color: theme.text },
            ]}
          >
            {lastSeenPlace ?? "Location unavailable"}
          </Text>

          {lastSeenAt ? (
            <Text
              style={[
                styles.lastUpdate,
                { color: theme.text },
              ]}
            >
              {`(Last update: ${new Date(
                lastSeenAt
              ).toLocaleTimeString([], {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })})`}
            </Text>
          ) : null}
        </View>

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
        {relationshipStatus === "friend" ? (
          <Pressable
            onPress={handleRemoveFriend}
            style={({ pressed }) => ({
              marginTop: 30,
              marginBottom: 50,
              paddingHorizontal: 22,
              paddingVertical: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#E53935",
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons
                name="person-remove-outline"
                size={18}
                color="#E53935"
              />

              <Text
                style={{
                  color: "#E53935",
                  fontFamily: "alanRegular",
                  fontSize: 15,
                }}
              >
                Remove friend
              </Text>
            </View>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}