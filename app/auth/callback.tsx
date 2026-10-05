import {
  View,
  ActivityIndicator,
} from "react-native";

import { useAppTheme } from "../../contexts/themeContext";

export default function AuthCallback() {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.background,
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}