# Truy vết FR-01 → FR-45 theo PDF

Nguồn yêu cầu: SPEC.md (đã đối chiếu PDF 2026-10-20).
Trạng thái `có code` không đồng nghĩa đã kiểm tay trên Expo Go.
Bằng chứng thiếu trước sửa được giữ ở FR-AUDIT.md.

| FR | Yêu cầu | File/điểm kiểm soát | Trạng thái kiểm chứng |
|---|---|---|---|
| FR-01 | Hệ thống phải cho phép sinh viên đăng ký tài khoản bằng email và mật khẩu. | `src/features/auth/` | có code; hồi quy thiết bị còn mở |
| FR-02 | Hệ thống phải cho phép sinh viên đăng nhập và đăng xuất. | `src/features/auth/` | có code; hồi quy thiết bị còn mở |
| FR-03 | Hệ thống phải hỗ trợ chức năng quên và đặt lại mật khẩu. | `src/features/auth/` | có code; hồi quy thiết bị còn mở |
| FR-04 | Hệ thống phải cho phép sinh viên cập nhật thông tin cá nhân. | `src/features/profile/` | có code; hồi quy thiết bị còn mở |
| FR-05 | Hệ thống phải quản lý dữ liệu học tập riêng biệt cho từng tài khoản. | `src/features/notes/` | có code; hồi quy thiết bị còn mở |
| FR-06 | Hệ thống phải cho phép sinh viên tải lên tài liệu học tập. | `src/features/documents/` | có code; hồi quy thiết bị còn mở |
| FR-07 | Hệ thống phải hỗ trợ các định dạng tài liệu phổ biến như PDF, DOCX và TXT. | `src/features/documents/` | có code; hồi quy thiết bị còn mở |
| FR-08 | Hệ thống phải hiển thị danh sách các tài liệu mà sinh viên đã tải lên. | `src/features/documents/` | có code; hồi quy thiết bị còn mở |
| FR-09 | Hệ thống phải cho phép sinh viên xem thông tin của tài liệu như tên, ngày tải lên và kích thước. | `src/features/documents/` | có code; hồi quy thiết bị còn mở |
| FR-10 | Hệ thống phải cho phép sinh viên đổi tên tài liệu. | `src/features/documents/` | có code; hồi quy thiết bị còn mở |
| FR-11 | Hệ thống phải cho phép sinh viên xóa tài liệu. | `src/features/documents/` | có code; hồi quy thiết bị còn mở |
| FR-12 | Hệ thống phải cho phép sinh viên tổ chức tài liệu theo môn học/chủ đề. | `src/features/documents/` | có code; hồi quy thiết bị còn mở |
| FR-13 | Hệ thống phải lưu trữ nội dung tài liệu để phục vụ các chức năng AI. | `src/features/documents/` | có code; hồi quy thiết bị còn mở |
| FR-14 | Hệ thống phải cho phép sinh viên yêu cầu AI tóm tắt tài liệu đã tải lên. | `src/features/summary/` | có code; hồi quy thiết bị còn mở |
| FR-15 | Hệ thống phải trích xuất nội dung văn bản từ tài liệu PDF . | `src/features/summary/` | có code; hồi quy thiết bị còn mở |
| FR-16 | Hệ thống phải gửi nội dung phù hợp đến Generative AI API như OpenAI hoặc Gemini để xử lý. | `src/features/summary/` | có code; hồi quy thiết bị còn mở |
| FR-17 | AI phải tạo bản tóm tắt dựa trên nội dung của tài liệu. | `src/features/summary/` | có code; hồi quy thiết bị còn mở |
| FR-18 | Hệ thống phải cho phép người dùng lựa chọn mức độ tóm tắt như ngắn, trung bình hoặc chi tiết. | `src/features/summary/` | có code + unit; remote lưu 2 phiên bản PASS; chờ Expo Go |
| FR-19 | Hệ thống phải có thể tạo bản tóm tắt theo từng chương hoặc từng phần của tài liệu. | `src/features/summary/` | có code + unit; remote lưu 2 phiên bản PASS; chờ Expo Go |
| FR-20 | Hệ thống phải trình bày kết quả tóm tắt theo cấu trúc dễ đọc. | `src/features/summary/` | có code + unit; remote lưu 2 phiên bản PASS; chờ Expo Go |
| FR-21 | Hệ thống phải cho phép sinh viên lưu bản tóm tắt. | `src/features/summary/` | có code + unit; remote lưu 2 phiên bản PASS; chờ Expo Go |
| FR-22 | Hệ thống phải cho phép sinh viên xem lại các bản tóm tắt đã tạo. | `src/features/summary/` | có code + unit; remote lưu 2 phiên bản PASS; chờ Expo Go |
| FR-23 | Hệ thống phải cho phép sinh viên đặt câu hỏi liên quan đến tài liệu đã tải lên. | `src/features/chat/` | có code; hồi quy thiết bị còn mở |
| FR-24 | AI phải sử dụng nội dung tài liệu làm nguồn thông tin để trả lời câu hỏi. | `src/features/chat/` | có code; hồi quy thiết bị còn mở |
| FR-25 | Hệ thống phải ưu tiên trả lời dựa trên nội dung tài liệu thay vì tạo câu trả lời không liên quan. | `src/features/chat/` | có code; hồi quy thiết bị còn mở |
| FR-26 | Hệ thống phải hiển thị câu trả lời của AI trong giao diện hội thoại. | `src/features/chat/` | có code; hồi quy thiết bị còn mở |
| FR-27 | Hệ thống phải duy trì ngữ cảnh của cuộc hội thoại trong phiên học tập. | `src/features/chat/` | thiếu; chờ bổ sung |
| FR-28 | Sinh viên phải có thể đặt câu hỏi tiếp theo dựa trên câu trả lời trước đó. | `src/features/chat/` | thiếu; chờ bổ sung |
| FR-29 | Hệ thống phải cho phép người dùng bắt đầu một cuộc hội thoại mới. | `src/features/chat/` | thiếu; chờ bổ sung |
| FR-30 | Hệ thống phải lưu lịch sử các cuộc hội thoại nếu người dùng lựa chọn lưu. | `src/features/chat/` | thiếu; chờ bổ sung |
| FR-31 | Hệ thống phải cho phép sinh viên chụp ảnh đề bài bằng camera. | `src/features/scan/` | có code; hồi quy thiết bị còn mở |
| FR-32 | Hệ thống phải cho phép sinh viên tải ảnh đề bài từ thiết bị. | `src/features/scan/` | có code; hồi quy thiết bị còn mở |
| FR-33 | Hệ thống phải sử dụng OCR hoặc multimodal AI để nhận dạng nội dung trong hình ảnh. | `src/features/scan/` | có code; hồi quy thiết bị còn mở |
| FR-34 | Hệ thống phải chuyển nội dung nhận dạng thành văn bản có thể xử lý. | `src/features/scan/` | có code; hồi quy thiết bị còn mở |
| FR-35 | Hệ thống phải hiển thị nội dung đã nhận dạng để sinh viên kiểm tra. | `src/features/scan/` | có code; hồi quy thiết bị còn mở |
| FR-36 | Sinh viên phải có thể chỉnh sửa nội dung OCR nếu nhận dạng không chính xác. | `src/features/scan/` | thiếu; chờ bổ sung |
| FR-37 | Hệ thống phải cho phép sinh viên gửi đề bài đã nhận dạng đến AI để phân tích. | `src/features/scan/` | một phần; chờ bổ sung |
| FR-38 | AI phải phân tích nội dung đề bài. | `src/features/solver/` | một phần; chờ bổ sung |
| FR-39 | AI phải xác định loại bài toán hoặc chủ đề liên quan. | `src/features/solver/` | thiếu; chờ bổ sung |
| FR-40 | AI phải cung cấp gợi ý từng bước (step-by-step hints). | `src/features/solver/` | một phần; chờ bổ sung |
| FR-41 | Hệ thống phải cho phép sinh viên yêu cầu gợi ý tiếp theo. | `src/features/solver/` | thiếu; chờ bổ sung |
| FR-42 | AI phải giải thích các khái niệm liên quan đến bài toán. | `src/features/solver/` | thiếu; chờ bổ sung |
| FR-43 | Hệ thống có thể cung cấp lời giải tham khảo sau khi sinh viên yêu cầu. | `src/features/solver/` | thiếu; chờ bổ sung |
| FR-44 | Hệ thống phải phân biệt giữa gợi ý, giải thích và lời giải hoàn chỉnh. | `src/features/solver/` | thiếu; chờ bổ sung |
| FR-45 | Hệ thống phải cho phép sinh viên đặt câu hỏi tiếp theo về lời giải. | `src/features/solver/` | thiếu; chờ bổ sung |
