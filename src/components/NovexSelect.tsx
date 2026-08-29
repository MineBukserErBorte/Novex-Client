import { useEffect, useId, useRef, useState } from "react";

export type NovexSelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

type Props = {
    value: string;
    onChange: (value: string) => void;
    options: NovexSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

export default function NovexSelect({
    value,
    onChange,
    options,
    placeholder = "Select...",
    disabled = false,
    className = ""
}: Props) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const listId = useId();

    const selected = options.find(
        option => option.value === value
    );

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (
                !rootRef.current?.contains(
                    event.target as Node
                )
            ) {
                setOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            close
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                close
            );
        };
    }, []);

    useEffect(() => {
        const close = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener(
            "keydown",
            close
        );

        return () => {
            document.removeEventListener(
                "keydown",
                close
            );
        };
    }, []);

    return (
        <div
            ref={rootRef}
            className={[
                "novex-select",
                open
                    ? "novex-select-open"
                    : "",
                disabled
                    ? "novex-select-disabled"
                    : "",
                className
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <button
                type="button"
                className="novex-select-trigger"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                onClick={() =>
                    setOpen(
                        current => !current
                    )
                }
            >
                <span
                    className={
                        selected
                            ? "novex-select-value"
                            : "novex-select-placeholder"
                    }
                >
                    {selected?.label ??
                        placeholder}
                </span>

                <span
                    className="novex-select-arrow"
                    aria-hidden="true"
                >
                    ⌄
                </span>
            </button>

            {open && (
                <div
                    id={listId}
                    className="novex-select-menu"
                    role="listbox"
                >
                    {options.length === 0 ? (
                        <div className="novex-select-empty">
                            No options available
                        </div>
                    ) : (
                        options.map(option => (
                            <button
                                type="button"
                                role="option"
                                aria-selected={
                                    option.value === value
                                }
                                key={option.value}
                                disabled={
                                    option.disabled
                                }
                                className={[
                                    "novex-select-option",
                                    option.value ===
                                    value
                                        ? "selected"
                                        : "",
                                    option.disabled
                                        ? "disabled"
                                        : ""
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                onClick={() => {
                                    if (
                                        option.disabled
                                    ) {
                                        return;
                                    }

                                    onChange(
                                        option.value
                                    );

                                    setOpen(false);
                                }}
                            >
                                <span>
                                    {option.label}
                                </span>

                                {option.value ===
                                    value && (
                                    <span className="novex-select-check">
                                        ✓
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}