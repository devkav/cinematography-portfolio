import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router";

// Start new pages at the top. Back/forward (POP) keeps the browser's scroll position.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

  return null;
}
