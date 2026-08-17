// scripts/import-english-vocab.ts
// Script nạp bộ từ vựng Tiếng Anh chuẩn (Oxford A1-C1, TOEIC, IELTS) vào Firestore bằng Firebase Admin SDK
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!privateKey || !clientEmail || !projectId) {
  console.error("❌ Thiếu cấu hình Firebase Admin trong .env.local!");
  process.exit(1);
}

if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}
privateKey = privateKey.replace(/\\n/g, "\n");

const app =
  getApps().length === 0
    ? initializeApp(
        {
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        },
        "admin-import"
      )
    : getApps()[0];

const db = getFirestore(app);

type RawVocab = {
  word: string;
  ipa: string;
  type: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "TOEIC" | "IELTS";
  courseId: string;
  courseName: string;
  lessonId: string;
  lessonTitle: string;
};

const VOCAB_DATA: RawVocab[] = [
  // ==========================================
  // COURSE: OXFORD 3000 — A1 (BEGINNER)
  // ==========================================
  // Lesson 1: Daily Greetings & Basics
  {
    word: "hello",
    ipa: "/həˈloʊ/",
    type: "interjection",
    meaning: "Xin chào",
    example: "Hello, nice to meet you!",
    exampleMeaning: "Xin chào, rất vui được gặp bạn!",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_01",
    lessonTitle: "Bài 1: Giao tiếp & Chào hỏi",
  },
  {
    word: "welcome",
    ipa: "/ˈwel.kəm/",
    type: "verb",
    meaning: "Chào đón, hoan nghênh",
    example: "Welcome to our English class.",
    exampleMeaning: "Chào mừng bạn đến với lớp học tiếng Anh của chúng tôi.",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_01",
    lessonTitle: "Bài 1: Giao tiếp & Chào hỏi",
  },
  {
    word: "morning",
    ipa: "/ˈmɔːr.nɪŋ/",
    type: "noun",
    meaning: "Buổi sáng",
    example: "Good morning, have a great day!",
    exampleMeaning: "Chào buổi sáng, chúc bạn một ngày tuyệt vời!",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_01",
    lessonTitle: "Bài 1: Giao tiếp & Chào hỏi",
  },
  {
    word: "evening",
    ipa: "/ˈiːv.nɪŋ/",
    type: "noun",
    meaning: "Buổi tối",
    example: "We often read books in the evening.",
    exampleMeaning: "Chúng tôi thường đọc sách vào buổi tối.",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_01",
    lessonTitle: "Bài 1: Giao tiếp & Chào hỏi",
  },
  {
    word: "friend",
    ipa: "/frend/",
    type: "noun",
    meaning: "Bạn bè, người bạn",
    example: "She is my best friend from school.",
    exampleMeaning: "Cô ấy là bạn thân nhất của tôi từ thời đi học.",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_01",
    lessonTitle: "Bài 1: Giao tiếp & Chào hỏi",
  },

  // Lesson 2: Family & People
  {
    word: "family",
    ipa: "/ˈfæm.əl.i/",
    type: "noun",
    meaning: "Gia đình",
    example: "I love spending time with my family.",
    exampleMeaning: "Tôi thích dành thời gian bên gia đình.",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_02",
    lessonTitle: "Bài 2: Gia đình & Con người",
  },
  {
    word: "parent",
    ipa: "/ˈper.ənt/",
    type: "noun",
    meaning: "Bố hoặc mẹ, phụ huynh",
    example: "My parents live in a quiet town.",
    exampleMeaning: "Bố mẹ tôi sống ở một thị trấn yên bình.",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_02",
    lessonTitle: "Bài 2: Gia đình & Con người",
  },
  {
    word: "brother",
    ipa: "/ˈbrʌð.ɚ/",
    type: "noun",
    meaning: "Anh trai / em trai",
    example: "My brother is an engineer.",
    exampleMeaning: "Anh trai tôi là một kỹ sư.",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_02",
    lessonTitle: "Bài 2: Gia đình & Con người",
  },
  {
    word: "sister",
    ipa: "/ˈsɪs.tɚ/",
    type: "noun",
    meaning: "Chị gái / em gái",
    example: "Her sister is studying abroad in Japan.",
    exampleMeaning: "Em gái cô ấy đang du học ở Nhật Bản.",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_02",
    lessonTitle: "Bài 2: Gia đình & Con người",
  },
  {
    word: "children",
    ipa: "/ˈtʃɪl.drən/",
    type: "noun",
    meaning: "Trẻ em, con cái",
    example: "The children are playing happily in the park.",
    exampleMeaning: "Bọn trẻ đang chơi đùa vui vẻ trong công viên.",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_02",
    lessonTitle: "Bài 2: Gia đình & Con người",
  },

  // Lesson 3: Home & Living
  {
    word: "house",
    ipa: "/haʊs/",
    type: "noun",
    meaning: "Ngôi nhà",
    example: "They bought a beautiful house near the river.",
    exampleMeaning: "Họ đã mua một ngôi nhà xinh đẹp gần bờ sông.",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_03",
    lessonTitle: "Bài 3: Nhà cửa & Đời sống",
  },
  {
    word: "kitchen",
    ipa: "/ˈkɪtʃ.ən/",
    type: "noun",
    meaning: "Phòng bếp",
    example: "The kitchen is bright and clean.",
    exampleMeaning: "Căn bếp rất sáng sủa và sạch sẽ.",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_03",
    lessonTitle: "Bài 3: Nhà cửa & Đời sống",
  },
  {
    word: "bedroom",
    ipa: "/ˈbed.ruːm/",
    type: "noun",
    meaning: "Phòng ngủ",
    example: "I usually study in my bedroom.",
    exampleMeaning: "Tôi thường học bài trong phòng ngủ của mình.",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_03",
    lessonTitle: "Bài 3: Nhà cửa & Đời sống",
  },
  {
    word: "table",
    ipa: "/ˈteɪ.bəl/",
    type: "noun",
    meaning: "Cái bàn",
    example: "Put the books on the table, please.",
    exampleMeaning: "Làm ơn hãy đặt sách lên trên bàn.",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_03",
    lessonTitle: "Bài 3: Nhà cửa & Đời sống",
  },
  {
    word: "window",
    ipa: "/ˈwɪn.doʊ/",
    type: "noun",
    meaning: "Cửa sổ",
    example: "Please open the window for fresh air.",
    exampleMeaning: "Làm ơn mở cửa sổ cho thoáng khí.",
    level: "A1",
    courseId: "oxford_a1",
    courseName: "Oxford 3000 — A1 Căn bản",
    lessonId: "a1_lesson_03",
    lessonTitle: "Bài 3: Nhà cửa & Đời sống",
  },

  // ==========================================
  // COURSE: OXFORD 3000 — A2 (ELEMENTARY)
  // ==========================================
  // Lesson 1: Work & Career
  {
    word: "colleague",
    ipa: "/ˈkɑː.liːɡ/",
    type: "noun",
    meaning: "Đồng nghiệp",
    example: "I get along very well with my colleagues.",
    exampleMeaning: "Tôi rất hòa thuận với các đồng nghiệp của mình.",
    level: "A2",
    courseId: "oxford_a2",
    courseName: "Oxford 3000 — A2 Sơ cấp",
    lessonId: "a2_lesson_01",
    lessonTitle: "Bài 1: Công việc & Đồng nghiệp",
  },
  {
    word: "manager",
    ipa: "/ˈmæn.ə.dʒɚ/",
    type: "noun",
    meaning: "Người quản lý, trưởng phòng",
    example: "Our project manager approved the new plan.",
    exampleMeaning: "Quản lý dự án của chúng tôi đã phê duyệt kế hoạch mới.",
    level: "A2",
    courseId: "oxford_a2",
    courseName: "Oxford 3000 — A2 Sơ cấp",
    lessonId: "a2_lesson_01",
    lessonTitle: "Bài 1: Công việc & Đồng nghiệp",
  },
  {
    word: "salary",
    ipa: "/ˈsæl.ɚ.i/",
    type: "noun",
    meaning: "Tiền lương hàng tháng",
    example: "The company offers a competitive salary.",
    exampleMeaning: "Công ty đưa ra mức lương rất cạnh tranh.",
    level: "A2",
    courseId: "oxford_a2",
    courseName: "Oxford 3000 — A2 Sơ cấp",
    lessonId: "a2_lesson_01",
    lessonTitle: "Bài 1: Công việc & Đồng nghiệp",
  },
  {
    word: "schedule",
    ipa: "/ˈskedʒ.uːl/",
    type: "noun",
    meaning: "Lịch trình, thời gian biểu",
    example: "I have a tight schedule this week.",
    exampleMeaning: "Tuần này tôi có một lịch trình khá bận rộn.",
    level: "A2",
    courseId: "oxford_a2",
    courseName: "Oxford 3000 — A2 Sơ cấp",
    lessonId: "a2_lesson_01",
    lessonTitle: "Bài 1: Công việc & Đồng nghiệp",
  },
  {
    word: "interview",
    ipa: "/ˈɪn.t̬ɚ.vjuː/",
    type: "noun",
    meaning: "Cuộc phỏng vấn",
    example: "She has a job interview tomorrow morning.",
    exampleMeaning: "Cô ấy có buổi phỏng vấn xin việc vào sáng mai.",
    level: "A2",
    courseId: "oxford_a2",
    courseName: "Oxford 3000 — A2 Sơ cấp",
    lessonId: "a2_lesson_01",
    lessonTitle: "Bài 1: Công việc & Đồng nghiệp",
  },

  // Lesson 2: Travel & Exploration
  {
    word: "journey",
    ipa: "/ˈdʒɝː.ni/",
    type: "noun",
    meaning: "Hành trình, chuyến đi dài",
    example: "The train journey took nearly four hours.",
    exampleMeaning: "Chuyến đi bằng tàu hỏa mất gần bốn tiếng đồng hồ.",
    level: "A2",
    courseId: "oxford_a2",
    courseName: "Oxford 3000 — A2 Sơ cấp",
    lessonId: "a2_lesson_02",
    lessonTitle: "Bài 2: Du lịch & Hành trình",
  },
  {
    word: "destination",
    ipa: "/ˌdes.təˈneɪ.ʃən/",
    type: "noun",
    meaning: "Điểm đến, đích đến",
    example: "Da Nang is a popular travel destination in Vietnam.",
    exampleMeaning: "Đà Nẵng là một điểm đến du lịch nổi tiếng ở Việt Nam.",
    level: "A2",
    courseId: "oxford_a2",
    courseName: "Oxford 3000 — A2 Sơ cấp",
    lessonId: "a2_lesson_02",
    lessonTitle: "Bài 2: Du lịch & Hành trình",
  },
  {
    word: "luggage",
    ipa: "/ˈlʌɡ.ɪdʒ/",
    type: "noun",
    meaning: "Hành lý",
    example: "Make sure you label your luggage clearly.",
    exampleMeaning: "Hãy chắc chắn rằng bạn đã gắn nhãn hành lý rõ ràng.",
    level: "A2",
    courseId: "oxford_a2",
    courseName: "Oxford 3000 — A2 Sơ cấp",
    lessonId: "a2_lesson_02",
    lessonTitle: "Bài 2: Du lịch & Hành trình",
  },
  {
    word: "passenger",
    ipa: "/ˈpæs.ən.dʒɚ/",
    type: "noun",
    meaning: "Hành khách",
    example: "All passengers must wear seatbelts.",
    exampleMeaning: "Tất cả hành khách phải thắt dây an toàn.",
    level: "A2",
    courseId: "oxford_a2",
    courseName: "Oxford 3000 — A2 Sơ cấp",
    lessonId: "a2_lesson_02",
    lessonTitle: "Bài 2: Du lịch & Hành trình",
  },

  // ==========================================
  // COURSE: OXFORD 3000 — B1 (INTERMEDIATE)
  // ==========================================
  // Lesson 1: Technology & Society
  {
    word: "convenient",
    ipa: "/kənˈviː.ni.ənt/",
    type: "adjective",
    meaning: "Thuận tiện, tiện lợi",
    example: "Online shopping is extremely convenient.",
    exampleMeaning: "Mua sắm trực tuyến vô cùng tiện lợi.",
    level: "B1",
    courseId: "oxford_b1",
    courseName: "Oxford 3000 — B1 Trung cấp",
    lessonId: "b1_lesson_01",
    lessonTitle: "Bài 1: Công nghệ & Cuộc sống",
  },
  {
    word: "opportunity",
    ipa: "/ˌɑː.pɚˈtuː.nə.t̬i/",
    type: "noun",
    meaning: "Cơ hội, thời cơ",
    example: "Studying abroad gives you great opportunities.",
    exampleMeaning: "Du học mang lại cho bạn những cơ hội tuyệt vời.",
    level: "B1",
    courseId: "oxford_b1",
    courseName: "Oxford 3000 — B1 Trung cấp",
    lessonId: "b1_lesson_01",
    lessonTitle: "Bài 1: Công nghệ & Cuộc sống",
  },
  {
    word: "develop",
    ipa: "/dɪˈvel.əp/",
    type: "verb",
    meaning: "Phát triển, mở rộng",
    example: "We need to develop our communication skills.",
    exampleMeaning: "Chúng ta cần phát triển kỹ năng giao tiếp của mình.",
    level: "B1",
    courseId: "oxford_b1",
    courseName: "Oxford 3000 — B1 Trung cấp",
    lessonId: "b1_lesson_01",
    lessonTitle: "Bài 1: Công nghệ & Cuộc sống",
  },
  {
    word: "environment",
    ipa: "/ɪnˈvaɪ.rən.mənt/",
    type: "noun",
    meaning: "Môi trường sống",
    example: "Protecting the environment is our responsibility.",
    exampleMeaning: "Bảo vệ môi trường là trách nhiệm của chúng ta.",
    level: "B1",
    courseId: "oxford_b1",
    courseName: "Oxford 3000 — B1 Trung cấp",
    lessonId: "b1_lesson_01",
    lessonTitle: "Bài 1: Công nghệ & Cuộc sống",
  },
  {
    word: "efficient",
    ipa: "/ɪˈfɪʃ.ənt/",
    type: "adjective",
    meaning: "Hiệu quả, năng suất cao",
    example: "This software is very efficient for team collaboration.",
    exampleMeaning: "Phần mềm này rất hiệu quả cho việc làm việc nhóm.",
    level: "B1",
    courseId: "oxford_b1",
    courseName: "Oxford 3000 — B1 Trung cấp",
    lessonId: "b1_lesson_01",
    lessonTitle: "Bài 1: Công nghệ & Cuộc sống",
  },

  // ==========================================
  // COURSE: OXFORD 3000 — B2 (UPPER INTERMEDIATE)
  // ==========================================
  // Lesson 1: Leadership & Innovation
  {
    word: "resilient",
    ipa: "/rɪˈzɪl.jənt/",
    type: "adjective",
    meaning: "Kiên cường, phục hồi nhanh sau khó khăn",
    example: "He proved to be remarkably resilient after the crisis.",
    exampleMeaning: "Anh ấy đã chứng minh mình kiên cường phi thường sau khủng hoảng.",
    level: "B2",
    courseId: "oxford_b2",
    courseName: "Oxford 3000 — B2 Trung cao cấp",
    lessonId: "b2_lesson_01",
    lessonTitle: "Bài 1: Năng lực & Thích ứng",
  },
  {
    word: "perspective",
    ipa: "/pɚˈspek.tɪv/",
    type: "noun",
    meaning: "Góc nhìn, quan điểm",
    example: "Try to look at the problem from another perspective.",
    exampleMeaning: "Hãy thử nhìn nhận vấn đề từ một góc nhìn khác.",
    level: "B2",
    courseId: "oxford_b2",
    courseName: "Oxford 3000 — B2 Trung cao cấp",
    lessonId: "b2_lesson_01",
    lessonTitle: "Bài 1: Năng lực & Thích ứng",
  },
  {
    word: "implement",
    ipa: "/ˈɪm.plə.ment/",
    type: "verb",
    meaning: "Triển khai, thực thi kế hoạch",
    example: "The government decided to implement strict regulations.",
    exampleMeaning: "Chính phủ đã quyết định triển khai các quy định nghiêm ngặt.",
    level: "B2",
    courseId: "oxford_b2",
    courseName: "Oxford 3000 — B2 Trung cao cấp",
    lessonId: "b2_lesson_01",
    lessonTitle: "Bài 1: Năng lực & Thích ứng",
  },
  {
    word: "substantial",
    ipa: "/səbˈstæn.ʃəl/",
    type: "adjective",
    meaning: "Đáng kể, quan trọng",
    example: "We saw a substantial increase in revenue this quarter.",
    exampleMeaning: "Chúng tôi nhận thấy sự gia tăng doanh thu đáng kể trong quý này.",
    level: "B2",
    courseId: "oxford_b2",
    courseName: "Oxford 3000 — B2 Trung cao cấp",
    lessonId: "b2_lesson_01",
    lessonTitle: "Bài 1: Năng lực & Thích ứng",
  },
  {
    word: "comprehensive",
    ipa: "/ˌkɑːm.prəˈhen.sɪv/",
    type: "adjective",
    meaning: "Toàn diện, bao quát",
    example: "The report provides a comprehensive overview of the market.",
    exampleMeaning: "Báo cáo cung cấp một cái nhìn tổng quan toàn diện về thị trường.",
    level: "B2",
    courseId: "oxford_b2",
    courseName: "Oxford 3000 — B2 Trung cao cấp",
    lessonId: "b2_lesson_01",
    lessonTitle: "Bài 1: Năng lực & Thích ứng",
  },

  // ==========================================
  // COURSE: TOEIC WORKPLACE & BUSINESS
  // ==========================================
  // Lesson 1: Contracts & Corporate
  {
    word: "negotiate",
    ipa: "/nəˈɡoʊ.ʃi.eɪt/",
    type: "verb",
    meaning: "Thương lượng, đàm phán hợp đồng",
    example: "The company is negotiating a partnership with a global brand.",
    exampleMeaning: "Công ty đang đàm phán hợp tác với một thương hiệu toàn cầu.",
    level: "TOEIC",
    courseId: "toeic_biz",
    courseName: "TOEIC — Giao tiếp Doanh nghiệp",
    lessonId: "toeic_lesson_01",
    lessonTitle: "Bài 1: Hợp đồng & Đàm phán",
  },
  {
    word: "deadline",
    ipa: "/ˈded.laɪn/",
    type: "noun",
    meaning: "Hạn chót hoàn thành",
    example: "We must deliver the project before the strict deadline.",
    exampleMeaning: "Chúng ta phải bàn giao dự án trước thời hạn chót nghiêm ngặt.",
    level: "TOEIC",
    courseId: "toeic_biz",
    courseName: "TOEIC — Giao tiếp Doanh nghiệp",
    lessonId: "toeic_lesson_01",
    lessonTitle: "Bài 1: Hợp đồng & Đàm phán",
  },
  {
    word: "reimburse",
    ipa: "/ˌriː.ɪmˈbɝːs/",
    type: "verb",
    meaning: "Hoàn trả chi phí, bồi hoàn",
    example: "The company will reimburse your travel expenses.",
    exampleMeaning: "Công ty sẽ hoàn trả các chi phí đi lại của bạn.",
    level: "TOEIC",
    courseId: "toeic_biz",
    courseName: "TOEIC — Giao tiếp Doanh nghiệp",
    lessonId: "toeic_lesson_01",
    lessonTitle: "Bài 1: Hợp đồng & Đàm phán",
  },
  {
    word: "collaborate",
    ipa: "/kəˈlæb.ə.reɪt/",
    type: "verb",
    meaning: "Hợp tác, làm việc cùng nhau",
    example: "Multiple departments collaborated on the product launch.",
    exampleMeaning: "Nhiều phòng ban đã hợp tác trong đợt ra mắt sản phẩm.",
    level: "TOEIC",
    courseId: "toeic_biz",
    courseName: "TOEIC — Giao tiếp Doanh nghiệp",
    lessonId: "toeic_lesson_01",
    lessonTitle: "Bài 1: Hợp đồng & Đàm phán",
  },
  {
    word: "agenda",
    ipa: "/əˈdʒen.də/",
    type: "noun",
    meaning: "Chương trình nghị sự, nội dung cuộc họp",
    example: "What is the next item on the meeting agenda?",
    exampleMeaning: "Mục tiếp theo trong chương trình họp là gì?",
    level: "TOEIC",
    courseId: "toeic_biz",
    courseName: "TOEIC — Giao tiếp Doanh nghiệp",
    lessonId: "toeic_lesson_01",
    lessonTitle: "Bài 1: Hợp đồng & Đàm phán",
  },

  // ==========================================
  // COURSE: IELTS ACADEMIC VOCABULARY
  // ==========================================
  // Lesson 1: Academic Discourse & Research
  {
    word: "ubiquitous",
    ipa: "/juːˈbɪk.wə.təs/",
    type: "adjective",
    meaning: "Có mặt khắp nơi, phổ biến rộng rãi",
    example: "Smartphones have become ubiquitous in modern society.",
    exampleMeaning: "Điện thoại thông minh đã trở nên phổ biến khắp mọi nơi trong xã hội hiện đại.",
    level: "IELTS",
    courseId: "ielts_academic",
    courseName: "IELTS Academic — Từ vựng Học thuật",
    lessonId: "ielts_lesson_01",
    lessonTitle: "Bài 1: Luận điểm & Nghiên cứu",
  },
  {
    word: "predominant",
    ipa: "/prɪˈdɑː.mə.nənt/",
    type: "adjective",
    meaning: "Chiếm ưu thế, chủ đạo",
    example: "English is the predominant language of international trade.",
    exampleMeaning: "Tiếng Anh là ngôn ngữ chiếm ưu thế trong thương mại quốc tế.",
    level: "IELTS",
    courseId: "ielts_academic",
    courseName: "IELTS Academic — Từ vựng Học thuật",
    lessonId: "ielts_lesson_01",
    lessonTitle: "Bài 1: Luận điểm & Nghiên cứu",
  },
  {
    word: "unprecedented",
    ipa: "/ʌnˈpres.ə.den.t̬ɪd/",
    type: "adjective",
    meaning: "Chưa từng có tiền lệ",
    example: "The technological shift is happening at an unprecedented pace.",
    exampleMeaning: "Sự thay đổi công nghệ đang diễn ra ở tốc độ chưa từng có tiền lệ.",
    level: "IELTS",
    courseId: "ielts_academic",
    courseName: "IELTS Academic — Từ vựng Học thuật",
    lessonId: "ielts_lesson_01",
    lessonTitle: "Bài 1: Luận điểm & Nghiên cứu",
  },
  {
    word: "deteriorate",
    ipa: "/dɪˈtɪr.i.ə.reɪt/",
    type: "verb",
    meaning: "Xuống cấp, suy thoái, xấu đi",
    example: "Air quality in the city continues to deteriorate rapidly.",
    exampleMeaning: "Chất lượng không khí trong thành phố tiếp tục suy giảm nhanh chóng.",
    level: "IELTS",
    courseId: "ielts_academic",
    courseName: "IELTS Academic — Từ vựng Học thuật",
    lessonId: "ielts_lesson_01",
    lessonTitle: "Bài 1: Luận điểm & Nghiên cứu",
  },
  {
    word: "exacerbate",
    ipa: "/ɪɡˈzæs.ɚ.beɪt/",
    type: "verb",
    meaning: "Làm trầm trọng thêm (vấn đề, tình hình)",
    example: "Deforestation will further exacerbate global warming.",
    exampleMeaning: "Nạn phá rừng sẽ càng làm trầm trọng thêm sự nóng lên toàn cầu.",
    level: "IELTS",
    courseId: "ielts_academic",
    courseName: "IELTS Academic — Từ vựng Học thuật",
    lessonId: "ielts_lesson_01",
    lessonTitle: "Bài 1: Luận điểm & Nghiên cứu",
  },
];

async function main() {
  console.log(`🚀 Bắt đầu nạp ${VOCAB_DATA.length} từ vựng Tiếng Anh vào Firestore (Firebase Admin)...`);

  const batch = db.batch();
  const vocabCollection = db.collection("vocabulary");

  for (const item of VOCAB_DATA) {
    const docId = `en_${item.word.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${item.level.toLowerCase()}`;
    const docRef = vocabCollection.doc(docId);

    batch.set(docRef, {
      ...item,
      reading: item.ipa,
      language: "en",
      source: "curated",
      updatedAt: new Date().toISOString(),
    });
  }

  await batch.commit();
  console.log(`✅ Đã lưu ${VOCAB_DATA.length} từ vựng vào Firestore thành công!`);

  // Cập nhật version trong meta/vocabVersion_en
  const version = Date.now();
  await db.doc("meta/vocabVersion_en").set({ version });
  console.log(`✨ Đã cập nhật meta/vocabVersion_en lên version: ${version}`);
  console.log("🎉 Hoàn tất nạp dữ liệu từ vựng!");
}

main().catch((err) => {
  console.error("❌ Lỗi khi import từ vựng:", err);
  process.exit(1);
});
