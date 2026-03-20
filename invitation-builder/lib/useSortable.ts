"use client";

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";

export interface SortableItem {
  id: string;
}

export interface UseSortableOptions<T extends SortableItem> {
  items: T[];
  onReorder: (reordered: T[]) => void;
}

export interface SortableItemProps {
  /** 이 아이템의 드래그 핸들에 spread */
  handleProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    style: React.CSSProperties;
    "aria-label": string;
  };
  /** 이 아이템의 wrapper에 spread */
  wrapperProps: {
    onPointerEnter: () => void;
    style: React.CSSProperties;
    className: string;
    ref: (el: HTMLDivElement | null) => void;
  };
  /** 현재 드래그 중인 아이템인지 */
  isDragging: boolean;
  /** 다른 아이템이 이 위치 위로 드래그되고 있는지 */
  isOver: boolean;
}

/**
 * iOS 스타일 드래그 재정렬 훅.
 *
 * 드래그 시작 → 다른 아이템 위로 포인터가 이동하면 즉시 splice로 밀어냄 →
 * 포인터 올리면 확정.
 *
 * 세로/가로 모두 동작하며, CSS transition은 wrapper의 className으로 제공한다.
 */
export function useSortable<T extends SortableItem>({
  items,
  onReorder,
}: UseSortableOptions<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const prevRectsRef = useRef(new Map<string, DOMRect>());
  const shouldAnimateRef = useRef(false);

  useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>();
    for (const item of items) {
      const el = itemRefs.current.get(item.id);
      if (!el) continue;
      nextRects.set(item.id, el.getBoundingClientRect());
    }

    // 레이아웃 리사이즈(패널 너비 변경 등)에는 FLIP을 적용하지 않는다.
    // 실제 reorder 발생 시에만 shouldAnimateRef를 켠다.
    if (!shouldAnimateRef.current) {
      prevRectsRef.current = nextRects;
      return;
    }

    for (const item of items) {
      const id = item.id;
      if (id === activeId) continue;
      const el = itemRefs.current.get(id);
      const prev = prevRectsRef.current.get(id);
      const next = nextRects.get(id);
      if (!el || !prev || !next) continue;
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;

      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = "";
      });
    }

    shouldAnimateRef.current = false;
    prevRectsRef.current = nextRects;
  }, [items, activeId]);

  useEffect(() => {
    if (!activeId) return;
    const up = () => {
      setActiveId(null);
      activeIdRef.current = null;
    };
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      document.body.style.userSelect = "";
    };
  }, [activeId]);

  const startDrag = useCallback((id: string) => {
    setActiveId(id);
    activeIdRef.current = id;
  }, []);

  const enterItem = useCallback(
    (targetId: string) => {
      const dragId = activeIdRef.current;
      if (!dragId || dragId === targetId) return;
      const from = items.findIndex((x) => x.id === dragId);
      const to = items.findIndex((x) => x.id === targetId);
      if (from === -1 || to === -1 || from === to) return;
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      shouldAnimateRef.current = true;
      onReorder(next);
    },
    [items, onReorder],
  );

  const getItemProps = useCallback(
    (id: string): SortableItemProps => {
      const dragging = activeId === id;
      const isOver = false;
      return {
        handleProps: {
          onPointerDown: (e: React.PointerEvent) => {
            e.preventDefault();
            startDrag(id);
          },
          style: { cursor: "grab", touchAction: "none" },
          "aria-label": "드래그하여 순서 변경",
        },
        wrapperProps: {
          onPointerEnter: () => enterItem(id),
          style: {},
          className: [
            "transition-all duration-200 ease-out",
            dragging ? "opacity-60 scale-[0.97] z-10 relative shadow-lg" : "",
          ]
            .filter(Boolean)
            .join(" "),
          ref: (el: HTMLDivElement | null) => {
            if (el) {
              itemRefs.current.set(id, el);
              return;
            }
            itemRefs.current.delete(id);
          },
        },
        isDragging: dragging,
        isOver,
      };
    },
    [activeId, startDrag, enterItem],
  );

  return {
    getItemProps,
    activeId,
  };
}
