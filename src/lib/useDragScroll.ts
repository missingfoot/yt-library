"use client";

import { useEffect, useRef } from "react";

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const state = useRef({ dragging: false, startX: 0, startScrollLeft: 0, moved: false });
  const touchState = useRef({
    dragging: false,
    axis: null as "x" | "y" | null,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
  });

  function onMouseDown(e: React.MouseEvent) {
    if (!ref.current) return;
    state.current.dragging = true;
    state.current.moved = false;
    state.current.startX = e.clientX;
    state.current.startScrollLeft = ref.current.scrollLeft;
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!state.current.dragging || !ref.current) return;
    const dx = e.clientX - state.current.startX;
    if (Math.abs(dx) > 3) state.current.moved = true;
    ref.current.scrollLeft = state.current.startScrollLeft - dx;
  }

  function endDrag() {
    state.current.dragging = false;
  }

  function onClickCapture(e: React.MouseEvent) {
    if (state.current.moved) {
      e.stopPropagation();
      e.preventDefault();
      state.current.moved = false;
    }
  }

  // Axis-locked touch scrolling: horizontal drags are driven manually (and
  // block vertical movement for the rest of the gesture), while vertical
  // drags are left to native scrolling (touch-action: pan-y on the element)
  // so the two can never combine into a diagonal pan.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      touchState.current.dragging = true;
      touchState.current.axis = null;
      touchState.current.startX = t.clientX;
      touchState.current.startY = t.clientY;
      touchState.current.startScrollLeft = el!.scrollLeft;
    }

    function onTouchMove(e: TouchEvent) {
      if (!touchState.current.dragging) return;
      const t = e.touches[0];
      const dx = t.clientX - touchState.current.startX;
      const dy = t.clientY - touchState.current.startY;

      if (touchState.current.axis === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        touchState.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }

      if (touchState.current.axis === "x") {
        e.preventDefault();
        el!.scrollLeft = touchState.current.startScrollLeft - dx;
      }
    }

    function onTouchEnd() {
      touchState.current.dragging = false;
      touchState.current.axis = null;
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return { ref, onMouseDown, onMouseMove, onMouseUp: endDrag, onMouseLeave: endDrag, onClickCapture };
}
