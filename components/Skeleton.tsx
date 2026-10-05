import {
  Animated,
  DimensionValue,
  StyleProp,
  ViewStyle,
} from "react-native";

import {
  useEffect,
  useRef,
} from "react";

import { useAppTheme } from "../contexts/themeContext";

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export default function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { colorScheme } = useAppTheme();

  const opacity = useRef(
    new Animated.Value(0.45)
  ).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          opacity,
          backgroundColor:
            colorScheme === "dark"
              ? "#2B2A34"
              : "#E5E5E5",
        },
        style,
      ]}
    />
  );
}