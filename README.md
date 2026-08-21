# Backend setup

Two things live on the server, and both exist for the same reason: a browser
cannot be trusted to decide who has paid. The page reads the plan; only
Stripe's webhook writes it.

Everything here is one-time setup. Once it's done, upgrades happen on their
own — someone pays in Stripe's tab, and the plan appears on their account.

---

## 1. Create the database table

In your Supabase project: **SQL Editor → New query**, paste the whole of
`schema.sql` from this folder, and run it.

That creates:

- a `subscriptions` table holding each user's plan,
- a read-only security policy: you can read your own row and nobody else's,
  and **no** write policy at all, so nothing in a browser can grant a plan,
- a trigger that gives every new signup a `free` row.

You can confirm it worked under **Table Editor → subscriptions**.

## 2. Create the products in Stripe

In the Stripe dashboard, create one **Product** per paid tier (Studio and
Pro, unless you've changed them in `js/billing.js`), each with a recurring
monthly price.

For each one you now need two values:

| Value | Where to find it | Looks like |
| --- | --- | --- |
| **Price ID** | Product page → the price row | `price_1AbC…` |
| **Payment Link** | Payment Links → create one for that price | `https://buy.stripe.com/…` |

## 3. Deploy the webhook

Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then from
the repository root:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy stripe-webhook --no-verify-jwt
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...   # from step 4
```

`--no-verify-jwt` is correct here and nowhere else: Stripe calls this
endpoint, not a signed-in user, so there is no user token to check. The
Stripe signature check inside the function is what authenticates the
request — don't remove it.

Before deploying, open `functions/stripe-webhook/index.ts` and fill in
`PRICE_TO_PLAN` with the Price IDs from step 2:

```ts
const PRICE_TO_PLAN: Record<string, string> = {
  'price_1AbC...': 'studio',
  'price_1XyZ...': 'pro',
};
```

A price that isn't listed here is ignored, which fails closed: an
unrecognised payment grants nothing rather than guessing a tier.

## 4. Point Stripe at the webhook

In Stripe: **Developers → Webhooks → Add endpoint**.

- **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
- **Events**: `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`

Stripe then shows a **Signing secret** (`whsec_…`) — that's the
`STRIPE_WEBHOOK_SECRET` from step 3.

The last two events matter as much as the first: they're what downgrades
someone whose card later fails or who cancels. Without them, a cancelled
subscription would keep its paid plan forever.

## 5. Paste the payment links into the site

Sign in to your site, go to **Settings**, and paste each Payment Link
against its plan. The Plans page then shows working upgrade buttons.

---

## Checking it works

Use Stripe's **test mode** keys and card `4242 4242 4242 4242`.

1. Sign in to your site, go to Plans, click an upgrade button.
2. Pay in the tab that opens.
3. Switch back to the site.

The page notices you've returned, shows *"Confirming your payment with
Stripe…"*, and switches to the new plan once the webhook lands — usually a
second or two. **Check for updates** on the Plans page does the same thing
on demand.

If it doesn't update:

- **Stripe → Developers → Webhooks → your endpoint** lists every delivery and
  its response. A `400` means the signing secret doesn't match; a `500`
  shows the error from the function.
- **Supabase → Edge Functions → stripe-webhook → Logs** shows what the
  function did with the event.
- If the delivery succeeded but the plan didn't change, the Price ID is
  probably missing from `PRICE_TO_PLAN`.

Stripe retries failed deliveries for up to three days, so a webhook that
fails once because of a typo will land by itself after you fix it.

## Why the plan is read twice

After a payment there are two answers to "what plan is this user on", and
they disagree for a short while:

- the **subscriptions row**, which the webhook writes and you can read
  immediately;
- the **plan inside the login token**, which is a snapshot from when the
  token was issued and doesn't change until it's refreshed.

The site prefers the row because it's the fresher of the two, and refreshes
the token once the row changes so both agree. Both are written server-side —
the browser only ever reads them.
