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

/**
 * Cấu hình JSON cho MỘT lần gọi Gemini trích PDF (CN3-PDF): trả đúng 2
 * trường `extracted_text` (toàn văn) và `summary_text` (tóm tắt tiếng Việt).
 * Gemini đọc PDF bằng native vision (giới hạn 50MB/1000 trang; app trần
 * 10MB nên không chia nhỏ). KHÔNG đặt max_output_tokens nhỏ (thinking
 * tokens tính vào hạn mức, model có thể đốt hết rồi trả rỗng), KHÔNG
 * temperature/top_p/top_k/candidate_count/thinking_budget (Gemini 3.x
 * trả HTTP 400). Muốn chỉnh chi phí thì dùng thinking_level.
 */
export const EXTRACTION_GENERATION_CONFIG = {
  responseMimeType: 'application/json',
  responseSchema: {
    properties: {
      extracted_text: { type: 'STRING' },
      summary_text: { type: 'STRING' },
    },
    required: ['extracted_text', 'summary_text'],
    type: 'OBJECT',
  },
} as const;

export type ExtractionResult = {
  extractedText: string;
  summaryText: string;
  truncated: boolean;
};

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
      'Chưa cấu hình EXPO_PUBLIC_GEMINI_API_KEY. Điền key vào .env.local (xem docs/SETUP.md mục 4), rồi dừng và chạy lại Expo.',
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

/**
 * Gemini không trả nội dung nào (parts=null/text=null khi chạm MAX_TOKENS
 * với responseSchema bật — googleapis/python-genai#1039 — hoặc chuỗi rỗng).
 * Nhánh (b): báo thất bại rõ, KHÔNG ghi đè summary cũ bằng rỗng.
 */
export class GeminiEmptyError extends GeminiError {
  constructor() {
    super(
      'Gemini không trả về nội dung (có thể tài liệu quá dài chạm giới hạn). Hãy thử lại với tài liệu ngắn hơn.',
    );
    this.name = 'GeminiEmptyError';
  }
}

function unescapeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

/** Cứu chuỗi dở khi JSON bị cắt cụt: bắt giá trị chưa đóng ngoặc của 1 key. */
function rescueTruncatedField(raw: string, key: string): string {
  const pattern = new RegExp(
    `"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`,
  );
  const match = pattern.exec(raw);
  if (!match) {
    return '';
  }
  return unescapeJsonString(match[1] ?? '').trim();
}

/**
 * Parser JSON trích xuất PDF: đủ / dở / RỖNG HOÀN TOÀN.
 * - Đủ: JSON hợp lệ, cả hai trường non-empty → {truncated: false}.
 * - Dở: JSON không parse được nhưng còn chuỗi dở cứu được ít nhất một
 *   trường → {truncated: true} để caller LƯU phần lấy được và BÁO user
 *   biết bị cắt (CẤM giả vờ thành công).
 * - Rỗng hoàn toàn (raw rỗng hoặc không cứu được gì) → ném
 *   GeminiEmptyError để caller báo thất bại, KHÔNG upsert rỗng.
 * - Chuỗi thuần không phải JSON (legacy/plain, vd mock cũ): coi là bản
 *   tóm tắt, extractedText rỗng, truncated false — giữ tương thích.
 */
export function parseExtractionJson(raw: string): ExtractionResult {
  const text = raw.trim();
  if (!text) {
    throw new GeminiEmptyError();
  }
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const extractedText =
      typeof parsed.extracted_text === 'string'
        ? parsed.extracted_text.trim()
        : '';
    const summaryText =
      typeof parsed.summary_text === 'string'
        ? parsed.summary_text.trim()
        : '';
    if (extractedText && summaryText) {
      return { extractedText, summaryText, truncated: false };
    }
    if (extractedText || summaryText) {
      return { extractedText, summaryText, truncated: true };
    }
    throw new GeminiEmptyError();
  } catch (error) {
    if (error instanceof GeminiEmptyError) {
      throw error;
    }
    const extractedText = rescueTruncatedField(text, 'extracted_text');
    const summaryText = rescueTruncatedField(text, 'summary_text');
    if (extractedText || summaryText) {
      return { extractedText, summaryText, truncated: true };
    }
    // Không phải JSON mà là văn bản thuần (legacy): giữ làm tóm tắt.
    if (!text.startsWith('{') && !text.startsWith('[')) {
      return { extractedText: '', summaryText: text, truncated: false };
    }
    throw new GeminiEmptyError();
  }
}

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

export const OCR_PROMPT =
  'Hãy đọc ảnh đề bài và chép lại toàn bộ chữ nhìn thấy bằng tiếng Việt. ' +
  'Giữ nguyên công thức, ký hiệu và thứ tự dòng. Nếu ảnh không có chữ đọc được ' +
  'hoặc không phải đề bài, trả extracted_text là chuỗi rỗng. Không giải bài.';

export const OCR_GENERATION_CONFIG = {
  responseMimeType: 'application/json',
  responseSchema: {
    properties: { extracted_text: { type: 'STRING' } },
    required: ['extracted_text'],
    type: 'OBJECT',
  },
} as const;

export type OcrResult = { extractedText: string; truncated: boolean };

export function parseOcrJson(raw: string): OcrResult {
  const text = raw.trim();
  if (!text) {
    throw new GeminiEmptyError();
  }
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const extractedText = typeof parsed.extracted_text === 'string'
      ? parsed.extracted_text.trim()
      : '';
    if (!extractedText) {
      throw new GeminiEmptyError();
    }
    return { extractedText, truncated: false };
  } catch (error) {
    if (error instanceof GeminiEmptyError) {
      throw error;
    }
    const extractedText = rescueTruncatedField(text, 'extracted_text');
    if (!extractedText) {
      throw new GeminiEmptyError();
    }
    return { extractedText, truncated: true };
  }
}

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
 * Không set temperature/top_p/top_k/candidate_count/thinking_budget
 * (deprecated/400 trên Gemini 3.x). `generationConfig` chỉ mang
 * responseMimeType/responseSchema cho trích PDF (1 lần gọi, JSON 2 trường).
 */
async function postGenerate(
  parts: GeminiPart[],
  emptyMessage: string,
  generationConfig?: typeof EXTRACTION_GENERATION_CONFIG | typeof OCR_GENERATION_CONFIG,
): Promise<string> {
  const apiKey = readApiKey();

  let res: Response;
  try {
    res = await fetch(
      `${GEMINI_GENERATE_URL}?key=${encodeURIComponent(apiKey)}`,
      {
        body: JSON.stringify({
          contents: [{ parts }],
          ...(generationConfig ? { generationConfig } : {}),
        }),
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
 * Gọi Gemini REST trực tiếp từ client, trả về chuỗi thô (PDF: JSON 2 trường
 * `extracted_text`/`summary_text` do `EXTRACTION_GENERATION_CONFIG` ép kiểu;
 * TXT: văn bản tóm tắt thuần). Caller (requestSummary) parse chuỗi PDF qua
 * `parseExtractionJson` để lấy cả hai và ghi DB trong cùng một lần cập nhật.
 * Key lấy từ EXPO_PUBLIC_GEMINI_API_KEY, CẤM log key. Không set
 * temperature/top_p/top_k (deprecated). Giữ nguyên mapping 429/5xx.
 */
export async function summarizeWithGemini(source: SummarySource): Promise<string> {
  return postGenerate(
    buildParts(source),
    'Gemini không trả về nội dung tóm tắt. Hãy thử lại.',
    source.kind === 'pdf' ? EXTRACTION_GENERATION_CONFIG : undefined,
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

/** OCR CN5: text trước ảnh, base64 picker luôn là JPEG. Một request. */
export async function ocrWithGemini(base64Data: string): Promise<OcrResult> {
  const raw = await postGenerate(
    [
      { text: OCR_PROMPT },
      { inline_data: { mime_type: 'image/jpeg', data: base64Data } },
    ],
    'AI không đọc được chữ trong ảnh. Hãy chọn ảnh rõ hơn rồi thử lại.',
    OCR_GENERATION_CONFIG,
  );
  return parseOcrJson(raw);
}
