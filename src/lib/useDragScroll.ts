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
    startScrollTop: 0,
    lastX: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
  });
  const momentumFrame = useRef<number | null>(null);

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

  // Fully manual axis-locked touch scrolling: whichever direction the
  // gesture starts in (x or y) is the only direction that moves for the
  // rest of that gesture, so the two can never combine into a diagonal
  // pan. Relying on CSS touch-action (e.g. pan-y) for this isn't reliable
  // enough across iOS Safari versions, so we take over both axes here and
  // apply simple momentum on release to keep vertical scrolling feeling
  // native.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function stopMomentum() {
      if (momentumFrame.current !== null) {
        cancelAnimationFrame(momentumFrame.current);
        momentumFrame.current = null;
      }
    }

    function onTouchStart(e: TouchEvent) {
      stopMomentum();
      const t = e.touches[0];
      touchState.current.dragging = true;
      touchState.current.axis = null;
      touchState.current.startX = t.clientX;
      touchState.current.startY = t.clientY;
      touchState.current.startScrollLeft = el!.scrollLeft;
      touchState.current.startScrollTop = el!.scrollTop;
      touchState.current.lastX = t.clientX;
      touchState.current.lastY = t.clientY;
      touchState.current.lastT = e.timeStamp;
      touchState.current.velocity = 0;
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

      e.preventDefault();

      if (touchState.current.axis === "x") {
        el!.scrollLeft = touchState.current.startScrollLeft - dx;
      } else {
        el!.scrollTop = touchState.current.startScrollTop - dy;
      }

      const dt = e.timeStamp - touchState.current.lastT;
      if (dt > 0) {
        const delta = touchState.current.axis === "x" ? t.clientX - touchState.current.lastX : t.clientY - touchState.current.lastY;
        touchState.current.velocity = delta / dt;
      }
      touchState.current.lastX = t.clientX;
      touchState.current.lastY = t.clientY;
      touchState.current.lastT = e.timeStamp;
    }

    function onTouchEnd() {
      touchState.current.dragging = false;
      const axis = touchState.current.axis;
      touchState.current.axis = null;
      if (!axis) return;

      let velocity = touchState.current.velocity * 16; // px per ~frame
      const friction = 0.95;

      function step() {
        if (Math.abs(velocity) < 0.5) {
          momentumFrame.current = null;
          return;
        }
        if (axis === "x") {
          el!.scrollLeft -= velocity;
        } else {
          el!.scrollTop -= velocity;
        }
        velocity *= friction;
        momentumFrame.current = requestAnimationFrame(step);
      }
      momentumFrame.current = requestAnimationFrame(step);
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      stopMomentum();
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return { ref, onMouseDown, onMouseMove, onMouseUp: endDrag, onMouseLeave: endDrag, onClickCapture };
}
