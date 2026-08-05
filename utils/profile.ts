import { supabase } from "../lib/supabase";
import * as ImagePicker from "expo-image-picker";

export async function getCurrentProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { profile: null, error: userError };
  }

  if (!user) {
    return {
      profile: null,
      error: new Error("No authenticated user"),
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { profile, error };
}

export async function updateCurrentProfile(values: {
  first_name: string;
  username: string;
  bio: string;
  country_code: string;
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      profile: null,
      error: userError,
    };
  }

  if (!user) {
    return {
      profile: null,
      error: new Error("No authenticated user"),
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      first_name: values.first_name.trim(),
      username: values.username.trim().toLowerCase() || null,
      bio: values.bio.trim() || null,
      country_code:
        values.country_code.trim().toUpperCase() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single();

  return {
    profile,
    error,
  };
}

export async function pickAndUploadAvatar() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled) {
    return {
      avatarUrl: null,
      error: null,
      canceled: true,
    };
  }

  const image = result.assets[0];

  if (!image.base64) {
    return {
      avatarUrl: null,
      error: new Error("Could not read the selected image."),
      canceled: false,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      avatarUrl: null,
      error: userError ?? new Error("No authenticated user."),
      canceled: false,
    };
  }

  const extension =
    image.mimeType?.split("/")[1] === "png" ? "png" : "jpg";

  const filePath = `${user.id}/avatar.${extension}`;

  const arrayBuffer = Uint8Array.from(
    atob(image.base64),
    (character) => character.charCodeAt(0)
  ).buffer;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, arrayBuffer, {
      contentType: image.mimeType ?? "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    return {
      avatarUrl: null,
      error: uploadError,
      canceled: false,
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const avatarUrl = `${publicUrl}?updated=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  return {
    avatarUrl: profileError ? null : avatarUrl,
    error: profileError,
    canceled: false,
  };
}

export async function getVisitedCountries() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      countries: [],
      error: userError,
    };
  }

  if (!user) {
    return {
      countries: [],
      error: new Error("No authenticated user"),
    };
  }

  const { data, error } = await supabase
    .from("visited_countries")
    .select("country_code")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return {
    countries: data?.map((item) => item.country_code) ?? [],
    error,
  };
}

export async function addVisitedCountry(countryCode: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { error: userError };
  }

  if (!user) {
    return {
      error: new Error("No authenticated user"),
    };
  }

  const { error } = await supabase
    .from("visited_countries")
    .insert({
      user_id: user.id,
      country_code: countryCode.toUpperCase(),
    });

  return { error };
}

export async function removeVisitedCountry(countryCode: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { error: userError };
  }

  if (!user) {
    return {
      error: new Error("No authenticated user"),
    };
  }

  const { error } = await supabase
    .from("visited_countries")
    .delete()
    .eq("user_id", user.id)
    .eq("country_code", countryCode.toUpperCase());

  return { error };
}

export async function getProfileById(userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return {
    profile,
    error,
  };
}

export async function getVisitedCountriesByUserId(
  userId: string
) {
  const { data, error } = await supabase
    .from("visited_countries")
    .select("country_code")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return {
    countries:
      data?.map((item) => item.country_code) ?? [],
    error,
  };
}