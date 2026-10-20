# Truy vết 45 FR theo PDF — 2026-10-20

Yêu cầu theo SPEC.md, đối chiếu đủ 3 trang PDF trong thư mục cha.
`Có code` không đồng nghĩa đã nghiệm thu thiết bị. Mốc 43 suites/336 test,
RLS remote 51/51, schema/types 57 cột, Android export và web smoke.
Chưa chạy lại checklist Expo Go 19→22; các ca cũ còn mở không tự tick.
Độ đúng của AI chỉ được smoke với mẫu cụ thể, không bảo đảm mọi đề/tài liệu.

Đường dẫn feature dưới đây tính từ src/features/, shared từ src/; route/SQL/script
đã ghi gốc tương ứng. Định nghĩa trước sửa giữ ở FR-AUDIT.md.

| FR | Yêu cầu gốc | File/hàm hiện có | Kiểm chứng |
|---|---|---|---|
| FR-01 | Hệ thống phải cho phép sinh viên đăng ký tài khoản bằng email và mật khẩu. | `auth/api.ts: signUp; auth/schemas.ts: signUpSchema` | Code + unit; Expo Go còn ca mở |
| FR-02 | Hệ thống phải cho phép sinh viên đăng nhập và đăng xuất. | `auth/api.ts: signIn/signOut; auth/AuthProvider.tsx` | Code + unit; Expo Go còn ca mở |
| FR-03 | Hệ thống phải hỗ trợ chức năng quên và đặt lại mật khẩu. | `auth/api.ts: requestPasswordReset/verifyRecoveryOtp/updatePassword` | Code + unit; Expo Go còn ca mở |
| FR-04 | Hệ thống phải cho phép sinh viên cập nhật thông tin cá nhân. | `profile/api.ts: getProfile/updateProfile/uploadAvatar` | Code + unit; Expo Go còn ca mở |
| FR-05 | Hệ thống phải quản lý dữ liệu học tập riêng biệt cho từng tài khoản. | `supabase/migrations/0011_parent_ownership_rls.sql; scripts/fr-audit-proof.mjs` | RLS A/B 51/51; proof CN1 hồi quy |
| FR-06 | Hệ thống phải cho phép sinh viên tải lên tài liệu học tập. | `documents/api.ts: pickDocument/uploadDocument` | Code + unit; Expo Go còn ca mở |
| FR-07 | Hệ thống phải hỗ trợ các định dạng tài liệu phổ biến như PDF, DOCX và TXT. | `documents/storage.ts: MIME/ext guard` | Code + unit; Expo Go còn ca mở |
| FR-08 | Hệ thống phải hiển thị danh sách các tài liệu mà sinh viên đã tải lên. | `documents/api.ts: listDocuments; app/(app)/documents/index.tsx` | Code + unit; Expo Go còn ca mở |
| FR-09 | Hệ thống phải cho phép sinh viên xem thông tin của tài liệu như tên, ngày tải lên và kích thước. | `documents/api.ts: getDocument; app/(app)/documents/[id].tsx` | Code + unit; Expo Go còn ca mở |
| FR-10 | Hệ thống phải cho phép sinh viên đổi tên tài liệu. | `documents/api.ts: renameDocument` | Code + unit; Expo Go còn ca mở |
| FR-11 | Hệ thống phải cho phép sinh viên xóa tài liệu. | `documents/api.ts: deleteDocument` | Code + unit; Expo Go còn ca mở |
| FR-12 | Hệ thống phải cho phép sinh viên tổ chức tài liệu theo môn học/chủ đề. | `documents/api.ts: listSubjects/createSubject/assignDocumentSubject` | Code + unit; Expo Go còn ca mở |
| FR-13 | Hệ thống phải lưu trữ nội dung tài liệu để phục vụ các chức năng AI. | `summary/api.ts: requestSummary; scan/api.ts: runScan; documents.extracted_text` | Code + unit; Expo Go còn ca mở |
| FR-14 | Hệ thống phải cho phép sinh viên yêu cầu AI tóm tắt tài liệu đã tải lên. | `summary/SummarySection.tsx; summary/api.ts: requestSummary` | Unit + history remote + web; AI text smoke đạt; PDF HTTP 503 hai lượt, cần kiểm lại dịch vụ |
| FR-15 | Hệ thống phải trích xuất nội dung văn bản từ tài liệu PDF . | `shared/ai/transport.ts: parseExtractionJson; summary/api.ts` | Unit + history remote + web; AI text smoke đạt; PDF HTTP 503 hai lượt, cần kiểm lại dịch vụ |
| FR-16 | Hệ thống phải gửi nội dung phù hợp đến Generative AI API như OpenAI hoặc Gemini để xử lý. | `shared/ai/transport.ts: postGenerate` | Unit + history remote + web; AI text smoke đạt; PDF HTTP 503 hai lượt, cần kiểm lại dịch vụ |
| FR-17 | AI phải tạo bản tóm tắt dựa trên nội dung của tài liệu. | `shared/ai/transport.ts: buildSummaryPrompt; summary/api.ts` | Unit + history remote + web; AI text smoke đạt; PDF HTTP 503 hai lượt, cần kiểm lại dịch vụ |
| FR-18 | Hệ thống phải cho phép người dùng lựa chọn mức độ tóm tắt như ngắn, trung bình hoặc chi tiết. | `summary/SummarySection.tsx; summary/schemas.ts: summaryOptionsSchema` | Unit + history remote + web; AI text smoke đạt; PDF HTTP 503 hai lượt, cần kiểm lại dịch vụ |
| FR-19 | Hệ thống phải có thể tạo bản tóm tắt theo từng chương hoặc từng phần của tài liệu. | `shared/ai/transport.ts: buildSummaryPrompt(scope/sectionTitle)` | Unit + history remote + web; AI text smoke đạt; PDF HTTP 503 hai lượt, cần kiểm lại dịch vụ |
| FR-20 | Hệ thống phải trình bày kết quả tóm tắt theo cấu trúc dễ đọc. | `shared/components/ai-result-text.tsx: AiResultText` | Unit + history remote + web; AI text smoke đạt; PDF HTTP 503 hai lượt, cần kiểm lại dịch vụ |
| FR-21 | Hệ thống phải cho phép sinh viên lưu bản tóm tắt. | `summary/api.ts: requestSummary INSERT; migration 0008` | Unit + history remote + web; AI text smoke đạt; PDF HTTP 503 hai lượt, cần kiểm lại dịch vụ |
| FR-22 | Hệ thống phải cho phép sinh viên xem lại các bản tóm tắt đã tạo. | `summary/api.ts: listSummaries/getSummary; SummarySection lịch sử` | Unit + history remote + web; AI text smoke đạt; PDF HTTP 503 hai lượt, cần kiểm lại dịch vụ |
| FR-23 | Hệ thống phải cho phép sinh viên đặt câu hỏi liên quan đến tài liệu đã tải lên. | `chat/api.ts: askQuestion; chat/QaSection.tsx` | Unit/API AI + web hỏi/lưu/phiên mới/mở lại; Expo Go chờ |
| FR-24 | AI phải sử dụng nội dung tài liệu làm nguồn thông tin để trả lời câu hỏi. | `shared/ai/transport.ts: QA_PROMPT_HEADER/buildQuestionParts` | Unit/API AI + web hỏi/lưu/phiên mới/mở lại; Expo Go chờ |
| FR-25 | Hệ thống phải ưu tiên trả lời dựa trên nội dung tài liệu thay vì tạo câu trả lời không liên quan. | `shared/ai/transport.ts: QA_PROMPT_HEADER (không bịa)` | Unit/API AI + web hỏi/lưu/phiên mới/mở lại; Expo Go chờ |
| FR-26 | Hệ thống phải hiển thị câu trả lời của AI trong giao diện hội thoại. | `chat/QaSection.tsx: lượt Bạn/Trợ lý; AiResultText` | Unit/API AI + web hỏi/lưu/phiên mới/mở lại; Expo Go chờ |
| FR-27 | Hệ thống phải duy trì ngữ cảnh của cuộc hội thoại trong phiên học tập. | `chat/QaSection.tsx: turns; shared/ai/transport.ts: history user/model` | Unit/API AI + web hỏi/lưu/phiên mới/mở lại; Expo Go chờ |
| FR-28 | Sinh viên phải có thể đặt câu hỏi tiếp theo dựa trên câu trả lời trước đó. | `chat/api.ts: askQuestion(history); QaSection send` | Unit/API AI + web hỏi/lưu/phiên mới/mở lại; Expo Go chờ |
| FR-29 | Hệ thống phải cho phép người dùng bắt đầu một cuộc hội thoại mới. | `chat/QaSection.tsx: Hội thoại mới, UUID và turns rỗng` | Unit/API AI + web hỏi/lưu/phiên mới/mở lại; Expo Go chờ |
| FR-30 | Hệ thống phải lưu lịch sử các cuộc hội thoại nếu người dùng lựa chọn lưu. | `chat/api.ts: saveConversation/groupConversations; migration 0009` | Unit/API AI + web hỏi/lưu/phiên mới/mở lại; Expo Go chờ |
| FR-31 | Hệ thống phải cho phép sinh viên chụp ảnh đề bài bằng camera. | `scan/api.ts: captureScanImage` | Code + unit; Expo Go còn ca mở |
| FR-32 | Hệ thống phải cho phép sinh viên tải ảnh đề bài từ thiết bị. | `scan/api.ts: pickScanImage` | Code + unit; Expo Go còn ca mở |
| FR-33 | Hệ thống phải sử dụng OCR hoặc multimodal AI để nhận dạng nội dung trong hình ảnh. | `shared/ai/transport.ts: ocrWithGemini/parseOcrJson` | Unit + OCR thật mẫu đọc đúng; 67,6 giây, tốc độ biến động |
| FR-34 | Hệ thống phải chuyển nội dung nhận dạng thành văn bản có thể xử lý. | `scan/api.ts: runScan, extracted_text` | Unit + OCR thật mẫu đọc đúng; 67,6 giây, tốc độ biến động |
| FR-35 | Hệ thống phải hiển thị nội dung đã nhận dạng để sinh viên kiểm tra. | `scan/scan-text-editor.tsx; app/(app)/scan.tsx` | Code + unit; Expo Go còn ca mở |
| FR-36 | Sinh viên phải có thể chỉnh sửa nội dung OCR nếu nhận dạng không chính xác. | `scan/api.ts: updateScanText; scan/scan-text-editor.tsx` | Unit API/UI sửa→lưu→intent; RLS remote; Expo Go chờ |
| FR-37 | Hệ thống phải cho phép sinh viên gửi đề bài đã nhận dạng đến AI để phân tích. | `scan/scan-text-editor.tsx: save→intent; solver/SolutionSection.tsx: effect` | Unit API/UI sửa→lưu→intent; RLS remote; Expo Go chờ |
| FR-38 | AI phải phân tích nội dung đề bài. | `shared/ai/transport.ts: buildSolutionPrompt(analysis)` | Unit API/UI + smoke AI thật từng chế độ; Expo Go chờ |
| FR-39 | AI phải xác định loại bài toán hoặc chủ đề liên quan. | `shared/ai/transport.ts: analysis chủ đề/dạng bài` | Unit API/UI + smoke AI thật từng chế độ; Expo Go chờ |
| FR-40 | AI phải cung cấp gợi ý từng bước (step-by-step hints). | `shared/ai/transport.ts: hint một bước; solver/SolutionSection.tsx` | Unit API/UI + smoke AI thật từng chế độ; Expo Go chờ |
| FR-41 | Hệ thống phải cho phép sinh viên yêu cầu gợi ý tiếp theo. | `solver/SolutionSection.tsx: hintStep/history; solver/api.ts` | Unit API/UI + smoke AI thật từng chế độ; Expo Go chờ |
| FR-42 | AI phải giải thích các khái niệm liên quan đến bài toán. | `shared/ai/transport.ts: explanation; SolutionSection nút riêng` | Unit API/UI + smoke AI thật từng chế độ; Expo Go chờ |
| FR-43 | Hệ thống có thể cung cấp lời giải tham khảo sau khi sinh viên yêu cầu. | `shared/ai/transport.ts: solution; SolutionSection yêu cầu riêng` | Unit API/UI + smoke AI thật từng chế độ; Expo Go chờ |
| FR-44 | Hệ thống phải phân biệt giữa gợi ý, giải thích và lời giải hoàn chỉnh. | `solver/SolutionSection.tsx: SOLUTION_LABELS; migration 0010 response_type` | Unit API/UI + smoke AI thật từng chế độ; Expo Go chờ |
| FR-45 | Hệ thống phải cho phép sinh viên đặt câu hỏi tiếp theo về lời giải. | `solver/api.ts: requestSolution(history/question); SolutionSection hỏi tiếp` | Unit API/UI + smoke AI thật từng chế độ; Expo Go chờ |


## Truy cập sau tinh gọn UI — 2026-10-21

45 FR giữ nguyên. FR-09→12 nằm trong Thông tin & quản lý ở chi tiết.
FR-14→22 ở mục Tóm tắt; mức trung bình hiển thị Vừa, chương/phần mở trong
Phạm vi, các bản cũ ở Bản tóm tắt đã lưu. FR-23→30 ở Hỏi đáp, giữ nút
Hội thoại mới/Lưu hội thoại/Hội thoại đã lưu. FR-36→37 trong màn Quét hoặc
Xem & sửa nội dung đề ở Giải bài. FR-38→45 ở Giải bài; Phân tích/Giải thích/
Lời giải trong Cách hỗ trợ khác, phản hồi gần nhất và các bước trước có nhãn.

`documents/document-study-tabs.tsx` giữ mount/draft/ngữ cảnh khi đổi mục;
regression `documents/__tests__/document-study-tabs.test.tsx` kiểm giữ bản
nháp, vùng ẩn accessibility, intent OCR. Tổng 44 suites/338 test; web thực
và Android export đạt theo checklist 24. Camera/Expo Go vẫn chưa nghiệm thu.


## Model phục vụ demo — 2026-10-21

FR-14→45 giữ nguyên chức năng, đổi model chung sang gemini-3.5-flash-lite.
Smoke API thật 10/10 gồm summary theo phần, Q/A hai lượt có ngữ cảnh,
phân tích/gợi ý 2 bước/giải thích/lời giải/hỏi tiếp, OCR và trích PDF mẫu.
PDF trước đây 3.6 gặp 503; mẫu mới trên 3.5 Lite đạt, không suy mọi PDF đạt.
Preflight một lượt trên code đã đổi đạt 1/1. Transport phân biệt quota
ngày/phút/chưa cấp và số dư 402, không retry/đổi key/model tự động.
44 suites/342 tests; bằng chứng ở evidence/ai-demo-quota-20261021.txt và
checklist 25/26. AI Studio đúng project xác nhận Free Tier 15 RPM/250K TPM/
500 RPD (2026-10-21), hạn mức ngày gấp 25 lần 3.6 cũ; không bật billing.
Peak usage 28 ngày không đo số lượt còn lại. Expo Go vẫn cần kiểm thiết bị.
