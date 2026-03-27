"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

const THRESHOLD = 70;
const SETTLED_HEIGHT = 44;

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef<number | null>(null);
  const pullYRef = useRef(0);
  const rawDeltaRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshingRef.current) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0) {
        // Resistance curve: feels springy (visual only)
        const clamped = Math.min(delta * 0.45, SETTLED_HEIGHT + 24);
        pullYRef.current = clamped;
        rawDeltaRef.current = delta;
        setPullY(clamped);
        // Prevent native overscroll bounce from fighting us
        e.preventDefault();
      } else if (delta < -5) {
        // User scrolled up — cancel pull
        startYRef.current = null;
        pullYRef.current = 0;
        rawDeltaRef.current = 0;
        setPullY(0);
      }
    };

    const onTouchEnd = async () => {
      if (startYRef.current === null) return;
      startYRef.current = null;
      const rawDelta = rawDeltaRef.current;
      pullYRef.current = 0;
      rawDeltaRef.current = 0;

      if (rawDelta >= THRESHOLD) {
        isRefreshingRef.current = true;
        setRefreshing(true); // height snaps to SETTLED_HEIGHT with transition
        try {
          await onRefresh();
        } finally {
          if (isMountedRef.current) {
            isRefreshingRef.current = false;
            setRefreshing(false);
            setPullY(0); // slides back to 0 with transition
          }
        }
      } else {
        setPullY(0); // snap back with transition
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    // passive: false so we can call preventDefault to block native overscroll
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh]);

  // While dragging: no transition. On release (pullY → 0) or activate (→ SETTLED): animate.
  const indicatorH = refreshing ? SETTLED_HEIGHT : pullY;
  const useTransition = refreshing || pullY === 0;
  const progress = Math.min(pullY / THRESHOLD, 1);

  return (
    <>
      {/* Pull indicator — sits below the fixed header at z-40 */}
      <div
        aria-hidden="true"
        className="fixed left-0 right-0 z-40 flex items-center justify-center overflow-hidden pointer-events-none"
        style={{
          top: "calc(4rem + env(safe-area-inset-top, 0px))",
          height: indicatorH,
          background: "rgba(10, 14, 26, 0.9)",
          backdropFilter: "blur(8px)",
          borderBottom: indicatorH > 0 ? "1px solid rgba(125,211,252,0.1)" : "none",
          transition: useTransition ? "height 0.28s cubic-bezier(0.4,0,0.2,1)" : "none",
        }}
      >
        <RefreshCw
          size={18}
          className="text-[#7dd3fc]"
          style={{
            opacity: refreshing ? 1 : progress,
            transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
            animation: refreshing ? "spin 0.7s linear infinite" : undefined,
          }}
        />
      </div>
      {children}
    </>
  );
}
