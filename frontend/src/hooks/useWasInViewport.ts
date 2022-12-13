import { useRef, useState } from "react";

const useWasInViewport = <T extends HTMLElement>() => {
  const observer: React.MutableRefObject<IntersectionObserver | undefined> =
    useRef<IntersectionObserver | undefined>();
  const [wasInView, setWasInView] = useState(false);

  const ref: React.Ref<T> = (element: T | null) => {
    const oldObserver = observer.current;
    if (oldObserver) oldObserver.disconnect();
    if (element === null) return;
    const newObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === element && entry.isIntersecting) {
          setWasInView(true);
        }
      }
    });
    newObserver.observe(element);
    observer.current = newObserver;
    newObserver.observe(element);
  };

  return [wasInView, ref] as const;
};

export default useWasInViewport;
