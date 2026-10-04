export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  // The OAuth return link is handled in utils/auth.ts, not by a screen.
  if (path.includes("auth/callback")) {
    return "/";
  }

  return path;
}