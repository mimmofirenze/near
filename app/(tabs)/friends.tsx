import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { router, useFocusEffect } from "expo-router";

import { styles } from "../../styles/friendsStyles";

import {
  searchUsers,
  sendFriendRequest,
  getIncomingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getRelationshipStatuses,
  type RelationshipStatus,
} from "../../utils/friends";

import { countryCodeToFlag } from "../../utils/countries";

import { useAppTheme } from "../../contexts/themeContext";

import { supabase } from "../../lib/supabase";
import Skeleton from "../../components/Skeleton";

type UserProfile = {
  id: string;
  first_name: string;
  username: string | null;
  avatar_url: string | null;
  country_code: string | null;
};

type IncomingRequest = {
  id: string;
  created_at: string;
  sender: UserProfile;
};

type FriendItem = {
  friendshipId: string;
  profile: UserProfile;
};

export default function FriendsScreen() {

  const { theme, colorScheme } =
  useAppTheme();

  const defaultAvatar =
  colorScheme === "dark"
    ? require("../../assets/images/Sample_User_Icon-dark.png")
    : require("../../assets/images/Sample_User_Icon.png");

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);

  const [incomingRequests, setIncomingRequests] = useState<
    IncomingRequest[]
  >([]);

  const [friends, setFriends] = useState<FriendItem[]>([]);

  const [searching, setSearching] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [sendingRequestId, setSendingRequestId] =
    useState<string | null>(null);

  const [processingRequestId, setProcessingRequestId] =
    useState<string | null>(null);

  const [requestedUserIds, setRequestedUserIds] = useState<string[]>(
    []
  );

  const [relationshipStatuses, setRelationshipStatuses] =
    useState<Record<string, RelationshipStatus>>({});

  const loadFriendsData = useCallback(async () => {
    try {
      setErrorMessage("");

      const [
        { requests, error: requestsError },
        { friends: loadedFriends, error: friendsError },
        { statuses, error: statusesError },
      ] = await Promise.all([
        getIncomingFriendRequests(),
        getFriends(),
        getRelationshipStatuses(),
      ]);

      if (requestsError) {
        setErrorMessage(requestsError.message);
      } else {
        setIncomingRequests(
          requests as unknown as IncomingRequest[]
        );
      }

      if (friendsError) {
        setErrorMessage(friendsError.message);
      } else {
        setFriends(
          loadedFriends as unknown as FriendItem[]
        );
      }

      if (statusesError) {
        setErrorMessage(statusesError.message);
      } else {
        setRelationshipStatuses(statuses);
      }
    } catch {
      setErrorMessage("Could not load your friends.");
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFriendsData();
    }, [loadFriendsData])
  );

useEffect(() => {
  const channel = supabase
    .channel(
      `friends-screen-realtime-${Date.now()}`
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "friendships",
      },
      () => {
        loadFriendsData();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [loadFriendsData]);

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      setUsers([]);
      setSearching(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setSearching(true);
        setErrorMessage("");

        const { users: results, error } =
          await searchUsers(query);

        if (error) {
          setErrorMessage(error.message);
          setUsers([]);
          return;
        }

        setUsers(results as UserProfile[]);
      } catch {
        setErrorMessage("Could not search users.");
        setUsers([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  const handleAddFriend = async (userId: string) => {
    try {
      setSendingRequestId(userId);
      setErrorMessage("");

      const { error } = await sendFriendRequest(userId);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setRequestedUserIds((currentIds) => [
        ...currentIds,
        userId,
      ]);

      setRelationshipStatuses((currentStatuses) => ({
        ...currentStatuses,
        [userId]: "outgoing_pending",
      }));
    } catch {
      setErrorMessage("Could not send the friend request.");
    } finally {
      setSendingRequestId(null);
    }
  };

  const handleAcceptRequest = async (
    friendshipId: string
  ) => {
    try {
      setProcessingRequestId(friendshipId);
      setErrorMessage("");

      const { error } = await acceptFriendRequest(friendshipId);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setIncomingRequests((currentRequests) =>
        currentRequests.filter(
          (request) => request.id !== friendshipId
        )
      );

      await loadFriendsData();
    } catch {
      setErrorMessage("Could not accept the friend request.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDeclineRequest = async (
    friendshipId: string
  ) => {
    try {
      setProcessingRequestId(friendshipId);
      setErrorMessage("");

      const { error } = await declineFriendRequest(friendshipId);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setIncomingRequests((currentRequests) =>
        currentRequests.filter(
          (request) => request.id !== friendshipId
        )
      );
    } catch {
      setErrorMessage("Could not decline the friend request.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const renderProfileCard = (
    profile: UserProfile,
    rightElement: ReactNode
  ) => (
    <View
      style={[
        styles.friendCard,
        {
          backgroundColor:
            colorScheme === "dark" ? "#22212D" : "#FFFCF3",
        },
      ]}
    >
      <Image
        source={
          profile.avatar_url
            ? { uri: profile.avatar_url }
            : defaultAvatar
        }
        style={styles.avatar}
      />

      <Pressable
        style={styles.friendInfo}
        onPress={() =>
          router.push({
            pathname: "/user/[id]",
            params: { id: profile.id },
          })
        }
      >
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.text }]}>
            {profile.first_name}
          </Text>

          <Text style={styles.flag}>
            {countryCodeToFlag(profile.country_code)}
          </Text>
        </View>

        <Text
          style={[
            styles.username,
            {
              color:
                colorScheme === "dark" ? "#A9A7B2" : "#333333",
            },
          ]}
        >
          ID: {profile.username ?? "No ID"}
        </Text>
      </Pressable>

      {rightElement}
    </View>
  );

  const FriendSkeleton = () => (
  <View
    style={[
      styles.friendCard,
      {
        backgroundColor:
          colorScheme === "dark"
            ? "#22212D"
            : "#FFFCF3",
      },
    ]}
  >
    <Skeleton
      style={styles.avatar}
    />

    <View style={styles.friendInfo}>
      <View style={styles.nameRow}>
        <Skeleton
          width={120}
          height={18}
          borderRadius={5}
        />
      </View>

      <Skeleton
        width={90}
        height={14}
        borderRadius={5}
        style={{
          marginTop: 6,
        }}
      />
    </View>

    <Skeleton
      width={58}
      height={36}
      borderRadius={18}
    />
  </View>
);

  return (
    <SafeAreaView
      style={[
        styles.screen,
        { backgroundColor: theme.background },
      ]}
      edges={["top", "left", "right"]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={[
              styles.title,
              {
                color: theme.text,
              },
            ]}
          >
            Friends
          </Text>

          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={27}
                color="#888888"
                style={styles.searchIcon}
              />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Add friends by ID"
                placeholderTextColor="#999999"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.searchInput}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.qrButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push("/qr")}
            >
              <Ionicons
                name="qr-code-outline"
                size={39}
                color={theme.text}
              />
            </Pressable>
          </View>

          {errorMessage ? (
            <Text
              style={[
                styles.emptyText,
                { color: "#E53935" },
              ]}
            >
              {errorMessage}
            </Text>
          ) : null}

          {search.trim() ? (
            <View style={{ marginTop: 18 }}>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 20,
                  fontFamily: "alanRegular",
                  marginBottom: 12,
                }}
              >
                Search results
              </Text>

              {searching ? (
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.text },
                  ]}
                >
                  Searching...
                </Text>
              ) : users.length === 0 ? (
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.text },
                  ]}
                >
                  No users found
                </Text>
              ) : (
                users.map((item) => {
                  const requestSent =
                    requestedUserIds.includes(item.id);

                  const requestLoading =
                    sendingRequestId === item.id;

                  const relationshipStatus =
                    relationshipStatuses[item.id];

                  const rightElement =
                    relationshipStatus === "friend" ? (
                      <Pressable
                        style={({ pressed }) => [
                          styles.viewButton,
                          {
                            borderColor:
                              colorScheme === "dark"
                                ? "#8B8998"
                                : "#333333",
                          },
                          pressed && styles.pressed,
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: "/user/[id]",
                            params: { id: item.id },
                          })
                        }
                      >
                        <Text 
                        style={[
                          styles.viewButtonText,
                          {
                            color: theme.text,
                            borderColor:
                              colorScheme === "dark"
                                ? "#8B8998"
                                : "#111111",
                          },
                        ]}
                        >
                          View
                        </Text>
                      </Pressable>
                    ) : relationshipStatus ===
                      "outgoing_pending" ? (
                      <View
                        style={[
                          styles.addButton,
                          { opacity: 0.55 },
                        ]}
                      >
                        <Ionicons
                          name="time-outline"
                          size={25}
                          color="#333333"
                        />
                      </View>
                    ) : relationshipStatus ===
                      "incoming_pending" ? (
                      <View
                        style={[
                          styles.addButton,
                          { opacity: 0.55 },
                        ]}
                      >
                        <Ionicons
                          name="mail-unread-outline"
                          size={24}
                          color="#333333"
                        />
                      </View>
                    ) : (
                      <Pressable
                        style={({ pressed }) => [
                          styles.addButton,
                          pressed &&
                            !requestSent &&
                            styles.pressed,
                          (requestSent ||
                            requestLoading) && {
                            opacity: 0.55,
                          },
                        ]}
                        disabled={
                          requestSent || requestLoading
                        }
                        onPress={() =>
                          handleAddFriend(item.id)
                        }
                      >
                        {requestLoading ? (
                          <Text
                            style={styles.viewButtonText}
                          >
                            ...
                          </Text>
                        ) : (
                          <Ionicons
                            name="add-outline"
                            size={28}
                            color="#333333"
                          />
                        )}
                      </Pressable>
                    );

                  return (
                    <View key={item.id}>
                      {renderProfileCard(
                        item,
                        rightElement
                      )}
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            <>
              {incomingRequests.length > 0 ? (
                <View style={{ marginTop: 18 }}>
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 20,
                      fontFamily: "alanRegular",
                      marginBottom: 12,
                    }}
                  >
                    Friend requests
                  </Text>

                  {incomingRequests.map((request) => {
                    const processing =
                      processingRequestId === request.id;

                    return (
                      <View key={request.id}>
                        {renderProfileCard(
                          request.sender,
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 8,
                            }}
                          >
                            <Pressable
                              disabled={processing}
                              onPress={() =>
                                handleAcceptRequest(
                                  request.id
                                )
                              }
                              style={({ pressed }) => [
                                {
                                  width: 42,
                                  height: 42,
                                  borderRadius: 21,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "#B8E6C1",
                                  opacity: processing
                                    ? 0.5
                                    : 1,
                                },
                                pressed &&
                                  styles.pressed,
                              ]}
                            >
                              <Ionicons
                                name="checkmark-outline"
                                size={25}
                                color="#224A2B"
                              />
                            </Pressable>

                            <Pressable
                              disabled={processing}
                              onPress={() =>
                                handleDeclineRequest(
                                  request.id
                                )
                              }
                              style={({ pressed }) => [
                                {
                                  width: 42,
                                  height: 42,
                                  borderRadius: 21,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "#F1B8B8",
                                  opacity: processing
                                    ? 0.5
                                    : 1,
                                },
                                pressed &&
                                  styles.pressed,
                              ]}
                            >
                              <Ionicons
                                name="close-outline"
                                size={27}
                                color="#5A2020"
                              />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <View style={{ marginTop: 22 }}>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 20,
                    fontFamily: "alanRegular",
                    marginBottom: 12,
                  }}
                >
                  Friends
                </Text>

                {loadingFriends ? (
                  <View style={{ gap: 10 }}>
                    <FriendSkeleton />
                    <FriendSkeleton />
                    <FriendSkeleton />
                    <FriendSkeleton />
                  </View>
                ) : friends.length === 0 ? (
                  <Text
                    style={[
                      styles.emptyText,
                      { color: theme.text },
                    ]}
                  >
                    You have no friends yet
                  </Text>
                ) : (
                  friends.map((friend) => (
                    <View key={friend.friendshipId}>
                      {renderProfileCard(
                        friend.profile,
                        <Pressable
                          style={({ pressed }) => [
                            styles.viewButton,
                            {
                              borderColor:
                                colorScheme === "dark" ? "#8B8998" : "#333333",
                            },
                            pressed && styles.pressed,
                          ]}
                          onPress={() =>
                            router.push({
                              pathname: "/user/[id]",
                              params: {
                                id: friend.profile.id,
                              },
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.viewButtonText,
                              {
                                color: theme.text,
                                borderColor:
                                  colorScheme === "dark" ? "#8B8998" : "#111111",
                              },
                            ]}
                          >
                            View
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}