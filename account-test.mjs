const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');

const { normalizeSupabaseUrl, inspectSupabaseKey, checkSupabasePair,
        getSupabaseConfig, setSupabaseConfig, clearSupabaseConfig }
  = await import('../js/account.js');

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};

const jwt = (payload) => {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64')
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return `${b({alg:'HS256',typ:'JWT'})}.${b(payload)}.sig`;
};
const REAL = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrbGxla3BhdmltYnVwb25pY2F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTEwMDMsImV4cCI6MjEwMjgyNzAwM30.NKPQT2eJTAp_iBMChXW4UFFTMUsGD75v2eHtbST9xMc';
const PROJECT = 'https://tkllekpavimbuponicaz.supabase.co';

console.log('--- the URL that actually broke it ---');
ok('the REST endpoint is reduced to the origin',
   normalizeSupabaseUrl('https://tkllekpavimbuponicaz.supabase.co/rest/v1/') === PROJECT,
   normalizeSupabaseUrl('https://tkllekpavimbuponicaz.supabase.co/rest/v1/'));
ok('with no trailing slash too',
   normalizeSupabaseUrl('https://tkllekpavimbuponicaz.supabase.co/rest/v1') === PROJECT);
ok('the auth endpoint too',
   normalizeSupabaseUrl(`${PROJECT}/auth/v1`) === PROJECT);
ok('the storage endpoint too',
   normalizeSupabaseUrl(`${PROJECT}/storage/v1/s3`) === PROJECT);
ok('the graphql endpoint too',
   normalizeSupabaseUrl(`${PROJECT}/graphql/v1`) === PROJECT);

console.log('--- other things people paste ---');
ok('the correct URL passes through unchanged', normalizeSupabaseUrl(PROJECT) === PROJECT);
ok('a trailing slash is dropped', normalizeSupabaseUrl(`${PROJECT}/`) === PROJECT);
ok('surrounding whitespace is trimmed', normalizeSupabaseUrl(`  ${PROJECT}  `) === PROJECT);
ok('a bare host gets https', normalizeSupabaseUrl('tkllekpavimbuponicaz.supabase.co') === PROJECT);
ok('http is upgraded to the same origin form',
   normalizeSupabaseUrl('http://tkllekpavimbuponicaz.supabase.co') === 'http://tkllekpavimbuponicaz.supabase.co');
ok('a query string is dropped', normalizeSupabaseUrl(`${PROJECT}/rest/v1/?apikey=x`) === PROJECT);
ok('empty stays empty', normalizeSupabaseUrl('') === '');
ok('nonsense does not throw', normalizeSupabaseUrl('   ') === '');
ok('self-hosted origins survive',
   normalizeSupabaseUrl('https://supabase.mycompany.com/rest/v1') === 'https://supabase.mycompany.com');
ok('a port is kept',
   normalizeSupabaseUrl('http://localhost:54321/rest/v1') === 'http://localhost:54321');

console.log('--- key validation ---');
const good = inspectSupabaseKey(REAL);
ok('the real anon key is accepted', good.ok === true, JSON.stringify(good));
ok('it reports the project ref', good.ref === 'tkllekpavimbuponicaz', String(good.ref));

const svc = inspectSupabaseKey(jwt({ role: 'service_role', ref: 'abc', exp: 4102444800 }));
ok('the service_role key is REFUSED', svc.ok === false && svc.reason === 'service-role', JSON.stringify(svc));
ok('and the refusal explains the danger', /never go in a web page/i.test(svc.message), svc.message);

ok('a non-JWT is refused', inspectSupabaseKey('sk_live_abc123').ok === false);
ok('and says where to find the right one',
   /anon public/i.test(inspectSupabaseKey('sk_live_abc123').message),
   inspectSupabaseKey('sk_live_abc123').message);
ok('an API key id is refused',
   inspectSupabaseKey('f7eaf441a0443d5e1a1057e02e0ded33f235b6ea590c5adf27abed1427967a04').ok === false);
ok('empty is refused', inspectSupabaseKey('').ok === false);
ok('undefined does not throw', inspectSupabaseKey(undefined).ok === false);
ok('a JWT with a garbled payload is refused',
   inspectSupabaseKey('aaa.!!!not-base64!!!.ccc').ok === false);
const expired = inspectSupabaseKey(jwt({ role: 'anon', ref: 'abc', exp: 1000 }));
ok('an expired key is refused', expired.ok === false && expired.reason === 'expired', JSON.stringify(expired));

console.log('--- the two halves must match ---');
const paired = checkSupabasePair('https://tkllekpavimbuponicaz.supabase.co/rest/v1/', REAL);
ok('the real pair is accepted even via the REST URL', paired.ok === true, JSON.stringify(paired));
ok('and the stored URL is the corrected one', paired.url === PROJECT, String(paired.url));

const crossed = checkSupabasePair('https://someotherproject.supabase.co', REAL);
ok('a key from a different project is caught', crossed.ok === false, JSON.stringify(crossed));
ok('and it names both projects',
   /tkllekpavimbuponicaz/.test(crossed.message) && /someotherproject/.test(crossed.message),
   crossed.message);
ok('a self-hosted host is not cross-checked',
   checkSupabasePair('https://supabase.mycompany.com', REAL).ok === true);
ok('a missing URL is reported', checkSupabasePair('', REAL).ok === false);
ok('a bad key is reported before the ref check',
   /anon public/i.test(checkSupabasePair(PROJECT, 'rubbish').message));

console.log('--- stored config ---');
store.clear();
ok('falls back to the built-in project', getSupabaseConfig().url === PROJECT, JSON.stringify(getSupabaseConfig()));
ok('the built-in key is the anon one', getSupabaseConfig().anonKey === REAL);

// Someone who already saved the broken URL should start working, not stay broken.
store.set('thevoice_supabase_config', JSON.stringify({ url: `${PROJECT}/rest/v1/`, anonKey: REAL }));
ok('an already-saved REST URL is repaired on read', getSupabaseConfig().url === PROJECT,
   getSupabaseConfig().url);

setSupabaseConfig('https://other.supabase.co/rest/v1/', '  ' + REAL + '  ');
ok('saving normalises the URL', getSupabaseConfig().url === 'https://other.supabase.co',
   getSupabaseConfig().url);
ok('saving trims the key', getSupabaseConfig().anonKey === REAL);
clearSupabaseConfig();
ok('clearing falls back to the built-in project', getSupabaseConfig().url === PROJECT);

store.set('thevoice_supabase_config', 'not json');
ok('corrupt stored config falls back rather than throwing', getSupabaseConfig().url === PROJECT);
store.set('thevoice_supabase_config', JSON.stringify({ url: '', anonKey: '' }));
ok('a half-empty stored config falls back', getSupabaseConfig().url === PROJECT);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
