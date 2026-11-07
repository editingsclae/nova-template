/* Inline status banner used by the auth and checkout forms. */
export default function Notice({ bar }) {
  return (
    <div className={'notice' + (bar ? ' notice--' + bar.kind : '')} role="status" aria-live="polite"
         {...(bar ? { 'data-show': '' } : {})}>
      {bar
        ? bar.kind === 'ok'
          ? <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          : <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5m0 3.2v.3" /></svg>
        : null}
      {bar ? <span>{bar.html}</span> : null}
    </div>
  );
}
