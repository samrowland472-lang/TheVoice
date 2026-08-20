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

export function planLabel(planId) {
  const plan = PLANS.find((p) => p.id === planId);
  return plan ? plan.name : 'Free';
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
