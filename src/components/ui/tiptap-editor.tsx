"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { cn } from "@/lib/utils";
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo, Link as LinkIcon } from "lucide-react";
import { Button } from "./button";
import { toast } from "sonner";

type TiptapEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onBlur?: () => void;
};

export default function TiptapEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className,
  disabled = false,
  onBlur,
}: TiptapEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    onBlur,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3",
      },
    },
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!isMounted || !editor) {
    return (
      <div
        className={cn(
          "rounded-md border border-[var(--border)] bg-[var(--input)] overflow-hidden min-h-[200px]",
          className
        )}
      >
        <div className="p-4 text-sm text-[var(--muted-foreground)]">{placeholder}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border border-[var(--border)] bg-[var(--input)] overflow-hidden",
        className
      )}
    >
      {/* Toolbar */}
      {!disabled && (
        <div className="flex items-center gap-1 p-2 border-b border-[var(--border)] bg-[var(--muted)]/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("bold") && "bg-[var(--muted)]"
            )}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("italic") && "bg-[var(--muted)]"
            )}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-[var(--border)] mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("bulletList") && "bg-[var(--muted)]"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("orderedList") && "bg-[var(--muted)]"
            )}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("blockquote") && "bg-[var(--muted)]"
            )}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-[var(--border)] mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt("Nhập URL: Ví dụ: https://www.google.com");
              // Nếu bấm Cancel thì url === null -> không làm gì cả (không hiện toast)
              if (url === null) return;
              if (url && url.startsWith("http")) {
                editor.chain().focus().setLink({ href: url }).run();
              } else {
                toast.error("Vui lòng nhập URL hợp lệ");
              }
            }}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("link") && "bg-[var(--muted)]"
            )}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
