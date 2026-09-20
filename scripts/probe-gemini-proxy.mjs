// Probe CN3-G1: cua chan kien truc truoc moi dong code khac.
// Chay bang: PROBE_EMAIL=... PROBE_PASSWORD=... node scripts/probe-gemini-proxy.mjs
//   a. Dang nhap lay JWT that (signInWithPassword). KHONG co bien thi DUNG.
//      Cam tu tao user moi trong script nay.
//   b. POST endpoint KEM Authorization. In status + body nguyen van.
//   c. POST endpoint KHONG kem Authorization. In status + body.
// Luat chon (xem lenh session):
//   (b)=200 va (c)=401 -> PROXY ; (b)=200 va (c)=200 -> CONG FAIL (Verify JWT tat)
//   con lai -> KEY TRUC TIEP.
import { createClient } from '@supabase/supabase-js';

function readEnv(name, fallbacks = []) {
  for (const key of [name, ...fallbacks]) {
    const value = process.env[key]?.trim();
    if (value) return { key, value };
  }
  return { key: name, value: '' };
}

const email = process.env.PROBE_EMAIL?.trim() ?? '';
const password = process.env.PROBE_PASSWORD?.trim() ?? '';
if (!email || !password) {
  console.error(
    'THIEU CREDENTIAL: dat PROBE_EMAIL va PROBE_PASSWORD trong env roi chay lai. ' +
      'Cam tu tao user moi trong script nay.',
  );
  process.exit(2);
}

const { value: supabaseUrl } = readEnv('SUPABASE_URL', ['EXPO_PUBLIC_SUPABASE_URL']);
const { value: publishableKey } = readEnv('SUPABASE_ANON_KEY', [
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
]);
if (!supabaseUrl || !publishableKey) {
  console.error(
    'THIEU ENV: can SUPABASE_URL (hoac EXPO_PUBLIC_SUPABASE_URL) va ' +
      'SUPABASE_ANON_KEY (hoac EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY).',
  );
  process.exit(2);
}

const endpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/gemini-proxy`;

const supabase = createClient(supabaseUrl, publishableKey);
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error || !data.session?.access_token) {
  console.error(`SIGNIN_FAIL status=n/a body=${error?.message ?? 'khong co session'}`);
  process.exit(1);
}
const jwt = data.session.access_token;
console.log('SIGNIN_OK');

async function postProbe(label, withAuth) {
  const headers = { 'Content-Type': 'application/json' };
  if (withAuth) headers.Authorization = `Bearer ${jwt}`;
  const res = await fetch(endpoint, { method: 'POST', headers, body: '{}' });
  const text = await res.text();
  console.log(`${label} status=${res.status} body=${text}`);
  return res.status;
}

const statusWithAuth = await postProbe('WITH_AUTH', true);
const statusWithoutAuth = await postProbe('WITHOUT_AUTH', false);

let verdict = 'KEY_TRUC_TIEP';
if (statusWithAuth === 200 && statusWithoutAuth === 401) verdict = 'PROXY';
else if (statusWithAuth === 200 && statusWithoutAuth === 200) verdict = 'CONG_FAIL_VERIFY_JWT_TAT';
console.log(`VERDICT=${verdict}`);
