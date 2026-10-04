import { supabase } from "../lib/supabase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

function normalizeFirstName(name: string) {
  const clean = name.trim();

  if (!clean) return clean;

  return (
    clean.charAt(0).toUpperCase() +
    clean.slice(1).toLowerCase()
  );
}

async function normalizeProviderFirstName(
  userId: string
) {
  const { data: profile, error } =
    await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", userId)
      .maybeSingle();

  if (error || !profile?.first_name) {
    return;
  }

  const normalized = normalizeFirstName(
    profile.first_name
  );

  if (normalized === profile.first_name) {
    return;
  }

  await supabase
    .from("profiles")
    .update({
      first_name: normalized,
    })
    .eq("id", userId);
}

async function syncSocialFirstName() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.log("SOCIAL PROFILE SYNC ERROR:", error?.message);
    return;
  }

  const metadata = user.user_metadata;

  const firstName =
    metadata?.given_name?.trim() ||
    metadata?.first_name?.trim() ||
    metadata?.full_name?.trim()?.split(/\s+/)[0] ||
    metadata?.name?.trim()?.split(/\s+/)[0] ||
    "";

  if (!firstName) {
    console.log("No social first name found");
    return;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: normalizeFirstName(firstName),
    })
    .eq("id", user.id);

  if (profileError) {
    console.log(
      "SOCIAL PROFILE UPDATE ERROR:",
      profileError.message
    );
  }
}

export async function signUp(
  firstName: string,
  email: string,
  password: string
) {
  return supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        first_name: firstName.trim(),
      },
    },
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function signInWithGoogle() {
  try {
    const redirectTo = Linking.createURL("auth/callback");

    const { data, error } =
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: "select_account",
          },
        },
    });

    if (error) {
      return { error };
    }

    if (!data.url) {
      return {
        error: new Error(
          "Google login URL was not returned."
        ),
      };
    }

    const result =
      await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

    if (result.type !== "success") {
      return {
        error: new Error(
          "Google login was cancelled."
        ),
      };
    }

    console.log("OAuth result URL:", result.url);

    // Supabase normally returns tokens in the URL hash:
    // near://auth/callback#access_token=...&refresh_token=...
    const parts = result.url.split("#");

    const params = new URLSearchParams(
      parts[1] ?? parts[0].split("?")[1] ?? ""
    );

    const accessToken =
      params.get("access_token");

    const refreshToken =
      params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return {
        error: new Error(
          "Google login did not return authentication tokens."
        ),
      };
    }

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      return {
        error: sessionError,
      };
    }

    await syncSocialFirstName();

    return {
      data: sessionData,
      error: null,
    };
  } catch (error) {
    console.error("Google OAuth error:", error);

    return {
      error:
        error instanceof Error
          ? error
          : new Error("Google login failed."),
    };
  }
}

export async function signInWithFacebook() {
  try {
    const redirectTo = Linking.createURL("auth/callback");

    const { data, error } =
      await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            auth_type: "reauthenticate",
          },
        },
      });

    if (error) {
      return { error };
    }

    if (!data.url) {
      return {
        error: new Error(
          "Facebook login URL was not returned."
        ),
      };
    }

    const result =
      await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

    if (result.type !== "success") {
      return {
        error: new Error(
          "Facebook login was cancelled."
        ),
      };
    }

    const parts = result.url.split("#");

    const params = new URLSearchParams(
      parts[1] ?? parts[0].split("?")[1] ?? ""
    );

    const accessToken =
      params.get("access_token");

    const refreshToken =
      params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return {
        error: new Error(
          "Facebook login did not return authentication tokens."
        ),
      };
    }

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      return { error: sessionError };
    }

    await syncSocialFirstName();

    return {
      data: sessionData,
      error: null,
    };
  } catch (error) {
    console.error("Facebook OAuth error:", error);

    return {
      error:
        error instanceof Error
          ? error
          : new Error("Facebook login failed."),
    };
  }
}

export async function signOut() {
  return supabase.auth.signOut();
}