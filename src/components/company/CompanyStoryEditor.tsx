"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type CompanyStoryBlock } from "@/types/company";
import CompanyStoryRenderer from "@/components/company/CompanyStoryRenderer";
import { Plus } from "lucide-react";

type EditableBlock = {
  _localId: string;
  type: CompanyStoryBlock["type"];
  title?: string;
  subtitle?: string;
  body?: string;
  items?: Array<{ id: string; text: string }>;
  stats?: Array<{ id: string; label: string; value: string; description?: string }>;
  quote?: { text: string; author?: string; role?: string };
  media?: Array<{ id: string; url: string; caption?: string }>;
};

type Props = {
  companyId: string;
  initialStory?: CompanyStoryBlock[] | null;
  fallbackDescription?: string | null;
  onSaved?: () => void;
};

const BLOCK_TYPES: Array<{ value: CompanyStoryBlock["type"]; label: string }> = [
  { value: "text", label: "Đoạn mô tả" },
  { value: "list", label: "Danh sách bullet" },
  { value: "quote", label: "Trích dẫn" },
  { value: "stats", label: "Nhóm số liệu" },
  { value: "media", label: "Thư viện ảnh" },
];

const MAX_BLOCKS = 12;

const SAMPLE_STORY: CompanyStoryBlock[] = [
  {
    id: "intro",
    type: "text",
    title: "Hành trình của Skyline Media",
    subtitle: "Từ một studio nhỏ đến đối tác chiến lược của các thương hiệu dẫn đầu",
    body:
      "Skyline Media khởi đầu năm 2018 với 5 thành viên đam mê sáng tạo. Sau 6 năm phát triển, chúng tôi đã đồng hành cùng hơn 120 doanh nghiệp trong các dự án truyền thông quy mô từ trong nước đến khu vực.\n\nChúng tôi tin rằng mỗi thương hiệu đều có câu chuyện riêng và nhiệm vụ của Skyline Media là kể lại câu chuyện đó bằng trải nghiệm chạm cảm xúc.",
  },
  {
    id: "vision",
    type: "list",
    title: "Giá trị khác biệt mà Skyline Media mang đến",
    items: [
      "Chiến lược phát triển thương hiệu dựa trên dữ liệu và insight khách hàng.",
      "Đội ngũ sáng tạo nội dung linh hoạt, hiểu rõ đặc thù từng ngành.",
      "Hệ sinh thái dịch vụ khép kín: nghiên cứu, sản xuất, phân phối và đo lường.",
    ],
  },
  {
    id: "metrics",
    type: "stats",
    title: "Một vài con số biết nói",
    subtitle: "Chúng tôi đặt mục tiêu tăng trưởng bền vững qua từng dự án",
    stats: [
      { label: "Đối tác doanh nghiệp", value: "+120" },
      { label: "Chiến dịch triển khai", value: "450+" },
      { label: "Tỉ lệ hài lòng", value: "97%" },
      { label: "Quốc gia từng hợp tác", value: "6" },
      { label: "Số lượng thành viên", value: "58" },
    ],
  },
  {
    id: "quote",
    type: "quote",
    title: "Thông điệp từ CEO",
    quote: {
      text:
        "Chúng tôi không chỉ tạo ra nội dung đẹp mà còn tạo nên trải nghiệm khiến khách hàng nhớ đến thương hiệu lâu dài.",
      author: "Lan Anh",
      role: "Founder & CEO Skyline Media",
    },
  },
  {
    id: "media",
    type: "media",
    title: "Khoảnh khắc từ các dự án gần đây",
    media: [
      {
        url: "https://picsum.photos/seed/skyline-media-story-1/1280/720",
        caption: "Hậu trường chiến dịch ra mắt sản phẩm công nghệ 2025",
      },
      {
        url: "https://picsum.photos/seed/skyline-media-story-2/1280/720",
        caption: "Buổi workshop đồng sáng tạo cùng đối tác F&B",
      },
      {
        url: "https://picsum.photos/seed/skyline-media-story-3/1280/720",
        caption: "Đội ngũ Skyline Media trong chuyến teambuilding Đà Nẵng",
      },
    ],
  },
];

export default function CompanyStoryEditor({ companyId, initialStory, fallbackDescription, onSaved }: Props) {
  const [blocks, setBlocks] = useState<EditableBlock[]>(() => toEditableBlocks(initialStory));
  const [isDirty, setDirty] = useState(false);

  useEffect(() => {
    setBlocks(toEditableBlocks(initialStory));
    setDirty(false);
  }, [initialStory]);

  const preparedBlocks = useMemo(() => sanitizeBlocks(blocks), [blocks]);

  const updateStory = useMutation({
    mutationFn: async (payload: CompanyStoryBlock[]) => {
      await api.patch(`/api/companies/${companyId}`, { profileStory: payload });
    },
    onSuccess: () => {
      toast.success("Đã lưu phần giới thiệu doanh nghiệp");
      setDirty(false);
      onSaved?.();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Không thể lưu nội dung, thử lại sau";
      toast.error(message);
    },
  });

  const handleAddBlock = () => {
    if (blocks.length >= MAX_BLOCKS) {
      toast.info(`Bạn nên giữ tối đa ${MAX_BLOCKS} khối nội dung để nội dung dễ đọc.`);
      return;
    }
    setBlocks((prev) => [
      ...prev,
      {
        _localId: crypto.randomUUID(),
        type: "text",
        title: "",
        body: "",
      },
    ]);
    setDirty(true);
  };

  const updateBlock = (id: string, updater: (block: EditableBlock) => EditableBlock) => {
    setBlocks((prev) => prev.map((block) => (block._localId === id ? updater(block) : block)));
    setDirty(true);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block._localId !== id));
    setDirty(true);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const index = prev.findIndex((block) => block._localId === id);
      if (index === -1) return prev;
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === prev.length - 1) return prev;

      const newBlocks = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      return newBlocks;
    });
    setDirty(true);
  };

  const handleReset = () => {
    setBlocks(toEditableBlocks(initialStory));
    setDirty(false);
  };

  const handleSave = () => {
    updateStory.mutate(preparedBlocks);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Trình bày câu chuyện</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Sắp xếp các khối nội dung để kể câu chuyện về tầm nhìn, văn hoá, hành trình của doanh nghiệp.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setBlocks(toEditableBlocks(SAMPLE_STORY));
              setDirty(true);
              toast.info("Đã áp dụng dữ liệu mẫu. Hãy điều chỉnh nội dung và bấm “Lưu nội dung”.");
            }}
          >
            Dùng dữ liệu mẫu
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {blocks.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] p-6 text-center text-sm text-[var(--muted-foreground)]">
            Chưa có nội dung. Hãy thêm khối “Đoạn mô tả” đầu tiên để bắt đầu trình bày.
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <BlockEditor
                key={block._localId}
                index={index}
                total={blocks.length}
                block={block}
                onChange={(updater) => updateBlock(block._localId, updater)}
                onRemove={() => removeBlock(block._localId)}
                onMoveUp={() => moveBlock(block._localId, "up")}
                onMoveDown={() => moveBlock(block._localId, "down")}
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddBlock}
            className="border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)]/5"
            aria-label="Thêm khối nội dung"
          >
            <Plus className="mr-1 h-4 w-4" />
            Thêm khối nội dung
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={updateStory.isPending || !isDirty}
            >
              Khôi phục
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={updateStory.isPending || !isDirty}
            >
              {updateStory.isPending ? "Đang lưu..." : "Lưu nội dung"}
            </Button>
          </div>
        </div>
        <div className="space-y-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)]/40 p-4 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-[var(--foreground)]">Xem trước dành cho ứng viên</h4>
            <p className="text-xs text-[var(--muted-foreground)]">
              Nội dung này hiển thị tại tab “Tổng quan” trên trang công ty.
            </p>
          </div>
          <CompanyStoryRenderer
            blocks={preparedBlocks.length ? preparedBlocks : undefined}
            fallbackDescription={preparedBlocks.length ? undefined : fallbackDescription}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function BlockEditor({
  block,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: EditableBlock;
  index: number;
  total: number;
  onChange: (updater: (block: EditableBlock) => EditableBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">Khối #{index + 1}</p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={onMoveUp}
            disabled={index === 0}
          >
            ↑
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={onMoveDown}
            disabled={index === total - 1}
          >
            ↓
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-red-500 hover:bg-red-500/10"
            onClick={onRemove}
          >
            Xoá
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
        <FormControl label="Loại nội dung">
          <select
            value={block.type}
            onChange={(event) => {
              const type = event.target.value as CompanyStoryBlock["type"];
              onChange((current) => ({
                ...current,
                type,
                body: type === "text" ? current.body ?? "" : undefined,
                items: type === "list" ? current.items ?? [{ id: crypto.randomUUID(), text: "" }] : undefined,
                quote:
                  type === "quote"
                    ? current.quote ?? {
                        text: "",
                        author: "",
                        role: "",
                      }
                    : undefined,
                stats:
                  type === "stats"
                    ? current.stats ?? [{ id: crypto.randomUUID(), label: "", value: "", description: "" }]
                    : undefined,
                media:
                  type === "media"
                    ? current.media ?? [{ id: crypto.randomUUID(), url: "", caption: "" }]
                    : undefined,
              }));
            }}
            className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            {BLOCK_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormControl>

        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <FormControl label="Tiêu đề">
              <Input
                placeholder="Ví dụ: Tầm nhìn"
                value={block.title ?? ""}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </FormControl>
            <FormControl label="Phụ đề / ghi chú">
              <Input
                placeholder="Tuỳ chọn"
                value={block.subtitle ?? ""}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    subtitle: event.target.value,
                  }))
                }
              />
            </FormControl>
          </div>

          <BlockBodyEditor block={block} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}

function BlockBodyEditor({
  block,
  onChange,
}: {
  block: EditableBlock;
  onChange: (updater: (block: EditableBlock) => EditableBlock) => void;
}) {
  switch (block.type) {
    case "text":
      return (
        <FormControl label="Nội dung">
          <Textarea
            placeholder="Viết đoạn mô tả chi tiết..."
            rows={5}
            value={block.body ?? ""}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                body: event.target.value,
              }))
            }
          />
        </FormControl>
      );

    case "list":
      return (
        <FormControl label="Danh sách">
          <div className="space-y-2">
            {(block.items ?? []).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                <Input
                  placeholder={`Mục #${idx + 1}`}
                  value={item.text}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      items: (current.items ?? []).map((i) =>
                        i.id === item.id ? { ...i, text: event.target.value } : i,
                      ),
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    onChange((current) => ({
                      ...current,
                      items: (current.items ?? []).filter((i) => i.id !== item.id),
                    }))
                  }
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange((current) => ({
                  ...current,
                  items: [...(current.items ?? []), { id: crypto.randomUUID(), text: "" }],
                }))
              }
            >
              Thêm mục
            </Button>
          </div>
        </FormControl>
      );

    case "quote":
      return (
        <div className="space-y-3">
          <FormControl label="Nội dung trích dẫn">
            <Textarea
              rows={3}
              placeholder="Lời chia sẻ truyền cảm hứng..."
              value={block.quote?.text ?? ""}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  quote: {
                    ...(current.quote ?? { text: "" }),
                    text: event.target.value,
                  },
                }))
              }
            />
          </FormControl>
          <div className="grid gap-3 md:grid-cols-2">
            <FormControl label="Người nói">
              <Input
                placeholder="Tên người chia sẻ"
                value={block.quote?.author ?? ""}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    quote: {
                      text: current.quote?.text ?? "",
                      author: event.target.value,
                      role: current.quote?.role ?? "",
                    },
                  }))
                }
              />
            </FormControl>
            <FormControl label="Chức danh / vai trò">
              <Input
                placeholder="Ví dụ: CEO"
                value={block.quote?.role ?? ""}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    quote: {
                      text: current.quote?.text ?? "",
                      author: current.quote?.author ?? "",
                      role: event.target.value,
                    },
                  }))
                }
              />
            </FormControl>
          </div>
        </div>
      );

    case "stats":
      return (
        <FormControl label="Nhóm số liệu">
          <div className="space-y-3">
            {(block.stats ?? []).map((stat, idx) => (
              <Fragment key={stat.id}>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <Input
                    placeholder={`Chỉ số #${idx + 1}`}
                    value={stat.label}
                    onChange={(event) =>
                      onChange((current) => ({
                        ...current,
                        stats: (current.stats ?? []).map((s) =>
                          s.id === stat.id ? { ...s, label: event.target.value } : s,
                        ),
                      }))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Giá trị"
                      value={stat.value}
                      onChange={(event) =>
                        onChange((current) => ({
                          ...current,
                          stats: (current.stats ?? []).map((s) =>
                            s.id === stat.id ? { ...s, value: event.target.value } : s,
                          ),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        onChange((current) => ({
                          ...current,
                          stats: (current.stats ?? []).filter((s) => s.id !== stat.id),
                        }))
                      }
                    >
                      ✕
                    </Button>
                  </div>
                </div>
                <Textarea
                  rows={2}
                  placeholder="Mô tả thêm (tuỳ chọn)"
                  value={stat.description ?? ""}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      stats: (current.stats ?? []).map((s) =>
                        s.id === stat.id ? { ...s, description: event.target.value } : s,
                      ),
                    }))
                  }
                />
              </Fragment>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange((current) => ({
                  ...current,
                  stats: [
                    ...(current.stats ?? []),
                    { id: crypto.randomUUID(), label: "", value: "", description: "" },
                  ],
                }))
              }
            >
              Thêm chỉ số
            </Button>
          </div>
        </FormControl>
      );

    case "media":
      return (
        <FormControl label="Thư viện ảnh">
          <div className="space-y-3">
            {(block.media ?? []).map((item, idx) => (
              <div key={item.id} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
                <Input
                  placeholder={`Ảnh #${idx + 1} - URL`}
                  value={item.url}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      media: (current.media ?? []).map((media) =>
                        media.id === item.id ? { ...media, url: event.target.value } : media,
                      ),
                    }))
                  }
                />
                <Input
                  placeholder="Chú thích (tuỳ chọn)"
                  value={item.caption ?? ""}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      media: (current.media ?? []).map((media) =>
                        media.id === item.id ? { ...media, caption: event.target.value } : media,
                      ),
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    onChange((current) => ({
                      ...current,
                      media: (current.media ?? []).filter((media) => media.id !== item.id),
                    }))
                  }
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange((current) => ({
                  ...current,
                  media: [
                    ...(current.media ?? []),
                    { id: crypto.randomUUID(), url: "", caption: "" },
                  ],
                }))
              }
            >
              Thêm ảnh
            </Button>
            <p className="text-xs text-[var(--muted-foreground)]">
              Hỗ trợ link ảnh công khai (S3, Cloudinary, Google Drive đã bật chia sẻ công khai...). Tối ưu kích
              thước khoảng 1280x720px.
            </p>
          </div>
        </FormControl>
      );
    default:
      return null;
  }
}

function toEditableBlocks(blocks?: CompanyStoryBlock[] | null): EditableBlock[] {
  if (!blocks?.length) {
    return [];
  }
  return blocks.map((block) => ({
    _localId: crypto.randomUUID(),
    type: block.type,
    title: block.title,
    subtitle: "subtitle" in block ? block.subtitle : undefined,
    body: block.type === "text" ? block.body ?? "" : undefined,
    items:
      block.type === "list"
        ? (block.items ?? []).map((text) => ({
            id: crypto.randomUUID(),
            text,
          }))
        : undefined,
    quote:
      block.type === "quote"
        ? {
            text: block.quote?.text ?? "",
            author: block.quote?.author ?? "",
            role: block.quote?.role ?? "",
          }
        : undefined,
    stats:
      block.type === "stats"
        ? (block.stats ?? []).map((stat) => ({
            id: crypto.randomUUID(),
            label: stat.label,
            value: stat.value,
            description: stat.description,
          }))
        : undefined,
    media:
      block.type === "media"
        ? (block.media ?? []).map((item) => ({
            id: crypto.randomUUID(),
            url: item.url,
            caption: item.caption,
          }))
        : undefined,
  }));
}

function sanitizeBlocks(blocks: EditableBlock[]): CompanyStoryBlock[] {
  return blocks
    .map<CompanyStoryBlock | null>((block) => {
      switch (block.type) {
        case "text":
          if (!block.body?.trim()) return null;
          return {
            id: block._localId,
            type: "text",
            title: block.title?.trim() || undefined,
            subtitle: block.subtitle?.trim() || undefined,
            body: block.body.trim(),
          };
        case "list":
          if (!block.items?.length) return null;
          const items = block.items.map((item) => item.text.trim()).filter(Boolean);
          if (!items.length) return null;
          return {
            id: block._localId,
            type: "list",
            title: block.title?.trim() || undefined,
            subtitle: block.subtitle?.trim() || undefined,
            items,
          };
        case "quote":
          if (!block.quote?.text.trim()) return null;
          return {
            id: block._localId,
            type: "quote",
            title: block.title?.trim() || undefined,
            quote: {
              text: block.quote.text.trim(),
              author: block.quote.author?.trim() || undefined,
              role: block.quote.role?.trim() || undefined,
            },
          };
        case "stats":
          if (!block.stats?.length) return null;
          const stats = block.stats
            .map((stat) => ({
              label: stat.label.trim(),
              value: stat.value.trim(),
              description: stat.description?.trim() || undefined,
            }))
            .filter((stat) => stat.label && stat.value);
          if (!stats.length) return null;
          return {
            id: block._localId,
            type: "stats",
            title: block.title?.trim() || undefined,
            subtitle: block.subtitle?.trim() || undefined,
            stats,
          };
        case "media":
          if (!block.media?.length) return null;
          const media = block.media
            .map((item) => ({
              url: item.url.trim(),
              caption: item.caption?.trim() || undefined,
            }))
            .filter((item) => item.url);
          if (!media.length) return null;
          return {
            id: block._localId,
            type: "media",
            title: block.title?.trim() || undefined,
            subtitle: block.subtitle?.trim() || undefined,
            media,
          };
        default:
          return null;
      }
    })
    .filter((block): block is CompanyStoryBlock => Boolean(block));
}

function FormControl({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-[var(--foreground)]">{label}</span>
      {children}
    </label>
  );
}

