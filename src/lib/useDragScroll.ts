"use client";

import { useEffect, useRef } from "react";

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const state = useRef({ dragging: false, startX: 0, startScrollLeft: 0, moved: false });

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

  // Axis-locked touch scrolling: let the browser handle scrolling (and its
  // momentum) entirely natively — we never preventDefault — but once a
  // gesture's direction is clear, clip the other axis with overflow:hidden
  // so it can't also move for the rest of that gesture. This avoids the
  // reliability issues of relying on CSS touch-action alone across iOS
  // Safari versions, without having to reimplement scroll physics by hand.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let axis: "x" | "y" | null = null;
    let startX = 0;
    let startY = 0;

    function reset() {
      axis = null;
      el!.style.overflowX = "";
      el!.style.overflowY = "";
    }

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      reset();
    }

    function onTouchMove(e: TouchEvent) {
      if (axis) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      el!.style[axis === "x" ? "overflowY" : "overflowX"] = "hidden";
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", reset, { passive: true });
    el.addEventListener("touchcancel", reset, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", reset);
      el.removeEventListener("touchcancel", reset);
      el.style.overflowX = "";
      el.style.overflowY = "";
    };
  }, []);

  return { ref, onMouseDown, onMouseMove, onMouseUp: endDrag, onMouseLeave: endDrag, onClickCapture };
}
