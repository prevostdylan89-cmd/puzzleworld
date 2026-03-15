import React, { useState, useRef, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

const THRESHOLD = 70; // px to pull before triggering

export default function PullToRefresh({ children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(null);
  const isPullingRef = useRef(false);

  useEffect(() => {
    const el = document.getElementById('pull-scroll-container');
    if (!el) return;

    const onTouchStart = (e) => {
      if (el.scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (!isPullingRef.current || startYRef.current === null) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0 && el.scrollTop === 0) {
        e.preventDefault();
        setPullDistance(Math.min(dy * 0.5, THRESHOLD + 20));
      } else {
        isPullingRef.current = false;
        setPullDistance(0);
      }
    };

    const onTouchEnd = () => {
      if (pullDistance >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(THRESHOLD);
        setTimeout(() => {
          window.location.reload();
        }, 400);
      } else {
        setPullDistance(0);
      }
      startYRef.current = null;
      isPullingRef.current = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [pullDistance, isRefreshing]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const triggered = pullDistance >= THRESHOLD;

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Indicateur pull-to-refresh */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: `${pullDistance}px`,
          overflow: 'hidden',
          zIndex: 100,
          transition: pullDistance === 0 ? 'height 0.2s ease' : 'none',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(249,115,22,0.15)',
            border: '2px solid rgba(249,115,22,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: progress,
            transform: `scale(${0.5 + progress * 0.5}) rotate(${progress * 180}deg)`,
            transition: 'none',
          }}
        >
          {isRefreshing ? (
            <Loader2 style={{ width: 16, height: 16, color: '#f97316', animation: 'spin 1s linear infinite' }} />
          ) : (
            <RefreshCw style={{ width: 16, height: 16, color: triggered ? '#f97316' : '#9a9a9a' }} />
          )}
        </div>
      </div>

      {/* Contenu décalé */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.2s ease' : 'none',
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}