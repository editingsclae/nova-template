import Link from 'next/link';
import { Chev } from '@/components/icons';

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

/* Only these schemes may appear in an authored href; everything else renders as plain text. */
const SAFE = /^(\/(?!\/)|mailto:|tel:|https?:\/\/)/i;

function hrefOf(raw) {
  return SAFE.test(raw) ? raw : null;
}

function Rich({ text }) {
  const parts = String(text).split(TOKEN).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const m = part.match(LINK);
    if (m) {
      const href = hrefOf(m[2]);
      if (!href) return <span key={i}>{m[1]}</span>;
      if (href.startsWith('/')) return <Link key={i} href={href}>{m[1]}</Link>;
      return <a key={i} href={href}>{m[1]}</a>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function PageArticle({ page }) {
  return (
    <main className="container doc">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <Chev />
        <span>{page.title}</span>
      </nav>

      <h1 className="doc__title">{page.title}</h1>

      <article className="doc__card">
        <h2 className="doc__head">{page.head}</h2>
        {page.blocks.map((b, i) => {
          if (b.h) return <h3 key={i} className="doc__sec">{b.h}</h3>;
          if (b.p) return <p key={i}><Rich text={b.p} /></p>;
          if (b.lines) return <p key={i} className="doc__lines">{b.lines.map((l, j) => <span key={j}><Rich text={l} />{j < b.lines.length - 1 && <br />}</span>)}</p>;
          if (b.ul) return <ul key={i}>{b.ul.map((item, j) => <li key={j}><Rich text={item} /></li>)}</ul>;
          return null;
        })}
      </article>
    </main>
  );
}
