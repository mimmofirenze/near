import { View, Text, Pressable, useColorScheme } from "react-native";
import { signOut } from "../../utils/auth";
import { router } from "expo-router";
import { styles } from "../../styles/settingsStyles";
import { Colors } from "../../constants/theme";

export default function Settings() {

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const handleLogout = async () => {
    const { error } = await signOut();

    if (error) {
      console.error(error.message);
      return;
    }

    router.replace("/");
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
      style={[styles.text, { color: theme.text }]}
      >settings
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed,
          {
            backgroundColor: theme.background,
            borderColor: "#E53935",
          },
        ]}
        onPress={handleLogout}
      >
        <Text
          style={[
            styles.logoutButtonText,
            { color: "#E53935" },
          ]}
        >
          Log out
        </Text>
      </Pressable>
    </View>
  );
}