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
 * Gọi Gemini REST trực tiếp từ client với parts đã dựng sẵn.
 * `emptyMessage` riêng cho từng nghiệp vụ (tóm tắt / hỏi đáp) để câu
 * báo "trả rỗng" đúng ngữ cảnh. Key lấy từ EXPO_PUBLIC_GEMINI_API_KEY,
 * CẤM log key (không bao giờ đưa key vào message lỗi).
 * Không set temperature/top_p/top_k (deprecated trên Gemini 3.x).
 */
async function postGenerate(
  parts: GeminiPart[],
  emptyMessage: string,
): Promise<string> {
  const apiKey = readApiKey();

  let res: Response;
  try {
    res = await fetch(
      `${GEMINI_GENERATE_URL}?key=${encodeURIComponent(apiKey)}`,
      {
        body: JSON.stringify({ contents: [{ parts }] }),
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
    throw new GeminiError(emptyMessage);
  }
  return text;
}

/**
 * Gọi Gemini REST trực tiếp từ client, trả về bản tóm tắt tiếng Việt.
 * Key lấy từ EXPO_PUBLIC_GEMINI_API_KEY, CẤM log key (không bao giờ đưa
 * key vào message lỗi). Không set temperature/top_p/top_k (deprecated).
 */
export async function summarizeWithGemini(source: SummarySource): Promise<string> {
  return postGenerate(
    buildParts(source),
    'Gemini không trả về nội dung tóm tắt. Hãy thử lại.',
  );
}

/** Đầu vào hỏi đáp CN4: câu hỏi + toàn văn `extracted_text` nhồi vào prompt. */
export type QuestionSource = {
  contextText: string;
  question: string;
};

/**
 * Prompt hỏi đáp tiếng Việt cố định cho mọi request CN4: model CHỈ được
 * trả lời dựa trên nội dung tài liệu đính kèm, không bịa ngoài tài liệu.
 */
export const QA_PROMPT_HEADER =
  'Bạn là trợ lý học tập cho sinh viên. Hãy trả lời câu hỏi bên dưới ' +
  'bằng tiếng Việt, CHỈ dựa trên nội dung tài liệu đính kèm. Nếu tài liệu ' +
  'không chứa thông tin để trả lời, hãy nói rõ là tài liệu không đề cập, ' +
  'không bịa thêm. Trình bày ngắn gọn, giữ đúng thuật ngữ chuyên môn.';

function buildQuestionParts(source: QuestionSource): GeminiPart[] {
  return [
    {
      text:
        `${QA_PROMPT_HEADER}\n\n--- NỘI DUNG TÀI LIỆU ---\n` +
        `${source.contextText}\n\n--- CÂU HỎI ---\n${source.question}`,
    },
  ];
}

/**
 * Gọi Gemini REST trực tiếp từ client, trả về câu trả lời tiếng Việt.
 * CẤM vector DB/RAG/chunking: toàn văn `extracted_text` (TXT ≤ 10 MB
 * theo luật CN2) nhồi thẳng vào prompt trong MỘT request duy nhất.
 * Không retry tự động; mỗi lần gọi tối đa một request.
 */
export async function answerWithGemini(
  source: QuestionSource,
): Promise<string> {
  return postGenerate(
    buildQuestionParts(source),
    'Gemini không trả về câu trả lời. Hãy thử lại.',
  );
}
