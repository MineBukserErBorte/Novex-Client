import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { isHomeAdmin } from '../services/homeContent';
export function useHomeAdmin() {
    const [admin, setAdmin] = useState(false);
    useEffect(() => {
        let disposed = false, generation = 0;
        const refresh = async () => { const current = ++generation; const result = await isHomeAdmin(); if (!disposed && current === generation) setAdmin(result); };
        void refresh();
        let unsubscribe = () => {};
        try {
            const { data } = supabase.auth.onAuthStateChange(() => { generation++; setAdmin(false); queueMicrotask(() => void refresh()); });
            unsubscribe = () => data.subscription.unsubscribe();
        } catch { /* Optional backend unavailable. */ }
        const timer = setInterval(() => void refresh(), 45000);
        return () => { disposed = true; clearInterval(timer); unsubscribe(); };
    }, []);
    return admin;
}
