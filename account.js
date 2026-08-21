// Real accounts only — email + password against a Supabase project.
// There is deliberately no local/offline profile fallback: a "login" that
// anyone can walk past isn't a login.
//
// BACKEND_URL/BACKEND_KEY are the deployment's own credentials. The anon
// key is public by design (Supabase enforces access server-side via row
// level security), so shipping it in the page is how it's meant to work —
// unlike a secret key, which must never be in client code. Fill these in
// to have the site come up already pointed at your project; if left blank,
// the owner can connect one at runtime from the gate's setup panel.
const BACKEND_URL = 'https://tkllekpavimbuponicaz.supabase.co/rest/v1/';
const BACKEND_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrbGxla3BhdmltYnVwb25pY2F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTEwMDMsImV4cCI6MjEwMjgyNzAwM30.NKPQT2eJTAp_iBMChXW4UFFTMUsGD75v2eHtbST9xMc';

const SUPABASE_CONFIG_KEY = 'thevoice_supabase_config';
const SUPABASE_SDK_URL = 'https://esm.sh/@supabase/supabase-js@2';

export function getSupabaseConfig() {
  if (BACKEND_URL && BACKEND_KEY) return { url: BACKEND_URL, anonKey: BACKEND_KEY };
  try {
    return JSON.parse(localStorage.getItem(SUPABASE_CONFIG_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setSupabaseConfig(url, anonKey) {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, anonKey }));
  clientPromise = null; // force a rebuild against the new project
}

export function clearSupabaseConfig() {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
  clientPromise = null;
}

export function isBackendConfigured() {
  return !!getSupabaseConfig();
}

let clientPromise = null;

async function getClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  if (!clientPromise) {
    clientPromise = import(SUPABASE_SDK_URL)
      .then(({ createClient }) => createClient(config.url, config.anonKey))
      .catch((err) => {
        clientPromise = null;
        throw new Error(`Couldn't reach the authentication service: ${err.message || err}`);
      });
  }
  return clientPromise;
}

function friendlyAuthError(err) {
  const msg = String((err && err.message) || err || '');
  if (/Invalid API key|invalid.*key|Failed to fetch/i.test(msg)) return 'Cannot reach the authentication service.';
  if (/User already registered/i.test(msg)) return 'An account with that email already exists.';
  if (/Invalid login credentials/i.test(msg)) return 'Incorrect email or password.';
  if (/Email not confirmed/i.test(msg)) return 'Confirm your email address before signing in.';
  if (/Password should be at least/i.test(msg)) return 'Password must be at least 6 characters.';
  if (/valid email/i.test(msg)) return 'Enter a valid email address.';
  return msg || 'Authentication failed.';
}

export async function supabaseSignUp(email, password) {
  const client = await getClient();
  if (!client) throw new Error('No authentication service configured.');
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw new Error(friendlyAuthError(error));
  return data;
}

export async function supabaseSignIn(email, password) {
  const client = await getClient();
  if (!client) throw new Error('No authentication service configured.');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(friendlyAuthError(error));
  return data;
}

// Social sign-in. Each provider must also be switched on in the Supabase
// dashboard (Authentication -> Providers) with its client id/secret —
// Supabase brokers the OAuth handshake, so no provider secrets are ever
// present in this page.
export async function signInWithProvider(provider) {
  const client = await getClient();
  if (!client) throw new Error('No authentication service configured.');
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.href.split('#')[0] },
  });
  if (error) throw new Error(friendlyAuthError(error));
}

export async function signOutUser() {
  const client = await getClient();
  if (!client) return;
  await client.auth.signOut();
}

export async function getCurrentSession() {
  const client = await getClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

export async function onAuthChange(callback) {
  const client = await getClient();
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange((event, session) => callback(event, session));
  return () => data.subscription.unsubscribe();
}

/**
 * Read the signed-in user's plan straight from the subscriptions table.
 *
 * This is the fresh source: the Stripe webhook writes the row server-side,
 * and row level security lets the owner read it the moment it changes —
 * whereas the plan baked into the JWT stays stale until the token is
 * refreshed. Reading is all the browser is allowed to do; there is no write
 * policy for normal users, which is what stops anyone granting themselves a
 * paid plan from devtools.
 *
 * Returns null rather than throwing when the table is missing or unreadable,
 * so a deployment that hasn't run schema.sql yet degrades to the JWT plan
 * instead of breaking the Plans page.
 */
export async function fetchSubscriptionPlan() {
  const client = await getClient().catch(() => null);
  if (!client) return null;
  const { data: sessionData } = await client.auth.getSession();
  const session = sessionData.session;
  if (!session) return null;
  const { data, error } = await client
    .from('subscriptions')
    .select('plan')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data.plan || null;
}

/**
 * Pull a new access token so the plan inside the JWT catches up with the
 * subscriptions row. Anything gated on app_metadata elsewhere then sees the
 * upgrade too.
 */
export async function refreshSession() {
  const client = await getClient().catch(() => null);
  if (!client) return null;
  const { data, error } = await client.auth.refreshSession();
  if (error) return null;
  return data.session;
}
