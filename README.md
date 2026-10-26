# Lịch tập tới Tết — Nhịp Tập

Website: **https://nghiaztm.github.io/lich-tap-toi-tet/** · [Mã nguồn GitHub](https://github.com/NghiazTM/lich-tap-toi-tet).

Bảng theo dõi tập luyện bằng tiếng Việt: lịch tuần, biểu đồ tiến độ, ảnh minh họa, đồng hồ luyện tập và trình phát nhạc. HTML, CSS và JavaScript thuần; không cần cài thư viện hay tạo tài khoản.

Giao diện dùng tông đỏ–đen, chữ tiếng Việt rõ ràng và bố cục thích ứng với máy tính, máy tính bảng và điện thoại. Các chức năng và dữ liệu cá nhân được giữ nguyên khi thay đổi giao diện.

## Chạy ứng dụng

Cần Node.js 18 trở lên. Trong thư mục dự án:

```sh
npm start
```

Mở **http://localhost:4173**. Muốn dùng cổng khác, đặt biến môi trường `PORT` trước khi chạy.

Cũng có thể mở trực tiếp `designs/workout-dashboard/index.html`. Nên dùng máy chủ cục bộ để trình duyệt lưu dữ liệu ổn định theo cùng một địa chỉ.

### Mở trên điện thoại cùng Wi-Fi

Dừng máy chủ cũ bằng `Ctrl+C` nếu đang chạy, rồi chạy:

```sh
npm run start:lan
```

Cửa sổ dòng lệnh sẽ hiển thị **Điện thoại cùng Wi-Fi: http://...:4173**. Mở địa chỉ đó trên điện thoại, giữ máy tính và điện thoại cùng mạng. Máy tính cần tiếp tục chạy máy chủ. Nếu Windows hỏi quyền mạng cho Node.js, cho phép trên mạng riêng bạn đang sử dụng.

Giao diện tự sắp xếp cho máy tính, máy tính bảng và điện thoại. Dữ liệu tập và nhạc được lưu riêng trên từng trình duyệt, không tự đồng bộ giữa các thiết bị hoặc giữa địa chỉ localhost và địa chỉ Wi-Fi.

### Đưa lên GitHub Pages miễn phí

Ứng dụng là web tĩnh, không cần chạy `server.mjs` trên hosting. Workflow `.github/workflows/deploy-pages.yml` triển khai đúng thư mục `designs/workout-dashboard`, tự cập nhật khi đẩy code lên nhánh `main`.

1. Tạo repository **Public** trên GitHub (GitHub Free hỗ trợ Pages với repo công khai). Nếu đẩy dự án từ máy, nên tạo repo trống, không thêm README hay `.gitignore` tự động.
2. Đưa toàn bộ dự án, gồm thư mục `.github`, lên nhánh `main`. Nếu dùng terminal lần đầu trong thư mục dự án:

   ```sh
   git init -b main
   git add .
   git commit -m "Add Nhip Tap workout dashboard"
   git remote add origin https://github.com/TEN_TAI_KHOAN/TEN_REPO.git
   git push -u origin main
   ```

   Thay tên tài khoản/repo bằng địa chỉ thật. Git có thể yêu cầu đăng nhập GitHub qua trình duyệt.
3. Trong repository, mở **Settings → Pages → Build and deployment → Source**, chọn **GitHub Actions**.
4. Mở **Actions → Deploy Nhịp Tập to GitHub Pages → Run workflow** nếu lần chạy trước chưa thành công do Pages chưa bật.
5. Khi workflow thành công, mở URL trong deployment `github-pages`, thường là `https://TEN_TAI_KHOAN.github.io/TEN_REPO/`.

Trang được phục vụ qua HTTPS mà không cần bật máy tính; mở được bằng Wi-Fi hoặc dữ liệu di động. Mỗi lần sửa code, commit và push lên `main` để cập nhật. Không cần trả tiền tên miền khi dùng địa chỉ `github.io`.

Lưu ý: tiến độ và tệp nhạc vẫn được lưu riêng trong từng trình duyệt. Đổi từ địa chỉ cục bộ sang Pages sẽ có vùng lưu trữ mới, không tự chuyển dữ liệu hoặc đồng bộ điện thoại với máy tính. Hosting luôn truy cập được không có nghĩa âm báo tiếp tục chạy khi bạn đóng trình duyệt.

Tham khảo: [GitHub Pages và quy trình triển khai](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Bấm giờ, hẹn giờ và tập theo chu kỳ

Mở **Đồng hồ và âm nhạc** trong thanh điều hướng, hoặc chọn bài rồi bấm **Mở đồng hồ** trong danh sách bài tập.

- **Bấm giờ:** bắt đầu, tạm dừng, tiếp tục, đặt lại và ghi vòng; lưu tối đa 20 vòng gần nhất.
- **Hẹn giờ:** nhập số phút/giây, chọn mốc nhanh, hoặc hẹn ngày và giờ cụ thể theo **UTC+7 — Việt Nam/Bangkok**. Hẹn giờ cụ thể có nút hủy để giữ rõ mốc hẹn.
- **Tập và nghỉ:** chỉnh thời gian tập, nghỉ và số hiệp; tự chuyển pha, có thể bỏ qua pha. Đồng hồ kết thúc ngay sau hiệp tập cuối. Có thể áp dụng thông số trực tiếp từ bài đang xem. Với bài chùng chân, chạy một lượt cho từng bên theo ghi chú.

Chỉ một chế độ đồng hồ chạy tại một thời điểm. Tạm dừng trước khi đổi chế độ; thời gian và vòng đã ghi của chế độ khác vẫn được giữ. Đổi ngày, đánh dấu bài hoặc mở ảnh không đặt lại đồng hồ. Hết giờ không tự đánh dấu bài đã hoàn thành.

Đồng hồ lưu riêng theo mốc thời gian để khôi phục khi tải lại và tính lại khi quay về thẻ trình duyệt. Giữ trang mở để nhận âm báo; trình duyệt có thể hạn chế âm thanh hoặc tạm ngưng thực thi khi khóa màn hình. [Chính sách phát âm thanh](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play), [hành vi của thẻ chạy nền](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

Tùy chọn **Giữ màn hình sáng** chỉ bật khi trình duyệt hỗ trợ và địa chỉ là HTTPS hoặc localhost; tính năng này không khả dụng qua địa chỉ Wi-Fi HTTP thông thường. [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).

## Nhạc tập luyện

### Danh sách YouTube được yêu cầu

Ứng dụng có thêm danh sách từ [liên kết YouTube người dùng gửi](https://www.youtube.com/watch?v=BEg93DzKBjw&list=RDBEg93DzKBjw&start_radio=1), bắt đầu bằng **“HAI CHÚNG TA KHÔNG CÓ NGÀY CHIA TAY | DJ BIN BIN”** của kênh **DJ BIN BIN**. Đây là YouTube Mix; nội dung gợi ý có thể khác giữa các tài khoản hoặc thời điểm. Liên kết gốc được giữ để mở toàn bộ Mix trên YouTube.

Nhạc YouTube được phát bằng trình phát nhúng, không tải xuống hoặc chuyển thành tệp âm thanh cục bộ. Cần kết nối mạng; có nút mở trực tiếp trên YouTube khi nội dung không phát được trong khung nhúng. [Tài liệu trình phát nhúng YouTube](https://developers.google.com/youtube/iframe_api_reference).

### Nhạc trên thiết bị

Có sẵn ba bản nhạc không lời được tổng hợp riêng cho ứng dụng: **Vào nhịp — 100 BPM**, **Giữ nhịp — 120 BPM**, **Bứt tốc — 140 BPM**. Các bản nhạc có sẵn được tạo cục bộ. [Nguồn và cách tạo nhạc](designs/workout-dashboard/assets/audio/README.md).

Bấm **Thêm nhạc từ thiết bị** để chọn nhiều tệp MP3, WAV, M4A, OGG hoặc định dạng trình duyệt đọc được. Có thể kéo thả tệp vào khung nhạc trên máy tính. Tệp được phát ngay và lưu bằng IndexedDB khi trình duyệt cho phép; nếu không lưu được, ứng dụng báo rõ rằng tệp chỉ dùng trong phiên hiện tại. Nhạc không được tải lên máy chủ.

Trình phát có phát hoặc tạm dừng, đổi bài, tua, âm lượng, tắt tiếng, ngẫu nhiên, lặp một bài hoặc cả danh sách và xóa bài tự thêm. Nhạc không tự phát sau khi tải lại trang. Thanh điều khiển gọn xuất hiện khi đang dùng đồng hồ hoặc phát nhạc, cho phép điều khiển cả hai khi cuộn xem bài tập.

## Nguồn bài tập

Video người dùng cung cấp: [Prime Form — 6 tư thế giữ tĩnh tại nhà, không cần tạ](https://web.facebook.com/reel/3500844863420320/). [Liên kết chia sẻ ban đầu](https://web.facebook.com/share/v/1FKBnoTE8c/).

Đây là các động tác giữ tĩnh tại nhà, không phải giáo án tập máy/tạ tại phòng gym. Đã đối chiếu tên động tác và khung lịch tuần xuất hiện ở khoảng **12:40** trong video:

| Ngày | Nội dung video |
| --- | --- |
| Thứ 2, Thứ 6 | Đáy chống đẩy, chùng chân sâu, L-sit; 4 hiệp × 20–30 giây; mức gắng sức 7/10 |
| Thứ 3 | Nghỉ hoặc giữ co khăn tùy chọn |
| Thứ 4 | Đẩy tường, kéo khăn đứng: 5 hiệp × 3–5 giây; tiếp đến thân rỗng và trồng chuối dựa tường |
| Thứ 5, Chủ nhật | Nghỉ |
| Thứ 7 | Đi dạo hoặc thể thao |

Hai bài đẩy tường và kéo khăn là các biến thể của nhóm “Vượt lực cản”. Video mô tả mức hết sức cho phần này; có thể chỉnh thông số theo khả năng. Thời gian nghỉ, thông số mặc định bổ sung cho thân rỗng/trồng chuối, gợi ý ăn uống và công cụ theo dõi là phần ứng dụng bổ sung, có ghi chú riêng. Video giới thiệu khoảng 15 phút/buổi; đây là ước lượng của tác giả, không phải thời gian đo thực tế.

## Ảnh minh họa và hướng dẫn tư thế

Mỗi bài có ảnh ngay trong danh sách. Bấm ảnh để xem lớn, hướng dẫn ngắn và thông số đang dùng; nút **Xem tất cả tư thế** mở thư viện 6 nhóm tư thế với 7 hình, gồm hai biến thể vượt lực cản. Thư viện vẫn xem được trong ngày nghỉ. Bài tự thêm có tên chưa được nhận diện sẽ hiện “Chưa có ảnh”.

Sáu ảnh trích trực tiếp từ video Prime Form, giữ nguyên tệp gốc và hiển thị vùng minh họa bằng CSS. Riêng ảnh đẩy tường được tạo bổ sung bằng công cụ ImageGen tích hợp, có ghi chú riêng. Ảnh lưu cục bộ trong `designs/workout-dashboard/assets/exercises/`; [nguồn và thông tin ảnh](designs/workout-dashboard/assets/exercises/README.md), [câu lệnh tạo ảnh đẩy tường](designs/workout-dashboard/assets/exercises/wall-press-prompt.md).

Thông tin vận động và ăn uống cân bằng tham khảo thêm từ [WHO](https://www.who.int/initiatives/behealthy/physical-activity/) và [NHS Eatwell Guide](https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/). Các nguồn này không xác nhận một giáo án riêng hay một mức calo cá nhân.

## Dữ liệu và cấu trúc

Dữ liệu tập, đồng hồ và tùy chọn nhạc được lưu bằng các khóa `localStorage` riêng; tệp nhạc tự thêm được lưu trong IndexedDB của trình duyệt đang dùng. Đổi trình duyệt, đổi địa chỉ truy cập hoặc xóa dữ liệu trang sẽ không giữ chung tiến độ. Không có máy chủ nhận dữ liệu tập luyện hoặc tệp nhạc.

- `designs/workout-dashboard/index.html`: giao diện.
- `designs/workout-dashboard/styles.css`: giao diện máy tính, điện thoại và bản in.
- `designs/workout-dashboard/app.js`: lịch, biểu đồ, chỉnh sửa và lưu tiến độ.
- `designs/workout-dashboard/training-tools.js`, `tools.css`: đồng hồ, âm báo, chu kỳ tập và nghỉ, thanh điều khiển gọn.
- `designs/workout-dashboard/music.js`, `music.css`: trình phát và lưu danh sách nhạc.
- `designs/workout-dashboard/youtube-music.js`: trình phát YouTube và 25 bài ghi nhận từ Mix người dùng gửi.
- `designs/workout-dashboard/assets/exercises/`: ảnh minh họa động tác và thông tin nguồn.
- `designs/workout-dashboard/assets/audio/`: ba bản nhạc không lời và thông tin nguồn.
- `designs/workout-dashboard/scripts/generate-beats.mjs`: mã tạo các bản nhạc cục bộ.
- `server.mjs`: máy chủ cục bộ/Wi-Fi, hỗ trợ MIME âm thanh và HTTP byte ranges để tua nhạc.

Phông chữ trực tuyến có phông chữ hệ thống dự phòng; phần cốt lõi của ứng dụng hoạt động không cần gọi dịch vụ bên ngoài. Liên kết xem video cần kết nối mạng và quyền truy cập Facebook phù hợp.

## Đã kiểm tra

Đã kiểm tra giao diện máy tính, máy tính bảng và điện thoại; lưu tiến độ qua lần tải lại; tách dữ liệu giữa các tuần; chỉnh sửa, thêm và xóa bài; bật ngày tập; đồng hồ giữ tư thế, nghỉ và tạm dừng; giữ nguyên lịch sử sau khi sửa giáo án. Biểu đồ cập nhật từ dữ liệu đánh dấu thực tế, không có lịch sử tập giả.

Phiên bản đồng hồ và nhạc đã kiểm tra bấm giờ, ghi vòng, khôi phục qua tải lại; đếm ngược và hẹn giờ cụ thể theo UTC+7; từ chối mốc đã qua; chu kỳ tập và nghỉ tự động, không nghỉ sau hiệp cuối và trường hợp nghỉ 0 giây. Đã kiểm tra phát WAV thực tế, tua, lặp, đổi bài, thêm tệp nhạc vào trình duyệt, giữ tệp sau khi tải lại, xóa tệp và thanh điều khiển chung. Cách tính theo mốc thời gian được kiểm tra bằng việc mô phỏng khoảng thời gian thẻ trình duyệt bị gián đoạn.

Ảnh giao diện ban đầu nằm trong `artifacts/desktop.png` và `artifacts/mobile.png`. Ảnh phiên bản có minh họa: `artifacts/desktop-images.png`, `artifacts/mobile-images.png`, `artifacts/gallery-images.png` và `artifacts/guide-images.png`.

Ảnh phiên bản đồng hồ và nhạc: `artifacts/desktop-tools.png`, `artifacts/mobile-tools.png` và `artifacts/landscape-tools.png`.

### Giao diện nghe nhạc dạng video

Khu vực YouTube Mix dùng khung video lớn, nền đen, tên bài và các nút tròn phía dưới. Nút mở rộng tăng diện tích video; danh sách chuyển xuống dưới trên điện thoại. Đồng hồ và mục **Nghe từ thiết bị** vẫn dùng độc lập; mục nhạc thiết bị có thể thu gọn. Ảnh bìa được lưu cùng ứng dụng, khung YouTube cần Internet để phát. Nút toàn màn hình nằm trong trình phát YouTube gốc.


### Giao diện ứng dụng thống nhất

Bốn mục **Buổi tập · Lịch tuần · Tiến độ · Âm nhạc** dùng chung một hệ bố cục, màu đỏ đen và thành phần điều khiển. Chọn ngày trong lịch để mở đúng buổi tập; mở đồng hồ từ bài đang chọn để áp dụng thời gian tập/nghỉ. Mục Tiến độ hiển thị kết quả tuần cùng lượng nước của ngày đang chọn. Điện thoại có thanh điều hướng cố định bên dưới, lịch dạng danh sách và vùng chạm lớn.

`navigation.js` quản lý điều hướng theo URL, hỗ trợ quay lại và các liên kết cũ. Chuyển mục chỉ ẩn phần giao diện, không tạo lại hay dừng đồng hồ/nhạc. Hiệu ứng chuyển mục, phản hồi nút và tiến độ tôn trọng cài đặt giảm chuyển động. Dữ liệu được giữ nguyên theo các khóa lưu trữ cũ.

Giao diện chính nằm trong `styles.css`, `guide-styles.css`, `tools.css` và `music.css`; đã bỏ lớp ghi đè `pro.css` cũ. Ảnh xem trước: `artifacts/unified-desktop.png`, `artifacts/unified-mobile.png`, `artifacts/unified-schedule.png`, `artifacts/unified-timer-mobile.png` và `artifacts/unified-music.png`.
