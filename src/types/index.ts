// src/types/index.ts
// Định nghĩa kiểu dữ liệu dùng chung trong toàn bộ app
import { LearningLanguage } from "@/lib/languages";

// Thông tin một từ vựng
export interface Vocabulary {
  id: string;
  word: string;
  reading?: string; // Có thể chứa IPA hoặc cách đọc
  ipa?: string;
  meaning: string;
  type?: string;    // n, v, adj, adv, idiom, phrase...
  level: string;   // A1, A2, B1, B2, C1, TOEIC, IELTS
  language?: LearningLanguage;
  example?: string;
  exampleMeaning?: string;
  courseId?: string;
  courseName?: string;
  lessonId?: string;
  lessonTitle?: string;
  source?: string;
  status?: string;
}

// Thông tin người dùng (sau khi đăng nhập)
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  currentLanguage?: LearningLanguage;
}
