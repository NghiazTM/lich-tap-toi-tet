# Nhạc không lời tạo sẵn

Ba beat điện tử được tổng hợp bằng mã nguồn của project, không dùng bản ghi, sample hoặc giai điệu từ bài hát bên ngoài. Mỗi beat có trống kick, snare, hi-hat, bass, hợp âm và giai điệu ngắn. Chúng là nhạc nền lặp để luyện tập, không phải nhạc thương mại hay khuyến nghị nhịp tim.

| Tệp | Tên trong ứng dụng | Tempo | Thời lượng |
| --- | --- | --- | --- |
| `vao-nhip-100.wav` | Vào nhịp | 100 BPM | 57,60 giây |
| `giu-nhip-120.wav` | Giữ nhịp | 120 BPM | 48,00 giây |
| `but-toc-140.wav` | Bứt tốc | 140 BPM | khoảng 41,14 giây |

Định dạng PCM WAV, mono, 22.050 Hz, 16 bit. Mức đỉnh chuẩn hóa dưới toàn thang để tránh cắt đỉnh. Mở bằng nút Phát; trình duyệt không tự phát âm thanh sau khi tải trang.

Tái tạo các tệp từ thư mục project:

```sh
node designs/workout-dashboard/scripts/generate-beats.mjs
```

Người dùng có thể thêm tệp nhạc của mình. Các tệp này được giữ trên trình duyệt của thiết bị qua IndexedDB khi được hỗ trợ, không gửi lên máy chủ. Nếu dung lượng/quyền lưu không cho phép, ứng dụng giữ tệp để phát trong phiên đang mở và hiển thị thông báo.
