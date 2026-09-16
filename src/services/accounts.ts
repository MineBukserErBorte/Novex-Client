import {
    supabase
} from "./supabase";


export interface NovexProfile {
    id: string;
    username: string;
    avatar_url?: string | null;
    created_at?: string;
}


export interface Friend {
    id: string;
    username: string;
    avatar_url?: string | null;
}


export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
}


export async function registerNovexAccount(
    email: string,
    password: string,
    username: string
) {
    const {
        data,
        error
    } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username
            }
        }
    });

    if (error) {
        throw error;
    }

    return data;
}


export async function loginNovexAccount(
    email: string,
    password: string
) {
    const {
        data,
        error
    } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw error;
    }

    return data;
}


export async function logoutNovexAccount() {
    const {
        error
    } = await supabase.auth.signOut();

    if (error) {
        throw error;
    }
}


export async function getCurrentUser() {
    const {
        data,
        error
    } = await supabase.auth.getUser();

    if (error) {
        return null;
    }

    return data.user;
}


export async function getCurrentProfile(): Promise<
    NovexProfile | null
> {
    const user =
        await getCurrentUser();

    if (!user) {
        return null;
    }

    return getProfile(user.id);
}


/*
 * SESSION
 */

export async function getSession() {
    const {
        data,
        error
    } = await supabase.auth.getSession();

    if (error) {
        return null;
    }

    return data.session;
}


/*
 * PROFILE
 */

export async function getProfile(
    userId: string
): Promise<NovexProfile | null> {

    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}


/*
 * FRIENDS / AUTH ALIASES
 *
 * These names are used by Friends.tsx.
 */

export async function signIn(
    email: string,
    password: string
) {
    return loginNovexAccount(
        email,
        password
    );
}


export async function signUp(
    email: string,
    password: string,
    username: string
) {
    return registerNovexAccount(
        email,
        password,
        username
    );
}


export async function signOut() {
    return logoutNovexAccount();
}


/*
 * SEARCH USERS
 */

export async function searchUsers(
    query: string
): Promise<Friend[]> {

    const trimmed =
        query.trim();

    if (!trimmed) {
        return [];
    }

    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select(
            "id, username, avatar_url"
        )
        .ilike(
            "username",
            `%${trimmed}%`
        )
        .limit(20);

    if (error) {
        throw error;
    }

    return data ?? [];
}


/*
 * FRIEND LIST
 */

export async function listFriends(): Promise<
    Friend[]
> {

    const {
        data,
        error
    } = await supabase
        .from("friends")
        .select(`
            friend_id,
            profiles:friend_id (
                id,
                username,
                avatar_url
            )
        `);

    if (error) {
        throw error;
    }

    return (data ?? [])
        .map((row: any) => row.profiles)
        .filter(Boolean);
}


/*
 * SEND FRIEND REQUEST
 */

export async function sendFriendRequest(
    userId: string
) {

    const session =
        await getSession();

    if (!session) {
        throw new Error(
            "You must be signed in."
        );
    }

    if (
        userId ===
        session.user.id
    ) {
        throw new Error(
            "You cannot add yourself."
        );
    }

    const {
        error
    } = await supabase
        .from("friend_requests")
        .insert({
            from_id:
                session.user.id,
            to_id:
                userId
        });

    if (error) {
        throw error;
    }
}


/*
 * INCOMING FRIEND REQUESTS
 */

export async function listIncomingRequests() {

    const {
        data,
        error
    } = await supabase
        .from("friend_requests")
        .select(`
            id,
            from_id,
            to_id,
            status,
            created_at,
            profiles:from_id (
                id,
                username,
                avatar_url
            )
        `)
        .eq(
            "status",
            "pending"
        );

    if (error) {
        throw error;
    }

    return data ?? [];
}


/*
 * ACCEPT FRIEND REQUEST
 */

export async function acceptFriendRequest(
    requestId: string
) {

    const {
        error
    } = await supabase.rpc(
        "accept_friend_request",
        {
            request_id:
                requestId
        }
    );

    if (error) {
        throw error;
    }
}


/*
 * CHAT MESSAGES
 */

export async function listMessages(
    friendId: string
): Promise<Message[]> {

    const session =
        await getSession();

    if (!session) {
        throw new Error(
            "You must be signed in."
        );
    }

    const userId =
        session.user.id;

    const {
        data,
        error
    } = await supabase
        .from("messages")
        .select("*")
        .or(
            `and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    if (error) {
        throw error;
    }

    return data ?? [];
}


/*
 * SEND MESSAGE
 */

export async function sendMessage(
    receiverId: string,
    content: string
) {

    const session =
        await getSession();

    if (!session) {
        throw new Error(
            "You must be signed in."
        );
    }

    const trimmed =
        content.trim();

    if (!trimmed) {
        return;
    }

    if (trimmed.length > 4000) {
        throw new Error(
            "Message is too long."
        );
    }

    const {
        error
    } = await supabase
        .from("messages")
        .insert({
            sender_id:
                session.user.id,
            receiver_id:
                receiverId,
            content:
                trimmed
        });

    if (error) {
        throw error;
    }
}


/*
 * AUTH STATE
 */

export function onAuthChange(
    callback: (
        user: NovexProfile | null
    ) => void
) {

    return supabase.auth.onAuthStateChange(
        async (
            _event,
            session
        ) => {

            if (!session?.user) {
                callback(null);
                return;
            }

            try {

                const profile =
                    await getProfile(
                        session.user.id
                    );

                callback(profile);

            } catch {

                callback(null);

            }

        }
    );
}