import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
type Request = { title: string; message: string; confirm?: string; danger?: boolean; resolve: (value: boolean) => void };
type Dialogs = { confirm: (message: string, title?: string) => Promise<boolean>; notice: (message: string) => Promise<boolean> };
const Context = createContext<Dialogs | null>(null);
export function useDialogs() {
    const value = useContext(Context);
    if (!value) throw new Error('Dialog provider is missing.');
    return value;
}
export default function DialogProvider({ children }: { children: ReactNode }) {
    const [requests, setRequests] = useState<Request[]>([]);
    const request = requests[0];
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => { if (request && !dialog.current?.open) dialog.current?.showModal(); }, [request]);
    function finish(value: boolean) { request.resolve(value); dialog.current?.close(); setRequests(items => items.slice(1)); }
    const ask = (input: Omit<Request, 'resolve'>) => new Promise<boolean>(resolve => setRequests(items => [...items, { ...input, resolve }]));
    return <Context.Provider value={{ confirm: (message, title = 'Confirm action') => ask({ title, message, confirm: 'Confirm', danger: true }), notice: message => ask({ title: 'Novex', message }) }}>
        {children}
        {request && createPortal(<dialog ref={dialog} className="novex-dialog" aria-labelledby="novex-dialog-title" aria-describedby="novex-dialog-message" onCancel={event => { event.preventDefault(); finish(false); }}>
            <div className="modal-header"><h2 id="novex-dialog-title">{request.title}</h2><button className="icon-button" aria-label="Close dialog" onClick={() => finish(false)}>×</button></div>
            <p id="novex-dialog-message">{request.message}</p>
            <div className="modal-actions">{request.confirm && <button autoFocus className="secondary-button" onClick={() => finish(false)}>Cancel</button>}<button autoFocus={!request.confirm} className={request.danger ? 'danger-button' : 'primary-button'} onClick={() => finish(true)}>{request.confirm || 'OK'}</button></div>
        </dialog>, document.body)}
    </Context.Provider>;
}
