import { SUMMARY_MODEL } from './models';

/**
 * Transport gọi Gemini DUY NHẤT của CN3-G1 — nhánh key trực tiếp
 * (probe cn3-g1: WITH_AUTH 401 + WITHOUT_AUTH 401, xem REPORT-NOTES
 * "Giới hạn đã biết"). CHỈ cài đặt nhánh này; cấm viết sẵn nhánh proxy
 * rồi bật/tắt bằng cờ — đó là code chết.
 *
 * PDF gửi base64 inline nguyên file (≤ 10 MB theo luật CN2, dưới ngưỡng
 * PDF 50 MB nên không chunk). TXT gửi text trực tiếp, không base64.
 * Không thư viện trích xuất PDF (Gemini đọc native).
 */

/** Đầu vào đã chuẩn bị sẵn: G2 tải tệp rồi truyền vào, transport không đọc file. */
export type SummarySource =
  | { kind: 'pdf'; base64Data: string }
  | { kind: 'txt'; textContent: string };

const GEMINI_GENERATE_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${SUMMARY_MODEL}:generateContent`;

/** Prompt tóm tắt tiếng Việt cố định cho mọi request CN3. */
export const SUMMARY_PROMPT =
  'Bạn là trợ lý học tập cho sinh viên. Hãy đọc tài liệu đính kèm và tóm tắt ' +
  'bằng tiếng Việt, trình bày ngắn gọn theo các ý chính, giữ đúng thuật ngữ ' +
  'chuyên môn trong tài liệu. Chỉ trả về bản tóm tắt, không thêm lời dẫn.';

export class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiError';
  }
}

/** Thiếu EXPO_PUBLIC_GEMINI_API_KEY ở client (xem docs/SETUP.md). */
export class GeminiConfigError extends GeminiError {
  constructor() {
    super(
      'Chưa cấu hình EXPO_PUBLIC_GEMINI_API_KEY. Xem docs/SETUP.md mục 4 rồi khởi động lại Expo.',
    );
    this.name = 'GeminiConfigError';
  }
}

/** Lỗi mạng/fetch — user bấm "Thử lại". */
export class GeminiNetworkError extends GeminiError {
  constructor() {
    super('Không có kết nối mạng. Kiểm tra Wi-Fi/4G rồi thử lại.');
    this.name = 'GeminiNetworkError';
  }
}

/** HTTP 429/quota — báo hạn mức, CẤM tự retry. */
export class GeminiQuotaError extends GeminiError {
  constructor() {
    super(
      'Đã chạm giới hạn miễn phí hôm nay (khoảng 1.500 lượt/ngày, reset lúc nửa đêm giờ Thái Bình Dương). Hãy thử lại sau.',
    );
    this.name = 'GeminiQuotaError';
  }
}

/** HTTP 5xx — user bấm "Thử lại". */
export class GeminiServerError extends GeminiError {
  readonly status: number;

  constructor(status: number) {
    super(`Máy chủ AI đang bận (lỗi ${status}). Hãy thử lại sau.`);
    this.name = 'GeminiServerError';
    this.status = status;
  }
}

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

function readApiKey(): string {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiConfigError();
  }
  return apiKey;
}

function buildParts(source: SummarySource): GeminiPart[] {
  if (source.kind === 'pdf') {
    return [
      { inline_data: { mime_type: 'application/pdf', data: source.base64Data } },
      { text: SUMMARY_PROMPT },
    ];
  }
  return [{ text: `${SUMMARY_PROMPT}\n\n--- NỘI DUNG TÀI LIỆU ---\n${source.textContent}` }];
}

type GeminiGenerateResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

function extractText(data: GeminiGenerateResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part) => part.text ?? '')
    .join('')
    .trim();
}

/**
 * Gọi Gemini REST trực tiếp từ client, trả về bản tóm tắt tiếng Việt.
 * Key lấy từ EXPO_PUBLIC_GEMINI_API_KEY, CẤM log key (không bao giờ đưa
 * key vào message lỗi). Không set temperature/top_p/top_k (deprecated).
 */
export async function summarizeWithGemini(source: SummarySource): Promise<string> {
  const apiKey = readApiKey();

  let res: Response;
  try {
    res = await fetch(
      `${GEMINI_GENERATE_URL}?key=${encodeURIComponent(apiKey)}`,
      {
        body: JSON.stringify({ contents: [{ parts: buildParts(source) }] }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
    );
  } catch {
    throw new GeminiNetworkError();
  }

  if (res.status === 429) {
    throw new GeminiQuotaError();
  }
  if (res.status >= 500) {
    throw new GeminiServerError(res.status);
  }
  if (!res.ok) {
    throw new GeminiError(
      `Gemini trả lỗi HTTP ${res.status}. Hãy thử lại sau.`,
    );
  }

  const data = (await res.json()) as GeminiGenerateResponse;
  const text = extractText(data);
  if (!text) {
    throw new GeminiError(
      'Gemini không trả về nội dung tóm tắt. Hãy thử lại.',
    );
  }
  return text;
}
