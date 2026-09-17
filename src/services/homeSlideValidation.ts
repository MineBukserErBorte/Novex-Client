export const slideTypes = ['welcome', 'announcement', 'advertisement', 'partner_server', 'news', 'update', 'custom'] as const;
export type SlideType = typeof slideTypes[number];
export interface HomeSlide {
    id: string; type: SlideType; title: string; subtitle: string; description: string;
    image_url: string; button_text: string; button_url: string; server_address: string;
    enabled: boolean; sort_order: number; starts_at: string | null; ends_at: string | null;
}
export function safeHttps(value: unknown): string {
    if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\u007f]/.test(value)) return '';
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && url.hostname ? url.href : ''; } catch { return ''; }
}
export function parseSlide(value: unknown): HomeSlide | null {
    if (!value || typeof value !== 'object') return null;
    const row = value as Record<string, unknown>;
    if (typeof row.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(row.id) || !slideTypes.includes(row.type as SlideType) || typeof row.enabled !== 'boolean' || !Number.isInteger(row.sort_order) || Math.abs(Number(row.sort_order)) > 1000000) return null;
    const lengths = { title: 120, subtitle: 200, description: 2000, image_url: 2048, button_text: 60, button_url: 2048, server_address: 253 };
    const strings: Record<string, string> = {};
    for (const [key, limit] of Object.entries(lengths)) {
        const text = row[key] ?? '';
        if (typeof text !== 'string' || text.length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) return null;
        strings[key] = text;
    }
    if (!strings.title.trim()) return null;
    for (const key of ['image_url', 'button_url']) if (strings[key] && !safeHttps(strings[key])) return null;
    if (strings.server_address && !/^(?:[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)(?::[0-9]{1,5})?$/i.test(strings.server_address)) return null;
    if (strings.server_address.includes(':') && Number(strings.server_address.split(':')[1]) > 65535) return null;
    for (const key of ['starts_at', 'ends_at']) if (row[key] != null && (typeof row[key] !== 'string' || row[key].length > 40 || !Number.isFinite(Date.parse(row[key])))) return null;
    if (row.starts_at && row.ends_at && Date.parse(String(row.starts_at)) >= Date.parse(String(row.ends_at))) return null;
    return { id: row.id, type: row.type as SlideType, ...strings, enabled: row.enabled, sort_order: Number(row.sort_order), starts_at: row.starts_at as string || null, ends_at: row.ends_at as string || null } as HomeSlide;
}
export function visibleSlides(rows: HomeSlide[], now = Date.now()) {
    return rows.filter(row => row.enabled && (!row.starts_at || Date.parse(row.starts_at) <= now) && (!row.ends_at || Date.parse(row.ends_at) > now)).sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}
