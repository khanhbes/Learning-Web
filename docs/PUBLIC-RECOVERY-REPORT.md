# Khôi phục kết nối BytePath — 17/10/2026

## Nguyên nhân

Máy khởi động lại làm backend, tunnel và monitor đang chạy dừng theo. Chưa có tác vụ mở lại monitor khi đăng nhập Windows. Hai nhánh khởi động thành công của lệnh `-Recovery` cũng bỏ qua việc khôi phục monitor.

## Thay đổi

- Khôi phục backend, tunnel và cổng HTTPS tại https://hoc.bytepath.workers.dev.
- Cho phép lệnh recovery thành công khôi phục monitor đã được người dùng bật.
- Khóa thao tác tạo monitor, kiểm tra lại trạng thái và xác minh PID để tránh tạo trùng hoặc tác động tới tiến trình khác.
- Thêm bootstrap chỉ hoạt động khi người dùng đã bật chia sẻ và tự phục hồi; giữ nguyên lựa chọn hồ sơ, dữ liệu và thông tin đăng nhập.
- Cài tác vụ `BytePathPublicRecovery` cho người dùng Windows hiện tại: chạy ẩn khi đăng nhập và kiểm tra monitor mỗi năm phút, quyền Limited. Lựa chọn Stop vẫn có hiệu lực sau đăng nhập hoặc lịch kiểm tra.

## Xác minh

- Bộ kiểm thử recovery/tunnel: **10/10 đạt**.
- Fixture Windows cho bootstrap: cờ tắt không khởi động, lần chạy tiếp không tạo monitor trùng, PID không khớp được giữ nguyên, Stop không bị đảo ngược — đạt.
- Fixture Windows cho Stop trong lúc tạo tiến trình/ghi PID: không để tiến trình mồ côi, không tự mở lại — đạt.
- Tác vụ thực tế đã đăng ký và chạy thành công (`LastTaskResult=0`); có trigger đăng nhập, chu kỳ `PT5M`, quyền Limited, chế độ Interactive, lệnh ẩn và đường dẫn tuyệt đối.
- Monitor thật đang hoạt động. Backend, tunnel và link công khai cùng trả HTTP 200; trạng thái runner và AI sẵn sàng.

Các kiểm thử tiến trình dùng dữ liệu giả riêng, không dừng website thật hoặc thay đổi bài làm. Không thay đổi giao diện/học liệu trong bản sửa này. Máy vẫn phải bật, có Internet và đăng nhập Windows; xem [hướng dẫn vận hành](TUNNEL.md).
