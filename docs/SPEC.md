# Đặc tả AI Learning Assistant — nguồn chuẩn PDF

Đối chiếu ngày 2026-10-20 với `../AI Learning Assistant-de tai.pdf` (3 trang).
Nội dung FR dưới đây giữ nguyên nghĩa đề gốc. Những bảng FR cũ đã đổi nghĩa
FR-16→FR-45 và loại nhầm yêu cầu ra ngoài phạm vi; không dùng chúng để nghiệm thu.

## CN1 — Tài khoản

| FR | Yêu cầu gốc |
|---|---|
| FR-01 | Hệ thống phải cho phép sinh viên đăng ký tài khoản bằng email và mật khẩu. |
| FR-02 | Hệ thống phải cho phép sinh viên đăng nhập và đăng xuất. |
| FR-03 | Hệ thống phải hỗ trợ chức năng quên và đặt lại mật khẩu. |
| FR-04 | Hệ thống phải cho phép sinh viên cập nhật thông tin cá nhân. |
| FR-05 | Hệ thống phải quản lý dữ liệu học tập riêng biệt cho từng tài khoản. |

## CN2 — Tài liệu học tập

| FR | Yêu cầu gốc |
|---|---|
| FR-06 | Hệ thống phải cho phép sinh viên tải lên tài liệu học tập. |
| FR-07 | Hệ thống phải hỗ trợ các định dạng tài liệu phổ biến như PDF, DOCX và TXT. |
| FR-08 | Hệ thống phải hiển thị danh sách các tài liệu mà sinh viên đã tải lên. |
| FR-09 | Hệ thống phải cho phép sinh viên xem thông tin của tài liệu như tên, ngày tải lên và kích thước. |
| FR-10 | Hệ thống phải cho phép sinh viên đổi tên tài liệu. |
| FR-11 | Hệ thống phải cho phép sinh viên xóa tài liệu. |
| FR-12 | Hệ thống phải cho phép sinh viên tổ chức tài liệu theo môn học/chủ đề. |
| FR-13 | Hệ thống phải lưu trữ nội dung tài liệu để phục vụ các chức năng AI. |

## CN3 — Tóm tắt tài liệu

| FR | Yêu cầu gốc |
|---|---|
| FR-14 | Hệ thống phải cho phép sinh viên yêu cầu AI tóm tắt tài liệu đã tải lên. |
| FR-15 | Hệ thống phải trích xuất nội dung văn bản từ tài liệu PDF . |
| FR-16 | Hệ thống phải gửi nội dung phù hợp đến Generative AI API như OpenAI hoặc Gemini để xử lý. |
| FR-17 | AI phải tạo bản tóm tắt dựa trên nội dung của tài liệu. |
| FR-18 | Hệ thống phải cho phép người dùng lựa chọn mức độ tóm tắt như ngắn, trung bình hoặc chi tiết. |
| FR-19 | Hệ thống phải có thể tạo bản tóm tắt theo từng chương hoặc từng phần của tài liệu. |
| FR-20 | Hệ thống phải trình bày kết quả tóm tắt theo cấu trúc dễ đọc. |
| FR-21 | Hệ thống phải cho phép sinh viên lưu bản tóm tắt. |
| FR-22 | Hệ thống phải cho phép sinh viên xem lại các bản tóm tắt đã tạo. |

## CN4 — Hội thoại theo tài liệu

| FR | Yêu cầu gốc |
|---|---|
| FR-23 | Hệ thống phải cho phép sinh viên đặt câu hỏi liên quan đến tài liệu đã tải lên. |
| FR-24 | AI phải sử dụng nội dung tài liệu làm nguồn thông tin để trả lời câu hỏi. |
| FR-25 | Hệ thống phải ưu tiên trả lời dựa trên nội dung tài liệu thay vì tạo câu trả lời không liên quan. |
| FR-26 | Hệ thống phải hiển thị câu trả lời của AI trong giao diện hội thoại. |
| FR-27 | Hệ thống phải duy trì ngữ cảnh của cuộc hội thoại trong phiên học tập. |
| FR-28 | Sinh viên phải có thể đặt câu hỏi tiếp theo dựa trên câu trả lời trước đó. |
| FR-29 | Hệ thống phải cho phép người dùng bắt đầu một cuộc hội thoại mới. |
| FR-30 | Hệ thống phải lưu lịch sử các cuộc hội thoại nếu người dùng lựa chọn lưu. |

## CN5 — Quét đề bài

| FR | Yêu cầu gốc |
|---|---|
| FR-31 | Hệ thống phải cho phép sinh viên chụp ảnh đề bài bằng camera. |
| FR-32 | Hệ thống phải cho phép sinh viên tải ảnh đề bài từ thiết bị. |
| FR-33 | Hệ thống phải sử dụng OCR hoặc multimodal AI để nhận dạng nội dung trong hình ảnh. |
| FR-34 | Hệ thống phải chuyển nội dung nhận dạng thành văn bản có thể xử lý. |
| FR-35 | Hệ thống phải hiển thị nội dung đã nhận dạng để sinh viên kiểm tra. |
| FR-36 | Sinh viên phải có thể chỉnh sửa nội dung OCR nếu nhận dạng không chính xác. |
| FR-37 | Hệ thống phải cho phép sinh viên gửi đề bài đã nhận dạng đến AI để phân tích. |

## CN6 — Hỗ trợ giải bài

| FR | Yêu cầu gốc |
|---|---|
| FR-38 | AI phải phân tích nội dung đề bài. |
| FR-39 | AI phải xác định loại bài toán hoặc chủ đề liên quan. |
| FR-40 | AI phải cung cấp gợi ý từng bước (step-by-step hints). |
| FR-41 | Hệ thống phải cho phép sinh viên yêu cầu gợi ý tiếp theo. |
| FR-42 | AI phải giải thích các khái niệm liên quan đến bài toán. |
| FR-43 | Hệ thống có thể cung cấp lời giải tham khảo sau khi sinh viên yêu cầu. |
| FR-44 | Hệ thống phải phân biệt giữa gợi ý, giải thích và lời giải hoàn chỉnh. |
| FR-45 | Hệ thống phải cho phép sinh viên đặt câu hỏi tiếp theo về lời giải. |

## Acceptance criteria bổ sung cho đợt đối chiếu

- CN1/CN2: giữ luồng email/OTP, profile, notes, upload PDF/DOCX/TXT,
  CRUD tài liệu/môn học. PDF/TXT/ảnh có extracted_text để dùng AI; DOCX
  lưu/mở được, AI yêu cầu chuyển PDF. Không thêm môn học theo nghĩa quản
  lý đào tạo, điểm, lịch học hay admin.
- CN3: chọn Ngắn/Trung bình/Chi tiết; chọn toàn tài liệu hoặc từng
  chương/phần, có thể nhập tên phần. Prompt giữ đúng nội dung, chia tiêu đề
  và ý chính. Mỗi kết quả thành công được lưu riêng; danh sách bản đã tạo
  cho phép xem lại, giữ bản cũ khi yêu cầu mới lỗi.
  FR-15 chạy cùng lần tóm tắt PDF đầu tiên: chép nguyên văn tất cả trang,
  giữ ngôn ngữ gốc; mức/chương tóm tắt chỉ áp dụng cho summary_text.
  Chỉ cập nhật nguồn khi có cả văn bản và tóm tắt, extraction_complete=true
  và API kết thúc STOP. Thiếu/rỗng/cắt thì báo lỗi, giữ nguồn/bản cũ.
  Mục thu gọn “Văn bản đã trích xuất” trong Tóm tắt cho xem/chọn chữ đã
  lưu, số ký tự và đọc lại PDF gốc (đồng thời tạo bản tóm tắt mới).
  Xem phần này không gọi AI. “Mở tài liệu” chỉ mở tệp gốc ở ứng dụng ngoài.
  Cờ đầy đủ là tự báo của AI; vẫn cần đối chiếu PDF, không bảo đảm mọi sách.
- CN4: phiên mới bắt đầu với ngữ cảnh rỗng; gửi các lượt hỏi/đáp của phiên
  hiện tại theo thứ tự. Lấy tài liệu làm căn cứ; cho phép dịch, kể lại,
  giải thích và suy luận hợp lý từ nội dung, không đòi có sẵn câu trả lời
  nguyên văn. Theo ngôn ngữ người dùng yêu cầu (mặc định tiếng Việt), kể
  cả yêu cầu hỏi tiếp. Khi xin một câu chuyện bất kỳ, tự chọn chuyện có
  trong phần tài liệu được cung cấp để minh hoạ; không bịa chuyện, nhân
  vật hay trích dẫn. Trả lời phần có căn cứ và chỉ rõ phần thiếu; không
  từ chối toàn bộ vì thiếu một chi tiết. Câu hỏi ngoài tài liệu nhắc phạm vi.
  Mặc định phiên chỉ ở bộ nhớ; bấm Lưu hội thoại mới lưu Supabase.
  Mở lại hội thoại đã lưu tiếp tục được; phiên mới không xóa bản đã lưu.
- CN5: sửa nội dung OCR (không rỗng), lưu vào documents.extracted_text
  bằng API feature rồi mở chi tiết để phân tích bằng nội dung đã sửa.
- CN6: tách Phân tích đề (nêu chủ đề/dạng bài), Gợi ý (mỗi lượt một
  bước, tiếp tục từ lịch sử), Giải thích khái niệm, Lời giải tham khảo
  (chỉ khi bấm yêu cầu) và Hỏi tiếp. Nhãn UI luôn phân biệt các loại.
  Hỏi tiếp dùng đề + các phản hồi trước của phiên; không tự tiết lộ lời
  giải hoàn chỉnh trong chế độ gợi ý.

## Ràng buộc triển khai

- Giữ Expo SDK 57/Expo Go, TypeScript strict và stack AGENTS.md; không
  thêm dependency cho đợt này. Route chỉ ở app/, feature không import chéo.
- Mọi dữ liệu có RLS theo tài khoản; FK con phải thuộc tài liệu/hội thoại
  của chính chủ. Không dùng service-role trong app; secret không vào Git.
- Một transport Gemini; không tự retry; khóa thao tác đang chạy. Giữ dữ
  liệu cũ khi lỗi, lỗi hiển thị được chuẩn hóa, quota không hứa số lượt cố định.
- Model stable phải được xác minh từ Google và API bằng key hiện có trước
  khi đổi; ưu tiên Flash cho tốc độ, điều chỉnh thinking theo tác vụ.
  Google AI Pro không tự thay thế billing/quota của Gemini Developer API.
- Giới hạn hiện tại: tệp 10 MB, 100 tài liệu, 30 chủ đề; câu hỏi 500 ký tự,
  kết quả 20.000 ký tự. Ngữ cảnh dài phải báo giới hạn, không âm thầm bỏ lượt.
- Ngoài phạm vi: social login/admin, chat ngoài tài liệu, RAG/vector DB,
  xuất/chia sẻ kết quả, streaming, cron xử lý AI.

## Tài liệu triển khai và kiểm chứng

`ARCHITECTURE.md`, `DATA-MODEL.md`, `TASKS.md`, `FR-TRACEABILITY.md`,
`TEST-CHECKLIST.md` và `FR-AUDIT.md`. Nhật ký cũ ở DEVLOG là lịch sử,
không phải bằng chứng nghiệm thu theo PDF. Kiểm thử thiết bị chưa chạy
phải giữ ô mở, không ghi đã đạt.
