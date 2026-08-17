"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type HeroBannerSlide = {
  id: string;
  src: string;
  alt: string;
  href: string;
  openInNewTab: boolean;
};

const BANNER_SRC = "/banner/banner_100dn.png";
const BANNER_ALT = "100 doanh nghiệp có môi trường làm việc tốt";
const BANNER_HREF = "https://doanhnghieptot.joywork.vn/";
const HOMEPAGE_HERO_SLOT = "homepage-hero";

const HERO_BANNER_SLIDES_FALLBACK: HeroBannerSlide[] = [
  { id: "1", src: BANNER_SRC, alt: BANNER_ALT, href: BANNER_HREF, openInNewTab: true },
  { id: "2", src: BANNER_SRC, alt: BANNER_ALT, href: BANNER_HREF, openInNewTab: true },
  { id: "3", src: BANNER_SRC, alt: BANNER_ALT, href: BANNER_HREF, openInNewTab: true },
];

const AUTOPLAY_DELAY_MS = 4500;

type PublicBannerItem = {
  id: string;
  imageUrl: string;
  href: string;
  alt: string;
  openInNewTab: boolean;
};

type HeroBannerCarouselProps = {
  variant?: "default" | "mobile";
};

export default function HeroBannerCarousel({ variant = "default" }: HeroBannerCarouselProps) {
  const isMobile = variant === "mobile";
  const [slides, setSlides] = useState<HeroBannerSlide[]>(HERO_BANNER_SLIDES_FALLBACK);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [
      Autoplay({
        delay: AUTOPLAY_DELAY_MS,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadBanners() {
      try {
        const res = await api.get<{ data: { items: PublicBannerItem[] } }>("/api/banners", {
          params: { slot: HOMEPAGE_HERO_SLOT },
        });
        const items = res.data?.data?.items ?? [];
        if (cancelled) return;
        if (!items.length) {
          setSlides(HERO_BANNER_SLIDES_FALLBACK);
          return;
        }
        setSlides(
          items.map((item) => ({
            id: item.id,
            src: item.imageUrl,
            alt: item.alt,
            href: item.href,
            openInNewTab: item.openInNewTab !== false,
          }))
        );
      } catch {
        if (!cancelled) {
          setSlides(HERO_BANNER_SLIDES_FALLBACK);
        }
      }
    }

    void loadBanners();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, slides]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = emblaApi.plugins()?.autoplay;
    if (!autoplay) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncAutoplay = () => {
      if (mediaQuery.matches) {
        autoplay.stop();
      } else {
        autoplay.play();
      }
    };

    syncAutoplay();
    mediaQuery.addEventListener("change", syncAutoplay);
    return () => mediaQuery.removeEventListener("change", syncAutoplay);
  }, [emblaApi]);

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isMobile
          ? "aspect-[16/9] rounded-[20px] bg-[#12103A]"
          : "min-h-[180px] rounded-[10px] border border-white/10 lg:min-h-[230px]"
      )}
    >
      <div
        className={cn(
          "h-full overflow-hidden",
          isMobile ? "absolute inset-0" : "min-h-[180px] lg:min-h-[230px]"
        )}
        ref={emblaRef}
      >
        <div
          className={cn(
            "flex h-full",
            isMobile ? "" : "min-h-[180px] lg:min-h-[230px]"
          )}
        >
          {slides.map((slide, index) => (
            <div key={slide.id} className="min-w-0 flex-[0_0_100%]">
              <a
                href={slide.href}
                target={slide.openInNewTab ? "_blank" : undefined}
                rel={slide.openInNewTab ? "noopener noreferrer" : undefined}
                className={cn(
                  "block h-full",
                  isMobile ? "" : "min-h-[180px] lg:min-h-[230px]"
                )}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  width={1942}
                  height={809}
                  priority={index === 0}
                  sizes={isMobile ? "100vw" : "(max-width: 1024px) 100vw, 860px"}
                  className="h-full w-full object-cover"
                />
              </a>
            </div>
          ))}
        </div>
      </div>

      {!isMobile && (
        <>
          <button
            type="button"
            aria-label="Banner trước"
            onClick={() => emblaApi?.scrollPrev()}
            className={cn(
              "absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full",
              "border border-white/30 bg-black/35 text-white shadow-sm backdrop-blur-sm",
              "transition-colors hover:bg-black/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Banner sau"
            onClick={() => emblaApi?.scrollNext()}
            className={cn(
              "absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full",
              "border border-white/30 bg-black/35 text-white shadow-sm backdrop-blur-sm",
              "transition-colors hover:bg-black/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      <div
        className={cn(
          "absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center",
          isMobile ? "gap-1.5" : "gap-2"
        )}
        role="tablist"
        aria-label="Điều hướng banner"
      >
        {slides.map((slide, index) => {
          const isActive = selectedIndex === index;
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Chuyển tới banner ${index + 1}`}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                isMobile
                  ? cn(
                      "h-1 rounded-full",
                      isActive ? "w-[18px] bg-white" : "w-1 bg-white/45 hover:bg-white/70"
                    )
                  : cn(
                      "h-2 w-2 rounded-full",
                      isActive
                        ? "bg-[var(--brand-secondary)]"
                        : "bg-white/50 hover:bg-white/80"
                    )
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
