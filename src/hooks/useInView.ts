"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function useInView<T extends Element = Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  const setRef = useCallback((node: T | null) => {
    ref.current = node;
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, options ?? { root: null, rootMargin: "0px", threshold: 0.1 });

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { ref: setRef, inView } as const;
}



