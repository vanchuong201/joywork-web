import Script from "next/script";

const DEFAULT_MEASUREMENT_ID = "G-6Z7E7Z0HER";
const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;

export function GoogleAnalytics() {
  const raw = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const id = raw && raw.length > 0 ? raw : DEFAULT_MEASUREMENT_ID;
  if (!GA_MEASUREMENT_ID_PATTERN.test(id)) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
