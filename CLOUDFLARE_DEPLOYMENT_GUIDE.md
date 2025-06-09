# 🚀 Hướng dẫn Deploy lên Cloudflare Pages

## Phương pháp 1: Deploy thông qua Cloudflare Dashboard (Khuyến nghị)

### Bước 1: Chuẩn bị
1. Tạo tài khoản [Cloudflare](https://cloudflare.com) (miễn phí)
2. Push code lên GitHub/GitLab repository

### Bước 2: Tạo Cloudflare Pages Project
1. Đăng nhập vào Cloudflare Dashboard
2. Vào **Pages** > **Create a project**
3. Chọn **Connect to Git**
4. Chọn repository của bạn
5. Cấu hình build settings:
   - **Framework preset**: Vite
   - **Build command**: `cd web && npm run build`
   - **Build output directory**: `web/dist`
   - **Root directory**: `/` (để trống)

### Bước 3: Cấu hình Environment Variables
Trong Cloudflare Pages Dashboard:
1. Vào **Settings** > **Environment variables**
2. Thêm các biến sau:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com  
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_APP_ENV=production
```

### Bước 4: Deploy
- Mỗi khi push code lên branch chính, Cloudflare sẽ tự động build và deploy
- URL sẽ có dạng: `https://your-project-name.pages.dev`

## Phương pháp 2: Deploy thông qua Wrangler CLI

### Bước 1: Cài đặt Wrangler
```bash
npm install -g wrangler
```

### Bước 2: Đăng nhập Cloudflare
```bash
wrangler login
```

### Bước 3: Cấu hình wrangler.toml
Sửa file `wrangler.toml` và thay thế `YOUR_ACCOUNT_ID` bằng Account ID của bạn:
```bash
wrangler whoami  # để lấy Account ID
```

### Bước 4: Deploy
```bash
# Từ thư mục web
cd web
npm run deploy:cloudflare
```

## 🔧 Troubleshooting

### Lỗi Firebase không kết nối được
- Kiểm tra Firebase config trong Cloudflare environment variables
- Đảm bảo domain Cloudflare được thêm vào Firebase Authentication settings

### Lỗi 404 khi refresh trang
- File `_redirects` đã được tạo để handle React Router
- Nếu vẫn lỗi, kiểm tra file có trong build output không

### Lỗi build
- Kiểm tra Node.js version (khuyến nghị >= 18)
- Xóa node_modules và npm install lại
- Kiểm tra các dependencies trong package.json

## 📊 Performance Optimization

### Đã tối ưu:
- ✅ Code splitting với Vite
- ✅ PWA với Service Worker
- ✅ Image optimization
- ✅ Gzip compression (Cloudflare tự động)
- ✅ CDN global (Cloudflare network)

### Custom Domain
1. Trong Cloudflare Pages Dashboard
2. Vào **Custom domains**
3. Thêm domain của bạn
4. Cấu hình DNS records

## 🔄 CI/CD Automation

### GitHub Actions (Tùy chọn)
Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: cd web && npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: iloveyou-web
          directory: web/dist
```

## 📈 Monitoring

### Cloudflare Analytics
- Tự động có analytics trong Cloudflare Dashboard
- Theo dõi performance, traffic, errors

### Web Vitals
- App đã tích hợp Web Vitals tracking
- Data sẽ hiển thị trong browser DevTools

## 🌍 Multi-language Support
- App hỗ trợ i18n
- Cloudflare Pages tự động serve từ CDN gần nhất với users

---

**Lưu ý:** Cloudflare Pages miễn phí cho:
- ✅ Unlimited sites
- ✅ Unlimited requests  
- ✅ 500 builds/month
- ✅ Global CDN
- ✅ DDoS protection 