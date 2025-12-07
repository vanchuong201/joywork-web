"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

type HashtagInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  className?: string;
};

export default function HashtagInput({
  value = [],
  onChange,
  maxTags = 5,
  placeholder = "Thêm hashtag...",
  className,
}: HashtagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce input for API search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Fetch suggestions
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["hashtag-suggest", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];
      try {
        const res = await api.get("/api/hashtags/suggest", {
          params: { query: debouncedSearch, limit: 5 },
        });
        return (res.data?.data?.items ?? []) as { id: string; slug: string; label: string }[];
      } catch {
        return [];
      }
    },
    enabled: debouncedSearch.length > 0,
    staleTime: 60000,
  });

  // Handle outside click to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().replace(/^#/, ""); // Remove leading # if user typed it
    if (!trimmed) return;
    
    // Check dupliate (case insensitive)
    if (value.some(v => v.toLowerCase() === trimmed.toLowerCase())) {
        setInputValue("");
        setShowSuggestions(false);
        return;
    }

    if (value.length >= maxTags) {
        setInputValue("");
        setShowSuggestions(false);
        return;
    }

    onChange([...value, trimmed]);
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
        e.preventDefault();
        addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeTag(value.length - 1);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {value.map((tag, index) => (
          <Badge key={index} className="gap-1 pr-1 bg-blue-50 text-blue-700 hover:bg-blue-100">
            #{tag}
            <button
              type="button"
              className="ml-1 rounded-full p-0.5 hover:bg-blue-200/50"
              onClick={() => removeTag(index)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        {value.length < maxTags && (
            <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[120px]"
            placeholder={value.length === 0 ? placeholder : ""}
            value={inputValue}
            onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            />
        )}
      </div>
      
      {/* Suggestions Dropdown */}
      {showSuggestions && inputValue.trim() && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-md animate-in fade-in-0 zoom-in-95">
            {isLoading ? (
                <div className="flex items-center justify-center p-2 text-xs text-muted-foreground">
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Đang tìm...
                </div>
            ) : suggestions && suggestions.length > 0 ? (
                <ul className="max-h-60 overflow-auto py-1">
                    {suggestions.map((item) => (
                        <li
                            key={item.id}
                            className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                            onClick={() => addTag(item.label)}
                        >
                            <span className="font-medium">#{item.label}</span>
                            <span className="ml-2 text-xs text-muted-foreground">({item.slug})</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="p-2 text-xs text-muted-foreground text-center">
                    Nhấn Enter để tạo mới: <span className="font-medium text-foreground">#{inputValue}</span>
                </div>
            )}
        </div>
      )}
      
      {value.length >= maxTags && (
        <p className="mt-1 text-xs text-muted-foreground">Đã đạt tối đa {maxTags} hashtag.</p>
      )}
    </div>
  );
}


