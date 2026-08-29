import { useEffect, useState, type ReactNode } from "react";
import "./index.css";

import Instances from "./pages/Instances";
import Home from "./pages/Home";
import Mods from "./pages/Mods";
import Versions from "./pages/Versions";
import Files from "./pages/Files";
import Friends from "./pages/Friends";
import Chat from "./pages/Chat";
import Modpacks from "./pages/Modpacks";
import InstanceEditor from "./pages/InstanceEditor";

import {
    getInstances,
    type MinecraftInstance
} from "./services/instances";

import {
    getSession,
    getProfile,
    type NovexProfile
} from "./services/accounts";


type Page =
    | "home"
    | "instances"
    | "mods"
    | "modpacks"
    | "files"
    | "versions"
    | "friends"
    | "chat"
    | "settings"
    | "instance";


function App() {

    const [page, setPage] =
        useState<Page>("home");

    const [instances, setInstances] =
        useState<MinecraftInstance[]>(
            getInstances()
        );

    const [
        selectedInstance,
        setSelectedInstance
    ] = useState<MinecraftInstance | null>(
        null
    );

    const [profile, setProfile] =
        useState<NovexProfile | null>(
            null
        );


    function refreshInstances() {

        setInstances(
            getInstances()
        );

    }


    function openInstance(
        instance: MinecraftInstance
    ) {

        setSelectedInstance(instance);
        setPage("instance");

    }


    useEffect(() => {

        getSession()
            .then(session => {

                if (!session) {

                    setProfile(null);
                    return;

                }

                return getProfile(
                    session.user.id
                );

            })
            .then(profile => {

                if (profile !== undefined) {

                    setProfile(profile);

                }

            })
            .catch(error => {

                console.error(
                    "Failed to load profile:",
                    error
                );

                setProfile(null);

            });

    }, []);


    function nav(next: Page) {

        setPage(next);

    }


    function refreshSelectedInstance() {

        refreshInstances();

        if (!selectedInstance) {
            return;
        }

        const fresh =
            getInstances().find(
                instance =>
                    instance.id ===
                    selectedInstance.id
            );

        if (fresh) {

            setSelectedInstance(fresh);

        }

    }


    const pageInfo: Record<Page, {
        title: string;
        description: string;
    }> = {

        home: {
            title: "Home",
            description: "Welcome back to Novex"
        },

        instances: {
            title: "Instances",
            description: "Manage your Minecraft installations"
        },

        instance: {
            title: selectedInstance?.name || "Instance",
            description: "Instance management"
        },

        mods: {
            title: "Mods",
            description: "Discover and manage your mods"
        },

        modpacks: {
            title: "Modpacks",
            description: "Browse and manage modpacks"
        },

        files: {
            title: "Files",
            description: "Manage your Minecraft files"
        },

        versions: {
            title: "Versions",
            description: "Minecraft versions and loaders"
        },

        friends: {
            title: "Friends",
            description: "Your Novex social network"
        },

        chat: {
            title: "Chat",
            description: "Messages and conversations"
        },

        settings: {
            title: "Settings",
            description: "Configure your Novex client"
        }

    };


    return (

        <div className="app-shell">

            {/* SIDEBAR */}

            <aside className="sidebar">

                <button
                    className="sidebar-brand"
                    onClick={() => nav("home")}
                >

                    <div className="brand-mark">
                        N
                    </div>

                    <div className="brand-copy">

                        <div className="brand-name">
                            NOVEX
                        </div>

                        <div className="brand-label">
                            MINECRAFT CLIENT
                        </div>

                    </div>

                </button>


                <nav className="sidebar-navigation">

                    <div className="sidebar-section">

                        <div className="sidebar-section-title">
                            Library
                        </div>

                        <NavItem
                            icon={<HomeIcon />}
                            label="Home"
                            active={page === "home"}
                            onClick={() => nav("home")}
                        />

                        <NavItem
                            icon={<CubeIcon />}
                            label="Instances"
                            active={
                                page === "instances" ||
                                page === "instance"
                            }
                            onClick={() => nav("instances")}
                        />

                    </div>


                    <div className="sidebar-section">

                        <div className="sidebar-section-title">
                            Content
                        </div>

                        <NavItem
                            icon={<PuzzleIcon />}
                            label="Mods"
                            active={page === "mods"}
                            onClick={() => nav("mods")}
                        />

                        <NavItem
                            icon={<PackageIcon />}
                            label="Modpacks"
                            active={page === "modpacks"}
                            onClick={() => nav("modpacks")}
                        />

                        <NavItem
                            icon={<FolderIcon />}
                            label="Files"
                            active={page === "files"}
                            onClick={() => nav("files")}
                        />

                        <NavItem
                            icon={<LayersIcon />}
                            label="Versions"
                            active={page === "versions"}
                            onClick={() => nav("versions")}
                        />

                    </div>


                    <div className="sidebar-section">

                        <div className="sidebar-section-title">
                            Social
                        </div>

                        <NavItem
                            icon={<UsersIcon />}
                            label="Friends"
                            active={page === "friends"}
                            onClick={() => nav("friends")}
                        />

                        <NavItem
                            icon={<ChatIcon />}
                            label="Chat"
                            active={page === "chat"}
                            onClick={() => nav("chat")}
                        />

                    </div>

                </nav>


                <div className="sidebar-footer">

                    <NavItem
                        icon={<SettingsIcon />}
                        label="Settings"
                        active={page === "settings"}
                        onClick={() => nav("settings")}
                    />


                    <button
                        className="account-card"
                        onClick={() => nav("friends")}
                    >

                        <div className="account-avatar">

                            {profile?.username
                                ?.slice(0, 1)
                                .toUpperCase()
                                || "?"}

                        </div>

                        <div className="account-details">

                            <div className="account-name">
                                {
                                    profile?.username ||
                                    "Not signed in"
                                }
                            </div>

                            <div className="account-status">

                                <span
                                    className={
                                        profile
                                            ? "status-dot online"
                                            : "status-dot"
                                    }
                                />

                                {
                                    profile
                                        ? "Novex account"
                                        : "Sign in"
                                }

                            </div>

                        </div>

                        <ChevronIcon />

                    </button>

                </div>

            </aside>


            {/* MAIN */}

            <div className="app-main">

                {/* TOPBAR */}

                <header className="topbar">

                    <div className="topbar-page">

                        <div className="topbar-title">
                            {pageInfo[page].title}
                        </div>

                        <div className="topbar-description">
                            {pageInfo[page].description}
                        </div>

                    </div>


                    <div className="topbar-actions">

                        <div className="topbar-status">

                            <span className="status-dot online" />

                            Novex

                        </div>

                    </div>

                </header>


                {/* CONTENT */}

                <main className="content">

                    {page === "home" && (

                        <Home
                            instances={instances}
                            onOpenInstances={() =>
                                nav("instances")
                            }
                            onOpenMods={() =>
                                nav("mods")
                            }
                            onOpenFriends={() =>
                                nav("friends")
                            }
                            onOpenInstance={
                                openInstance
                            }
                        />

                    )}


                    {page === "instances" && (

                        <Instances
                            instances={instances}
                            onInstancesChanged={
                                refreshInstances
                            }
                            onEditInstance={
                                openInstance
                            }
                        />

                    )}


                    {page === "instance" && (

                        selectedInstance ? (

                            <InstanceEditor
                                instance={
                                    selectedInstance
                                }
                                onBack={() =>
                                    nav("instances")
                                }
                                onInstancesChanged={
                                    refreshSelectedInstance
                                }
                            />

                        ) : (

                            <EmptyInstance />

                        )

                    )}


                    {page === "mods" && (

                        <Mods
                            instances={instances}
                        />

                    )}


                    {page === "modpacks" && (

                        <Modpacks
                            instances={instances}
                        />

                    )}


                    {page === "files" && (

                        <Files
                            instances={instances}
                        />

                    )}


                    {page === "versions" && (

                        <Versions />

                    )}


                    {page === "friends" && (

                        <Friends
                            onProfileChanged={
                                setProfile
                            }
                        />

                    )}


                    {page === "chat" && (

                        <Chat />

                    )}


                    {page === "settings" && (

                        <SettingsPlaceholder />

                    )}

                </main>

            </div>

        </div>

    );

}


/* =========================================================
   NAV ITEM
   ========================================================= */

function NavItem({

    icon,
    label,
    active,
    onClick

}: {

    icon: ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;

}) {

    return (

        <button
            className={
                `sidebar-nav-item ${
                    active ? "active" : ""
                }`
            }
            onClick={onClick}
        >

            <span className="sidebar-nav-icon">
                {icon}
            </span>

            <span className="sidebar-nav-label">
                {label}
            </span>

        </button>

    );

}


/* =========================================================
   EMPTY INSTANCE
   ========================================================= */

function EmptyInstance() {

    return (

        <div className="empty-page">

            <div className="empty-page-icon">
                <CubeIcon />
            </div>

            <div className="eyebrow">
                NOVEX CLIENT
            </div>

            <h1>
                No instance selected
            </h1>

            <p>
                Select an instance to open
                the instance editor.
            </p>

        </div>

    );

}


/* =========================================================
   SETTINGS
   ========================================================= */

function SettingsPlaceholder() {

    return (

        <div className="empty-page">

            <div className="empty-page-icon">
                <SettingsIcon />
            </div>

            <div className="eyebrow">
                NOVEX CLIENT
            </div>

            <h1>
                Settings
            </h1>

            <p>
                Launcher and Novex account
                settings will live here.
            </p>

        </div>

    );

}


/* =========================================================
   ICONS
   ========================================================= */

function Icon({
    children
}: {
    children: ReactNode;
}) {

    return (

        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {children}
        </svg>

    );

}


function HomeIcon() {

    return (
        <Icon>
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
            <path d="M9 21v-6h6v6" />
        </Icon>
    );

}


function CubeIcon() {

    return (
        <Icon>
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
            <path d="m4 7.5 8 4.5 8-4.5" />
            <path d="M12 12v9" />
        </Icon>
    );

}


function PuzzleIcon() {

    return (
        <Icon>
            <path d="M19 13h2v-3h-3V7h-3V4h-3v2H9v3H6v3H3v3h3v3h3v3h3v-3h3v-3h3v-2Z" />
        </Icon>
    );

}


function PackageIcon() {

    return (
        <Icon>
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
            <path d="m4 7.5 8 4.5 8-4.5" />
            <path d="M12 12v9" />
            <path d="m8 5 8 4.5" />
        </Icon>
    );

}


function FolderIcon() {

    return (
        <Icon>
            <path d="M3 6.5h7l2 2h9v10H3v-12Z" />
        </Icon>
    );

}


function LayersIcon() {

    return (
        <Icon>
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="m3 12 9 5 9-5" />
            <path d="m3 16 9 5 9-5" />
        </Icon>
    );

}


function UsersIcon() {

    return (
        <Icon>
            <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9.5" cy="7" r="4" />
            <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Icon>
    );

}


function ChatIcon() {

    return (
        <Icon>
            <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2v-5.5a7.5 7.5 0 1 1 16-4Z" />
        </Icon>
    );

}


function SettingsIcon() {

    return (
        <Icon>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V20h-2v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-1.42-1.42.06-.06A1.7 1.7 0 0 0 8.6 15a1.7 1.7 0 0 0-1.55-1H7v-2h.05a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.42-1.42.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1-1.55V6h2v.49a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.42 1.42-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1H20v2h-.6a1.7 1.7 0 0 0-0 1Z" />
        </Icon>
    );

}


function ChevronIcon() {

    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );

}


export default App;