import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../contexts/themeContext";

export default function TabsLayout() {

  const { theme, colorScheme } =
  useAppTheme();

  const insets = useSafeAreaInsets();

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