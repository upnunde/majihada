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

export default function ParticleCanvasOverlay({
  effect,
  themeColor,
}: {
  effect: ParticleEffect | string;
  themeColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const petalImageRefs = useRef<HTMLImageElement[]>([]);

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
        spriteIndex: number;
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
          return 22;
        case "snow":
          return 42;
        case "sparkle":
          return 27;
        case "heart":
          return Math.round(17 * 1.2);
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

    const petalSpritePool = ["/petal01.svg", "/petal02.svg", "/petal03.svg"];
    const exposureSizeMultiplier =
      targetEffect === "snow" || targetEffect === "sparkle" || targetEffect === "heart" ? 1.2 : 1;
    const sparkleSizeBoost = targetEffect === "sparkle" ? 1.2 : 1;
    const heartSizeBoost = targetEffect === "heart" ? 1.3 * 1.2 : 1;
    const sparkleHeartVyMult =
      targetEffect === "sparkle" || targetEffect === "heart" ? 1.2 : 1;

    const randomPetalSpawn = () => ({
      x: rand(state.w * 1.02, state.w * 1.28),
      y: rand(-state.h * 0.12, state.h * 1.12),
    });

    for (let i = 0; i < seedCount; i += 1) {
      const size =
        rand(3, 7) *
        (targetEffect === "heart" ? 1.2 : targetEffect === "cherryBlossom" ? 0.675 : 1) *
        heartSizeBoost *
        sparkleSizeBoost;
      const isPetal = kind === "petal";
      const spawn = isPetal ? randomPetalSpawn() : null;
      state.particles.push({
        x: isPetal ? spawn!.x : rand(-state.w * 0.1, state.w * 1.1),
        y: isPetal ? spawn!.y : rand(-state.h, state.h),
        // 꽃잎은 기본적으로 우 -> 좌로 흐르도록 음수 x 속도를 부여
        vx: isPetal ? rand(-1.35, -0.55) : rand(-0.35, 0.35),
        vy: isPetal
          ? rand(0.22, 0.78)
          : kind === "sparkle" || kind === "heart"
            ? rand(0.22, 0.62) * sparkleHeartVyMult
            : rand(0.6, 1.7) * (kind === "snow" ? 1.0 : 1),
        size: size * exposureSizeMultiplier,
        rot: rand(0, Math.PI * 2),
        vr:
          kind === "sparkle" || kind === "heart"
            ? rand(-0.008, 0.008)
            : rand(-0.02, 0.02) * (kind === "petal" ? 1.7 : 1),
        alpha: rand(0.25, 0.9),
        life: rand(0.6, 1.0),
        kind,
        hue: rand(320, 360),
        tw: rand(0, Math.PI * 2),
        spriteIndex: Math.floor(Math.random() * petalSpritePool.length),
      });
    }

    let last = performance.now();

    const drawPetal = (p: (typeof state.particles)[number]) => {
      const sprite = petalImageRefs.current[p.spriteIndex];
      if (sprite && sprite.complete && sprite.naturalWidth > 0 && sprite.naturalHeight > 0) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const w = p.size * 4.8;
        const h = p.size * 4.2;
        ctx.globalAlpha = clamp(p.alpha, 0.2, 1);
        ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
        ctx.restore();
        return;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      // 꽃잎 형태(대칭 베지어) + 중앙 하이라이트
      const w = p.size * 1.25;
      const h = p.size * 0.95;

      const base = `hsla(${p.hue}, 78%, 80%, ${p.alpha})`;
      const edge = `hsla(${p.hue}, 72%, 66%, ${p.alpha * 0.9})`;
      const highlight = `hsla(${p.hue}, 95%, 92%, ${Math.min(1, p.alpha * 0.7)})`;

      const g = ctx.createLinearGradient(0, -h, 0, h);
      g.addColorStop(0, highlight);
      g.addColorStop(0.45, base);
      g.addColorStop(1, edge);
      ctx.fillStyle = g;

      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.bezierCurveTo(w * 0.9, -h * 0.6, w, h * 0.45, 0, h);
      ctx.bezierCurveTo(-w, h * 0.45, -w * 0.9, -h * 0.6, 0, -h);
      ctx.closePath();
      ctx.fill();

      // 꽃잎 중앙 결
      ctx.strokeStyle = `hsla(${p.hue}, 70%, 60%, ${p.alpha * 0.45})`;
      ctx.lineWidth = Math.max(0.6, p.size * 0.08);
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.82);
      ctx.lineTo(0, h * 0.72);
      ctx.stroke();

      ctx.restore();
    };

    if (targetEffect === "cherryBlossom") {
      petalImageRefs.current = petalSpritePool.map((src) => {
        const img = new Image();
        img.src = src;
        return img;
      });
    } else {
      petalImageRefs.current = [];
    }

    const drawSnow = (p: (typeof state.particles)[number]) => {
      const snowColor = themeColor?.trim() ? themeColor : "rgba(255,255,255,1)";
      ctx.fillStyle = snowColor;
      ctx.globalAlpha = clamp(p.alpha, 0.2, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.2, p.size * 0.55), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawSparkle = (p: (typeof state.particles)[number]) => {
      const t = p.tw;
      const a = p.alpha * (0.55 + 0.45 * Math.sin(t));
      const sparkleColor = themeColor?.trim() ? themeColor : "rgba(255,255,255,1)";
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.strokeStyle = sparkleColor;
      ctx.globalAlpha = clamp(a, 0.15, 1);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(p.size, 0);
      ctx.moveTo(0, -p.size);
      ctx.lineTo(0, p.size);
      ctx.stroke();
      ctx.fillStyle = sparkleColor;
      ctx.fillRect(-0.6, -0.6, 1.2, 1.2);
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const drawHeart = (p: (typeof state.particles)[number]) => {
      const color = themeColor?.trim() ? themeColor : "rgba(255, 105, 180, 1)";
      ctx.fillStyle = color;
      ctx.globalAlpha = clamp(p.alpha, 0.2, 1);
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
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      if (!state.running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.clearRect(0, 0, state.w, state.h);

      for (const p of state.particles) {
        // 공통 이동
        if (p.kind === "petal") {
          // 우 -> 좌 기본 흐름 + 살랑이는 바람(사인 곡선)
          const windX = Math.sin(p.tw * 0.9 + p.y * 0.008) * 0.42;
          const swayY = Math.sin(p.tw * 1.35 + p.x * 0.01) * 0.12;
          p.x += (p.vx + windX) * (dt * 60);
          p.y += (p.vy + swayY) * (dt * 60);
        } else {
          p.x += p.vx * (dt * 60);
          p.y += p.vy * (dt * 60);
        }
        p.rot += p.vr * (dt * 60);
        p.tw += dt * (p.kind === "sparkle" || p.kind === "heart" ? 1.6 : 3.2);

        // 꽃잎은 좌측/하단 바깥으로 벗어나면 재생성
        const isOutForPetal = p.kind === "petal" && (p.x < -p.size * 3 || p.y > state.h + p.size * 2);

        // 파티클이 화면 바깥으로 나가면 리셋
        if (isOutForPetal || p.y > state.h + p.size * 2) {
          if (p.kind === "petal") {
            const spawn = randomPetalSpawn();
            p.x = spawn.x;
            p.y = spawn.y;
          } else {
            p.y = -rand(20, 120);
            p.x = rand(-state.w * 0.1, state.w * 1.1);
          }
          p.alpha = rand(0.25, 0.9);
          p.size =
            rand(3, 7) *
            (targetEffect === "heart" ? 1.2 : targetEffect === "cherryBlossom" ? 0.675 : 1) *
            heartSizeBoost *
            sparkleSizeBoost *
            exposureSizeMultiplier;
          p.rot = rand(0, Math.PI * 2);
          p.vx = p.kind === "petal" ? rand(-1.35, -0.55) : rand(-0.35, 0.35) * (kind === "petal" ? 1.1 : 1);
          p.vy =
            p.kind === "petal"
              ? rand(0.22, 0.78)
              : p.kind === "sparkle" || p.kind === "heart"
                ? rand(0.22, 0.62) * sparkleHeartVyMult
                : rand(0.6, 1.7) * (kind === "snow" ? 1.0 : 1);
          p.vr =
            p.kind === "sparkle" || p.kind === "heart"
              ? rand(-0.008, 0.008)
              : rand(-0.02, 0.02) * (p.kind === "petal" ? 1.7 : 1);
          p.life = rand(0.6, 1.0);
          p.hue = rand(320, 360);
          p.spriteIndex = Math.floor(Math.random() * petalSpritePool.length);
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
  }, [effect, heartPoints, themeColor]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />;
}

