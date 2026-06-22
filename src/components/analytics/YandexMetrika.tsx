"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

const COUNTER_ID_PATTERN = /^\d+$/;

export function YandexMetrika() {
  const rawCounterId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID?.trim();
  const counterId = rawCounterId && COUNTER_ID_PATTERN.test(rawCounterId) ? rawCounterId : null;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = useMemo(() => {
    const query = searchParams.toString();

    return query.length > 0 ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!counterId || typeof window === "undefined" || typeof window.ym !== "function") {
      return;
    }

    const currentHref = window.location.href;
    const previousUrl = previousUrlRef.current;

    if (previousUrl && previousUrl !== currentHref) {
      window.ym(Number(counterId), "hit", currentHref, {
        referer: previousUrl,
      });
    }

    previousUrlRef.current = currentHref;
  }, [counterId, currentUrl]);

  if (!counterId) {
    return null;
  }

  const watchUrl = `https://mc.yandex.ru/watch/${encodeURIComponent(counterId)}`;

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${counterId}', 'ym');

          ym(${counterId}, 'init', {
            ssr: true,
            webvisor: true,
            clickmap: true,
            ecommerce: 'dataLayer',
            referrer: document.referrer,
            url: location.href,
            accurateTrackBounce: true,
            trackLinks: true
          });
        `}
      </Script>
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={watchUrl} style={{ position: "absolute", left: "-9999px" }} alt="" />
        </div>
      </noscript>
    </>
  );
}
