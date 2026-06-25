"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const PIXEL_ID_PATTERN = /^\d+$/;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function MetaPixel() {
  const rawPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const pixelId = rawPixelId && PIXEL_ID_PATTERN.test(rawPixelId) ? rawPixelId : null;
  const pathname = usePathname();
  const hasTrackedInitialPageView = useRef(false);

  useEffect(() => {
    if (!pixelId || typeof window === "undefined" || typeof window.fbq !== "function") {
      return;
    }

    if (!hasTrackedInitialPageView.current) {
      hasTrackedInitialPageView.current = true;
      return;
    }

    window.fbq("track", "PageView");
  }, [pixelId, pathname]);

  if (!pixelId) {
    return null;
  }

  const noscriptUrl = `https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1`;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: "none" }} src={noscriptUrl} alt="" />
      </noscript>
    </>
  );
}
