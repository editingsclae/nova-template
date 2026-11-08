import { redirect } from 'next/navigation';

export default function PrivacyRedirect() {
  redirect('/pages/privacy');
}
