import { supabase } from "../lib/supabase";

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  reply_to_message_id: string | null;

  reply_to?: {
    id: string;
    sender_id: string;
    body: string;
  } | null;
};

export type ChatUser = {
  id: string;
  first_name: string;
  username: string | null;
  avatar_url: string | null;
};

export async function openOrCreateDirectConversation(
  friendId: string
) {
  const { data, error } = await supabase.rpc(
    "open_or_create_direct_conversation",
    {
      p_friend_id: friendId,
    }
  );

  return {
    conversationId: data as string | null,
    error,
  };
}

export async function getMessages(
  conversationId: string,
  before?: string,
  limit = 40
) {
  let query = supabase
    .from("messages")
        .select(`
      id,
      conversation_id,
      sender_id,
      body,
      created_at,
      reply_to_message_id,
      reply_to (
        id,
        sender_id,
        body
      )
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", {
      ascending: false,
    })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;

  return {
    messages: (data ?? []) as ChatMessage[],
    error,
  };
}

export async function sendMessage(
  conversationId: string,
  text: string,
  replyToMessageId?: string | null
) {
  const cleanText = text.trim();

  if (!cleanText) {
    return {
      message: null,
      error: new Error("Message cannot be empty."),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      message: null,
      error:
        userError ??
        new Error("No authenticated user."),
    };
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: cleanText.slice(0, 2000),
      reply_to_message_id: replyToMessageId ?? null,
    })
    .select(`
      id,
      conversation_id,
      sender_id,
      body,
      created_at,
      reply_to_message_id,
      reply_to (
        id,
        sender_id,
        body
      )
    `)
    .single();

  return {
    message: data as ChatMessage | null,
    error,
  };
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: ChatMessage) => void
) {
  const channel = supabase
    .channel(
      `chat-${conversationId}-${Date.now()}-${Math.random()}`
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function markConversationRead(
  conversationId: string
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error:
        userError ??
        new Error("No authenticated user."),
    };
  }

  const { error } = await supabase
    .from("conversation_members")
    .update({
      last_read_at: new Date().toISOString(),
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  return { error };
}

export async function getConversationFriend(
  conversationId: string
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      friend: null,
      error:
        userError ??
        new Error("No authenticated user."),
    };
  }

  const { data: members, error: membersError } =
    await supabase
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", conversationId);

  if (membersError) {
    return {
      friend: null,
      error: membersError,
    };
  }

  const friendId = members?.find(
    (member) => member.user_id !== user.id
  )?.user_id;

  if (!friendId) {
    return {
      friend: null,
      error: new Error(
        "Conversation friend not found."
      ),
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, username, avatar_url"
    )
    .eq("id", friendId)
    .single();

  return {
    friend: data as ChatUser | null,
    error,
  };
}

export type ConversationListItem = {
  conversation_id: string;
  friend_id: string;
  friend_first_name: string | null;
  friend_username: string | null;
  friend_avatar_url: string | null;
  friend_country_code: string | null;
  last_message: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
};

export async function getMyConversations() {
  const { data, error } = await supabase.rpc(
    "get_my_conversations"
  );

  return {
    conversations: (data ?? []) as ConversationListItem[],
    error,
  };
}

export function subscribeToConversationList(
  onChange: () => void
) {
  const channel = supabase
    .channel("conversation-list")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export type TypingPayload = {
  userId: string;
  isTyping: boolean;
};

export function createTypingChannel(
  conversationId: string,
  onTypingChange: (
    payload: TypingPayload
  ) => void
) {
  const channel = supabase
    .channel(`typing-${conversationId}`)
    .on(
      "broadcast",
      {
        event: "typing",
      },
      ({ payload }) => {
        onTypingChange(
          payload as TypingPayload
        );
      }
    )
    .subscribe();

  const sendTyping = async (
    userId: string,
    isTyping: boolean
  ) => {
    await channel.send({
      type: "broadcast",
      event: "typing",
      payload: {
        userId,
        isTyping,
      },
    });
  };

  const unsubscribe = () => {
    supabase.removeChannel(channel);
  };

  return {
    sendTyping,
    unsubscribe,
  };
}