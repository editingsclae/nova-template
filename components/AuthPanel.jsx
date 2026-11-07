import AuthHeader from './AuthHeader';

/* Two-column auth shell: brand panel on the left, card on the right. */
export default function AuthPanel({ img, quote, byline, back, backHref, eyebrow, title, sub, children }) {
  return (
    <div className="auth-body">
      <AuthHeader label={back} href={backHref} />

      <main className="auth">
        <aside className="auth__aside">
          <img src={img} alt="" />
          <div className="auth__quote">
            <p>{quote}</p>
            <span>{byline}</span>
          </div>
        </aside>

        <section className="auth__main">
          <div className="auth__card">
            <p className="auth__eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="auth__sub">{sub}</p>
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}
