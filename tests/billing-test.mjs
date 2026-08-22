// billing.js reaches for localStorage at module scope only inside functions,
// so a minimal stand-in is enough to exercise it under Node.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { PLANS, planFromSession, resolvePlan, markAwaitingUpgrade, clearAwaitingUpgrade,
        awaitingUpgrade, nextPollDelay, MAX_UPGRADE_POLLS, checkoutUrl, setPaymentLink }
  = await import('../js/billing.js');

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};
const sess = (plan) => ({ user: { id: 'u1', email: 'a@b.c', app_metadata: plan ? { plan } : {} } });

console.log('--- planFromSession fails closed ---');
ok('no session is free', planFromSession(null)==='free');
ok('no metadata is free', planFromSession(sess())==='free');
ok('a real plan is honoured', planFromSession(sess('pro'))==='pro');
ok('an invented plan is refused', planFromSession(sess('unlimited'))==='free');
ok('a non-string plan is refused', planFromSession({user:{app_metadata:{plan:{}}}})==='free');

console.log('--- resolvePlan prefers the fresher source ---');
ok('table wins over a stale token', resolvePlan(sess('free'), 'pro')==='pro');
ok('token is the fallback when the table is unreadable', resolvePlan(sess('studio'), null)==='studio');
ok('an invalid table value falls back to the token', resolvePlan(sess('studio'), 'enterprise')==='studio');
ok('both missing is free', resolvePlan(null, null)==='free');
ok('a downgrade in the table is honoured', resolvePlan(sess('pro'), 'free')==='free');

console.log('--- awaiting-upgrade marker ---');
store.clear();
ok('nothing pending by default', awaitingUpgrade()===null);
markAwaitingUpgrade('pro');
ok('marker survives a read', awaitingUpgrade()?.planId==='pro');
ok('stale marker is ignored', awaitingUpgrade(1000, Date.now()+5000)===null);
ok('fresh marker inside the window is kept', awaitingUpgrade(10000, Date.now()+5000)?.planId==='pro');
clearAwaitingUpgrade();
ok('clearing works', awaitingUpgrade()===null);

store.set('thevoice_awaiting_upgrade', 'not json');
ok('corrupt marker does not throw', awaitingUpgrade()===null);
store.set('thevoice_awaiting_upgrade', '{"planId":"pro"}');
ok('marker without a timestamp is ignored', awaitingUpgrade()===null);
store.clear();

console.log('--- storage that throws (private browsing) ---');
{
  const real = globalThis.localStorage;
  globalThis.localStorage = {
    getItem(){ throw new Error('denied'); },
    setItem(){ throw new Error('denied'); },
    removeItem(){ throw new Error('denied'); },
  };
  let threw = false;
  try { markAwaitingUpgrade('pro'); clearAwaitingUpgrade(); awaitingUpgrade(); }
  catch { threw = true; }
  ok('marking and reading degrade quietly', !threw);
  globalThis.localStorage = real;
}

console.log('--- poll schedule ---');
ok('first check is quick', nextPollDelay(0)===1000, String(nextPollDelay(0)));
let prev = 0, monotonic = true;
for (let i=0;i<MAX_UPGRADE_POLLS;i++){ const d=nextPollDelay(i); if (d<prev) monotonic=false; prev=d; }
ok('delays never decrease', monotonic);
ok('delays are capped', nextPollDelay(999)===nextPollDelay(50), String(nextPollDelay(999)));
let total = 0;
for (let i=0;i<MAX_UPGRADE_POLLS;i++) total += nextPollDelay(i);
ok(`gives up after a sensible window (${(total/1000).toFixed(0)}s)`, total>=30000 && total<=180000, String(total));

console.log('--- checkout url carries the account ---');
store.clear();
setPaymentLink('pro', 'https://buy.stripe.com/test123');
const url = checkoutUrl('pro', sess());
ok('includes client_reference_id', url.includes('client_reference_id=u1'), url);
ok('includes the email', url.includes('prefilled_email=a%40b.c'), url);
ok('unconfigured plan has no link', checkoutUrl('studio', sess())===null);
const withQ = (setPaymentLink('pro','https://buy.stripe.com/x?a=1'), checkoutUrl('pro', sess()));
ok('appends to an existing query string', withQ.includes('?a=1&'), withQ);
ok('signed-out user still gets the bare link',
   checkoutUrl('pro', null)==='https://buy.stripe.com/x?a=1');

console.log('--- plan catalogue ---');
ok('every plan has an id, name and price', PLANS.every(p=>p.id&&p.name&&p.price));
ok('ids are unique', new Set(PLANS.map(p=>p.id)).size===PLANS.length);
ok('free tier exists', PLANS.some(p=>p.id==='free'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
