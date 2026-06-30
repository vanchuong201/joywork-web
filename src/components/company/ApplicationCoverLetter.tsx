"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  textClassName?: string;
  clampClass?: string;
};

export default function ApplicationCoverLetter({
  text,
  textClassName = "text-sm",
  clampClass = "line-clamp-2",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!contentRef.current || expanded) {
      return;
    }
    const el = contentRef.current;
    const checkOverflow = () => {
      setShowToggle(el.scrollHeight > el.clientHeight + 4);
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [expanded, text, clampClass]);

  return (
    <div className="border-t border-[var(--border)] pt-2">
      <p className="mb-1 text-xs font-medium text-[var(--muted-foreground)]">Thư giới thiệu:</p>
      <p
        ref={contentRef}
        className={cn(
          "whitespace-pre-line leading-relaxed text-[var(--muted-foreground)]",
          textClassName,
          !expanded && clampClass
        )}
      >
        {text}
      </p>
      {showToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 text-xs font-medium text-[var(--brand)] hover:underline"
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      ) : null}
    </div>
  );
}
