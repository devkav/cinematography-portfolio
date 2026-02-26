import { useEffect, useMemo, useState } from "react";

export default function useOnScreen(ref: React.RefObject<HTMLDivElement | null>) {
  const [isIntersecting, setIntersecting] = useState(false);

  const observer = useMemo(() => new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting)), [ref]);

  useEffect(() => {
    if (ref.current != null) {
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [ref]);

  return isIntersecting;
}
