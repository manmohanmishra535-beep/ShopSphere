"use client";

import { useRef, useState } from "react";
import { ZoomIn } from "lucide-react";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/format";

export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const frameRef = useRef<HTMLDivElement>(null);

  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      <div className="hide-scrollbar flex gap-2 overflow-x-auto md:w-[76px] md:flex-col md:overflow-visible">
        {images.map((image, index) => (
          <button
            key={image.url}
            onClick={() => setActive(index)}
            className={cn(
              "relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-lg border bg-surface transition-all md:w-full",
              index === active ? "border-primary ring-1 ring-primary/30" : "border-border opacity-75 hover:opacity-100"
            )}
            aria-label={`Show image ${index + 1} of ${images.length}`}
            aria-current={index === active}
          >
            <img src={image.url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <div
        ref={frameRef}
        className="group relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-xl border border-border bg-surface"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => {
          setZoom(false);
          setOrigin("50% 50%");
        }}
        onMouseMove={(event) => {
          if (!frameRef.current) return;
          const rect = frameRef.current.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 100;
          const y = ((event.clientY - rect.top) / rect.height) * 100;
          setOrigin(`${x}% ${y}%`);
        }}
      >
        <img
          src={current.url}
          alt={current.alt || title}
          className="h-full w-full object-cover transition-transform duration-300 ease-out"
          style={{ transform: zoom ? "scale(1.7)" : "scale(1)", transformOrigin: origin }}
        />
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-bg/85 px-2.5 py-1 text-[10px] font-medium text-muted backdrop-blur transition-opacity group-hover:opacity-0">
          <ZoomIn className="h-3 w-3" /> Hover to zoom
        </div>
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-bg/85 px-2.5 py-1 text-[10px] font-medium text-muted backdrop-blur md:hidden">
          {active + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
