import { useEffect, useState } from "react";

const KEY = "l2m-presenter";

/** Reads ?presenter=1/0 from the URL, remembers it per tab, and returns whether presenter mode is on. */
export function usePresenterMode(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => {
      try {
        const p = new URLSearchParams(window.location.search).get("presenter");
        if (p === "1") sessionStorage.setItem(KEY, "1");
        else if (p === "0") sessionStorage.removeItem(KEY);
        setOn(sessionStorage.getItem(KEY) === "1");
      } catch {
        setOn(false);
      }
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  return on;
}
