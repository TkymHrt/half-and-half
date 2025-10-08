import { useCallback, useEffect } from "react";

export function useInfiniteScroll(
  loadMoreRef: React.RefObject<HTMLElement | null>,
  loadMore: () => void,
  hasMore: boolean,
  isLoading: boolean
) {
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    },
    [hasMore, isLoading, loadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection, loadMoreRef]);
}
