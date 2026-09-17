import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { fetchSlides } from '../services/homeContent';
import { visibleSlides, type HomeSlide } from '../services/homeSlideValidation';
export function useHomeSlides() {
    const [slides, setSlides] = useState<HomeSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [offline, setOffline] = useState(false);
    useEffect(() => {
        let disposed = false, running = false, again = false;
        let debounce: ReturnType<typeof setTimeout>;
        let rows: HomeSlide[] = [];
        async function reload() {
            if (disposed) return;
            if (running) { again = true; return; }
            running = true;
            try { rows = await fetchSlides(); if (!disposed) { setSlides(visibleSlides(rows)); setOffline(false); } }
            catch { if (!disposed) { rows = []; setSlides([]); setOffline(true); } }
            finally { running = false; if (!disposed) setLoading(false); if (again) { again = false; void reload(); } }
        }
        const reconcile = () => { clearTimeout(debounce); debounce = setTimeout(() => void reload(), 250); };
        void reload();
        // Revision events include disabling/deleting rows which public RLS may hide.
        let channel: ReturnType<typeof supabase.channel> | undefined;
        try {
            channel = supabase.channel('novex-home-content')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'home_slides' }, reconcile)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'home_content_revision' }, reconcile)
                .subscribe(status => { if (status === 'SUBSCRIBED') reconcile(); });
        } catch { /* Missing backend uses the same local fallback. */ }
        // Also reconciles scheduled starts and serves as fallback for missed events.
        const polling = setInterval(() => void reload(), 45000);
        const schedule = setInterval(() => { if (!disposed) setSlides(visibleSlides(rows)); }, 1000);
        window.addEventListener('online', reconcile);
        return () => { disposed = true; clearTimeout(debounce); clearInterval(polling); clearInterval(schedule); window.removeEventListener('online', reconcile); if (channel) void supabase.removeChannel(channel); };
    }, []);
    return { slides, loading, offline };
}
