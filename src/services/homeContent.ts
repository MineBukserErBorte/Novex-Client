import { supabase } from './supabase';
import { parseSlide, type HomeSlide } from './homeSlideValidation';
export async function fetchSlides(admin = false): Promise<HomeSlide[]> {
    let query = supabase.from('home_slides').select('id,type,title,subtitle,description,image_url,button_text,button_url,server_address,enabled,sort_order,starts_at,ends_at').order('sort_order').order('id').limit(200);
    if (!admin) query = query.eq('enabled', true);
    const { data, error } = await query.abortSignal(AbortSignal.timeout(15000));
    if (error) throw new Error('Home content is unavailable. Check your connection and the Home content database setup.');
    return (data || []).map(parseSlide).filter((slide): slide is HomeSlide => Boolean(slide));
}
export async function isHomeAdmin(): Promise<boolean> {
    try { const { data, error } = await supabase.rpc('novex_is_admin'); return !error && data === true; } catch { return false; }
}
export async function saveSlide(slide: HomeSlide, existing: boolean) {
    const validated = parseSlide(slide);
    if (!validated) throw new Error('Check the slide fields, HTTPS URLs, server address and date range.');
    const query = existing ? supabase.from('home_slides').update(validated).eq('id', slide.id) : supabase.from('home_slides').insert(validated);
    const { data, error } = await query.select('id').single();
    if (error || !data) throw new Error('Slide could not be saved. Verify your admin access and database setup.');
}
export async function deleteSlide(id: string) {
    const { data, error } = await supabase.from('home_slides').delete().eq('id', id).select('id').single();
    if (error || !data) throw new Error('Slide could not be deleted. Verify your admin access.');
}
