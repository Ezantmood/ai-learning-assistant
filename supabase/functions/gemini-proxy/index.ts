// Mũi thăm dò đường dây app → Edge Function → Gemini (CN3-01).
// CHƯA làm logic CN3: prompt cố định cực ngắn, chỉ chứng minh JWT + secret
// + gọi model thông suốt. Key không bao giờ rời server.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const MODEL = "gemini-2.5-flash";
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

  // 1. JWT từ header Authorization, thiếu hoặc sai thì 401. Token phải
  // truyền tường minh vào getUser: client trong Edge Function không giữ
  // session nên gọi getUser() không đối số luôn fail (probe 2026-09-20).
  const auth = req.headers.get("Authorization");
  if (auth === null || !auth.startsWith("Bearer ")) {
    return json(401, {
      error: "Thiếu JWT: gửi header Authorization: Bearer <token>.",
    });
  }
  const token = auth.replace(/^Bearer\s+/i, "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: auth } } },
  );
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

  // 3. Gọi Gemini 2.5 Flash với prompt cố định, trả về text nhận được.
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT } }] }),
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
