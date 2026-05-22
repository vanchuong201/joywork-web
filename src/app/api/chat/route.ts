import { streamText, tool, jsonSchema, UIMessage, convertToModelMessages } from 'ai';
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
- luôn sử dụng searchJobsTool khi tìm kiếm công việc
- Luôn trả lời bằng tiếng Việt.
- Thân thiện, ngắn gọn, không hỏi quá 2 câu một lần.
- Không hỏi thêm nếu đã đủ thông tin để tìm kiếm.
- Nếu người dùng hỏi về chủ đề không liên quan, nhẹ nhàng dẫn dắt về mục tiêu tìm việc.
- Khi hiển thị kết quả, dùng định dạng danh sách rõ ràng với link đầy đủ.`;

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const searchJobsTool = tool({
  description: 'Get the weather in a location',
  inputSchema: z.object({
    q: z.string().describe('Mô tả vị trí, ngành nghề, kỹ năng mong muốn bằng tiếng Việt hoặc tiếng Anh'),
    location: z.string().describe('Mã tỉnh/thành phố, ví dụ: ha-noi, ho-chi-minh, da-nang'),
    salaryMin: z.number().describe('Mức lương tối thiểu (VND)'),
    salaryMax: z.number().describe('Mức lương tối đa (VND)'),
  }),
  execute: async (params: any) => {
    const q = new URLSearchParams({...params, limit: 6})
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
    const res = await fetch(`${apiBase}/api/jobs?${q}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) {
      return { jobs: [], error: 'Không thể tìm kiếm việc làm lúc này. Vui lòng thử lại.' };
    }
    return data.data ?? data;
  },
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: { searchJobsTool }
  });

  return result.toUIMessageStreamResponse();
}
