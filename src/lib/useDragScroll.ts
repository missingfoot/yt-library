"use client";

import { useRef } from "react";

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

  return { ref, onMouseDown, onMouseMove, onMouseUp: endDrag, onMouseLeave: endDrag, onClickCapture };
}
