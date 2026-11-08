import Link from 'next/link';
import { BackArrow } from './icons';
import { STORE_NAME } from '@/lib/medusa';

export default function AuthHeader({ label, href }) {
  return (
    <header className="nav">
      <div className="container nav__top nav__top--auth">
        <Link className="logo" href="/">{STORE_NAME}</Link>
        <Link className="btn btn--ghost" href={href}>
          <BackArrow />
          {label}
        </Link>
      </div>
    </header>
  );
}
