# Đối chiếu đề PDF — 2026-10-20

Nguồn: `../AI Learning Assistant-de tai.pdf`, đọc toàn bộ 3 trang và kiểm tra ảnh render.
Mốc kiểm tra: `e417031` trên main. Bảng này giữ kết quả **trước khi sửa**.

Phát hiện: tài liệu nội bộ đã gán lại nhiều FR cho quota/RLS/retry và
đánh dấu hoàn thành, trong khi đề yêu cầu độ dài/chương, hội thoại có
ngữ cảnh, sửa OCR và các chế độ giải bài. SPEC và traceability được sửa
theo PDF; các kiểm soát kỹ thuật vẫn giữ nhưng không thay thế FR.

| FR | Yêu cầu PDF | Trước sửa | Đối chiếu code |
|---|---|---|---|
| FR-01 | Hệ thống phải cho phép sinh viên đăng ký tài khoản bằng email và mật khẩu. | có code | Đã có luồng tại feature auth, cần hồi quy theo checklist. |
| FR-02 | Hệ thống phải cho phép sinh viên đăng nhập và đăng xuất. | có code | Đã có luồng tại feature auth, cần hồi quy theo checklist. |
| FR-03 | Hệ thống phải hỗ trợ chức năng quên và đặt lại mật khẩu. | có code | Đã có luồng tại feature auth, cần hồi quy theo checklist. |
| FR-04 | Hệ thống phải cho phép sinh viên cập nhật thông tin cá nhân. | có code | Đã có luồng tại feature profile, cần hồi quy theo checklist. |
| FR-05 | Hệ thống phải quản lý dữ liệu học tập riêng biệt cho từng tài khoản. | có code | Đã có luồng tại feature notes, cần hồi quy theo checklist. |
| FR-06 | Hệ thống phải cho phép sinh viên tải lên tài liệu học tập. | có code | Đã có luồng tại feature documents, cần hồi quy theo checklist. |
| FR-07 | Hệ thống phải hỗ trợ các định dạng tài liệu phổ biến như PDF, DOCX và TXT. | có code | Đã có luồng tại feature documents, cần hồi quy theo checklist. |
| FR-08 | Hệ thống phải hiển thị danh sách các tài liệu mà sinh viên đã tải lên. | có code | Đã có luồng tại feature documents, cần hồi quy theo checklist. |
| FR-09 | Hệ thống phải cho phép sinh viên xem thông tin của tài liệu như tên, ngày tải lên và kích thước. | có code | Đã có luồng tại feature documents, cần hồi quy theo checklist. |
| FR-10 | Hệ thống phải cho phép sinh viên đổi tên tài liệu. | có code | Đã có luồng tại feature documents, cần hồi quy theo checklist. |
| FR-11 | Hệ thống phải cho phép sinh viên xóa tài liệu. | có code | Đã có luồng tại feature documents, cần hồi quy theo checklist. |
| FR-12 | Hệ thống phải cho phép sinh viên tổ chức tài liệu theo môn học/chủ đề. | có code | Đã có luồng tại feature documents, cần hồi quy theo checklist. |
| FR-13 | Hệ thống phải lưu trữ nội dung tài liệu để phục vụ các chức năng AI. | có code | Đã có luồng tại feature documents, cần hồi quy theo checklist. |
| FR-14 | Hệ thống phải cho phép sinh viên yêu cầu AI tóm tắt tài liệu đã tải lên. | có code | Đã có luồng tại feature summary, cần hồi quy theo checklist. |
| FR-15 | Hệ thống phải trích xuất nội dung văn bản từ tài liệu PDF . | có code | Đã có luồng tại feature summary, cần hồi quy theo checklist. |
| FR-16 | Hệ thống phải gửi nội dung phù hợp đến Generative AI API như OpenAI hoặc Gemini để xử lý. | có code | Đã có luồng tại feature summary, cần hồi quy theo checklist. |
| FR-17 | AI phải tạo bản tóm tắt dựa trên nội dung của tài liệu. | có code | Đã có luồng tại feature summary, cần hồi quy theo checklist. |
| FR-18 | Hệ thống phải cho phép người dùng lựa chọn mức độ tóm tắt như ngắn, trung bình hoặc chi tiết. | thiếu | Không có bộ chọn độ dài. |
| FR-19 | Hệ thống phải có thể tạo bản tóm tắt theo từng chương hoặc từng phần của tài liệu. | thiếu | Prompt cố định, không chọn chương/phần. |
| FR-20 | Hệ thống phải trình bày kết quả tóm tắt theo cấu trúc dễ đọc. | một phần | Chỉ hiện Text thuần; chưa có cấu trúc tiêu đề. |
| FR-21 | Hệ thống phải cho phép sinh viên lưu bản tóm tắt. | có code | Đã có luồng tại feature summary, cần hồi quy theo checklist. |
| FR-22 | Hệ thống phải cho phép sinh viên xem lại các bản tóm tắt đã tạo. | một phần | Chỉ giữ một bản gần nhất/tài liệu. |
| FR-23 | Hệ thống phải cho phép sinh viên đặt câu hỏi liên quan đến tài liệu đã tải lên. | có code | Đã có luồng tại feature chat, cần hồi quy theo checklist. |
| FR-24 | AI phải sử dụng nội dung tài liệu làm nguồn thông tin để trả lời câu hỏi. | có code | Đã có luồng tại feature chat, cần hồi quy theo checklist. |
| FR-25 | Hệ thống phải ưu tiên trả lời dựa trên nội dung tài liệu thay vì tạo câu trả lời không liên quan. | có code | Đã có luồng tại feature chat, cần hồi quy theo checklist. |
| FR-26 | Hệ thống phải hiển thị câu trả lời của AI trong giao diện hội thoại. | có code | Đã có luồng tại feature chat, cần hồi quy theo checklist. |
| FR-27 | Hệ thống phải duy trì ngữ cảnh của cuộc hội thoại trong phiên học tập. | thiếu | Request chỉ có tài liệu + câu hỏi hiện tại. |
| FR-28 | Sinh viên phải có thể đặt câu hỏi tiếp theo dựa trên câu trả lời trước đó. | thiếu | Không gửi các lượt trước cho AI. |
| FR-29 | Hệ thống phải cho phép người dùng bắt đầu một cuộc hội thoại mới. | thiếu | Không có phiên mới/xóa ngữ cảnh. |
| FR-30 | Hệ thống phải lưu lịch sử các cuộc hội thoại nếu người dùng lựa chọn lưu. | thiếu | Mọi câu hỏi bị lưu bắt buộc, không lựa chọn. |
| FR-31 | Hệ thống phải cho phép sinh viên chụp ảnh đề bài bằng camera. | có code | Đã có luồng tại feature scan, cần hồi quy theo checklist. |
| FR-32 | Hệ thống phải cho phép sinh viên tải ảnh đề bài từ thiết bị. | có code | Đã có luồng tại feature scan, cần hồi quy theo checklist. |
| FR-33 | Hệ thống phải sử dụng OCR hoặc multimodal AI để nhận dạng nội dung trong hình ảnh. | có code | Đã có luồng tại feature scan, cần hồi quy theo checklist. |
| FR-34 | Hệ thống phải chuyển nội dung nhận dạng thành văn bản có thể xử lý. | có code | Đã có luồng tại feature scan, cần hồi quy theo checklist. |
| FR-35 | Hệ thống phải hiển thị nội dung đã nhận dạng để sinh viên kiểm tra. | có code | Đã có luồng tại feature scan, cần hồi quy theo checklist. |
| FR-36 | Sinh viên phải có thể chỉnh sửa nội dung OCR nếu nhận dạng không chính xác. | thiếu | OCR chỉ có Text đọc. |
| FR-37 | Hệ thống phải cho phép sinh viên gửi đề bài đã nhận dạng đến AI để phân tích. | một phần | Chưa có nút gửi bản OCR đã kiểm tra sang phân tích. |
| FR-38 | AI phải phân tích nội dung đề bài. | một phần | Prompt gợi ý chung, chưa tách phân tích. |
| FR-39 | AI phải xác định loại bài toán hoặc chủ đề liên quan. | thiếu | Không yêu cầu xác định loại bài/chủ đề. |
| FR-40 | AI phải cung cấp gợi ý từng bước (step-by-step hints). | một phần | Một lần sinh toàn bộ gợi ý. |
| FR-41 | Hệ thống phải cho phép sinh viên yêu cầu gợi ý tiếp theo. | thiếu | Gợi ý lại không phải gợi ý tiếp. |
| FR-42 | AI phải giải thích các khái niệm liên quan đến bài toán. | thiếu | Không có chế độ giải thích. |
| FR-43 | Hệ thống có thể cung cấp lời giải tham khảo sau khi sinh viên yêu cầu. | thiếu | Không có yêu cầu lời giải tham khảo riêng. |
| FR-44 | Hệ thống phải phân biệt giữa gợi ý, giải thích và lời giải hoàn chỉnh. | thiếu | Chỉ một chuỗi solution_text chung. |
| FR-45 | Hệ thống phải cho phép sinh viên đặt câu hỏi tiếp theo về lời giải. | thiếu | Không có câu hỏi tiếp về lời giải. |

Kết quả trước sửa: 27 FR có code, 5 FR một phần, 13 FR thiếu.
Không tính bảo mật/độ đúng AI đã được chứng minh chỉ bằng việc tồn tại file.
