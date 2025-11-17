"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import "@uiw/react-md-editor/markdown-editor.css";
import MDEditor, { getExtraCommands } from "@uiw/react-md-editor";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: RichTextEditorProps) {
  const extraCommands = useMemo(() => (disabled ? [] : getExtraCommands()), [disabled]);

  return (
    <div
      className={cn(
        "rounded-md border border-[var(--border)] bg-[var(--input)] [&_.wmde-markdown]:bg-[var(--input)]",
        className,
      )}
      data-color-mode="light"
    >
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? "")}
        textareaProps={{ placeholder }}
        hideToolbar={disabled}
        visibleDragbar={false}
        preview="edit"
        extraCommands={extraCommands}
        height={260}
      />
    </div>
  );
}
