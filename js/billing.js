// Subscription tiers.
//
// What runs here in the browser: showing the plans, reading which plan the
// signed-in user is on, and sending them to Stripe to pay.
//
// What deliberately does NOT run here: deciding that someone has paid. A
// browser can't be trusted to grant itself a paid plan — anyone could edit
// it. The plan is read from the user's row in the database, and only
// Stripe's webhook (server-side, signature-verified) is allowed to write
// it. See supabase/README.md for the table and the function to deploy.
//
// PAYMENT_LINKS: create a Payment Link per paid tier in the Stripe
// dashboard (no code needed) and paste the URLs here, or set them at
// runtime from Settings.
const PAYMENT_LINKS_KEY = 'thevoice_payment_links';

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '£0',
    cadence: 'forever',
    features: [
      'Neural voices, unlimited',
      'Recording, transcript & effects',
      'Clip library on this device',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    price: '£9',
    cadence: 'per month',
    features: [
      'Everything in Free',
      'Long-form audiobook rendering',
      'Priority voice models',
      'Library synced across devices',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '£29',
    cadence: 'per month',
    features: [
      'Everything in Studio',
      'Voice cloning included',
      'Commercial usage rights',
      'Early access to new tools',
    ],
  },
];

export function getPaymentLinks() {
  try {
    return JSON.parse(localStorage.getItem(PAYMENT_LINKS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function setPaymentLink(planId, url) {
  const links = getPaymentLinks();
  if (url) links[planId] = url;
  else delete links[planId];
  localStorage.setItem(PAYMENT_LINKS_KEY, JSON.stringify(links));
}

// The signed-in user's plan, as recorded server-side. Anything unreadable
// or absent is treated as free — failing closed, never open.
export function planFromSession(session) {
  if (!session || !session.user) return 'free';
  const meta = session.user.app_metadata || {};
  const plan = meta.plan;
  return PLANS.some((p) => p.id === plan) ? plan : 'free';
}

export const PLAN_RANK = { free: 0, studio: 1, pro: 2 };

export function planIncludes(currentId, neededId) {
  return (PLAN_RANK[currentId] || 0) >= (PLAN_RANK[neededId] || 0);
}

// Stripe needs to know which account to credit when the payment succeeds,
// so the user's id rides along as client_reference_id — that's the value
// the webhook reads back to find the right row.
export function checkoutUrl(planId, session) {
  const links = getPaymentLinks();
  const base = links[planId];
  if (!base) return null;
  if (!session || !session.user) return base;
  const sep = base.includes('?') ? '&' : '?';
  const params = new URLSearchParams({
    client_reference_id: session.user.id,
    prefilled_email: session.user.email || '',
  });
  return `${base}${sep}${params.toString()}`;
}

// --- Reconciling a payment with the running page -------------------------
//
// Paying happens in Stripe's tab, and the webhook lands a moment later on
// Supabase's servers. Neither of those touches the page the user came from,
// so without this the buyer returns to a tab that still says "Free" and has
// no reason to think the payment worked.
//
// Two sources say what plan someone is on, and they disagree for a while:
//
//   - the JWT's app_metadata, which is a snapshot from when the token was
//     issued and does not change until the token is refreshed;
//   - the subscriptions row, which the webhook writes and RLS lets the user
//     read immediately.
//
// The row is the fresher of the two, so it wins when it is readable. Both
// are server-controlled; the browser is only ever reading.

const AWAITING_KEY = 'thevoice_awaiting_upgrade';

/**
 * Pick the plan to show. `tablePlan` is the subscriptions row (or null when
 * the table is unreachable), `session` supplies the JWT fallback.
 */
export function resolvePlan(session, tablePlan) {
  if (PLANS.some((p) => p.id === tablePlan)) return tablePlan;
  return planFromSession(session);
}

/** Remember that a checkout was started, so the return can be noticed. */
export function markAwaitingUpgrade(planId) {
  try {
    localStorage.setItem(AWAITING_KEY, JSON.stringify({ planId, since: Date.now() }));
  } catch {
    /* private browsing: the manual refresh button still works */
  }
}

export function clearAwaitingUpgrade() {
  try {
    localStorage.removeItem(AWAITING_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 * The pending upgrade, if one was started recently.
 *
 * A stale marker is worse than none — someone who abandoned checkout a week
 * ago should not be met with "confirming your payment" forever — so anything
 * older than the window is treated as gone.
 */
export function awaitingUpgrade(maxAgeMs = 24 * 60 * 60 * 1000, now = Date.now()) {
  let raw;
  try {
    raw = localStorage.getItem(AWAITING_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed.since !== 'number') return null;
  if (now - parsed.since > maxAgeMs) return null;
  return parsed;
}

/**
 * How long to wait before the next check, in ms.
 *
 * Webhooks usually land within a couple of seconds, so the first checks are
 * quick; after that the delay backs off rather than hammering the database
 * while someone leaves the tab open.
 */
export function nextPollDelay(attempt) {
  const schedule = [1000, 2000, 3000, 5000, 8000];
  return schedule[Math.min(attempt, schedule.length - 1)];
}

/** Total attempts before giving up and telling the user to check back. */
export const MAX_UPGRADE_POLLS = 12;
