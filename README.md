# 🌟 ZoldyVocab — Nền Tảng Học & Ôn Tập Từ Vựng Thông Minh

**ZoldyVocab** là ứng dụng học và ghi nhớ từ vựng tiếng Anh hiện đại, kết hợp thuật toán lặp lại ngắt quãng **Spaced Repetition System (SRS)**, hệ thống bài học đa dạng (Flashcard, Trắc nghiệm, Nghe, Gõ chính tả) cùng bộ dữ liệu từ vựng chất lượng cao được đồng bộ tự động.

---

## ✨ Tính Năng Nổi Bật

- 🧠 **Thuật Toán Spaced Repetition (SRS 5 Cấp Độ):**
  - Tự động phân bổ lịch ôn tập dựa theo đường cong quên lãng Ebbinghaus (1 giờ ➔ 1 ngày ➔ 5 ngày ➔ 14 ngày ➔ 30 ngày ➔ Mastered).
  - Nhắc nhở người dùng ôn tập vào đúng "Thời điểm vàng" để tối ưu hóa khả năng ghi nhớ dài hạn.
- 📚 **Khoá Học Mochi Vocab (148 Bài Học Random):**
  - Gần **3.000 từ vựng** tiếng Anh thông dụng được phân chia khoa học thành 148 bài học (20 từ/bài ngẫu nhiên).
  - Hỗ trợ học từng bài học với đầy đủ 4 bước tương tác:
    1. **Flashcard** trực quan (Từ, phiên âm IPA, nghĩa, ví dụ minh họa).
    2. **Trắc nghiệm Nghĩa ➔ Chọn Từ**.
    3. **Luyện Nghe ➔ Chọn Nghĩa** với giọng đọc chuẩn bản xứ.
    4. **Gõ chính tả từ** (Spelling test).
- 🔤 **Chuẩn Hóa Ký Hiệu Ngữ Âm Quốc Tế (IPA):**
  - Tích hợp font chữ ngữ âm chuẩn cho toàn bộ ký hiệu IPA (`/ɔːl wɔːks əv laɪf/`, `/ˌæstrəˈnɑːmɪkl/`), đảm bảo hiển thị sắc nét, không bị lỗi font hay đứt nét.
- ⚡ **Kiến Trúc Cache Cực Nhanh & Tối Ưu Chi Phí:**
  - Client-side cache đa tầng (Local Storage + Version Validation) giúp ứng dụng tải tức thì và không bị cạn kiệt hạn mức đọc của cơ sở dữ liệu.
- 📱 **Hỗ Trợ PWA & Push Notifications:**
  - Cài đặt như ứng dụng native trên iOS / Android / Desktop.
  - Gửi thông báo đẩy nhắc nhở ôn tập từ vựng đúng giờ.
- 🔍 **Tra Cứu & Sổ Tay Cá Nhân:**
  - Sổ tay tổng hợp toàn bộ từ đã học, lọc theo cấp độ nhớ (Mức 1 đến Mức 5, Đã thuộc vĩnh viễn), tìm kiếm tức thì.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + Custom CSS Design System
- **Database & Auth:** [Firebase Authentication](https://firebase.google.com/products/auth), [Cloud Firestore](https://firebase.google.com/products/firestore), [Firebase Cloud Messaging (FCM)](https://firebase.google.com/products/cloud-messaging)
- **Icons & UI Utilities:** [Lucide React](https://lucide.dev/), Canvas Confetti, Howler Sound Effects

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### 1. Clone dự án

```bash
git clone https://github.com/NamPH03/zoldy-vocab.git
cd zoldy-vocab
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình biến môi trường

Tạo file `.env.local` tại thư mục gốc với các thông tin Firebase của bạn:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Khởi chạy Development Server

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000) để trải nghiệm ứng dụng.

---

## 📁 Cấu Trúc Thư Mục

```
zoldy-vocab/
├── data/                       # Dữ liệu từ vựng backup dạng JSON
├── public/                     # Static assets, icons, manifest, service worker
├── scripts/                    # Scripts đồng bộ, phân chia khóa học & xử lý dữ liệu
├── src/
│   ├── app/                    # Next.js App Router (Dashboard, Learn, Review, Vocab, Auth)
│   ├── components/             # Reusable UI components (StudySession, Navbar, Cards)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Firebase client/admin, SRS progress logic, Audio/SFX, Cache
│   └── types/                  # TypeScript interfaces & types
└── ...
```

---

## 📄 Giấy Phép (License)

Dự án được phân phối dưới giấy phép [MIT License](LICENSE).
