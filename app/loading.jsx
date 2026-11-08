import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default function Loading() {
  return (
    <div className="shop">
      <SiteHeader />
      <main className="container" style={{ padding: '8rem 1rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid #e5e5e4', borderTopColor: '#1c1b18', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: 16, color: '#666', fontSize: '0.95rem' }}>Loading…</p>
        <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
      </main>
      <SiteFooter />
    </div>
  );
}
