import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../contexts/themeContext";
import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";
import { getMyConversations } from "../../utils/chat";

export default function TabsLayout() {

  const { theme, colorScheme } =
  useAppTheme();

  const insets = useSafeAreaInsets();

  const [unreadChats, setUnreadChats] = useState(0);

useEffect(() => {
  let mounted = true;

  const loadUnreadChats = async () => {
    const { conversations, error } =
      await getMyConversations();

    if (error || !mounted) {
      return;
    }

    const count = conversations.filter(
      (conversation) =>
        Number(conversation.unread_count) > 0
    ).length;

    setUnreadChats(count);
  };

  loadUnreadChats();

  const channel = supabase
    .channel(
      `chat-tab-badge-${Date.now()}`
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      () => {
        loadUnreadChats();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversation_members",
      },
      () => {
        loadUnreadChats();
      }
    )
    .subscribe();

  return () => {
    mounted = false;
    supabase.removeChannel(channel);
  };
}, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,

        sceneStyle: {
          backgroundColor: theme.background,
        },

        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,

        tabBarStyle: {
          backgroundColor: theme.navBar,
          height: 70 + insets.bottom,
          borderTopWidth: 0,

          elevation: 12,
          shadowOpacity: 0.3,
          shadowRadius: 18,

          paddingTop: 12,
          paddingBottom: 12 + insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" color={color} size={30} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" color={color} size={30} />
          ),
        }}
      />

      <Tabs.Screen
        name="chats"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="chatbubbles-outline"
              color={color}
              size={30}
            />
          ),

          tabBarBadge:
            unreadChats > 0
              ? unreadChats > 99
                ? "99+"
                : unreadChats
              : undefined,

          tabBarBadgeStyle: {
            backgroundColor: "#2563EB",
            color: "#FFFFFF",
            fontSize: 10,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
          },
        }}
      />

      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" color={color} size={30} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" color={color} size={30} />
          ),
        }}
      />
    </Tabs>
  );
}