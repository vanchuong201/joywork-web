import Script from "next/script";

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;

export function GoogleAnalytics() {
  // Chỉ bật GA khi có measurement ID được set qua env (chỉ prod set biến này),
  // nên dev/staging sẽ không load gtag và không gửi event nào.
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!id || !GA_MEASUREMENT_ID_PATTERN.test(id)) {
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
