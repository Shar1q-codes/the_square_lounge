"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { display, site } from "@/config/site";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ExpandIcon } from "@/components/ui/icons";
import { useLenis } from "@/components/layout/SmoothScroll";

const images = site.gallery;

export function Gallery() {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const openedFrom = useRef(0);
  const lenis = useLenis();

  const open = (i: number) => {
    openedFrom.current = i;
    setIndex(i);
    dialogRef.current?.showModal();
    lenis?.stop();
  };

  const close = useCallback(() => dialogRef.current?.close(), []);

  // The dialog fires "close" for Esc, the close button and backdrop clicks alike.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      lenis?.start();
      setIndex(null);
      triggerRefs.current[openedFrom.current]?.focus();
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [lenis]);

  const step = (dir: 1 | -1) =>
    setIndex((i) => (i === null ? i : (i + dir + images.length) % images.length));

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  };

  const current = index === null ? null : images[index];

  return (
    <Section id="gallery">
      <Reveal>
        <SectionHeading
          sectionId="gallery"
          eyebrow="Gallery"
          title="Inside the lounge."
          description="A look at the stations, the seating and the after-dark glow."
        />
      </Reveal>

      <Reveal stagger className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
        {images.map((img, i) => (
          <figure key={img.src} className="mb-5 break-inside-avoid">
            <button
              ref={(el) => {
                triggerRefs.current[i] = el;
              }}
              type="button"
              onClick={() => open(i)}
              aria-label={`View larger: ${display(img.alt)}`}
              className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-surface transition-[border-color,box-shadow] duration-500 ease-premium hover:border-gold/50 hover:shadow-[0_0_40px_rgb(212_178_106/0.12)]"
            >
              <Image
                src={img.src}
                alt={display(img.alt)}
                width={img.width}
                height={img.height}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-linear-to-t from-bg/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <span className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-sm font-medium opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                {img.caption}
                <ExpandIcon className="size-4 text-gold" />
              </span>
            </button>
          </figure>
        ))}
      </Reveal>

      <dialog
        ref={dialogRef}
        aria-label="Photo viewer"
        onKeyDown={onKeyDown}
        onClick={(e) => {
          // Clicks on the dimmed area (not the photo or controls) close the viewer
          const target = e.target as HTMLElement;
          if (target === e.currentTarget || target.hasAttribute("data-backdrop")) close();
        }}
        data-lenis-prevent
        className="lightbox m-auto max-h-none max-w-none bg-transparent p-0 text-fg backdrop:bg-bg/90 backdrop:backdrop-blur-md"
      >
        {current && index !== null && (
          <div data-backdrop className="flex h-dvh w-screen flex-col items-center justify-center gap-4 px-4 py-6 sm:px-16">
            <div className="flex w-full max-w-5xl items-center justify-between text-sm text-muted">
              <p aria-live="polite">
                <span className="text-fg">{current.caption}</span>
                <span className="mx-2">·</span>
                {index + 1} / {images.length}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Close photo viewer"
                className="inline-flex size-10 items-center justify-center rounded-full border border-border-strong transition-colors hover:border-gold/60 hover:text-gold"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
            <div data-backdrop className="relative flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center">
              <Image
                key={current.src}
                src={current.src}
                alt={display(current.alt)}
                width={current.width}
                height={current.height}
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="max-h-full w-auto animate-fade-up rounded-xl border border-border object-contain"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="inline-flex size-11 items-center justify-center rounded-full border border-border-strong transition-colors hover:border-gold/60 hover:text-gold"
              >
                <ChevronLeftIcon className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className="inline-flex size-11 items-center justify-center rounded-full border border-border-strong transition-colors hover:border-gold/60 hover:text-gold"
              >
                <ChevronRightIcon className="size-5" />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </Section>
  );
}
