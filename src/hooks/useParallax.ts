import { CSSProperties, useEffect, useRef, useState } from "react";

// Simple parallax hook. Apply returned style to any element you want to parallax.
export function useParallax(strength: number = 0.25) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<CSSProperties>({ willChange: "transform" });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      // progress from -1 (above) to 1 (below)
      const progress = (rect.top + rect.height / 2 - viewportH / 2) / (viewportH / 2);
      const translateY = progress * -strength * 40; // max ~ +/-10px at 0.25 strength
      setStyle({ transform: `translateY(${translateY.toFixed(2)}px)`, willChange: "transform" });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [strength]);

  return { ref, style } as const;
}
