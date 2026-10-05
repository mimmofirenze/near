import {
  AppState,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { useEffect, useRef, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "../../lib/supabase";
import { useAppTheme } from "../../contexts/themeContext";

import {
  createTypingChannel,
  getConversationFriend,
  getMessages,
  markConversationRead,
  sendMessage,
  subscribeToMessages,
} from "../../utils/chat";

import type {
  ChatMessage,
  ChatUser,
} from "../../utils/chat";

import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

import {
  setActiveConversationId,
} from "../../utils/notifications";

import Skeleton from "../../components/Skeleton";

const PAGE_SIZE = 40;

type ChatListItem =
  | {
      type: "message";
      message: ChatMessage;
    }
  | {
      type: "date";
      id: string;
      label: string;
    }
  | {
      type: "typing";
      id: string;
    };

function isSameDay(
  first: Date,
  second: Date
) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDateLabel(date: Date) {
  const today = new Date();

  if (isSameDay(date, today)) {
    return "Today";
  }

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, yesterday)) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year:
      date.getFullYear() !== today.getFullYear()
        ? "numeric"
        : undefined,
  });
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  useFocusEffect(
  useCallback(() => {
    if (!id) return;

    setActiveConversationId(id);

    return () => {
      setActiveConversationId(null);
    };
  }, [id])
);

  const { theme, colorScheme } = useAppTheme();

  const [messages, setMessages] = useState<
    ChatMessage[]
  >([]);

  const [friend, setFriend] =
    useState<ChatUser | null>(null);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] =
    useState(false);

const [friendTyping, setFriendTyping] =
  useState(false);

const typingTimeoutRef =
  useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

const typingChannelRef =
  useRef<ReturnType<
    typeof createTypingChannel
  > | null>(null);

const isTypingRef =
  useRef(false);

useEffect(() => {
  if (!id || !currentUserId) {
    return;
  }

  const typingChannel =
    createTypingChannel(
      id,
      (payload) => {
        if (
          payload.userId ===
          currentUserId
        ) {
          return;
        }

        setFriendTyping(
          payload.isTyping
        );
      }
    );

  typingChannelRef.current =
    typingChannel;

  return () => {
    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current
      );
    }

    typingChannel.unsubscribe();

    typingChannelRef.current =
      null;
  };
}, [id, currentUserId]);

const handleTextChange = (
  value: string
) => {
  setText(value);

  if (!currentUserId) {
    return;
  }

  if (!isTypingRef.current) {
    isTypingRef.current = true;

    typingChannelRef.current
      ?.sendTyping(
        currentUserId,
        true
      );
  }

  if (
    typingTimeoutRef.current
  ) {
    clearTimeout(
      typingTimeoutRef.current
    );
  }

  typingTimeoutRef.current =
    setTimeout(() => {
      isTypingRef.current = false;

      typingChannelRef.current
        ?.sendTyping(
          currentUserId,
          false
        );
    }, 1200);
};

const chatItems = useMemo<ChatListItem[]>(() => {
  const items: ChatListItem[] = [];

  // Inverted FlatList:
  // first item = visually at the bottom
  if (friendTyping) {
    items.push({
      type: "typing",
      id: "typing-indicator",
    });
  }

  messages.forEach((message, index) => {
    items.push({
      type: "message",
      message,
    });

    const currentDate = new Date(
      message.created_at
    );

    const nextMessage =
      messages[index + 1];

    const nextDate = nextMessage
      ? new Date(nextMessage.created_at)
      : null;

    if (
      !nextDate ||
      !isSameDay(currentDate, nextDate)
    ) {
      items.push({
        type: "date",
        id: `date-${getDateKey(
          currentDate
        )}`,
        label:
          formatDateLabel(currentDate),
      });
    }
  });

  return items;
}, [messages, friendTyping]);

  const hasMoreRef = useRef(true);

  const messageListRef =
  useRef<FlatList<ChatListItem> | null>(null);

  const scrollToNewest = (
  animated = true
) => {
  requestAnimationFrame(() => {
    messageListRef.current?.scrollToOffset({
      offset: 0,
      animated,
    });
  });
};

useEffect(() => {
  if (friendTyping) {
    scrollToNewest();
  }
}, [friendTyping]);

  const defaultAvatar =
    colorScheme === "dark"
      ? require("../../assets/images/Sample_User_Icon-dark.png")
      : require("../../assets/images/Sample_User_Icon.png");

    const addMessage = (
    message: ChatMessage
    ) => {
    setMessages((current) => {
        if (
        current.some(
            (existing) =>
            existing.id === message.id
        )
        ) {
        return current;
        }

        return [message, ...current];
    });

    scrollToNewest();
    };

  const loadChat = async () => {
    if (!id) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setCurrentUserId(user?.id ?? null);

    const [
      { messages: loadedMessages, error },
      { friend: loadedFriend },
    ] = await Promise.all([
      getMessages(id, undefined, PAGE_SIZE),
      getConversationFriend(id),
    ]);

    if (!error) {
      setMessages(loadedMessages);

      hasMoreRef.current =
        loadedMessages.length === PAGE_SIZE;
    }

    setFriend(loadedFriend);

    await markConversationRead(id);

    setLoading(false);

    setTimeout(() => {
    scrollToNewest(false);
    }, 50);
  };

  useEffect(() => {
    if (!id) return;

    loadChat();

    let unsubscribe =
      subscribeToMessages(
        id,
        async (message) => {
          addMessage(message);
          await markConversationRead(id);
        }
      );

    const appStateSubscription =
      AppState.addEventListener(
        "change",
        async (state) => {
          if (state !== "active") {
            return;
          }

          unsubscribe();

          await loadChat();

          unsubscribe =
            subscribeToMessages(
              id,
              async (message) => {
                addMessage(message);
                await markConversationRead(id);
              }
            );
        }
      );

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [id]);

  const handleSend = async () => {
    if (
      !id ||
      !text.trim() ||
      sending
    ) {
      return;
    }

    const messageText = text;

    setText("");
    setSending(true);

    const { message, error } =
      await sendMessage(
        id,
        messageText
      );

    setSending(false);

    if (error) {
      setText(messageText);

      console.log(
        "SEND MESSAGE ERROR:",
        error.message
      );

      return;
    }

    if (message) {
      addMessage(message);
      await markConversationRead(id);
    }
    if (currentUserId) {
  isTypingRef.current = false;

  if (
    typingTimeoutRef.current
  ) {
    clearTimeout(
      typingTimeoutRef.current
    );
  }

  typingChannelRef.current
    ?.sendTyping(
      currentUserId,
      false
    );
}
  };

  const loadMoreMessages = async () => {
    if (
      !id ||
      loadingMore ||
      !hasMoreRef.current ||
      messages.length === 0
    ) {
      return;
    }

    setLoadingMore(true);

    const oldest =
      messages[messages.length - 1];

    const { messages: older, error } =
      await getMessages(
        id,
        oldest.created_at,
        PAGE_SIZE
      );

    if (!error) {
      setMessages((current) => {
        const existingIds = new Set(
          current.map((message) => message.id)
        );

        return [
          ...current,
          ...older.filter(
            (message) =>
              !existingIds.has(message.id)
          ),
        ];
      });

      hasMoreRef.current =
        older.length === PAGE_SIZE;
    }

    setLoadingMore(false);
  };

if (loading) {
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >
        {/* HEADER */}
        <View
          style={{
            height: 64,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor:
              "rgba(128,128,128,0.15)",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons
              name="arrow-back-outline"
              size={28}
              color={theme.text}
            />
          </Pressable>

          <Skeleton
            width={42}
            height={42}
            borderRadius={21}
          />

          <View style={{ gap: 5 }}>
            <Skeleton
              width={110}
              height={18}
              borderRadius={5}
            />

            <Skeleton
              width={75}
              height={13}
              borderRadius={5}
            />
          </View>
        </View>

        {/* MESSAGES */}
        <View
          style={{
            flex: 1,
            padding: 14,
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <Skeleton
            width="48%"
            height={42}
            borderRadius={18}
            style={{
              alignSelf: "flex-start",
            }}
          />

          <Skeleton
            width="65%"
            height={58}
            borderRadius={18}
            style={{
              alignSelf: "flex-end",
            }}
          />

          <Skeleton
            width="38%"
            height={42}
            borderRadius={18}
            style={{
              alignSelf: "flex-end",
            }}
          />

          <Skeleton
            width="70%"
            height={74}
            borderRadius={18}
            style={{
              alignSelf: "flex-start",
            }}
          />

          <Skeleton
            width="52%"
            height={42}
            borderRadius={18}
            style={{
              alignSelf: "flex-start",
            }}
          />

          <Skeleton
            width="60%"
            height={58}
            borderRadius={18}
            style={{
              alignSelf: "flex-end",
            }}
          />

          <Skeleton
            width="36%"
            height={42}
            borderRadius={18}
            style={{
              alignSelf: "flex-start",
            }}
          />
        </View>

        {/* MESSAGE INPUT */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 10,
            borderTopWidth: 1,
            borderTopColor:
              "rgba(128,128,128,0.15)",
          }}
        >
          <Skeleton
            width="100%"
            height={44}
            borderRadius={20}
            style={{
              flex: 1,
            }}
          />

          <Skeleton
            width={44}
            height={44}
            borderRadius={22}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
            Platform.OS === "ios"
            ? "padding"
            : "height"
        }
        >
        <View
          style={{
            height: 64,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor:
              "rgba(128,128,128,0.15)",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons
              name="arrow-back-outline"
              size={28}
              color={theme.text}
            />
          </Pressable>

          <Image
            source={
              friend?.avatar_url
                ? {
                    uri: friend.avatar_url,
                  }
                : defaultAvatar
            }
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
            }}
          />

          <View>
            <Text
              style={{
                color: theme.text,
                fontFamily: "alanRegular",
                fontSize: 18,
              }}
            >
              {friend?.first_name ?? "Chat"}
            </Text>

            {friend?.username ? (
            <Text
                style={{
                color: "#888888",
                fontFamily: "alanRegular",
                fontSize: 13,
                }}
            >
                {friend.username}
            </Text>
            ) : null}
          </View>
        </View>

        <FlatList
          ref={messageListRef}
          inverted
          data={chatItems}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => {
            if (item.type === "message") {
                return item.message.id;
            }

            return item.id;
            }}
          contentContainerStyle={{
            padding: 14,
            gap: 8,
          }}
          onEndReached={
            loadMoreMessages
          }
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => {
            if (item.type === "typing") {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        maxWidth: "78%",
        backgroundColor:
          colorScheme === "dark"
            ? "#292929"
            : "#EEEEEE",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
      }}
    >
      <Text
        style={{
          color: "#888888",
          fontFamily: "alanRegular",
          fontSize: 16,
        }}
      >
        typing...
      </Text>
    </View>
  );
}

  if (item.type === "date") {
    return (
      <View
        style={{
          alignItems: "center",
          marginVertical: 14,
        }}
      >
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 12,
            backgroundColor:
              colorScheme === "dark"
                ? "#292929"
                : "#EEEEEE",
          }}
        >
          <Text
            style={{
              color: "#888888",
              fontFamily: "alanRegular",
              fontSize: 12,
            }}
          >
            {item.label}
          </Text>
        </View>
      </View>
    );
  }

  const message = item.message;

  const mine =
    message.sender_id === currentUserId;

  return (
    <View
      style={{
        alignSelf: mine
          ? "flex-end"
          : "flex-start",

        maxWidth: "78%",

        backgroundColor: mine
          ? "#2563EB"
          : colorScheme === "dark"
          ? "#292929"
          : "#EEEEEE",

        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
      }}
    >
      <Text
        style={{
          color: mine
            ? "#FFFFFF"
            : theme.text,

          fontFamily: "alanRegular",
          fontSize: 16,
        }}
      >
        {message.body}
      </Text>

      <Text
        style={{
          marginTop: 4,

          color: mine
            ? "rgba(255,255,255,0.7)"
            : "#888888",

          fontSize: 10,
          alignSelf: "flex-end",
        }}
      >
        {new Date(
          message.created_at
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}}
        />

        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 10,
            borderTopWidth: 1,
            borderTopColor:
              "rgba(128,128,128,0.15)",
          }}
        >
          <TextInput
            value={text}
            onChangeText={handleTextChange}
            placeholder="Message..."
            placeholderTextColor="#888"
            multiline
            maxLength={2000}
            style={{
              flex: 1,
              maxHeight: 120,

              backgroundColor:
                colorScheme === "dark"
                  ? "#292929"
                  : "#EEEEEE",

              color: theme.text,

              borderRadius: 20,

              paddingHorizontal: 16,
              paddingVertical: 10,

              fontFamily:
                "alanRegular",

              fontSize: 16,
            }}
          />

          <Pressable
            onPress={handleSend}
            disabled={
              !text.trim() || sending
            }
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,

              justifyContent:
                "center",
              alignItems: "center",

              backgroundColor:
                "#2563EB",

              opacity:
                !text.trim() ||
                sending
                  ? 0.4
                  : pressed
                  ? 0.7
                  : 1,
            })}
          >
            <Ionicons
              name="send"
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}