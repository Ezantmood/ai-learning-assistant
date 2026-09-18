// Kiểm chứng Storage RLS FR-04 bằng 2 user test A/B trên project thật.
//
// Chạy (từ gốc repo, đã source `.env` + `.env.local` để có credential
// trong environment; không truyền secret trên dòng lệnh):
//   npx tsc --ignoreConfig --types node scripts/storage-rls-proof.ts \
//     --outDir /tmp/storageproof-out --module nodenext \
//     --moduleResolution nodenext --target es2021 --esModuleInterop \
//     --skipLibCheck --strict
//   node /tmp/storageproof-out/storage-rls-proof.js
//
// Đọc credential từ environment: URL + anon key (`.env`), service key
// (`.env.local`). Service key CHỈ dùng trong script này, không vào app.
// Không in secret/token ra log. Exit 0 khi mọi assert pass, 1 khi fail.
// User test và object test được xóa trong `finally` dù pass hay fail.

import { createClient } from '@supabase/supabase-js';

const BUCKET = 'avatars';

type CheckResult = {
  detail: string;
  name: string;
  pass: boolean;
};

const results: CheckResult[] = [];

function check(name: string, pass: boolean, detail: string): void {
  results.push({ detail, name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name} — ${detail}`);
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

function fromProcessEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Thiếu biến ${name}.`);
  }
  return value;
}

async function main(): Promise<void> {
  const url = fromProcessEnv('EXPO_PUBLIC_SUPABASE_URL');
  const anonKey = fromProcessEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  const serviceKey = fromProcessEnv('SUPABASE_SERVICE_ROLE_KEY');

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  const anon = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0')}`;
  const password = `StorageProof!${suffix}${suffix}`;
  const userA = {
    code: `STPROOFA${suffix}`.toUpperCase().slice(0, 20),
    email: `storageproof.a.${suffix}@example.com`,
  };
  const userB = {
    code: `STPROOFB${suffix}`.toUpperCase().slice(0, 20),
    email: `storageproof.b.${suffix}@example.com`,
  };

  let idA = '';
  let idB = '';
  let objectA = '';
  let objectB = '';

  try {
    const createdA = await admin.auth.admin.createUser({
      email: userA.email,
      email_confirm: true,
      password,
      user_metadata: { full_name: 'Storage Proof A', student_code: userA.code },
    });
    if (createdA.error || !createdA.data.user) {
      throw new Error(
        `Tạo user A thất bại: ${createdA.error?.message ?? 'unknown'}.`,
      );
    }
    idA = createdA.data.user.id;

    const createdB = await admin.auth.admin.createUser({
      email: userB.email,
      email_confirm: true,
      password,
      user_metadata: { full_name: 'Storage Proof B', student_code: userB.code },
    });
    if (createdB.error || !createdB.data.user) {
      throw new Error(
        `Tạo user B thất bại: ${createdB.error?.message ?? 'unknown'}.`,
      );
    }
    idB = createdB.data.user.id;
    console.log(`SETUP 2 user test: A=${shortId(idA)} B=${shortId(idB)}`);

    objectA = `${idA}/proof_${suffix}.jpg`;
    objectB = `${idB}/proof_${suffix}.jpg`;
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

    // Client đăng nhập PHẢI tách riêng: gọi signInWithPassword trên client
    // anon sẽ làm client đó mang session (dù persistSession false) và các
    // case anon sau đó chạy nhầm quyền user A.
    const signInClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    const signIn = await signInClient.auth.signInWithPassword({
      email: userA.email,
      password,
    });
    if (signIn.error || !signIn.data.session) {
      throw new Error(
        `Đăng nhập A thất bại: ${signIn.error?.message ?? 'unknown'}.`,
      );
    }
    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    await userClient.auth.setSession({
      access_token: signIn.data.session.access_token,
      refresh_token: signIn.data.session.refresh_token,
    });

    // Case 1: A upload được vào folder của chính mình.
    const upA = await userClient.storage
      .from(BUCKET)
      .upload(objectA, jpeg, { contentType: 'image/jpeg', upsert: false });
    check(
      'A upload vào folder của mình',
      upA.error === null,
      upA.error
        ? `lỗi: ${upA.error.message.slice(0, 80)}`
        : `đã tạo ${shortId(idA)}/proof_….jpg`,
    );

    // File của B do admin tạo (service_role vượt RLS để dựng hiện trường).
    const seedB = await admin.storage
      .from(BUCKET)
      .upload(objectB, jpeg, { contentType: 'image/jpeg', upsert: true });
    if (seedB.error) {
      throw new Error(`Dựng file B thất bại: ${seedB.error.message}.`);
    }

    // Case 2a: A KHÔNG download được file của B.
    const downB = await userClient.storage.from(BUCKET).download(objectB);
    check(
      'A KHÔNG đọc được file của B (download)',
      downB.error !== null,
      downB.error
        ? `bị chặn: ${downB.error.message.slice(0, 80)}`
        : 'KHÔNG bị chặn (mong đợi bị chặn)',
    );

    // Case 2b: A KHÔNG tạo được signed URL cho file của B.
    const signB = await userClient.storage
      .from(BUCKET)
      .createSignedUrl(objectB, 3600);
    check(
      'A KHÔNG đọc được file của B (signed URL)',
      signB.error !== null || !signB.data?.signedUrl,
      signB.error
        ? `bị chặn: ${signB.error.message.slice(0, 80)}`
        : 'KHÔNG bị chặn (mong đợi bị chặn)',
    );

    // Case 3a: anon KHÔNG download được file của A.
    const anonDown = await anon.storage.from(BUCKET).download(objectA);
    check(
      'anon KHÔNG đọc được file của A',
      anonDown.error !== null,
      anonDown.error
        ? `bị chặn: ${anonDown.error.message.slice(0, 80)}`
        : 'KHÔNG bị chặn (mong đợi bị chặn)',
    );

    // Case 3b: anon list bucket không thấy gì.
    const anonList = await anon.storage.from(BUCKET).list('');
    const anonRows = anonList.data ?? [];
    check(
      'anon KHÔNG list được object nào',
      anonList.error !== null || anonRows.length === 0,
      anonList.error
        ? `bị chặn: ${anonList.error.message.slice(0, 80)}`
        : `thấy ${anonRows.length} object (mong đợi 0)`,
    );
  } finally {
    const objects = [objectA, objectB].filter(Boolean);
    if (objects.length > 0) {
      const res = await admin.storage.from(BUCKET).remove(objects);
      console.log(
        `CLEANUP objects: ${res.error ? `lỗi ${res.error.message}` : 'đã xóa'}`,
      );
    }
    for (const id of [idA, idB]) {
      if (id) {
        const res = await admin.auth.admin.deleteUser(id);
        console.log(
          `CLEANUP user ${shortId(id)}: ${res.error ? `lỗi ${res.error.message}` : 'đã xóa'}`,
        );
      }
    }
  }

  const passed = results.filter((r) => r.pass).length;
  console.log(`STORAGE_RLS_PROOF: ${passed}/${results.length} check pass`);
  if (passed !== results.length) {
    process.exitCode = 1;
  }
}

void main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : 'unknown';
  console.log(`FAIL storage-rls-proof sập: ${message}`);
  process.exitCode = 1;
});
