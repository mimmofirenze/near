import {
  AppState,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../contexts/themeContext";

import {
  createTypingChannel,
  getMyConversations,
  subscribeToConversationList,
} from "../../utils/chat";

import type {
  ConversationListItem,
} from "../../utils/chat";

import { countryCodeToFlag } from "../../utils/countries";

import { styles } from "../../styles/chatsStyles";

function formatChatTime(
  timestamp: string | null
) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();

  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date();
  yesterday.setDate(
    yesterday.getDate() - 1
  );

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() ===
      yesterday.getFullYear();

  if (isYesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  });
}

export default function ChatsScreen() {

  const [typingChats, setTypingChats] =
  useState<Record<string, boolean>>({});

  const { theme, colorScheme } =
    useAppTheme();

  const [conversations, setConversations] =
    useState<ConversationListItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const defaultAvatar =
    colorScheme === "dark"
      ? require("../../assets/images/Sample_User_Icon-dark.png")
      : require("../../assets/images/Sample_User_Icon.png");

  const loadConversations =
    useCallback(async () => {
      const {
        conversations,
        error,
      } = await getMyConversations();

      if (error) {
        console.log(
          "LOAD CHATS ERROR:",
          error.message
        );

        setErrorMessage(
          "Could not load chats."
        );

        setLoading(false);
        return;
      }

      setConversations(conversations);
      setErrorMessage("");
      setLoading(false);
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();

      const unsubscribe =
        subscribeToConversationList(() => {
          loadConversations();
        });

      const appStateSubscription =
        AppState.addEventListener(
          "change",
          (state) => {
            if (state === "active") {
              loadConversations();
            }
          }
        );

      return () => {
        unsubscribe();
        appStateSubscription.remove();
      };
    }, [loadConversations])
  );

  const openConversation = (
    conversationId: string
  ) => {
    router.push(
      `/chat/${conversationId}`
    );
  };

  useEffect(() => {
  const channels = conversations.map(
    (conversation) =>
      createTypingChannel(
        conversation.conversation_id,
        (payload) => {
          // Only care about the OTHER user typing
          if (
            payload.userId !==
            conversation.friend_id
          ) {
            return;
          }

          setTypingChats((current) => ({
            ...current,
            [conversation.conversation_id]:
              payload.isTyping,
          }));
        }
      )
  );

  return () => {
    channels.forEach((channel) => {
      channel.unsubscribe();
    });
  };
}, [conversations]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Text
            style={[
            styles.title,
            { color: theme.text, marginBottom: 20 },
            ]}
        >
            Chats
        </Text>
        </View>

      {errorMessage ? (
        <Text
          style={{
            color: "#E53935",
            paddingHorizontal: 22,
            marginBottom: 10,
            fontFamily: "alanRegular",
          }}
        >
          {errorMessage}
        </Text>
      ) : null}

      <FlatList
        data={conversations}
        keyExtractor={(item) =>
            item.conversation_id
        }
        contentContainerStyle={
            styles.listContent
        }
        ListEmptyComponent={
          !loading ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingBottom: 80,
                gap: 10,
              }}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={54}
                color="#888"
              />

              <Text
                style={{
                  color: theme.text,
                  fontFamily: "alanRegular",
                  fontSize: 19,
                }}
              >
                No chats yet
              </Text>

              <Text
                style={{
                  color: "#888",
                  fontFamily: "alanRegular",
                  textAlign: "center",
                }}
              >
                Open a friend's profile and
                start a conversation.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const unread =
            Number(item.unread_count) > 0;

          const isTyping =
            typingChats[item.conversation_id] ===
            true;

          return (
            <Pressable
            onPress={() =>
                openConversation(
                item.conversation_id
                )
            }
            style={({ pressed }) => [
                styles.chatRow,
                {
                opacity: pressed ? 0.65 : 1,
                },
            ]}
            >
              {/* AVATAR */}

              <Image
                source={
                    item.friend_avatar_url
                    ? { uri: item.friend_avatar_url }
                    : defaultAvatar
                }
                style={styles.avatar}
                />

              {/* NAME + MESSAGE */}

              <View style={styles.chatInfo}>
                <View style={styles.nameRow}>
                    <Text
                        numberOfLines={1}
                        style={[
                        styles.name,
                        {
                            color: theme.text,
                            fontFamily: unread
                            ? "alanSemiBold"
                            : "alanRegular",
                        },
                        ]}
                    >
                        {item.friend_first_name ?? "User"}
                    </Text>

                    {item.friend_country_code ? (
                        <Text style={styles.flag}>
                        {countryCodeToFlag(
                            item.friend_country_code
                        )}
                        </Text>
                    ) : null}
                    </View>

                    <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                        styles.lastMessage,
                        {
                        color: isTyping
                            ? "#2563EB"
                            : unread
                            ? theme.text
                            : "#888888",

                        fontFamily: unread
                          ? "alanSemiBold"
                          : "alanRegular",

                        fontStyle: isTyping
                            ? "italic"
                            : "normal",
                        },
                    ]}
                    >
                    {isTyping
                        ? "typing..."
                        : item.last_message ??
                        "Start a conversation"}
                    </Text>
                </View>

              {/* TIME + UNREAD */}

              <View style={styles.rightSection}>
                <Text
                    style={[
                    styles.time,
                    {
                        color: unread
                        ? "#2563EB"
                        : "#888888",
                    },
                    ]}
                >
                    {formatChatTime(
                    item.last_message_at
                    )}
                </Text>

                {unread ? (
                    <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                        {Number(item.unread_count) > 99
                        ? "99+"
                        : item.unread_count}
                    </Text>
                    </View>
                ) : null}
                </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}