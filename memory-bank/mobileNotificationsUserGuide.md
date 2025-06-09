# Hướng Dẫn Sử Dụng Thông Báo Mobile - ILoveYou App

## 🎯 Tổng Quan

Hệ thống thông báo mobile của ILoveYou giúp bạn và người yêu không bỏ lỡ những khoảnh khắc quan trọng, ngay cả khi không mở ứng dụng. Với công nghệ PWA hiện đại, bạn sẽ nhận được thông báo realtime về các nhắc nhở, tin nhắn tình yêu và những cột mốc đặc biệt.

## 📱 Cài Đặt Ứng Dụng PWA

### Bước 1: Mở ILoveYou Web App
1. Truy cập **ILoveYou** qua trình duyệt web
2. Đăng nhập hoặc tạo tài khoản mới
3. Tìm biểu tượng **"Cài đặt ứng dụng"** trên màn hình

### Bước 2: Cài Đặt PWA

#### 📱 Trên Điện Thoại Android
1. **Chrome**: Nhấn menu (⋮) → **"Thêm vào màn hình chính"**
2. **Samsung Internet**: Nhấn menu → **"Thêm trang vào"** → **"Màn hình chính"**
3. **Firefox**: Nhấn menu → **"Cài đặt"** → **"Thêm vào màn hình chính"**

```
Lưu ý: Tên ứng dụng sẽ hiện thị là "ILoveYou - Tình Yêu Đôi Lứa"
```

#### 📱 Trên iPhone/iPad
1. **Safari**: Nhấn nút **Chia sẻ** (□↑) → **"Thêm vào Màn hình chính"**
2. **Chrome**: Nhấn menu (⋮) → **"Thêm vào màn hình chính"**

```
Lưu ý: Safari là trình duyệt được khuyến nghị cho iOS
```

#### 💻 Trên Máy Tính
1. **Chrome**: Nhấn biểu tượng **cài đặt** trên thanh địa chỉ
2. **Edge**: Nhấn menu (⋯) → **"Ứng dụng"** → **"Cài đặt trang này làm ứng dụng"**
3. **Firefox**: Sử dụng extension PWA hoặc bookmark

### Bước 3: Xác Nhận Cài Đặt
✅ Biểu tượng ILoveYou xuất hiện trên màn hình chính  
✅ Ứng dụng mở trong chế độ toàn màn hình  
✅ Thanh địa chỉ trình duyệt không hiển thị  

## 🔔 Thiết Lập Thông Báo

### Bước 1: Kích Hoạt Quyền Thông Báo

#### Khi Lần Đầu Cài Đặt
1. Sau khi cài đặt PWA, hệ thống sẽ hiển thị **"Thiết lập thông báo"**
2. Nhấn **"Bật thông báo"** để bắt đầu
3. Trình duyệt sẽ yêu cầu quyền thông báo - chọn **"Cho phép"**

#### Thiết Lập Thủ Công
1. Vào **Trang cá nhân** → **Cài đặt thông báo**
2. Nhấn **"Bật thông báo"** 
3. Chọn **"Cho phép"** khi trình duyệt hỏi quyền

### Bước 2: Cấu Hình Chi Tiết

#### Cài Đặt Cơ Bản
- **🔔 Bật thông báo**: Tổng quan bật/tắt tất cả thông báo
- **🌍 Ngôn ngữ**: Chọn Tiếng Việt hoặc English
- **🔊 Âm thanh**: Bật/tắt âm thanh thông báo
- **📳 Rung**: Bật/tắt rung khi có thông báo

#### Loại Thông Báo
- **📝 Nhắc nhở cá nhân**: Thông báo về nhắc nhở riêng của bạn
- **💕 Nhắc nhở cặp đôi**: Thông báo về nhắc nhở chung với người yêu  
- **💌 Tin nhắn tình yêu**: Thông báo về tin nhắn từ người yêu
- **🕊️ Cột mốc ngày bình yên**: Thông báo khi đạt cột mốc ngày không cãi nhau

#### Giờ Yên Tĩnh
- **⏰ Bật giờ yên tĩnh**: Tự động tắt thông báo trong khung giờ nhất định
- **🌙 Từ giờ**: Mặc định 22:00 (10:00 PM)
- **🌅 Đến giờ**: Mặc định 08:00 (8:00 AM)

### Bước 3: Kiểm Tra Thông Báo

#### Công Cụ Kiểm Tra
1. **Test thông báo cục bộ**: Kiểm tra thông báo trình duyệt cơ bản
2. **Test thông báo FCM**: Kiểm tra thông báo qua server Firebase
3. **Test toàn diện**: Kiểm tra cả hai loại thông báo

#### Trạng Thái Hệ Thống
- **🟢 FCM hoạt động**: Thông báo hoạt động đầy đủ
- **🟡 Cơ bản hoạt động**: Chỉ thông báo trình duyệt
- **🔴 Có vấn đề**: Cần khắc phục sự cố

## ⏰ Tạo Nhắc Nhở Có Thông Báo

### Bước 1: Tạo Nhắc Nhở Mới
1. Vào **Trang Nhắc Nhở** → **"Tạo nhắc nhở mới"**
2. Điền thông tin nhắc nhở:
   - **📝 Tiêu đề**: Tên nhắc nhở
   - **📅 Ngày giờ**: Thời điểm cần nhắc
   - **👥 Loại**: Cá nhân hoặc cặp đôi

### Bước 2: Cấu Hình Thông Báo
- **🔔 Bật thông báo**: Tích chọn để nhận thông báo
- **⏰ Thời gian nhắc trước**: 
  - 0 phút (đúng giờ)
  - 15 phút trước
  - 30 phút trước  
  - 1 giờ trước
  - 1 ngày trước
- **⚡ Mức độ quan trọng**:
  - **Thông thường**: Thông báo tiêu chuẩn
  - **Quan trọng**: Thông báo với âm thanh và yêu cầu tương tác

### Bước 3: Lưu và Xác Nhận
1. Nhấn **"Lưu nhắc nhở"**
2. Xác nhận cài đặt thông báo hiển thị đúng
3. Kiểm tra trạng thái thông báo: **🟢 Sẽ gửi thông báo**

## 📩 Các Loại Thông Báo

### 📝 Nhắc Nhở Cá Nhân
**Ví dụ:**
```
💝 Nhắc nhở tình yêu
Mua hoa cho người yêu vào chiều nay
[✅ Hoàn thành] [⏰ Nhắc lại]
```

**Hành động có thể thực hiện:**
- **✅ Hoàn thành**: Đánh dấu nhắc nhở đã xong
- **⏰ Nhắc lại**: Hoãn thông báo 10 phút
- **👁️ Xem chi tiết**: Mở ứng dụng để xem đầy đủ

### 💕 Nhắc Nhở Cặp Đôi
**Ví dụ:**
```
💕 Nhắc nhở từ người yêu
Hẹn hò xem phim tối nay lúc 7:00 PM
[✅ Xác nhận] [💬 Nhắn tin]
```

**Đặc điểm:**
- Cả hai người đều nhận thông báo
- Khi một người hoàn thành, người kia được thông báo
- Có thể nhắn tin trực tiếp từ thông báo

### 💌 Tin Nhắn Tình Yêu
**Ví dụ:**
```
💌 Tin nhắn từ người yêu
"Anh nhớ em rất nhiều! 💕"
[💬 Trả lời] [❤️ Tim]
```

**Tính năng:**
- Hiển thị nội dung tin nhắn trực tiếp
- Trả lời nhanh từ thông báo
- Gửi react (tim, haha, wow) không cần mở ứng dụng

### 🕊️ Cột Mốc Ngày Bình Yên
**Ví dụ:**
```
🎉 Cột mốc đặc biệt!
Chúc mừng! Hai bạn đã có 30 ngày bình yên liên tiếp
[🎊 Ăn mừng] [📊 Xem thống kê]
```

**Các mốc quan trọng:**
- **7 ngày**: Tuần đầu tiên bình yên
- **30 ngày**: Một tháng hạnh phúc  
- **100 ngày**: Ba tháng không cãi nhau
- **365 ngày**: Một năm tình yêu bình yên

## ⚙️ Quản Lý Cài Đặt Thông Báo

### Truy Cập Cài Đặt
1. **Trang chính** → **Hồ sơ cá nhân**
2. **Cài đặt thông báo** → **Mở rộng**
3. Hoặc: **Menu** → **Cài đặt** → **Thông báo**

### Thay Đổi Ngôn Ngữ
1. Trong **Cài đặt thông báo**
2. **Ngôn ngữ** → Chọn **Tiếng Việt** hoặc **English**
3. Thông báo sẽ ngay lập tức hiển thị bằng ngôn ngữ mới

### Tùy Chỉnh Giờ Yên Tĩnh
1. **Giờ yên tĩnh** → **Bật**
2. Chọn **Từ giờ**: Thời điểm bắt đầu (mặc định 22:00)
3. Chọn **Đến giờ**: Thời điểm kết thúc (mặc định 08:00)
4. **Lưu cài đặt**

### Quản Lý Quyền Trình Duyệt
#### Chrome (Android/Desktop)
1. **Cài đặt** → **Quyền riêng tư và bảo mật** → **Cài đặt trang web**
2. Tìm domain ILoveYou → **Thông báo** → **Cho phép**

#### Safari (iOS)
1. **Cài đặt iOS** → **Safari** → **Thông báo**
2. Tìm ILoveYou → Bật **Cho phép thông báo**

## 🔧 Khắc Phục Sự Cố

### ❌ Không Nhận Được Thông Báo

#### Kiểm Tra Cơ Bản
1. **✅ Quyền thông báo**: Đảm bảo đã cấp quyền cho trình duyệt
2. **✅ Cài đặt ứng dụng**: Kiểm tra thông báo đã bật trong ứng dụng
3. **✅ Kết nối mạng**: Đảm bảo có kết nối internet ổn định
4. **✅ Trình duyệt hỗ trợ**: Sử dụng Chrome, Safari, hoặc Edge

#### Các Bước Khắc Phục
```
Bước 1: Kiểm tra trạng thái thông báo
- Vào Cài đặt thông báo
- Xem trạng thái: Cần hiển thị "🟢 FCM hoạt động"

Bước 2: Test thông báo
- Nhấn "Test thông báo cục bộ"
- Nếu không thấy thông báo → Vấn đề từ trình duyệt
- Nếu thấy thông báo → Tiếp tục bước 3

Bước 3: Test FCM
- Nhấn "Test thông báo FCM"  
- Nếu không thấy → Vấn đề từ server
- Nếu thấy → Vấn đề từ cài đặt nhắc nhở

Bước 4: Kiểm tra nhắc nhở
- Tạo nhắc nhở test sau 1 phút
- Đảm bảo "Bật thông báo" được tích chọn
- Chờ và kiểm tra
```

### ❌ Thông Báo Không Có Âm Thanh

#### Nguyên Nhân Thường Gặp
- **🔇 Thiết bị đang im lặng**: Kiểm tra âm lượng thiết bị
- **⏰ Trong giờ yên tĩnh**: Thông báo tự động im lặng
- **🔊 Cài đặt âm thanh tắt**: Kiểm tra cài đặt trong ứng dụng

#### Khắc Phục
1. **Kiểm tra âm lượng**: Tăng âm lượng thông báo trên thiết bị
2. **Cài đặt ứng dụng**: Bật **"Âm thanh"** trong cài đặt thông báo
3. **Giờ yên tĩnh**: Tạm tắt để test hoặc tạo thông báo ngoài giờ yên tĩnh

### ❌ PWA Không Cài Đặt Được

#### Yêu Cầu Hệ Thống
- **✅ HTTPS**: Trang web phải dùng giao thức an toàn
- **✅ Service Worker**: Phải đăng ký thành công  
- **✅ Manifest**: File manifest hợp lệ
- **✅ Trình duyệt hỗ trợ**: Chrome 67+, Safari 11.3+, Edge 79+

#### Khắc Phục
```
Cho Android:
1. Xóa cache trình duyệt
2. Khởi động lại trình duyệt
3. Thử lại quy trình cài đặt
4. Nếu vẫn lỗi, thử trình duyệt khác

Cho iOS:
1. Phải sử dụng Safari (khuyến nghị)
2. Đảm bảo iOS 11.3 trở lên
3. Xóa bookmark cũ nếu có
4. Thử lại với Safari
```

### ❌ Thông Báo Bị Trùng Lặp

#### Nguyên Nhân
- Mở ứng dụng trên nhiều tab/cửa sổ
- Service Worker đăng ký nhiều lần  
- Cache trình duyệt bị lỗi

#### Khắc Phục
1. **Đóng tất cả tab** ILoveYou
2. **Xóa cache**: Cài đặt trình duyệt → Xóa dữ liệu trang web
3. **Khởi động lại** trình duyệt
4. **Mở lại** ứng dụng trên 1 tab duy nhất

## 🛡️ Bảo Mật & Quyền Riêng Tư

### Thông Tin Thu Thập
✅ **FCM Token**: Chỉ để gửi thông báo, không chứa thông tin cá nhân  
✅ **Cài đặt thông báo**: Lưu tại Firebase, được mã hóa  
✅ **Thời gian online**: Để tối ưu hóa thời điểm gửi thông báo  

### Thông Tin Không Thu Thập
❌ **Vị trí**: Ứng dụng không theo dõi GPS  
❌ **Danh bạ**: Không truy cập danh sách liên lạc  
❌ **Camera/Mic**: Không thu âm hoặc chụp ảnh tự động  
❌ **Dữ liệu thiết bị**: Không thu thập thông tin phần cứng

### Quyền Riêng Tư
- **🔐 Mã hóa**: Tất cả dữ liệu được mã hóa khi truyền tải
- **🏠 Lưu trữ local**: Cài đặt được lưu tại thiết bị của bạn
- **👥 Chia sẻ**: Chỉ người yêu của bạn thấy thông báo cặp đôi
- **🗑️ Xóa dữ liệu**: Có thể xóa tài khoản và toàn bộ dữ liệu bất cứ lúc nào

## 📞 Hỗ Trợ & Liên Hệ

### Tự Khắc Phục
1. **📖 Đọc lại hướng dẫn**: Hầu hết vấn đề đều có trong hướng dẫn này
2. **🔄 Khởi động lại**: Thử tắt/mở lại ứng dụng và trình duyệt
3. **🧪 Test thông báo**: Sử dụng công cụ test tích hợp
4. **📱 Thử thiết bị khác**: Kiểm tra xem vấn đề có phải từ thiết bị

### Liên Hệ Hỗ Trợ
- **📧 Email hỗ trợ**: support@iloveyou.app
- **💬 Chat trực tuyến**: Trong ứng dụng → Menu → Hỗ trợ
- **📱 Hotline**: 1900-xxx-xxx (8:00 - 22:00)
- **🌐 FAQ**: iloveyou.app/faq

### Thông Tin Cần Cung Cấp Khi Liên Hệ
```
✅ Thiết bị: iPhone 13 / Samsung Galaxy S22 / Desktop
✅ Trình duyệt: Chrome 115 / Safari 16 / Edge 110
✅ Lỗi gặp phải: Mô tả chi tiết vấn đề
✅ Bước đã thử: Các cách khắc phục đã thực hiện
✅ Screenshot: Chụp màn hình lỗi (nếu có)
```

---

## 🎊 Chúc Mừng!

Bạn đã thiết lập thành công hệ thống thông báo ILoveYou! Giờ đây bạn và người yêu sẽ không bao giờ bỏ lỡ những khoảnh khắc quan trọng nữa. 

**Hãy tận hưởng những thông báo tình yêu ngọt ngào và những cột mốc đặc biệt trong mối quan hệ của bạn!** 💕

---

*Hướng dẫn sử dụng Version: 1.0*  
*Cập nhật lần cuối: 9 tháng 6, 2025*  
*Tương thích với: iOS 11.3+, Android 8.0+, Desktop browsers*