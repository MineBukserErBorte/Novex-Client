import { useEffect, useState } from "react";

export default function Settings() {

    const [theme, setTheme] =
        useState(
            localStorage.getItem(
                "novex-theme"
            ) || "dark"
        );

    const [closeToTray, setCloseToTray] =
        useState(
            localStorage.getItem(
                "novex-close-to-tray"
            ) === "true"
        );

    const [showConsole, setShowConsole] =
        useState(
            localStorage.getItem(
                "novex-show-console"
            ) !== "false"
        );


    useEffect(() => {

        document.documentElement
            .setAttribute(
                "data-theme",
                theme
            );

        localStorage.setItem(
            "novex-theme",
            theme
        );

    }, [theme]);


    useEffect(() => {

        localStorage.setItem(
            "novex-close-to-tray",
            String(closeToTray)
        );

    }, [closeToTray]);


    useEffect(() => {

        localStorage.setItem(
            "novex-show-console",
            String(showConsole)
        );

    }, [showConsole]);


    function resetSettings() {

        const confirmed =
            window.confirm(
                "Reset all Novex settings?"
            );

        if (!confirmed) {
            return;
        }

        localStorage.removeItem(
            "novex-theme"
        );

        localStorage.removeItem(
            "novex-close-to-tray"
        );

        localStorage.removeItem(
            "novex-show-console"
        );

        setTheme("dark");
        setCloseToTray(false);
        setShowConsole(true);

    }


    return (

        <div className="page">

            <div className="page-header">

                <div>

                    <h1>Settings</h1>

                    <p>
                        Customize your Novex Client.
                    </p>

                </div>

            </div>


            <section className="card">

                <h2>
                    Appearance
                </h2>

                <p>
                    Choose how Novex looks.
                </p>


                <label>

                    Theme

                    <select
                        value={theme}
                        onChange={e =>
                            setTheme(
                                e.target.value
                            )
                        }
                    >

                        <option value="dark">
                            Dark
                        </option>

                        <option value="light">
                            Light
                        </option>

                        <option value="system">
                            System
                        </option>

                    </select>

                </label>

            </section>


            <section className="card">

                <h2>
                    Minecraft
                </h2>

                <label
                    style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center"
                    }}
                >

                    <input
                        type="checkbox"
                        checked={showConsole}
                        onChange={e =>
                            setShowConsole(
                                e.target.checked
                            )
                        }
                    />

                    Show Minecraft console

                </label>

            </section>


            <section className="card">

                <h2>
                    Window
                </h2>

                <label
                    style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center"
                    }}
                >

                    <input
                        type="checkbox"
                        checked={closeToTray}
                        onChange={e =>
                            setCloseToTray(
                                e.target.checked
                            )
                        }
                    />

                    Minimize to tray when closing

                </label>

            </section>


            <section className="card">

                <h2>
                    Danger Zone
                </h2>

                <button
                    onClick={resetSettings}
                >
                    Reset Settings
                </button>

            </section>

        </div>

    );

}