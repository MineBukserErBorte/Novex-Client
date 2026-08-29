import type {
    MinecraftInstance
} from "../services/instances";


type Props = {
    instances: MinecraftInstance[];
    onOpenInstances: () => void;
    onOpenMods: () => void;
    onOpenFriends: () => void;
    onOpenInstance: (
        instance: MinecraftInstance
    ) => void;
};


export default function Home({
    instances,
    onOpenInstances,
    onOpenMods,
    onOpenFriends,
    onOpenInstance
}: Props) {

    return (

        <div className="home">

            <section className="home-hero">

                <div className="home-hero-copy">

                    <div className="eyebrow">
                        WELCOME TO NOVEX
                    </div>

                    <h1>
                        Your Minecraft.
                        <br />
                        <span>
                            Your way.
                        </span>
                    </h1>

                    <p>
                        Manage instances, install
                        mods, and keep every Minecraft
                        setup organized in one place.
                    </p>

                    <div className="home-hero-actions">

                        <button
                            className="primary-button"
                            onClick={
                                onOpenInstances
                            }
                        >
                            Create Instance
                        </button>

                        <button
                            className="secondary-button"
                            onClick={
                                onOpenMods
                            }
                        >
                            Browse Mods
                        </button>

                    </div>

                </div>


                <div className="home-hero-card">

                    <div className="home-hero-card-label">
                        YOUR LIBRARY
                    </div>

                    <strong>
                        {instances.length}
                    </strong>

                    <span>
                        {
                            instances.length === 1
                                ? "Minecraft instance"
                                : "Minecraft instances"
                        }
                    </span>

                    <div className="home-hero-card-line" />

                </div>

            </section>


            <section className="section">

                <div className="section-title">

                    <div>

                        <div className="eyebrow">
                            LIBRARY
                        </div>

                        <h2>
                            Your Instances
                        </h2>

                    </div>

                    {instances.length > 0 && (

                        <button
                            className="text-button"
                            onClick={
                                onOpenInstances
                            }
                        >
                            View all
                            <span>
                                →
                            </span>
                        </button>

                    )}

                </div>


                {!instances.length ? (

                    <div className="empty-card">

                        <div className="empty-icon">
                            +
                        </div>

                        <h3>
                            No instances yet
                        </h3>

                        <p>
                            Create your first Minecraft
                            instance to get started.
                        </p>

                        <button
                            className="primary-button"
                            onClick={
                                onOpenInstances
                            }
                        >
                            Create Instance
                        </button>

                    </div>

                ) : (

                    <div className="home-instance-grid">

                        {instances
                            .slice(0, 4)
                            .map(instance => (

                                <button
                                    className="home-instance-card"
                                    key={
                                        instance.id
                                    }
                                    onClick={() =>
                                        onOpenInstance(
                                            instance
                                        )
                                    }
                                >

                                    <div className="home-instance-icon-wrap">

                                        {instance.icon ? (

                                            <img
                                                className="home-instance-icon"
                                                src={
                                                    instance.icon
                                                }
                                                alt=""
                                            />

                                        ) : (

                                            <div className="home-instance-icon-placeholder">
                                                MC
                                            </div>

                                        )}

                                    </div>


                                    <div className="home-instance-info">

                                        <h3
                                            title={
                                                instance.name
                                            }
                                        >
                                            {
                                                instance.name
                                            }
                                        </h3>

                                        <p>
                                            Minecraft{" "}
                                            {
                                                instance.minecraftVersion
                                            }
                                        </p>

                                        <span>
                                            {
                                                formatLoader(
                                                    instance.loader
                                                )
                                            }
                                        </span>

                                    </div>


                                    <span className="home-instance-arrow">
                                        →
                                    </span>

                                </button>

                            ))}

                    </div>

                )}

            </section>


            <section className="section">

                <div className="section-title">

                    <div>

                        <div className="eyebrow">
                            EXPLORE
                        </div>

                        <h2>
                            Novex
                        </h2>

                    </div>

                </div>


                <div className="feature-grid">

                    <Feature
                        icon="MOD"
                        title="Mods"
                        description="Find and install compatible Modrinth mods."
                        onClick={
                            onOpenMods
                        }
                    />

                    <Feature
                        icon="MC"
                        title="Instances"
                        description="Keep every Minecraft setup separate and organized."
                        onClick={
                            onOpenInstances
                        }
                    />

                    <Feature
                        icon="FR"
                        title="Friends"
                        description="Connect with other Novex users."
                        onClick={
                            onOpenFriends
                        }
                    />

                </div>

            </section>

        </div>

    );
}


function formatLoader(
    loader: MinecraftInstance["loader"]
) {
    return loader === "neoforge"
        ? "NeoForge"
        : loader.charAt(0).toUpperCase() +
          loader.slice(1);
}


function Feature({
    icon,
    title,
    description,
    onClick
}: {
    icon: string;
    title: string;
    description: string;
    onClick: () => void;
}) {

    return (

        <button
            className="feature-card"
            onClick={onClick}
        >

            <span className="feature-icon">
                {icon}
            </span>

            <div>

                <h3>
                    {title}
                </h3>

                <p>
                    {description}
                </p>

            </div>

            <span className="feature-arrow">
                →
            </span>

        </button>

    );
}