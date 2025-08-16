import { useEffect, useState } from "react";

interface Options {
  rootMargin?: string;
  threshold?: number | number[];
}

// Returns the id of the section that's currently in view
export function useScrollSpy(
  sectionIds: string[],
  { rootMargin = "-50% 0px -40% 0px", threshold = [0, 0.25, 0.5, 0.75, 1] }: Options = {}
) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          const id = visible[0].target.getAttribute("id");
          if (id) setActiveId(id);
        } else {
          // Fallback: pick the first section above the fold
          const topMost = entries
            .slice()
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
          const id = topMost?.target.getAttribute("id");
          if (id) setActiveId(id);
        }
      },
      { rootMargin, threshold }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootMargin, sectionIds.join("|"), Array.isArray(threshold) ? threshold.join("|") : threshold]);

  return activeId;
}
