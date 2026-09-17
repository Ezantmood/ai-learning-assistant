// Kiểm chứng RLS FR-05 bằng 2 user test A/B trên Supabase project thật.
//
// Chạy (từ gốc repo, đã source `.env` + `.env.local` để có credential
// trong environment; không truyền secret trên dòng lệnh):
//   npx tsc --ignoreConfig --types node scripts/rls-proof.ts \
//     --outDir /tmp/rlsproof-out --module nodenext --moduleResolution nodenext \
//     --target es2021 --esModuleInterop --skipLibCheck --strict
//   node /tmp/rlsproof-out/rls-proof.js
//
// Đọc credential từ `.env` (URL, anon key) và `.env.local` (service key).
// Service key CHỈ dùng trong script này, không import vào code app.
// Không in secret/token ra log. Exit 0 khi mọi assert pass, 1 khi fail.
// User test được xóa trong `finally` dù pass hay fail.

import { createClient } from '@supabase/supabase-js';

type NoteRow = {
  content: string;
  id: string;
  title: string;
  user_id: string;
};

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
  // Credential lấy từ environment (bash đã source `.env` + `.env.local`).
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
  const password = `RlsProof!${suffix}${suffix}`;
  const userA = {
    code: `RLSPROOFA${suffix}`.toUpperCase().slice(0, 20),
    email: `rlsproof.a.${suffix}@example.com`,
  };
  const userB = {
    code: `RLSPROOFB${suffix}`.toUpperCase().slice(0, 20),
    email: `rlsproof.b.${suffix}@example.com`,
  };

  let idA = '';
  let idB = '';
  let noteA = '';
  let noteB = '';

  try {
    const createdA = await admin.auth.admin.createUser({
      email: userA.email,
      email_confirm: true,
      password,
      user_metadata: { full_name: 'RLS Proof A', student_code: userA.code },
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
      user_metadata: { full_name: 'RLS Proof B', student_code: userB.code },
    });
    if (createdB.error || !createdB.data.user) {
      throw new Error(
        `Tạo user B thất bại: ${createdB.error?.message ?? 'unknown'}.`,
      );
    }
    idB = createdB.data.user.id;
    console.log(`SETUP 2 user test: A=${shortId(idA)} B=${shortId(idB)}`);

    const profileA = await admin
      .from('profiles')
      .select('id')
      .eq('id', idA);
    const profileRows = (profileA.data ?? []) as Array<{ id: string }>;
    check(
      'trigger tạo profile cho A',
      profileRows.length === 1,
      profileA.error
        ? `lỗi đọc profiles: ${profileA.error.message || 'forbidden'}`
        : `profiles của A: ${profileRows.length} dòng (mong đợi 1)`,
    );

    const titleA = `RLS Proof A ${suffix}`;
    const titleB = `RLS Proof B ${suffix}`;
    const insA = await admin
      .from('study_notes')
      .insert({ content: 'note cua A', title: titleA, user_id: idA })
      .select('id');
    const insB = await admin
      .from('study_notes')
      .insert({ content: 'note cua B', title: titleB, user_id: idB })
      .select('id');
    const rowsA = (insA.data ?? []) as NoteRow[];
    const rowsB = (insB.data ?? []) as NoteRow[];
    if (rowsA.length !== 1 || rowsB.length !== 1 || !rowsA[0] || !rowsB[0]) {
      throw new Error(
        `Tạo note setup thất bại: ${insA.error?.message ?? insB.error?.message ?? 'unknown'}.`,
      );
    }
    noteA = rowsA[0].id;
    noteB = rowsB[0].id;
    console.log(
      `SETUP 2 note: noteA=${shortId(noteA)} noteB=${shortId(noteB)}`,
    );

    const signIn = await anon.auth.signInWithPassword({
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

    const own = await userClient.from('study_notes').select('id,title');
    const ownRows = (own.data ?? []) as NoteRow[];
    check(
      'A đọc note của chính mình',
      own.error === null &&
        ownRows.length === 1 &&
        ownRows[0]?.id === noteA,
      `list A: ${ownRows.length} dòng (mong đợi 1)`,
    );

    const cross = await userClient
      .from('study_notes')
      .select('id,title')
      .eq('id', noteB);
    check(
      'A SELECT note của B',
      cross.error === null && (cross.data ?? []).length === 0,
      `trả về ${(cross.data ?? []).length} dòng, error null (mong đợi 0 dòng)`,
    );

    const upd = await userClient
      .from('study_notes')
      .update({ title: 'Sua trom' })
      .eq('id', noteB)
      .select('id');
    check(
      'A UPDATE note của B',
      (upd.data ?? []).length === 0,
      `${(upd.data ?? []).length} dòng bị sửa (mong đợi 0)`,
    );

    const del = await userClient
      .from('study_notes')
      .delete()
      .eq('id', noteB)
      .select('id');
    check(
      'A DELETE note của B',
      (del.data ?? []).length === 0,
      `${(del.data ?? []).length} dòng bị xóa (mong đợi 0)`,
    );

    const evil = await userClient
      .from('study_notes')
      .insert({ content: 'chen leo', title: `Evil ${suffix}`, user_id: idB })
      .select('id');
    check(
      'A INSERT note với user_id = B',
      evil.error !== null,
      evil.error
        ? `bị chặn: ${evil.error.message.slice(0, 80)}`
        : 'KHÔNG bị chặn (mong đợi bị chặn)',
    );

    const verifyB = await admin
      .from('study_notes')
      .select('id,title')
      .eq('id', noteB);
    const verifyRows = (verifyB.data ?? []) as NoteRow[];
    check(
      'note của B còn nguyên sau các đòn chéo',
      verifyRows.length === 1 && verifyRows[0]?.title === titleB,
      `noteB: ${verifyRows.length} dòng, tiêu đề ${verifyRows[0]?.title === titleB ? 'nguyên vẹn' : 'ĐÃ BỊ ĐỔI'}`,
    );
  } finally {
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
  console.log(`RLS_PROOF: ${passed}/${results.length} check pass`);
  if (passed !== results.length) {
    process.exitCode = 1;
  }
}

void main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : 'unknown';
  console.log(`FAIL rls-proof sập: ${message}`);
  process.exitCode = 1;
});
