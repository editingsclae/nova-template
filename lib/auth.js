/* Front-end demo only: accounts live in localStorage and there is no server.
   Never use this as a real authentication implementation. */

export const STORE = 'nova.accounts';
export const REMEMBER = 'nova.remembered';
export const SESSION = 'nova.session';
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function loadAccounts() {
  try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch (e) { return []; }
}
export function saveAccounts(list) {
  try { localStorage.setItem(STORE, JSON.stringify(list)); } catch (e) { /* private mode */ }
}
export function ensureSeed() {
  if (!loadAccounts().length) {
    saveAccounts([{ name: 'Avery Nova', email: 'hello@nova.store', password: 'Nova1234' }]);
  }
}
export function findAccount(email) {
  const e = String(email).trim().toLowerCase();
  return loadAccounts().filter((a) => a.email === e)[0];
}
export function writeSession(acct) {
  try { localStorage.setItem(SESSION, JSON.stringify({ email: acct.email, name: acct.name, at: Date.now() })); } catch (e) { /* ignore */ }
}
