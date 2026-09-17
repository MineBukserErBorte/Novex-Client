import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
let client: SupabaseClient | undefined;
const storage = {
    async getItem(storageKey: string) {
        if (!window.novex?.socialSession) return null;
        const saved = await window.novex.socialSession.read();
        if (saved !== null) return saved || null;
        const legacy = localStorage.getItem(storageKey);
        if (legacy) { await window.novex.socialSession.write(legacy); localStorage.removeItem(storageKey); }
        return legacy;
    },
    async setItem(_storageKey: string, value: string) { await window.novex?.socialSession.write(value); },
    async removeItem(storageKey: string) { await window.novex?.socialSession.write(''); localStorage.removeItem(storageKey); }
};
// Keep local Minecraft functionality available when the optional social backend
// is not configured. Existing callers receive an actionable error on use.
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, property) {
        if (!client) {
            if (!url || !key) throw new Error('Novex social services are not configured. Set the public Supabase URL and publishable/anon key.');
            client = createClient(url, key, { auth: { storage, persistSession: true, detectSessionInUrl: false } });
        }
        const value = Reflect.get(client, property);
        return typeof value === 'function' ? value.bind(client) : value;
    }
});
