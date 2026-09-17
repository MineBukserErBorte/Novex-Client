import { useEffect, useId, useRef, useState } from "react";

export type NovexSelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

type Props = {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: NovexSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

export default function NovexSelect({
    label,
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

    const triggerRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (disabled) setOpen(false);
        if (open) rootRef.current?.querySelector<HTMLButtonElement>('[role="option"][aria-selected="true"]:not(:disabled), [role="option"]:not(:disabled)')?.focus();
    }, [open, disabled]);
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
            onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
            onKeyDown={event => {
                if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
                if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || disabled) return;
                event.preventDefault();
                if (!open) { setOpen(true); return; }
                const choices = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)') || []);
                const index = choices.indexOf(document.activeElement as HTMLButtonElement);
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + choices.length) % choices.length;
                choices[next]?.focus();
            }}
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
                ref={triggerRef}
                aria-label={label}
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
                    aria-label={label}
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
                                    triggerRef.current?.focus();
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