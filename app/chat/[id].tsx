import {
  Alert,
  Modal,
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
  deleteMessage,
  editMessage,
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

import {
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import Swipeable from
  "react-native-gesture-handler/ReanimatedSwipeable";

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

function SwipeToReply({
  children,
  onReply,
}: {
  children: any;
  onReply: () => void;
}) {
  const swipeableRef = useRef<any>(null);

  return (
    <Swipeable
      ref={swipeableRef}
      friction={1.5}
      rightThreshold={45}
      overshootRight={false}
      renderLeftActions={() => (
        <View
          style={{
            width: 64,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="arrow-undo-outline"
            size={24}
            color="#2563EB"
          />
        </View>
      )}
      onSwipeableOpen={() => {
        onReply();

        requestAnimationFrame(() => {
          swipeableRef.current?.close();
        });
      }}
    >
      {children}
    </Swipeable>
  );
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

const [replyingToMessage, setReplyingToMessage] =
  useState<ChatMessage | null>(null);

const [editingMessage, setEditingMessage] =
  useState<ChatMessage | null>(null);

const [messageMenuMessage, setMessageMenuMessage] =
  useState<ChatMessage | null>(null);

const [confirmingDelete, setConfirmingDelete] =
  useState(false);

const messageInputRef =
  useRef<TextInput | null>(null);

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

const handleMessageLongPress = (
  message: ChatMessage
) => {
  if (
    message.sender_id !== currentUserId ||
    message.deleted_at
  ) {
    return;
  }

  setMessageMenuMessage(message);
  setConfirmingDelete(false);
};

const handleDeleteMessage = async () => {
  if (!messageMenuMessage) return;

  const messageId =
    messageMenuMessage.id;

  const {
    message: updated,
    error,
  } = await deleteMessage(messageId);

  if (error) {
    console.log(
      "DELETE MESSAGE ERROR:",
      error.message
    );
    return;
  }

  setMessages((current) =>
    current.map((item) =>
      item.id === messageId
        ? {
            ...item,
            deleted_at:
              updated?.deleted_at ??
              new Date().toISOString(),
          }
        : item
    )
  );

  if (
    editingMessage?.id ===
    messageId
  ) {
    setEditingMessage(null);
    setText("");
  }

  setMessageMenuMessage(null);
  setConfirmingDelete(false);
};

  const handleSend = async () => {
    if (
      !id ||
      !text.trim() ||
      sending
    ) {
      return;
    }

    if (editingMessage) {
      const messageText = text;

      setSending(true);

      const {
        message: updated,
        error,
      } = await editMessage(
        editingMessage.id,
        messageText
      );

      setSending(false);

      if (error) {
        console.log(
          "EDIT MESSAGE ERROR:",
          error.message
        );
        return;
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === editingMessage.id
            ? {
                ...message,
                body:
                  updated?.body ??
                  messageText.trim(),
                edited_at:
                  updated?.edited_at ??
                  new Date().toISOString(),
              }
            : message
        )
      );

      setEditingMessage(null);
      setText("");

      return;
    }

    const messageText = text;

    setText("");
    setSending(true);

    const { message, error } =
      await sendMessage(
        id,
        messageText,
        replyingToMessage?.id ?? null
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
      setReplyingToMessage(null);
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
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      <Modal
          visible={!!messageMenuMessage}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => {
            setMessageMenuMessage(null);
            setConfirmingDelete(false);
          }}
        >
          <Pressable
            onPress={() => {
              setMessageMenuMessage(null);
              setConfirmingDelete(false);
            }}
            style={{
              flex: 1,
              backgroundColor:
                "rgba(0,0,0,0.45)",
              justifyContent: "flex-end",
            }}
          >
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor:
                  colorScheme === "dark"
                    ? "#1C1C1E"
                    : "#FFFFFF",

                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,

                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 84,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#888888",
                  opacity: 0.4,
                  alignSelf: "center",
                  marginBottom: 18,
                }}
              />

              {!confirmingDelete ? (
                <>
                  <Text
                    numberOfLines={2}
                    style={{
                      color: theme.text,
                      fontFamily: "alanRegular",
                      fontSize: 15,
                      opacity: 0.6,
                      marginBottom: 16,
                      paddingHorizontal: 4,
                    }}
                  >
                    {messageMenuMessage?.body}
                  </Text>

                  <Pressable
                    onPress={() => {
                      if (!messageMenuMessage) {
                        return;
                      }

                      setReplyingToMessage(null);
                      setEditingMessage(
                        messageMenuMessage
                      );
                      setText(
                        messageMenuMessage.body
                      );

                      setMessageMenuMessage(null);

                      setTimeout(() => {
                        messageInputRef.current?.focus();
                      }, 200);

                    }}
                    style={({ pressed }) => ({
                      height: 56,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      paddingHorizontal: 14,
                      borderRadius: 16,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={22}
                      color={theme.text}
                    />

                    <Text
                      style={{
                        color: theme.text,
                        fontFamily:
                          "alanSemiBold",
                        fontSize: 17,
                      }}
                    >
                      Edit message
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      setConfirmingDelete(true)
                    }
                    style={({ pressed }) => ({
                      height: 56,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      paddingHorizontal: 14,
                      borderRadius: 16,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color="#EF4444"
                    />

                    <Text
                      style={{
                        color: "#EF4444",
                        fontFamily:
                          "alanSemiBold",
                        fontSize: 17,
                      }}
                    >
                      Delete message
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text
                    style={{
                      color: theme.text,
                      fontFamily:
                        "alanSemiBold",
                      fontSize: 20,
                      marginBottom: 8,
                    }}
                  >
                    Delete message?
                  </Text>

                  <Text
                    style={{
                      color: "#888888",
                      fontFamily:
                        "alanRegular",
                      fontSize: 15,
                      marginBottom: 22,
                    }}
                  >
                    This message will be removed
                    for everyone.
                  </Text>

                  <Pressable
                    onPress={handleDeleteMessage}
                    style={({ pressed }) => ({
                      height: 52,
                      borderRadius: 16,
                      backgroundColor:
                        "#EF4444",
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: pressed
                        ? 0.75
                        : 1,
                    })}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontFamily:
                          "alanSemiBold",
                        fontSize: 16,
                      }}
                    >
                      Delete
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      setConfirmingDelete(false)
                    }
                    style={{
                      height: 48,
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.text,
                        fontFamily:
                          "alanRegular",
                        fontSize: 16,
                      }}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
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
  <SwipeToReply
    onReply={() =>
      setReplyingToMessage(message)
    }
  >
    <Pressable
      onLongPress={
        mine && !message.deleted_at
          ? () =>
              handleMessageLongPress(message)
          : undefined
      }
      delayLongPress={350}
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

      {message.reply_to ? (
        <View
          style={{
            marginBottom: 7,
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 10,

            borderLeftWidth: 3,
            borderLeftColor: mine
              ? "rgba(255,255,255,0.8)"
              : "#2563EB",

            backgroundColor: mine
              ? "rgba(255,255,255,0.12)"
              : colorScheme === "dark"
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.05)",
          }}
        >
          <Text
            style={{
              color: mine
                ? "#FFFFFF"
                : "#2563EB",
              fontFamily: "alanSemiBold",
              fontSize: 12,
              marginBottom: 2,
            }}
          >
            {message.reply_to.sender_id ===
            currentUserId
              ? "You"
              : friend?.first_name ?? "User"}
          </Text>

          <Text
            numberOfLines={2}
            style={{
              color: mine
                ? "rgba(255,255,255,0.8)"
                : theme.text,
              opacity: mine ? 1 : 0.7,
              fontFamily: "alanRegular",
              fontSize: 13,
            }}
          >
            {message.reply_to.body}
          </Text>
        </View>
      ) : null}
      <Text
        style={{
          color: mine
            ? "#FFFFFF"
            : theme.text,

          fontFamily: "alanRegular",
          fontSize: 16,
        }}
      >
        {message.deleted_at
          ? "Message deleted"
          : message.body}
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

        {message.edited_at &&
          !message.deleted_at
            ? " · edited"
            : ""}
      </Text>
    </Pressable>
  </SwipeToReply>
);
}}
        />

        <View
  style={{
    borderTopWidth: 1,
    borderTopColor:
      "rgba(128,128,128,0.15)",
  }}
>
  {replyingToMessage ? (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 10,
        gap: 12,
      }}
    >
      <View
        style={{
          flex: 1,
          borderLeftWidth: 3,
          borderLeftColor: "#2563EB",
          paddingLeft: 10,
        }}
      >
        <Text
          style={{
            color: "#2563EB",
            fontFamily: "alanSemiBold",
            fontSize: 13,
          }}
        >
          {replyingToMessage.sender_id ===
          currentUserId
            ? "Replying to yourself"
            : `Replying to ${
                friend?.first_name ?? "friend"
              }`}
        </Text>

        <Text
          numberOfLines={1}
          style={{
            color: theme.text,
            opacity: 0.65,
            fontFamily: "alanRegular",
            fontSize: 14,
            marginTop: 2,
          }}
        >
          {replyingToMessage.body}
        </Text>
      </View>

      <Pressable
        onPress={() =>
          setReplyingToMessage(null)
        }
        hitSlop={10}
      >
        <Ionicons
          name="close-outline"
          size={24}
          color={theme.text}
        />
      </Pressable>
    </View>
  ) : null}

  <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 10,
      }}
    >
      <TextInput
        ref={messageInputRef}
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

          fontFamily: "alanRegular",
          fontSize: 16,
        }}
      />

      <Pressable
        onPress={handleSend}
        disabled={!text.trim() || sending}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: 22,

          justifyContent: "center",
          alignItems: "center",

          backgroundColor: "#2563EB",

          opacity:
            !text.trim() || sending
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
  </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}