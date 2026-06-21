import { streamText, tool, stepCountIs, UIMessage, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import {
  mapKeywordJobsToCards,
  mapSemanticJobsToCards,
  type ChatJobCard,
} from "@/lib/chat/map-job-results";

const SYSTEM_PROMPT = `Bạn là trợ lý tìm việc của JOYWORK — nền tảng kết nối ứng viên với doanh nghiệp tại Việt Nam.

Mục tiêu: giúp người dùng tìm việc nhanh, đúng nhu cầu, qua trò chuyện ngắn gọn bằng tiếng Việt.

Quy trình:
1. Nếu người dùng đã nêu vị trí/ngành nghề (dù mơ hồ), gọi ngay tool searchJobsTool với tham số query là một câu mô tả tự nhiên gộp đủ ý: vị trí, kỹ năng, địa điểm, hình thức, mức lương người dùng đề cập.
2. Chỉ hỏi thêm khi câu hỏi quá chung và tool không thể chạy (ví dụ chỉ "tìm việc"). Tối đa 1 câu hỏi mỗi lượt.
3. Sau khi tool trả kết quả (có việc): chỉ viết MỘT câu ngắn dẫn dắt, ví dụ "Mình tìm được vài vị trí phù hợp bên dưới nhé:". TUYỆT ĐỐI KHÔNG liệt kê lại từng việc, KHÔNG đánh số, KHÔNG nêu tên công ty / mức lương / địa điểm của từng job — giao diện đã tự render thẻ (card) cho từng việc ngay phía dưới, nếu bạn viết lại sẽ bị trùng lặp.
4. Nếu kết quả rỗng: gợi ý mở rộng tiêu chí (bỏ filter lương, đổi địa điểm, dùng từ khóa khác) và hỏi người dùng có muốn điều chỉnh không.

Quy tắc:
- Tham số chính của tool là "query" — đưa toàn bộ ý của user vào đây (vị trí, kỹ năng, hình thức làm việc như "thực tập", "bán thời gian", "remote", level, ngành).
- Chỉ điền "location" khi user nói rõ tỉnh/thành; chỉ điền "salaryMin"/"salaryMax" khi user nói con số cụ thể. Không tự đoán.
- Mã địa điểm thường gặp: "Hà Nội" -> "ha-noi"; "TP.HCM"/"Hồ Chí Minh"/"Sài Gòn" -> "ho-chi-minh"; "Đà Nẵng" -> "da-nang"; "Hải Phòng" -> "hai-phong"; "Cần Thơ" -> "can-tho"; "Bình Dương" -> "binh-duong"; "Đồng Nai" -> "dong-nai". Nếu không chắc, bỏ trống location, để query tự nhiên xử lý.
- Chỉ dùng searchCompaniesTool khi user hỏi rõ về một công ty cụ thể (theo tên), không gọi mặc định mỗi lượt.
- Trả lời bằng tiếng Việt, thân thiện, ngắn gọn. Không liệt kê link, không mô tả lại chi tiết từng việc (UI đã hiển thị card), không bịa thông tin việc làm ngoài kết quả tool.
- Nếu user hỏi chủ đề ngoài tìm việc, nhẹ nhàng dẫn về mục tiêu tìm việc.`;

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
}

type SemanticSearchBody = {
  query: string;
  limit?: number;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
};

async function searchJobsSemantic(body: SemanticSearchBody): Promise<ChatJobCard[]> {
  const res = await fetch(`${getApiBase()}/api/jobs/semantic-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return [];
  const json = await res.json();
  const jobs = json?.data?.jobs ?? [];
  return mapSemanticJobsToCards(jobs);
}

async function searchJobsKeywordFallback(query: string, limit: number): Promise<ChatJobCard[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`${getApiBase()}/api/jobs?${params}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return [];
  const json = await res.json();
  const jobs = json?.data?.jobs ?? [];
  return mapKeywordJobsToCards(jobs);
}

const searchJobsTool = tool({
  description:
    "Tìm việc làm theo mô tả tự nhiên của ứng viên (ngữ nghĩa). Hãy gộp đầy đủ ý của user (vị trí, kỹ năng, hình thức làm việc, kinh nghiệm) vào query — tool sẽ tự hiểu, không cần filter cứng.",
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe(
        "Câu mô tả tự nhiên gộp vị trí, kỹ năng, hình thức (toàn thời gian, bán thời gian, thực tập, remote), kinh nghiệm — bằng tiếng Việt",
      ),
    location: z
      .string()
      .optional()
      .describe(
        "Mã tỉnh/thành: ha-noi, ho-chi-minh, da-nang, hai-phong, can-tho, binh-duong, dong-nai. Để trống nếu user không nói rõ địa điểm",
      ),
    salaryMin: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Lương tối thiểu (VND) — chỉ điền khi user nói con số cụ thể, không tự đoán"),
    salaryMax: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Lương tối đa (VND) — chỉ điền khi user nói con số cụ thể, không tự đoán"),
  }),
  execute: async ({ query, location, salaryMin, salaryMax }) => {
    const limit = 6;
    const body: SemanticSearchBody = { query, limit };
    if (location && location.trim()) body.location = location.trim();
    if (typeof salaryMin === "number" && salaryMin > 0) body.salaryMin = salaryMin;
    if (typeof salaryMax === "number" && salaryMax > 0) body.salaryMax = salaryMax;

    let jobs: ChatJobCard[] = [];
    try {
      jobs = await searchJobsSemantic(body);
    } catch {
      jobs = [];
    }

    if (jobs.length === 0) {
      try {
        jobs = await searchJobsKeywordFallback(query, limit);
      } catch {
        jobs = [];
      }
    }

    return { jobs };
  },
});

const searchCompaniesTool = tool({
  description:
    "Tìm công ty theo tên. Chỉ gọi khi người dùng hỏi cụ thể về một doanh nghiệp, không gọi mặc định khi tìm việc.",
  inputSchema: z.object({
    q: z.string().min(1).describe("Tên hoặc một phần tên công ty"),
  }),
  execute: async ({ q }) => {
    const params = new URLSearchParams({ q, limit: "6" });
    const res = await fetch(`${getApiBase()}/api/companies?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.companies ?? [];
  },
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: { searchJobsTool, searchCompaniesTool },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
