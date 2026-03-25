"use client";

import React, { useEffect, useMemo, useRef } from "react";

type ParticleEffect = "none" | "cherryBlossom" | "snow" | "sparkle" | "heart";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// 하트 곡선을 정규화된 포인트(0..1)로 미리 계산해 성능 부담을 줄입니다.
function makeHeartPoints(samples = 220) {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = (i / samples) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push({ x, y });
  }
  // 정규화(바운딩 박스 맞춤)
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  return pts.map((p) => ({
    x: (p.x - minX) / w - 0.5, // -0.5..0.5
    y: (p.y - minY) / h - 0.5, // -0.5..0.5
  }));
}

export default function ParticleCanvasOverlay({ effect }: { effect: ParticleEffect | string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const heartPoints = useMemo(() => makeHeartPoints(240), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const state = {
      running: true,
      w: 0,
      h: 0,
      dpr: Math.max(1, Math.min(2, window.devicePixelRatio || 1)),
      particles: [] as Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        rot: number;
        vr: number;
        alpha: number;
        life: number;
        kind: "petal" | "snow" | "sparkle" | "heart";
        hue: number;
        tw: number;
      }>,
    };

    const targetEffect = (effect as ParticleEffect) || "none";
    if (targetEffect === "none") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      state.w = Math.max(1, Math.floor(rect.width));
      state.h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(state.w * state.dpr);
      canvas.height = Math.floor(state.h * state.dpr);
      canvas.style.width = `${state.w}px`;
      canvas.style.height = `${state.h}px`;
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    };

    resize();

    const onResize = () => resize();
    const ro = new ResizeObserver(() => onResize());
    ro.observe(parent);

    const seedCount = (() => {
      // 너무 많은 파티클은 성능 저하가 있으니 적당히 제한
      switch (targetEffect) {
        case "cherryBlossom":
          return 90;
        case "snow":
          return 85;
        case "sparkle":
          return 55;
        case "heart":
          return 35;
        default:
          return 0;
      }
    })();

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const kind = (() => {
      switch (targetEffect) {
        case "cherryBlossom":
          return "petal" as const;
        case "snow":
          return "snow" as const;
        case "sparkle":
          return "sparkle" as const;
        case "heart":
          return "heart" as const;
        default:
          return "snow" as const;
      }
    })();

    for (let i = 0; i < seedCount; i += 1) {
      const size = rand(3, 7) * (targetEffect === "heart" ? 1.2 : 1);
      state.particles.push({
        x: rand(-state.w * 0.1, state.w * 1.1),
        y: rand(-state.h, state.h),
        vx: rand(-0.35, 0.35) * (kind === "petal" ? 1.1 : 1),
        vy: rand(0.6, 1.7) * (kind === "snow" ? 1.0 : 1),
        size,
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.02, 0.02) * (kind === "petal" ? 1.7 : 1),
        alpha: rand(0.25, 0.9),
        life: rand(0.6, 1.0),
        kind,
        hue: rand(320, 360),
        tw: rand(0, Math.PI * 2),
      });
    }

    let last = performance.now();

    const drawPetal = (p: (typeof state.particles)[number]) => {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.2);
      const base = `hsla(${p.hue}, 70%, 75%, ${p.alpha})`;
      g.addColorStop(0, base);
      g.addColorStop(1, `hsla(${p.hue}, 70%, 65%, 0)`);
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // 타원 + 작은 꼬리 느낌으로 단순화
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.05, p.size * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawSnow = (p: (typeof state.particles)[number]) => {
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.2, p.size * 0.55), 0, Math.PI * 2);
      ctx.fill();
    };

    const drawSparkle = (p: (typeof state.particles)[number]) => {
      const t = p.tw;
      const a = p.alpha * (0.55 + 0.45 * Math.sin(t));
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x - p.size, p.y);
      ctx.lineTo(p.x + p.size, p.y);
      ctx.moveTo(p.x, p.y - p.size);
      ctx.lineTo(p.x, p.y + p.size);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(p.x, p.y, 1.2, 1.2);
    };

    const drawHeart = (p: (typeof state.particles)[number]) => {
      const color = `rgba(255, 105, 180, ${clamp(p.alpha, 0, 1)})`;
      ctx.fillStyle = color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const s = p.size * 0.35;
      ctx.beginPath();
      for (let i = 0; i < heartPoints.length; i += 1) {
        const pt = heartPoints[i];
        const x = pt.x * s * 2.2;
        const y = -pt.y * s * 2.2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const tick = (now: number) => {
      if (!state.running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.clearRect(0, 0, state.w, state.h);

      for (const p of state.particles) {
        // 공통 이동
        p.x += p.vx * (dt * 60);
        p.y += p.vy * (dt * 60);
        p.rot += p.vr * (dt * 60);
        p.tw += dt * 3.2;

        // 살짝 바람 효과
        if (p.kind === "petal") p.vx += Math.sin((p.y / state.h) * Math.PI * 2) * 0.001;

        // 하단 밖으로 나가면 리셋
        if (p.y > state.h + p.size * 2) {
          p.y = -rand(20, 120);
          p.x = rand(-state.w * 0.1, state.w * 1.1);
          p.alpha = rand(0.25, 0.9);
          p.size = rand(3, 7) * (targetEffect === "heart" ? 1.2 : 1);
          p.rot = rand(0, Math.PI * 2);
          p.vx = rand(-0.35, 0.35) * (kind === "petal" ? 1.1 : 1);
          p.vy = rand(0.6, 1.7) * (kind === "snow" ? 1.0 : 1);
          p.life = rand(0.6, 1.0);
          p.hue = rand(320, 360);
        }

        // 그리기
        switch (p.kind) {
          case "petal":
            drawPetal(p);
            break;
          case "snow":
            drawSnow(p);
            break;
          case "sparkle":
            drawSparkle(p);
            break;
          case "heart":
            drawHeart(p);
            break;
        }
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      state.running = false;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [effect, heartPoints]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />;
}

