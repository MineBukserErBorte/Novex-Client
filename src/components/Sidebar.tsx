import type { ReactNode } from "react";

export type SidebarPage =
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

type SidebarProps = {
    page: SidebarPage;
    profile: {
        username?: string | null;
        avatar_url?: string | null;
    } | null;
    onNavigate: (page: SidebarPage) => void;
};

type NavItemProps = {
    label: string;
    icon: ReactNode;
    active: boolean;
    onClick: () => void;
};

function NavItem({
    label,
    icon,
    active,
    onClick
}: NavItemProps) {
    return (
        <button
            className={`sidebar-nav-item ${
                active ? "active" : ""
            }`}
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

function InitialAvatar({
    username
}: {
    username?: string | null;
}) {
    return (
        <div className="account-avatar">
            {username
                ?.slice(0, 1)
                .toUpperCase() || "?"}
        </div>
    );
}

export default function Sidebar({
    page,
    profile,
    onNavigate
}: SidebarProps) {
    const signedIn = Boolean(profile);

    return (
        <aside className="sidebar">

            {/* LOGO */}

            <button
                className="sidebar-brand"
                onClick={() => onNavigate("home")}
                aria-label="Go to Novex home"
            >
                <div className="logo-icon">
                    N
                </div>

                <div className="logo-copy">
                    <div className="logo-title">
                        NOVEX
                    </div>

                    <div className="logo-subtitle">
                        CLIENT
                    </div>
                </div>
            </button>


            {/* NAVIGATION */}

            <nav className="sidebar-navigation">

                <div className="sidebar-section-label">
                    Library
                </div>

                <NavItem
                    label="Home"
                    active={page === "home"}
                    onClick={() =>
                        onNavigate("home")
                    }
                    icon={<HomeIcon />}
                />

                <NavItem
                    label="Instances"
                    active={
                        page === "instances" ||
                        page === "instance"
                    }
                    onClick={() =>
                        onNavigate("instances")
                    }
                    icon={<CubeIcon />}
                />

                <NavItem
                    label="Mods"
                    active={page === "mods"}
                    onClick={() =>
                        onNavigate("mods")
                    }
                    icon={<PuzzleIcon />}
                />

                <NavItem
                    label="Modpacks"
                    active={page === "modpacks"}
                    onClick={() =>
                        onNavigate("modpacks")
                    }
                    icon={<LayersIcon />}
                />

                <NavItem
                    label="Versions"
                    active={page === "versions"}
                    onClick={() =>
                        onNavigate("versions")
                    }
                    icon={<DownloadIcon />}
                />


                <div className="sidebar-divider" />

                <div className="sidebar-section-label">
                    Social
                </div>

                <NavItem
                    label="Friends"
                    active={page === "friends"}
                    onClick={() =>
                        onNavigate("friends")
                    }
                    icon={<UsersIcon />}
                />

                <NavItem
                    label="Chat"
                    active={page === "chat"}
                    onClick={() =>
                        onNavigate("chat")
                    }
                    icon={<ChatIcon />}
                />

            </nav>


            {/* BOTTOM */}

            <div className="sidebar-bottom">

                <NavItem
                    label="Settings"
                    active={page === "settings"}
                    onClick={() =>
                        onNavigate("settings")
                    }
                    icon={<SettingsIcon />}
                />


                <button
                    className="sidebar-account"
                    onClick={() =>
                        onNavigate("friends")
                    }
                >
                    {profile?.avatar_url ? (
                        <img
                            className="account-avatar-image"
                            src={profile.avatar_url}
                            alt=""
                        />
                    ) : (
                        <InitialAvatar
                            username={
                                profile?.username
                            }
                        />
                    )}

                    <span className="account-copy">

                        <span className="account-name">
                            {profile?.username ||
                                "Not signed in"}
                        </span>

                        <span className="account-status">
                            {signedIn
                                ? "Novex account"
                                : "Sign in to Novex"}
                        </span>

                    </span>

                    <span className="account-chevron">
                        ›
                    </span>
                </button>

            </div>

        </aside>
    );
}


/* =========================
   ICONS
   ========================= */

function Icon({
    children
}: {
    children: ReactNode;
}) {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

function HomeIcon() {
    return (
        <Icon>
            <path d="m3 10 9-7 9 7" />
            <path d="M5 9v11h14V9" />
            <path d="M9 20v-6h6v6" />
        </Icon>
    );
}

function CubeIcon() {
    return (
        <Icon>
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
            <path d="m4.5 7.5 7.5 4 7.5-4" />
            <path d="M12 12v9" />
        </Icon>
    );
}

function PuzzleIcon() {
    return (
        <Icon>
            <path d="M19 13h-2a2 2 0 1 1-4 0v-1h-1a2 2 0 1 1 0-4h1V6a2 2 0 1 1 4 0v2h2a2 2 0 1 1 0 4Z" />
            <path d="M13 12v2a2 2 0 1 1-4 0v-2H7a2 2 0 1 1 0-4h2V6" />
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

function DownloadIcon() {
    return (
        <Icon>
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
        </Icon>
    );
}

function UsersIcon() {
    return (
        <Icon>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Icon>
    );
}

function ChatIcon() {
    return (
        <Icon>
            <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-4 2 1.5-4A7.5 7.5 0 1 1 20 11.5Z" />
        </Icon>
    );
}

function SettingsIcon() {
    return (
        <Icon>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.8 1.8-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V22h-2.55v-.1a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.8-1.8.06-.06A1.7 1.7 0 0 0 8.1 17a1.7 1.7 0 0 0-1.56-1.03H6.45v-2.55h.09A1.7 1.7 0 0 0 8.1 12.4a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.8-1.8.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5h2.55v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.8 1.8-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21v2.55h-.1A1.7 1.7 0 0 0 19.4 15Z" />
        </Icon>
    );
}