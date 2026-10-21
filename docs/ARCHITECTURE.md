# Kiến trúc — AI Learning Assistant

Mô tả hiện hành sau đối chiếu PDF ngày 2026-10-20. Các quyết định/đường dẫn
ở DEVLOG trước ngày này là lịch sử; SPEC.md giữ nguyên nghĩa FR gốc.

## Stack và cấu trúc

Expo SDK 57, TypeScript strict, expo-router; Supabase v2 Auth/Postgres/Storage;
AsyncStorage lưu phiên; Paper UI, React Hook Form/Zod, TanStack Query.
Expo Go, không thêm native build hoặc thư viện ngoài stack.

- `app/`: route/layout, ghép các vùng UI và điều hướng; không gọi Supabase.
- `src/features/auth/`: session, đăng ký/đăng nhập/OTP/đổi mật khẩu.
- `src/features/profile/`, `notes/`, `documents/`: API/query/form theo nghiệp vụ.
- `src/features/summary/`, `chat/`, `scan/`, `solver/`: từng chức năng AI.
- `src/shared/ai/`: models.ts, transport.ts; một đường generateContent.
- `src/shared/`: types, Supabase/env, QueryClient/providers, theme, component.
- `supabase/migrations/`: DDL/RLS theo thứ tự; không sửa migration đã áp.
- `scripts/`: proof/verify local; quyền service-role chỉ tại đây.

Feature không import trực tiếp feature khác. Route ghép chúng bằng props.
DocumentWithSubject đặt ở shared/types; AI transport đặt trong shared/ai
(chuyển từ src/lib/ai để tuân thủ phạm vi thư mục AGENTS.md).

## Luồng dữ liệu

Screen → API/query của feature → Supabase (RLS) hoặc transport Gemini.
Server state ở Query; draft/phiên hội thoại ở component state. AuthProvider
là nguồn session duy nhất, subscribe/restore một lần; signOut dọn query cache.
Guard không thay thế RLS; client không được tự quyết quyền sở hữu dữ liệu.

## Luồng màn hình

- `app/index.tsx`: khởi động/điều hướng theo session.
- `(auth)`: sign-in, sign-up, forgot-password, verify-reset-otp, reset-password.
  OTP email 6 số, không cần deep link.
- `(app)`: tabs Trang chủ/Tài liệu/Tài khoản; routes phụ không là tab.
- Dashboard hướng theo tác vụ: Tải tài liệu/Quét đề, kho tài liệu, ghi chú
  và môn học. Route chức năng vẫn từ shared/config/featureStatus.ts.
- `/notes`, `/notes/new`, `/notes/[id]`: CRUD ghi chú riêng.
- `/profile`, `/profile/change-password`: hồ sơ/avatar/giao diện/mật khẩu.
- `/documents`, `/documents/upload`, `/documents/[id]`, `/subjects`: CRUD tài liệu
  và phân loại. Mở tệp qua signed URL ra app ngoài, không viewer native.
- `/scan`: chọn/chụp → preview → OCR → sửa/lưu → phân tích.

Route chỉ có default export, component/test không đặt trong app/.
Header dùng ScreenHeader, back qua goBackOrReplace/goBackToDocuments.
Shared theme indigo theo DESIGN-SYSTEM.md; icon qua AppIcons/TAB_BAR_ICONS.
Giữ skeleton/loading, empty, lỗi + thử lại, thông báo dễ đọc ở light/dark.

## Tài liệu và AI

Upload guard ext/MIME/10 MB và trần 100 tài liệu, tên/path snake_case.
Storage trước DB; insert lỗi dọn object. Xóa Storage trước DB, DB fail báo rõ
để thử lại; sau xóa điều hướng rồi dọn cache detail. Chủ đề tối đa 30,
xóa chủ đề chỉ SET NULL, không mất tài liệu.

DocumentStudyTabs nhận ba vùng UI từ route, không import feature khác.
Chỉ vùng đang chọn hiển thị; cả ba giữ mount để bảo toàn draft/lượt chat.
Intent analyze mới mở mục Giải bài. Thông tin/quản lý tệp và sửa đề ảnh
thu gọn bằng display, không unmount form. DOCX chỉ hiện quản lý và hướng dẫn.

SummarySection chọn mức độ/phạm vi/phần, API đặt processing rồi sinh kết quả.
PDF gửi inline + JSON extracted_text/summary_text trong một lần gọi; TXT
đọc bằng File API mới. Khi đã có toàn văn done, tóm tắt lại dùng text để
tránh tải/gửi lại PDF. Mỗi bản INSERT mới, lịch sử chọn lại trên cùng màn.
Lưu kết quả tối đa 20.000 ký tự; không ghi đè bản cũ khi lỗi/rỗng. Phần cứu
được khi JSON cắt cụt phải có cảnh báo; không coi là toàn văn đầy đủ.
Processing treo 15 phút được thu hồi để thử lại bằng tay.

QaSection giữ phiên gồm câu hỏi/câu trả lời theo thời gian; transport gửi
role user/model. Hướng dẫn CN4 đặt ở `systemInstruction`; tài liệu và yêu
cầu hiện tại là hai text part riêng. Tài liệu là dữ liệu nguồn, lịch sử
giúp hiểu câu hỏi tiếp nhưng phải đối chiếu dữ kiện với nguồn, kể cả khi
lượt trước từ chối sai. Cho phép dịch/kể lại/giải thích dựa trên nguồn,
theo ngôn ngữ yêu cầu; nói rõ đúng phần thiếu, không bịa hoặc lạc đề.
Phiên mới có UUID mới và ngữ cảnh rỗng. Mặc định không ghi
DB; bấm Lưu mới upsert snapshot theo id, nhóm bằng conversation_id.
Mở lại phiên đã lưu có thể hỏi tiếp/lưu lại không nhân đôi. Row cũ NULL
conversation_id xem là một phiên riêng. Mỗi lượt hỏi tối đa 500 ký tự;
ngữ cảnh >300.000 ký tự báo rõ, không âm thầm bỏ lượt trước.

ScanTextEditor được route ghép vào scan và chi tiết ảnh. Lưu text đã kiểm
tra rồi refetch detail trước khi chuyển với intent analyze duy nhất. Ảnh gốc
không đổi. Solver chỉ tự phân tích theo intent người dùng vừa bấm; mở detail
thông thường không tự gọi AI.

SolutionSection có Phân tích (dạng bài/chủ đề), Gợi ý đầu/tiếp (mỗi lần một
bước), Giải thích, Lời giải tham khảo (yêu cầu riêng), Hỏi tiếp. Prompt/kết
quả có loại riêng; lưu response_type/hint_step và lần gần nhất ở DB, giữ
các lượt của phiên tại UI. Phân tích bắt đầu lại các bước. Hỏi tiếp gửi
đề và lịch sử, không tiết lộ lời giải đầy đủ trong chế độ gợi ý.

## Transport, lỗi và key

Một postGenerate dùng model stable gemini-3.5-flash-lite. Minimal cho hỏi đáp,
OCR và summary text; low cho trích PDF/gợi ý; medium cho full solution.
Không auto retry; khóa thao tác pending, timeout AbortController 90 giây.
429 đọc QuotaFailure/RetryInfo, phân biệt ngày/phút/quota chưa cấp; 402
báo số dư API, 5xx báo server bận. Metadata lỗi sai vẫn normalize an toàn;
không đưa message/key thô lên UI. Mạng/timeout/rỗng có thông báo tiếng Việt.
AiResultText hiển thị heading/bullet/bold, không chạy HTML/Markdown code.

App demo gọi Gemini trực tiếp, key từ EXPO_PUBLIC_GEMINI_API_KEY nằm trong
bundle; header tránh lộ key trong URL nhưng không bảo mật key khỏi người
có bundle. Edge Function proxy cũ chưa deploy thành công; không có nhánh
proxy dự phòng trong app. Cần chuyển key sang backend trước phát hành thật.
Không service-role/key quản trị trong app; .env/.env.local không commit.

## Kiểm chứng

Unit ở feature/shared __tests__, guard route/icon, tsc/lint/check:functions;
proof RLS hai tài khoản dùng Data API thật, verify catalog/schema; smoke
Gemini với dữ liệu học tập mẫu. Checklist thiết bị ghi độc lập, không xem
API/web/unit là bằng chứng camera/quyền/file picker trên Expo Go.

AuthProvider dọn query cache cả khi auth event đổi danh tính/hết phiên,
không chỉ nút signOut; refresh cùng user giữ cache. Regression FR-05 khóa
việc user B thấy cache dữ liệu A sau khi phiên A hết hạn.
