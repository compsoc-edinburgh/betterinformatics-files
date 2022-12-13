/* eslint-disable react-hooks/exhaustive-deps */
// Modified version of https://github.com/umijs/hooks/blob/master/packages/hooks/src/useInViewport/index.ts
/*
MIT License

Copyright (c) 2019 umijs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { useRef, useLayoutEffect, useState, MutableRefObject } from "react";

import "intersection-observer";
const radius = 500;

type Arg = HTMLElement | (() => HTMLElement) | null;
type InViewport = boolean | undefined;

function isInViewPort(el: HTMLElement): boolean {
  if (!el) {
    return false;
  }

  const viewPortWidth =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;
  const viewPortHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  const rect = el.getBoundingClientRect();

  if (rect) {
    const { top, bottom, left, right } = {
      top: rect.top - radius,
      bottom: rect.bottom + radius,
      left: rect.left - radius,
      right: rect.right + radius,
    };
    return (
      bottom > 0 && top <= viewPortHeight && left <= viewPortWidth && right > 0
    );
  }

  return false;
}

function useLoad<T extends HTMLElement = HTMLElement>(): [
  InViewport,
  MutableRefObject<T>,
];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useLoad<T extends HTMLElement = HTMLElement>(arg: Arg): [InViewport];
function useLoad<T extends HTMLElement = HTMLElement>(
  ...args: [Arg] | []
): [InViewport, MutableRefObject<T>?] {
  const element = useRef<T>();
  const hasPassedInElement = args.length === 1;
  const arg = useRef(args[0]);
  [arg.current] = args;
  const [inViewPort, setInViewport] = useState<InViewport>(() => {
    const initDOM =
      typeof arg.current === "function" ? arg.current() : arg.current;

    return isInViewPort(initDOM as HTMLElement);
  });

  useLayoutEffect(() => {
    const passedInElement =
      typeof arg.current === "function" ? arg.current() : arg.current;

    const targetElement = hasPassedInElement
      ? passedInElement
      : element.current;

    if (!targetElement) {
      return () => {};
    }

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInViewport(true);
          }
        }
      },
      { rootMargin: `${radius}px ${radius}px ${radius}px ${radius}px` },
    );

    observer.observe(targetElement);

    return () => {
      observer.disconnect();
    };
  }, [
    element.current,
    typeof arg.current === "function" ? undefined : arg.current,
  ]);

  if (hasPassedInElement) {
    return [inViewPort];
  }

  return [inViewPort, element as MutableRefObject<T>];
}

export default useLoad;
