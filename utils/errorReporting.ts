import * as Sentry from "@sentry/react-native";

export function reportError(
  error: unknown,
  feature: string
) {
  Sentry.captureException(error, {
    tags: {
      feature,
    },
  });
}