import { useEffect, useState } from "react";

import {
    getSession,
    listFriends,
    listMessages,
    sendMessage,
    type Friend,
    type Message
} from "../services/accounts";

import type { Session } from "@supabase/supabase-js";


export default function Chat() {

    const [session, setSession] =
        useState<Session | null>(null);

    const [friends, setFriends] =
        useState<Friend[]>([]);

    const [selected, setSelected] =
        useState<Friend | null>(null);

    const [messages, setMessages] =
        useState<Message[]>([]);

    const [text, setText] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(true);


    /*
     * Load session.
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

            })
            .finally(() => {

                setLoading(false);

            });

    }, []);


    /*
     * Load friends once signed in.
     */

    useEffect(() => {

        if (!session) {
            return;
        }

        listFriends()
            .then(setFriends)
            .catch(error => {

                setError(
                    error instanceof Error
                        ? error.message
                        : "Could not load friends."
                );

            });

    }, [session?.access_token]);


    /*
     * Load messages for selected friend.
     */

    useEffect(() => {

        if (!selected) {

            setMessages([]);
            return;

        }


        let active = true;


        const load = async () => {

            try {

                const result =
                    await listMessages(
                        selected.id
                    );

                if (active) {

                    setMessages(
                        result
                    );

                }

            } catch (error) {

                if (active) {

                    setError(
                        error instanceof Error
                            ? error.message
                            : "Could not load messages."
                    );

                }

            }

        };


        load();


        const id =
            window.setInterval(
                load,
                3000
            );


        return () => {

            active = false;

            window.clearInterval(
                id
            );

        };

    }, [selected?.id]);


    /*
     * Send message.
     */

    async function send() {

        if (
            !selected ||
            !text.trim()
        ) {

            return;

        }


        try {

            setError("");

            const content =
                text.trim();


            await sendMessage(
                selected.id,
                content
            );


            setText("");


            setMessages(
                await listMessages(
                    selected.id
                )
            );

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not send message."
            );

        }

    }


    /*
     * Loading.
     */

    if (loading) {

        return (

            <div className="page">

                <div className="empty-state">

                    Loading chat...

                </div>

            </div>

        );

    }


    /*
     * Not signed in.
     */

    if (!session) {

        return (

            <div className="placeholder">

                <h1>
                    Chat
                </h1>

                <p>
                    Sign in on Friends to
                    use Novex chat.
                </p>

            </div>

        );

    }


    return (

        <div className="chat-layout">

            <aside className="chat-friends">

                {friends.length === 0 ? (

                    <div
                        className="empty-card"
                    >

                        <h3>
                            No friends
                        </h3>

                        <p>
                            Add some friends
                            to start chatting.
                        </p>

                    </div>

                ) : (

                    friends.map(
                        friend => (

                            <button
                                className={
                                    selected?.id ===
                                    friend.id
                                        ? "active"
                                        : ""
                                }
                                key={
                                    friend.id
                                }
                                onClick={() =>
                                    setSelected(
                                        friend
                                    )
                                }
                            >

                                {friend.username}

                            </button>

                        )
                    )

                )}

            </aside>


            <section className="chat-panel">

                {selected ? (

                    <>

                        <div className="chat-header">

                            <h2>
                                {selected.username}
                            </h2>

                        </div>


                        <div className="messages">

                            {messages.length === 0 ? (

                                <div className="empty-card">

                                    <h3>
                                        No messages yet
                                    </h3>

                                    <p>
                                        Start the
                                        conversation.
                                    </p>

                                </div>

                            ) : (

                                messages.map(
                                    message => (

                                        <div
                                            className={
                                                `message ${
                                                    message.sender_id ===
                                                    session.user.id
                                                        ? "mine"
                                                        : ""
                                                }`
                                            }
                                            key={
                                                message.id
                                            }
                                        >

                                            {message.content}

                                        </div>

                                    )
                                )

                            )}

                        </div>


                        <div className="chat-input">

                            <input
                                value={text}
                                onChange={e =>
                                    setText(
                                        e.target.value
                                    )
                                }
                                onKeyDown={e => {

                                    if (
                                        e.key ===
                                        "Enter"
                                    ) {

                                        send();

                                    }

                                }}
                                placeholder="Message..."
                            />


                            <button
                                className="primary-button"
                                onClick={send}
                            >
                                Send
                            </button>

                        </div>

                    </>

                ) : (

                    <div className="empty-card">

                        <h3>
                            Select a friend
                        </h3>

                        <p>
                            Choose someone to
                            start chatting.
                        </p>

                    </div>

                )}


                {error && (

                    <div className="install-error">

                        <p>
                            {error}
                        </p>

                    </div>

                )}

            </section>

        </div>

    );

}