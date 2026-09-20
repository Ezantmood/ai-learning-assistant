// Mũi thăm dò đường dây app → Edge Function → Gemini (CN3-01, sửa ở cn3-g1b).
// CHƯA làm logic CN3: prompt cố định cực ngắn, chỉ chứng minh JWT + secret
// + gọi model thông suốt. Key không bao giờ rời server.
//
// Contract probe (giữ nguyên qua mọi lần sửa):
// - POST kèm JWT hợp lệ → 200, body chứa "OK".
// - POST không kèm Authorization → 401 (gateway chặn).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Model đồng bộ với app (src/lib/ai/models.ts): 2.5-flash shutdown sớm nhất
// 16/10/2026. CẤM set temperature/top_p/top_k (deprecated trên Gemini 3.x).
const MODEL = "gemini-3.5-flash";
const PROMPT = "Trả lời đúng một từ: OK";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1. JWT từ header Authorization, thiếu hoặc sai thì 401.
  // cn3-g1b: cắt tiền tố + trim rồi mới dùng; token rỗng sau khi cắt cũng
  // 401 (không để chuỗi rỗng lọt vào getUser). Chuỗi lỗi 401 giữ nguyên để
  // script probe grep được.
  const auth = req.headers.get("Authorization");
  if (auth === null || !/^Bearer\s+/i.test(auth)) {
    return json(401, {
      error: "Thiếu JWT: gửi header Authorization: Bearer <token>.",
    });
  }
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return json(401, {
      error: "Thiếu JWT: gửi header Authorization: Bearer <token>.",
    });
  }

  // Env do Supabase tự tiêm cho Edge Function; thiếu thì 500 rõ ràng để
  // phân biệt với 401 sai JWT (từng lẫn lộn ở probe cũ).
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !supabaseAnonKey) {
    return json(500, {
      error: "Thiếu env SUPABASE_URL/SUPABASE_ANON_KEY của Edge Function.",
    });
  }

  // Xác thực bằng supabase-js, KHÔNG tự verify chữ ký (project dùng JWT
  // signing keys ES256, legacy secret/HS256 đã sai). Belt and suspenders:
  // vừa forward header Authorization đã chuẩn hóa, vừa truyền token tường
  // minh vào getUser (client Edge Function không giữ session nên gọi
  // getUser() không đối số luôn fail — probe 2026-09-20).
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { error: userError } = await supabase.auth.getUser(token);
  if (userError) {
    return json(401, { error: "JWT không hợp lệ hoặc đã hết hạn." });
  }

  // 2. Key đọc từ secret server, thiếu thì 500 kèm thông báo rõ.
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return json(500, {
      error:
        "Chưa cấu hình secret GEMINI_API_KEY cho Edge Function (xem docs/SETUP.md mục 5d).",
    });
  }

  // 3. Gọi Gemini với prompt cố định, trả về text nhận được.
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT }] }] }),
    },
  );
  if (!geminiRes.ok) {
    return json(502, { error: `Gemini trả lỗi HTTP ${geminiRes.status}.` });
  }
  const data = await geminiRes.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return json(200, { ok: true, model: MODEL, text });
});
