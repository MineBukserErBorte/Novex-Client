// Keep diagnostics at the call site; show a bounded, readable message in the UI.
export function uiError(error: unknown, fallback: string): string {
    if (!(error instanceof Error)) return fallback;
    const message = error.message.replace(/^Error invoking remote method '[^']+': (?:Error: )?/, '').split('\n')[0].trim();
    if (!message || /TypeError|ReferenceError|SyntaxError|Cannot read|undefined|fetch failed|Failed to fetch/i.test(message)) return fallback;
    return message.length > 300 ? fallback : message;
}
