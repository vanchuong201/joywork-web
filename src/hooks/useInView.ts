"use client";

import { useCallback, useEffect, useState } from "react";

export default function useInView<T extends Element = Element>(options?: IntersectionObserverInit) {
  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(false);

  const root = options?.root ?? null;
  const rootMargin =
    typeof options?.rootMargin === "string" ? options.rootMargin : "0px";
  const threshold = options?.threshold !== undefined ? options.threshold : 0;

  const setRef = useCallback((next: T | null) => {
    if (next === null) setInView(false);
    setNode(next);
  }, []);

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, { root, rootMargin, threshold });

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [node, root, rootMargin, threshold]);

  return { ref: setRef, inView } as const;
}



