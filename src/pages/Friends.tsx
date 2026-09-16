import { useEffect, useState } from "react";

import {
    getSession,
    signIn,
    signUp,
    signOut,
    getProfile,
    searchUsers,
    listFriends,
    sendFriendRequest,
    listIncomingRequests,
    acceptFriendRequest,
    type Friend,
    type NovexProfile
} from "../services/accounts";

import type { Session } from "@supabase/supabase-js";


type Props = {
    onProfileChanged:
        (profile: NovexProfile | null) => void;
};


export default function Friends({
    onProfileChanged
}: Props) {

    const [session, setSession] =
        useState<Session | null>(null);

    const [profile, setProfile] =
        useState<NovexProfile | null>(null);

    const [friends, setFriends] =
        useState<Friend[]>([]);

    const [users, setUsers] =
        useState<Friend[]>([]);

    const [requests, setRequests] =
        useState<any[]>([]);

    const [query, setQuery] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [username, setUsername] =
        useState("");

    const [error, setError] =
        useState("");

    const [register, setRegister] =
        useState(false);

    const [loading, setLoading] =
        useState(false);


    /*
     * Load current session.
     */

    useEffect(() => {

        getSession()
            .then(setSession)
            .catch(error => {

                console.error(
                    "Failed to get session:",
                    error
                );

                setSession(null);

            });

    }, []);


    /*
     * Load profile, friends and
     * incoming requests.
     */

    async function load() {

        if (!session) {
            return;
        }

        try {

            setError("");

            const p =
                await getProfile(
                    session.user.id
                );

            setProfile(p);
            onProfileChanged(p);

            const friendList =
                await listFriends();

            setFriends(friendList);

            const incoming =
                await listIncomingRequests();

            setRequests(incoming);

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not load friends."
            );

        }

    }


    useEffect(() => {

        load();

    }, [session?.access_token]);


    /*
     * Sign in / register.
     */

    async function auth() {

        try {

            setError("");
            setLoading(true);

            const result =
                register
                    ? await signUp(
                        email,
                        password,
                        username
                    )
                    : await signIn(
                        email,
                        password
                    );


            if (result.session) {

                setSession(
                    result.session
                );

            } else if (register) {

                setError(
                    "Check your email to confirm the account, then sign in."
                );

            } else {

                setError(
                    "Sign in failed. No active session was returned."
                );

            }

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Authentication failed."
            );

        } finally {

            setLoading(false);

        }

    }


    /*
     * Search users.
     */

    async function search() {

        if (!query.trim()) {

            setUsers([]);
            return;

        }

        try {

            setError("");

            setUsers(
                await searchUsers(
                    query
                )
            );

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Search failed."
            );

        }

    }


    /*
     * Send friend request.
     */

    async function request(
        id: string
    ) {

        try {

            setError("");

            await sendFriendRequest(
                id
            );

            setUsers(
                users.filter(
                    user =>
                        user.id !== id
                )
            );

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not send friend request."
            );

        }

    }


    /*
     * Accept friend request.
     */

    async function accept(
        id: string
    ) {

        try {

            setError("");

            await acceptFriendRequest(
                id
            );

            await load();

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not accept friend request."
            );

        }

    }


    /*
     * Not signed in.
     */

    if (!session) {

        return (

            <div className="page">

                <div className="page-header">

                    <div>

                        <div className="eyebrow">
                            NOVEX ACCOUNT
                        </div>

                        <h1>
                            {
                                register
                                    ? "Create account"
                                    : "Sign in"
                            }
                        </h1>

                        <p>
                            Accounts, friends and
                            messages are stored
                            securely in the Novex
                            backend.
                        </p>

                    </div>

                </div>


                <div className="auth-card">

                    {register && (

                        <input
                            placeholder="Username"
                            value={username}
                            onChange={e =>
                                setUsername(
                                    e.target.value
                                )
                            }
                        />

                    )}


                    <input
                        placeholder="Email"
                        value={email}
                        onChange={e =>
                            setEmail(
                                e.target.value
                            )
                        }
                    />


                    <input
                        placeholder="Password"
                        type="password"
                        value={password}
                        onChange={e =>
                            setPassword(
                                e.target.value
                            )
                        }
                    />


                    <button
                        className="primary-button"
                        onClick={auth}
                        disabled={loading}
                    >

                        {loading
                            ? "Please wait..."
                            : register
                                ? "Create account"
                                : "Sign in"}

                    </button>


                    <button
                        className="text-button"
                        onClick={() => {

                            setRegister(
                                !register
                            );

                            setError("");

                        }}
                    >

                        {register
                            ? "Already have an account? Sign in"
                            : "Create a Novex account"}

                    </button>


                    {error && (

                        <div className="install-error">

                            <p>
                                {error}
                            </p>

                        </div>

                    )}

                </div>

            </div>

        );

    }


    /*
     * Signed-in Friends page.
     */

    return (

        <div className="page">

            <div className="page-header">

                <div>

                    <div className="eyebrow">
                        SOCIAL
                    </div>

                    <h1>
                        Friends
                    </h1>

                    <p>
                        Signed in as{" "}
                        {profile?.username ||
                            session.user.email}
                    </p>

                </div>


                <button
                    className="secondary-button"
                    onClick={async () => {

                        try {

                            await signOut();

                            setSession(null);
                            setProfile(null);

                            onProfileChanged(
                                null
                            );

                        } catch (error) {

                            setError(
                                error instanceof Error
                                    ? error.message
                                    : "Could not sign out."
                            );

                        }

                    }}
                >
                    Sign out
                </button>

            </div>


            <div className="social-grid">

                <section className="editor-panel">

                    <h2>
                        Find friends
                    </h2>


                    <div className="mod-search">

                        <input
                            value={query}
                            onChange={e =>
                                setQuery(
                                    e.target.value
                                )
                            }
                            onKeyDown={e => {

                                if (
                                    e.key ===
                                    "Enter"
                                ) {

                                    search();

                                }

                            }}
                            placeholder="Search username"
                        />


                        <button
                            className="primary-button"
                            onClick={search}
                        >
                            Search
                        </button>

                    </div>


                    {users.map(
                        user => (

                            <div
                                className="friend-row"
                                key={user.id}
                            >

                                <b>
                                    {user.username}
                                </b>

                                <button
                                    className="secondary-button"
                                    onClick={() =>
                                        request(
                                            user.id
                                        )
                                    }
                                >
                                    Add
                                </button>

                            </div>

                        )
                    )}


                    {requests.map(
                        requestItem => (

                            <div
                                className="friend-row"
                                key={
                                    requestItem.id
                                }
                            >

                                <b>
                                    {
                                        requestItem
                                            .profiles
                                            ?.username ||
                                        "Unknown user"
                                    }
                                </b>

                                <button
                                    className="primary-button"
                                    onClick={() =>
                                        accept(
                                            requestItem.id
                                        )
                                    }
                                >
                                    Accept
                                </button>

                            </div>

                        )
                    )}

                </section>


                <section className="editor-panel">

                    <h2>
                        Your friends
                    </h2>


                    {friends.map(
                        friend => (

                            <div
                                className="friend-row"
                                key={
                                    friend.id
                                }
                            >

                                <b>
                                    {friend.username}
                                </b>

                                <span>
                                    Friend
                                </span>

                            </div>

                        )
                    )}


                    {!friends.length && (

                        <p>
                            No friends yet.
                        </p>

                    )}

                </section>

            </div>


            {error && (

                <div className="install-error">

                    <p>
                        {error}
                    </p>

                </div>

            )}

        </div>

    );

}