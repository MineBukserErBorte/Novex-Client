import type { ReactNode } from "react";

type TopbarProps = {
    title: string;
    description?: string;
    children?: ReactNode;
};

export default function Topbar({
    title,
    description,
    children
}: TopbarProps) {
    return (
        <header className="topbar">

            <div className="topbar-left">

                <div className="topbar-title">
                    {title}
                </div>

                {description && (
                    <div className="topbar-description">
                        {description}
                    </div>
                )}

            </div>

            <div className="topbar-actions">
                {children}
            </div>

        </header>
    );
}