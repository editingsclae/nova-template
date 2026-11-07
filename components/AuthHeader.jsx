import Link from 'next/link';
import { BackArrow } from './icons';

export default function AuthHeader({ label, href }) {
  return (
    <header className="nav">
      <div className="container nav__top nav__top--auth">
        <Link className="logo" href="/">NOVA</Link>
        <Link className="btn btn--ghost" href={href}>
          <BackArrow />
          {label}
        </Link>
      </div>
    </header>
  );
}
