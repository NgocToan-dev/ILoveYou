# Dự án ILoveYou - Context cập nhật

## Kiến trúc dự án hiện tại

**Thay đổi quan trọng (06/11/2025):**
- ❌ **Mobile app (React Native) đã bị xóa**
- ✅ **Chỉ tập trung phát triển Web application**
- ✅ **PWA (Progressive Web App) để hỗ trợ mobile experience**

## Cấu trúc dự án

```
/
├── web/                 # React web application
├── shared/             # Shared services và utilities  
├── functions/          # Firebase Cloud Functions
└── memory-bank/        # Documentation và context
```

## Nền tảng mục tiêu

- **Primary**: Web Application (React + Vite)
- **Mobile support**: Thông qua PWA features
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Deployment**: Cloudflare Pages / Firebase Hosting

## Tech Stack chính

### Frontend
- React 18.2.0
- Material-UI (MUI) 5.15.1
- React Router Dom 6.20.1
- i18next cho internationalization
- Vite build tool

### Backend
- Firebase 11.9.0 (Auth, Firestore, Storage)
- Firebase Cloud Functions
- MinIO (planned integration for storage)

### PWA Features
- Service Worker với Workbox
- Offline capabilities
- Push notifications
- Install prompt

## Tính năng chính

1. **Authentication & User Management**
2. **Couple Connection System**
3. **Notes System** (Private & Shared)
4. **Reminders System**
5. **Love Days Counter**
6. **Notifications**
7. **Media Upload** (Photos - đang phát triển)

## Mục tiêu hiện tại

- Hoàn thiện photo upload system trên web
- Tích hợp MinIO để thay thế Firebase Storage
- Tối ưu PWA experience cho mobile users