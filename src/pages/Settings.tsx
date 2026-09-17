import NovexSelect from "../components/NovexSelect";
import UpdateNotice from "../components/UpdateNotice";
import MinecraftAccounts from "../components/MinecraftAccounts";
import LauncherSettings from "../components/LauncherSettings";
import Legal from "./Legal";
import { useEffect, useState } from "react";

export default function Settings() {

    const [theme, setTheme] =
        useState(
            localStorage.getItem(
                "novex-theme"
            ) || "dark"
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


            <MinecraftAccounts />
            <LauncherSettings /><UpdateNotice settings />
            <Legal />

            <section className="card">

                <h2>
                    Appearance
                </h2>

                <p>
                    Choose how Novex looks.
                </p>


                <div className="settings-field"><span>Theme</span><NovexSelect label="Theme" value={theme} onChange={setTheme} options={[{value:'dark',label:'Dark'},{value:'light',label:'Light'},{value:'system',label:'System'}]} /></div>

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