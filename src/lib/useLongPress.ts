"use client";

import { useRef } from "react";

interface Point {
  x: number;
  y: number;
}

export function useLongPress<T>(onLongPress: (data: T, point: Point) => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);
  const startRef = useRef<Point>({ x: 0, y: 0 });

  function clear() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function getHandlers(data: T) {
    return {
      onTouchStart(e: React.TouchEvent) {
        const touch = e.touches[0];
        startRef.current = { x: touch.clientX, y: touch.clientY };
        triggeredRef.current = false;
        clear();
        timerRef.current = setTimeout(() => {
          triggeredRef.current = true;
          onLongPress(data, startRef.current);
        }, delay);
      },
      onTouchMove(e: React.TouchEvent) {
        const touch = e.touches[0];
        const dx = touch.clientX - startRef.current.x;
        const dy = touch.clientY - startRef.current.y;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) clear();
      },
      onTouchEnd: clear,
      onTouchCancel: clear,
      onClickCapture(e: React.MouseEvent) {
        if (triggeredRef.current) {
          e.stopPropagation();
          e.preventDefault();
          triggeredRef.current = false;
        }
      },
    };
  }

  return { getHandlers };
}
