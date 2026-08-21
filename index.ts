// Stripe -> Supabase webhook. This is the only thing allowed to grant a
// paid plan: it runs on Supabase's servers, verifies Stripe's signature,
// and writes the plan using the service-role key. The browser never does
// any of that, because a browser can't be trusted to grant itself a plan.
//
// Deploy:
//   supabase functions deploy stripe-webhook --no-verify-jwt
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//
// Then in Stripe -> Developers -> Webhooks, add the function URL and
// subscribe it to: checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted.
//
// --no-verify-jwt is correct here and only here: Stripe calls this
// endpoint, not a logged-in user, so there is no user JWT to check. The
// Stripe signature check below is what authenticates the request — never
// remove it.
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Maps a Stripe Price ID to one of the app's plan ids. Fill in with the
// price ids from your Stripe dashboard.
const PRICE_TO_PLAN: Record<string, string> = {
  // 'price_1AbCdEf...': 'studio',
  // 'price_1XyZ...':    'pro',
};

async function setPlan(userId: string, plan: string) {
  // app_metadata (not user_metadata) — users can edit their own
  // user_metadata, which would let anyone hand themselves a paid plan.
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { plan },
  });
  if (error) throw error;

  await admin.from('subscriptions').upsert(
    { user_id: userId, plan, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  );
}

async function userIdForCustomer(customerId: string): Promise<string | null> {
  const { data } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    );
  } catch (err) {
    // An unverified body is untrusted input — refuse it outright.
    return new Response(`Invalid signature: ${(err as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        if (!userId) break;

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        const priceId = lineItems.data[0]?.price?.id ?? '';
        const plan = PRICE_TO_PLAN[priceId];
        if (!plan) break;

        if (session.customer) {
          await admin.from('subscriptions').upsert(
            { user_id: userId, stripe_customer_id: String(session.customer), plan },
            { onConflict: 'user_id' },
          );
        }
        await setPlan(userId, plan);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await userIdForCustomer(String(sub.customer));
        if (!userId) break;
        const priceId = sub.items.data[0]?.price?.id ?? '';
        const plan = sub.status === 'active' ? (PRICE_TO_PLAN[priceId] ?? 'free') : 'free';
        await setPlan(userId, plan);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await userIdForCustomer(String(sub.customer));
        if (userId) await setPlan(userId, 'free');
        break;
      }
    }
  } catch (err) {
    // 500 tells Stripe to retry — better than silently dropping a payment.
    return new Response(`Handler error: ${(err as Error).message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
