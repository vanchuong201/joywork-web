"use client";

const ZALO_CONTACT_URL = "https://zalo.me/0338685855";

export default function ZaloFloatingButton() {
  return (
    <a
      href={ZALO_CONTACT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nhắn tin Zalo với JOYWORK"
      title="Nhắn tin Zalo"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#0068ff] text-[11px] font-bold leading-none text-white shadow-lg transition-transform hover:scale-105 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0068ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] md:bottom-6 md:right-24"
    >
      Zalo
    </a>
  );
}
