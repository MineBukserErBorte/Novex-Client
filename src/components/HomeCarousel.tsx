import { useEffect, useState, type ReactNode } from 'react';
import { useHomeSlides } from '../hooks/useHomeSlides';
import type { HomeSlide } from '../services/homeSlideValidation';
export function SlideContent({ slide, preview = false }: { slide: HomeSlide; preview?: boolean }) {
    const [message, setMessage] = useState('');
    const [failedImage, setFailedImage] = useState(false);
    useEffect(() => { setFailedImage(false); setMessage(''); }, [slide.image_url, slide.id]);
    async function copy() {
        try { await navigator.clipboard.writeText(slide.server_address); setMessage('Server address copied.'); } catch { setMessage('Could not copy. Select and copy the address below.'); }
    }
    return <section className="home-hero remote-slide">
        <div className="home-hero-copy">
            <div className={`eyebrow ${slide.type === 'advertisement' ? 'sponsored-label' : ''}`}>{slide.type === 'advertisement' ? 'Sponsored' : slide.type === 'partner_server' ? 'Partner Server' : slide.type.replace('_', ' ')}</div>
            <h1>{slide.title}</h1>{slide.subtitle && <h3>{slide.subtitle}</h3>}<p>{slide.description}</p>
            {slide.type === 'partner_server' && slide.server_address && <p><code>{slide.server_address}</code></p>}
            <div className="home-hero-actions">
                {slide.type === 'partner_server' && slide.server_address && <button className="secondary-button" disabled={preview} onClick={() => void copy()}>Copy IP</button>}
                {slide.button_url && <button className="primary-button" disabled={preview} onClick={() => void window.novex.openExternal(slide.button_url).catch(() => setMessage('This link could not be opened.'))}>{slide.button_text || 'Learn More'} ↗</button>}
            </div><span role="status">{message}</span>
        </div>
        {slide.image_url && !failedImage ? <img className="slide-image" src={slide.image_url} alt="" referrerPolicy="no-referrer" onError={() => setFailedImage(true)} /> : <div className="slide-art" aria-hidden="true">N</div>}
    </section>;
}
export default function HomeCarousel({ children }: { children: ReactNode }) {
    const { slides, loading, offline } = useHomeSlides();
    const [selected, setSelected] = useState('welcome-local');
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [paused, setPaused] = useState(false);
    const [hidden, setHidden] = useState(document.hidden);
    const keys = ['welcome-local', ...slides.map(slide => slide.id)];
    const index = Math.max(0, keys.indexOf(selected));
    const keySignature = keys.join(',');
    useEffect(() => { const listener = () => setHidden(document.hidden); document.addEventListener('visibilitychange', listener); return () => document.removeEventListener('visibilitychange', listener); }, []);
    useEffect(() => {
        if (hovered || focused || paused || hidden || keys.length < 2) return;
        const timer = setTimeout(() => setSelected(keys[(index + 1) % keys.length]), 7000);
        return () => clearTimeout(timer);
    }, [keySignature, index, hovered, focused, paused, hidden]);
    const move = (step: number) => setSelected(keys[(index + step + keys.length) % keys.length]);
    return <div className="home-carousel" role="region" aria-label="Novex news and announcements" aria-roledescription="carousel" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
        <div className="carousel-viewport"><div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
            <div className="carousel-panel" inert={index !== 0} aria-hidden={index !== 0}>{children}</div>
            {slides.map((slide, i) => <div className="carousel-panel" key={slide.id} inert={index !== i + 1} aria-hidden={index !== i + 1}><SlideContent slide={slide} /></div>)}
        </div></div>
        <div className="carousel-controls">
            <span className="carousel-status">{loading ? 'Loading announcements…' : offline ? 'Welcome · announcements unavailable' : `${index + 1} / ${keys.length}`}</span>
            {keys.length > 1 && <><button aria-label="Previous slide" onClick={() => move(-1)}>←</button><div className="carousel-dots">{keys.map((key, i) => <button key={key} aria-label={`Show slide ${i + 1}`} aria-current={index === i ? 'true' : undefined} onClick={() => setSelected(key)} />)}</div><button aria-label="Next slide" onClick={() => move(1)}>→</button><button onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'}>{paused ? 'Play' : 'Pause'}</button></>}
        </div>
    </div>;
}
