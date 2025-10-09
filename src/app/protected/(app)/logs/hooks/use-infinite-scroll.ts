import { useEffect } from "react";

export function useInfiniteScroll(
  targetRef: React.RefObject<Element | null>,
  options: { enabled: boolean; onLoadMore: () => void }
) {
  const { enabled, onLoadMore } = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const target = targetRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "160px" }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [enabled, onLoadMore, targetRef]);
}
