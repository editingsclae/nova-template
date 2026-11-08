import { redirect } from 'next/navigation';

export default async function ProductRedirect({ params }) {
  const { id } = await params;
  redirect(`/p/${encodeURIComponent(id)}`);
}
