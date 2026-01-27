"use client";

import { Button } from "./button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 7;
    const sideCount = 2; // Number of pages to show on each side of current page

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of middle section
      let start = Math.max(2, currentPage - sideCount);
      let end = Math.min(totalPages - 1, currentPage + sideCount);

      // Adjust if we're near the start (show more pages at the beginning)
      if (currentPage <= sideCount + 2) {
        end = Math.min(maxVisible - 2, totalPages - 1); // -2 to account for first and last page
        start = 2;
      }
      // Adjust if we're near the end (show more pages at the end)
      else if (currentPage >= totalPages - sideCount - 1) {
        start = Math.max(2, totalPages - maxVisible + 3); // +3 to account for first, last, and ellipsis
        end = totalPages - 1;
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push("ellipsis");
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only md:not-sr-only md:ml-1">Trước</span>
      </Button>

      {pageNumbers.map((page, index) => {
        if (page === "ellipsis") {
          return (
            <div
              key={`ellipsis-${index}`}
              className="flex h-8 w-8 items-center justify-center"
            >
              <MoreHorizontal className="h-4 w-4 text-[var(--muted-foreground)]" />
            </div>
          );
        }

        return (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={cn(
              "min-w-[2rem]",
              page === currentPage && "font-semibold"
            )}
            aria-label={`Trang ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Trang sau"
      >
        <span className="sr-only md:not-sr-only md:mr-1">Sau</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
