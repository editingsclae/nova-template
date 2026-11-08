export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { declareLayout } = await import('./lib/declare-layout');
    declareLayout().catch((err) => {
      console.warn('[layout] Instrumentation layout declaration error:', err);
    });
  }
}

