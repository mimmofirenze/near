import { supabase } from "../lib/supabase";

export async function searchUsers(searchTerm: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      users: [],
      error: userError,
    };
  }

  if (!user) {
    return {
      users: [],
      error: new Error("No authenticated user"),
    };
  }

  const cleanedSearchTerm = searchTerm
    .trim()
    .toLowerCase();

  if (!cleanedSearchTerm) {
    return {
      users: [],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      first_name,
      username,
      avatar_url,
      country_code
      `
    )
    .neq("id", user.id)
    .ilike("username", `%${cleanedSearchTerm}%`)
    .limit(20);

  return {
    users: data ?? [],
    error,
  };
}

export async function sendFriendRequest(
  receiverId: string
) {
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

  if (user.id === receiverId) {
    return {
      error: new Error(
        "You cannot send a friend request to yourself."
      ),
    };
  }

  const { data: existingFriendship, error: existingError } =
    await supabase
      .from("friendships")
      .select("id, sender_id, receiver_id, status")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
      )
      .maybeSingle();

  if (existingError) {
    return { error: existingError };
  }

  if (existingFriendship) {
    if (existingFriendship.status === "accepted") {
      return {
        error: new Error(
          "You are already friends with this user."
        ),
      };
    }

    return {
      error: new Error(
        "A friend request already exists."
      ),
    };
  }

  const { error } = await supabase
    .from("friendships")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: "pending",
    });

  return { error };
}

export async function getIncomingFriendRequests() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      requests: [],
      error: userError,
    };
  }

  if (!user) {
    return {
      requests: [],
      error: new Error("No authenticated user"),
    };
  }

  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
      id,
      created_at,
      sender:profiles!friendships_sender_id_fkey (
        id,
        first_name,
        username,
        avatar_url,
        country_code
      )
      `
    )
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return {
    requests: data ?? [],
    error,
  };
}

export async function acceptFriendRequest(
  friendshipId: string
) {
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
    .from("friendships")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", friendshipId)
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  return { error };
}

export async function declineFriendRequest(
  friendshipId: string
) {
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
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  return { error };
}

export async function getFriends() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      friends: [],
      error: userError,
    };
  }

  if (!user) {
    return {
      friends: [],
      error: new Error("No authenticated user"),
    };
  }

  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
      id,
      sender_id,
      receiver_id,
      created_at,
      sender:profiles!friendships_sender_id_fkey (
        id,
        first_name,
        username,
        avatar_url,
        country_code
      ),
      receiver:profiles!friendships_receiver_id_fkey (
        id,
        first_name,
        username,
        avatar_url,
        country_code
      )
      `
    )
    .eq("status", "accepted")
    .or(
      `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return {
      friends: [],
      error,
    };
  }

  const friends = (data ?? []).map((friendship) => {
    const friend =
      friendship.sender_id === user.id
        ? friendship.receiver
        : friendship.sender;

    return {
      friendshipId: friendship.id,
      profile: friend,
    };
  });

  return {
    friends,
    error: null,
  };
}

export async function removeFriend(
  friendshipId: string
) {
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
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(
      `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
    );

  return { error };
}

export async function removeFriendByUserId(
  otherUserId: string
) {
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
    .from("friendships")
    .delete()
    .eq("status", "accepted")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
    );

  return { error };
}

export type RelationshipStatus =
  | "friend"
  | "outgoing_pending"
  | "incoming_pending";

export async function getRelationshipStatuses() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      statuses: {} as Record<string, RelationshipStatus>,
      error: userError,
    };
  }

  if (!user) {
    return {
      statuses: {} as Record<string, RelationshipStatus>,
      error: new Error("No authenticated user"),
    };
  }

  const { data, error } = await supabase
    .from("friendships")
    .select("sender_id, receiver_id, status")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error) {
    return {
      statuses: {} as Record<string, RelationshipStatus>,
      error,
    };
  }

  const statuses: Record<string, RelationshipStatus> = {};

  for (const friendship of data ?? []) {
    const otherUserId =
      friendship.sender_id === user.id
        ? friendship.receiver_id
        : friendship.sender_id;

    if (friendship.status === "accepted") {
      statuses[otherUserId] = "friend";
      continue;
    }

    statuses[otherUserId] =
      friendship.sender_id === user.id
        ? "outgoing_pending"
        : "incoming_pending";
  }

  return {
    statuses,
    error: null,
  };
}