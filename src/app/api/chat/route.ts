import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const SYSTEM_PROMPT = `Bạn là trợ lý tìm việc của nền tảng JoyWork — kết nối ứng viên phù hợp với doanh nghiệp tốt tại Việt Nam.

Nhiệm vụ: Giúp người dùng tìm việc làm phù hợp thông qua trò chuyện thân thiện.

Quy trình:
1. Chào hỏi ngắn gọn, hỏi về vị trí hoặc ngành nghề mong muốn.
2. Hỏi về địa điểm làm việc (thành phố/tỉnh).
3. Nếu chưa rõ, hỏi về cấp bậc và kinh nghiệm.
4. Hỏi về mức lương kỳ vọng (tuỳ chọn, có thể bỏ qua).
5. Khi đã đủ thông tin cơ bản (ít nhất vị trí/ngành nghề), gọi tool searchJobs để tìm kiếm.
6. Tóm tắt 3–5 kết quả phù hợp nhất bằng tiếng Việt, mỗi việc làm gồm: tên vị trí, công ty, địa điểm, mức lương (nếu có), và đường link xem chi tiết.
7. Hỏi người dùng có muốn tìm thêm hoặc điều chỉnh tiêu chí không.

Quy tắc:
- Luôn trả lời bằng tiếng Việt.
- Thân thiện, ngắn gọn, không hỏi quá 2 câu một lần.
- Không hỏi thêm nếu đã đủ thông tin để tìm kiếm.
- Nếu người dùng hỏi về chủ đề không liên quan, nhẹ nhàng dẫn dắt về mục tiêu tìm việc.
- Khi hiển thị kết quả, dùng định dạng danh sách rõ ràng với link đầy đủ.`;

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const searchJobsTool = tool({
  description: 'Tìm kiếm việc làm phù hợp theo từ khoá tự nhiên và các bộ lọc cấu trúc',
  parameters: z.object({
    query: z.string().describe('Mô tả vị trí, ngành nghề, kỹ năng mong muốn bằng tiếng Việt hoặc tiếng Anh'),
    location: z.string().optional().describe('Mã tỉnh/thành phố, ví dụ: ha-noi, ho-chi-minh, da-nang'),
    employmentType: z
      .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE'])
      .optional()
      .describe('Loại hình công việc'),
    jobLevel: z
      .enum(['INTERN_STUDENT', 'FRESH_GRAD', 'EMPLOYEE', 'SPECIALIST_TEAM_LEAD', 'MANAGER_HEAD', 'DIRECTOR', 'EXECUTIVE'])
      .optional()
      .describe('Cấp bậc công việc'),
    salaryMin: z.number().optional().describe('Mức lương tối thiểu (VND)'),
    salaryMax: z.number().optional().describe('Mức lương tối đa (VND)'),
    limit: z.number().min(1).max(10).default(5).describe('Số lượng kết quả trả về'),
  }),
  execute: async params => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
    const res = await fetch(`${apiBase}/api/jobs/semantic-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      return { jobs: [], error: 'Không thể tìm kiếm việc làm lúc này. Vui lòng thử lại.' };
    }
    const data = await res.json();
    return data.data ?? data;
  },
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT,
    messages,
    tools: { searchJobs: searchJobsTool },
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
