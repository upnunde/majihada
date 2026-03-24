"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Music, Image as ImageIcon, Users, MessageSquare, CalendarHeart, MapPin, Bell, Images, Wallet, BookOpen, Youtube, Share2, Shield, CheckCircle2, GripVertical, Play, Pause, VolumeX, Volume2, X, ChevronDown, ChevronLeft, ChevronRight, Pencil, Trash2, RotateCw, RefreshCcw, Move } from 'lucide-react';

const DEFAULT_LOCATION_PREVIEW_COORDS = { lat: 37.579617, lon: 126.977041 }; // 경복궁

function buildOsmEmbedUrl(lat: number, lon: number) {
  const delta = 0.01;
  const left = lon - delta;
  const bottom = lat - delta;
  const right = lon + delta;
  const top = lat + delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

function AppLabel({
  className = '',
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  );
}

// 원형 체크박스 컴포넌트 (기본 20x20)
function CircleCheckbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;
  return (
    <label
      className="relative inline-flex items-center cursor-pointer"
      onClick={(e) => {
        // 바깥 옵션 row(onClick)와 중복 토글 방지
        e.stopPropagation();
      }}
    >
      <input
        type="checkbox"
        className={`sr-only peer ${className}`}
        {...rest}
      />
      <span
        className="
          w-5 h-5 rounded-full border border-black/20 bg-transparent
          flex items-center justify-center relative
          peer-checked:bg-slate-700 peer-checked:border-black
          after:content-[''] after:w-[6px] after:h-[10px]
          after:border-r-2 after:border-b-2 after:border-white
          after:rotate-45 after:opacity-0 after:translate-y-[-1px]
          peer-checked:after:opacity-100
          transition-all
        "
      />
    </label>
  );
}

// 원형 라디오 버튼 컴포넌트 (기본 20x20)
function CircleRadio(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const { className = '', ...rest } = props;
  return (
    <label
      className="relative inline-flex items-center pointer-events-none select-none"
    >
      <input
        type="radio"
        className={`sr-only peer ${className}`}
        {...rest}
      />
      <span
        className="
          w-5 h-5 rounded-full border border-black/20 bg-transparent
          flex items-center justify-center relative
          peer-checked:border-black
          after:content-[''] after:w-2.5 after:h-2.5 after:rounded-full after:bg-slate-700
          after:opacity-0 peer-checked:after:opacity-100
          transition-all
        "
      />
    </label>
  );
}

// 파티클/옵션 선택용 칩 컴포넌트 (원본 스타일 유지)
function OptionChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-lg inline-flex items-center text-[13px] font-medium border transition-colors ${
        active
          ? 'bg-transparent text-on-surface-10 border-[color:var(--on-surface-10)] hover:bg-slate-50'
          : 'bg-[color:var(--surface-disabled)] text-[color:var(--on-surface-30)] opacity-70 border-transparent hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

function fontScaleToPercent(scale: unknown) {
  switch (scale) {
    case 'sm':
      return 80;
    case 'lg':
      return 120;
    case 'md':
    default:
      return 100;
  }
}

function getYoutubeVideoId(rawUrl: string) {
  const input = (rawUrl || "").trim();
  if (!input) return null as string | null;
  const directId = input.match(/^[a-zA-Z0-9_-]{11}$/)?.[0];
  if (directId) return directId;
  try {
    const u = new URL(input);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "").trim();
      if (id) return id;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const maybeId = parts[parts.length - 1];
      if (["embed", "shorts"].includes(parts[0]) && maybeId) {
        return maybeId;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeTransitionEffect(raw: unknown) {
  const v = typeof raw === 'string' ? raw : '없음';
  switch (v) {
    case '없음':
      return '없음' as const;
    case '랜덤':
      return '랜덤' as const;
    // 기존 옵션 → 신규 추천 옵션 매핑(하위호환)
    case '페이드 인':
      return '크로스페이드' as const;
    case '페이드 아웃':
      return '디졸브' as const;
    case '슬라이드':
      return '슬라이드(오→왼)' as const;
    case '줌 인':
      return '켄번즈(줌 인)' as const;
    case '줌 아웃':
      return '켄번즈(줌 아웃)' as const;
    // 신규 추천 옵션
    case '크로스페이드':
    case '디졸브':
    case '슬라이드(왼→오)':
    case '슬라이드(오→왼)':
    case '켄번즈(줌 인)':
    case '켄번즈(줌 아웃)':
      return v as any;
    default:
      return '크로스페이드' as const;
  }
}
import { Input as RawInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useCardStore } from "../store/useCardStore";
import { useSortable } from "@/lib/useSortable";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

declare global {
  interface Window {
    naver?: any;
  }
}

function NaverMapEmbed({
  lat,
  lon,
  className,
  onAuthError,
  onMapReady,
}: {
  lat: number;
  lon: number;
  className?: string;
  onAuthError?: () => void;
  onMapReady?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;
    if (!clientId) return;
    setFailed(false);
    setReady(false);

    if (window.naver?.maps) {
      setReady(true);
      return;
    }

    const scriptId = "naver-maps-sdk";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      const onLoad = () => {
        if (window.naver?.maps) {
          setReady(true);
          return;
        }
        setFailed(true);
        onAuthError?.();
      };
      existing.addEventListener("load", onLoad, { once: true });
      return;
    }

    const s = document.createElement("script");
    s.id = scriptId;
    s.async = true;
    s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${encodeURIComponent(clientId)}`;
    s.addEventListener("load", () => {
      if (window.naver?.maps) {
        setReady(true);
        return;
      }
      setFailed(true);
      onAuthError?.();
    }, { once: true });
    s.addEventListener("error", () => {
      setFailed(true);
      onAuthError?.();
    }, { once: true });
    document.head.appendChild(s);
  }, [onAuthError]);

  useEffect(() => {
    if (!ready) return;
    if (!containerRef.current) return;
    if (!window.naver?.maps) return;
    try {
      const center = new window.naver.maps.LatLng(lat, lon);
      const map = new window.naver.maps.Map(containerRef.current, {
        center,
        zoom: 16,
        mapTypeId: window.naver.maps.MapTypeId.NORMAL,
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
        zoomControl: false,
      });
      new window.naver.maps.Marker({ position: center, map });

      // SDK가 "인증 실패" 텍스트를 컨테이너에 렌더링하는 경우를 감지해 폴백 처리한다.
      window.setTimeout(() => {
        const text = containerRef.current?.textContent ?? "";
        if (text.includes("Open API 인증이 실패")) {
          setFailed(true);
          onAuthError?.();
          return;
        }
        onMapReady?.();
      }, 0);
    } catch {
      setFailed(true);
      onAuthError?.();
    }

    return () => {
      // SDK가 제공하는 공식 destroy API가 명확치 않아, 언마운트 시 참조만 끊어줌
      // (컨테이너 DOM이 제거되면 내부 리스너도 함께 해제됨)
    };
  }, [ready, lat, lon, onAuthError, onMapReady]);

  const hasKey = Boolean(process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID);

  if (!hasKey || failed) return null;

  return <div ref={containerRef} className={className} />;
}

function Input(props: React.ComponentProps<typeof RawInput>) {
  const { className, type, value, onChange, disabled, readOnly, ...rest } = props as any;

  const isTextLike =
    !type ||
    type === "text" ||
    type === "search" ||
    type === "email" ||
    type === "tel" ||
    type === "url" ||
    type === "password";

  const showClear =
    isTextLike &&
    !disabled &&
    !readOnly &&
    typeof value === "string" &&
    value.length > 0 &&
    typeof onChange === "function";

  // 텍스트 입력의 경우 DOM 구조를 고정해 포커스가 튀지 않게 유지
  if (!isTextLike) {
    return (
      <RawInput
        className={className}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        {...rest}
      />
    );
  }

  const wrapperClassName =
    typeof className === "string" && className.includes("flex-1")
      ? "relative flex-1 w-full group"
      : "relative w-full group";

  return (
    <div className={wrapperClassName}>
      <RawInput
        className={`${className ?? ""} pr-10`}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        {...rest}
      />
      <button
        type="button"
        className={[
          "absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg border border-border bg-white text-on-surface-30 hover:text-on-surface-10 hover:bg-slate-50 flex items-center justify-center transition-opacity",
          showClear ? "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" : "hidden",
        ].join(" ")}
        aria-label="내용 지우기"
        onClick={() => {
          onChange({ target: { value: "" } } as any);
        }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// 기획안 기반 14개 카테고리 (필수/선택 분리)
const sidebarItems = [
  // 필수 사항
  { id: 'theme', icon: Palette, label: '테마', category: '필수' },
  { id: 'bgm', icon: Music, label: '배경음악', category: '필수' },
  { id: 'main', icon: ImageIcon, label: '메인', category: '필수' },
  { id: 'hosts', icon: Users, label: '신랑신부', category: '필수' },
  { id: 'greeting', icon: MessageSquare, label: '인사말', category: '필수' },
  { id: 'eventInfo', icon: CalendarHeart, label: '예식정보', category: '필수' },
  { id: 'location', icon: MapPin, label: '오시는 길', category: '필수' },
  // 선택 사항
  { id: 'notice', icon: Bell, label: '안내사항', category: '선택', hasSwitch: true },
  { id: 'gallery', icon: Images, label: '갤러리', category: '선택', hasSwitch: true },
  { id: 'account', icon: Wallet, label: '계좌정보', category: '선택', hasSwitch: true },
  { id: 'guestbook', icon: BookOpen, label: '방명록', category: '선택', hasSwitch: true },
  { id: 'youtube', icon: Youtube, label: '유튜브', category: '선택', hasSwitch: true },
  { id: 'share', icon: Share2, label: '공유', category: '선택' },
  { id: 'protect', icon: Shield, label: '보호', category: '선택' },
];

const OTHER_OPTION_IDS = ['share', 'protect'] as const;

const builtInTracks = [
  // NOTE: 샘플 내장 음원(스트리밍 URL). 필요하면 추후 public/로 옮겨서 로컬 제공 가능.
  { id: 'classic-1', label: '클래식 (잔잔한)' , url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'jazz-1', label: '재즈 (스윙)' , url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 'march-1', label: '발랄한 행진곡' , url: '/audio/neti-main-theme.mp3' },
  { id: 'piano-1', label: '피아노 (로맨틱)' , url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'acoustic-1', label: '어쿠스틱 (따뜻한)' , url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'string-1', label: '스트링 (웅장한)' , url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  { id: 'lofi-1', label: '로파이 (감성)' , url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
] as const;

const BANK_OPTIONS = [
  '카카오뱅크',
  '국민은행',
  '기업은행',
  '농협은행',
  '신한은행',
  '산업은행',
  '우리은행',
  '한국씨티은행',
  '하나은행',
  'SC제일은행',
  '경남은행',
  '광주은행',
  '대구은행',
  '도이치은행',
  '뱅크오브아메리카',
  '부산은행',
  '산림조합중앙회',
  '저축은행',
] as const;

const BANK_LOGO_DOMAIN: Record<(typeof BANK_OPTIONS)[number], string | null> = {
  카카오뱅크: 'kakaobank.com',
  국민은행: 'kbstar.com',
  기업은행: 'ibk.co.kr',
  농협은행: 'nhbank.com',
  신한은행: 'shinhan.com',
  산업은행: 'kdb.co.kr',
  우리은행: 'wooribank.com',
  한국씨티은행: 'citi.com',
  하나은행: 'kebhana.com',
  SC제일은행: 'standardchartered.co.kr',
  경남은행: 'knbank.co.kr',
  광주은행: 'kjbank.com',
  대구은행: 'dgb.co.kr',
  도이치은행: 'db.com',
  뱅크오브아메리카: 'bankofamerica.com',
  부산은행: 'busanbank.co.kr',
  산림조합중앙회: 'nfcf.or.kr',
  저축은행: 'fsb.or.kr',
};

function BankLogo({ name }: { name: (typeof BANK_OPTIONS)[number] }) {
  const [imgOk, setImgOk] = React.useState(true);
  const domain = BANK_LOGO_DOMAIN[name];
  const src = domain ? `https://logo.clearbit.com/${domain}` : null;

  return (
    <div className="w-7 h-7 rounded-full bg-[color:var(--surface-20)] flex items-center justify-center overflow-hidden flex-shrink-0">
      {src && imgOk ? (
        <img
          src={src}
          alt=""
          className="w-7 h-7 object-contain bg-white"
          loading="lazy"
          onError={() => setImgOk(false)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="text-[11px] font-semibold text-on-surface-20">{name.charAt(0)}</span>
      )}
    </div>
  );
}

function FormItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <AppLabel
        className={`w-[90px] flex-shrink-0 text-[13px] font-medium text-on-surface-30 leading-tight ${
          label ? 'pt-1' : ''
        }`}
      >
        {label}
      </AppLabel>
      <div className="flex-1 flex gap-2 items-center">
        {children}
      </div>
    </div>
  );
}

function parseKoreanTime(value: string | undefined | null) {
  const fallback = { period: '오후', hour: 2, minute: '00' } as { period: '오전' | '오후'; hour: number; minute: string };
  if (!value) return fallback;
  const m = value.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
  if (!m) return fallback;
  const period: '오전' | '오후' = m[1] === '오전' ? '오전' : '오후';
  const hourNum = Number(m[2]);
  const hour = Number.isFinite(hourNum) && hourNum >= 1 && hourNum <= 12 ? hourNum : fallback.hour;
  const minute = m[3];
  return { period, hour, minute };
}

function MultiImageGrid({
  images,
  onReorder,
  onSlotClick,
  onEdit,
  onDelete,
}: {
  images: string[];
  onReorder: (next: string[]) => void;
  onSlotClick: (index: number, hasImg: boolean) => void;
  onEdit: (index: number, src: string) => void;
  onDelete: (index: number) => void;
}) {
  const normalized = Array.from({ length: 4 }, (_, i) => images[i] || "");
  const slots = normalized.map((src, i) => ({
    id: src ? `img-${src}` : `empty-${i}`,
    src,
  }));

  const sortable = useSortable({
    items: slots,
    onReorder: (reordered) => {
      const next = reordered.map((s) => s.src);
      onReorder(next);
    },
  });

  return (
    <div className="flex gap-2 flex-wrap w-full bg-[color:var(--surface-20)] p-4 rounded-lg">
      {slots.map((slot, realIndex) => {
        const hasImg = !!slot.src;
        const { handleProps, wrapperProps } = sortable.getItemProps(slot.id);
        return (
          <div
            key={slot.id}
            {...wrapperProps}
            className={`${wrapperProps.className} relative w-[100px] aspect-[9/16] group`}
          >
            <button
              type="button"
              className={[
                "w-full h-full rounded-lg border bg-white flex items-center justify-center text-3xl text-on-surface-30 bg-center bg-cover bg-clip-border bg-origin-border",
                hasImg ? "border-transparent" : "border-dashed border-border hover:bg-slate-50",
              ].join(" ")}
              style={hasImg ? { backgroundImage: `url(${slot.src})` } : undefined}
              onClick={() => onSlotClick(realIndex, hasImg)}
              aria-label={`이미지 ${realIndex + 1} 추가`}
            >
              {hasImg ? '' : '+'}
            </button>
            {hasImg && (
              <div className="absolute right-1 top-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg bg-white/95 border border-border shadow-sm flex items-center justify-center text-on-surface-20 hover:bg-white"
                  aria-label="이미지 수정"
                  onClick={(e) => { e.stopPropagation(); onEdit(realIndex, slot.src); }}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg bg-white/95 border border-border shadow-sm flex items-center justify-center text-on-surface-20 hover:bg-white"
                  aria-label="이미지 삭제"
                  onClick={(e) => { e.stopPropagation(); onDelete(realIndex); }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  {...handleProps}
                  className="w-7 h-7 rounded-lg bg-white/95 border border-border shadow-sm flex items-center justify-center text-on-surface-20 hover:bg-white cursor-grab active:cursor-grabbing"
                  aria-label="이미지 이동"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Move className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GalleryImageGrid({
  images,
  onChange,
  onEdit,
  imageRatio,
  max = 50,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  onEdit?: (index: number, src: string) => void;
  imageRatio?: "square" | "portrait";
  max?: number;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const normalized = images.slice(0, max);
  const slots = normalized.map((src, i) => ({ id: src ? `g-${src}` : `empty-${i}`, src }));

  const sortable = useSortable({
    items: slots,
    onReorder: (reordered) => onChange(reordered.map((x) => x.src)),
  });
  const thumbAspectClass = imageRatio === "square" ? "aspect-square" : "aspect-[9/16]";

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="pr-1">
        <div className="flex gap-2 flex-wrap w-full bg-[color:var(--surface-20)] p-4 rounded-lg max-h-[420px] overflow-y-auto">
          {slots.map((slot, i) => {
            const { handleProps, wrapperProps } = sortable.getItemProps(slot.id);
            return (
              <div
                key={`${slot.id}-${i}`}
                {...wrapperProps}
                className={`${wrapperProps.className} relative w-[100px] ${thumbAspectClass} group`}
              >
                <button
                  type="button"
                  className="w-full h-full rounded-lg border border-transparent bg-center bg-cover bg-clip-border bg-origin-border"
                  style={{ backgroundImage: `url(${slot.src})` }}
                  onClick={() => {
                    const el = document.getElementById(`gallery-image-${i}`) as HTMLInputElement | null;
                    el?.click();
                  }}
                  aria-label={`갤러리 이미지 ${i + 1} 수정`}
                />
                <div className="absolute right-1 top-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg bg-white/95 border border-border shadow-sm flex items-center justify-center text-on-surface-20 hover:bg-white"
                    aria-label="이미지 수정"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEdit && slot.src) {
                        onEdit(i, slot.src);
                        return;
                      }
                      const el = document.getElementById(`gallery-image-${i}`) as HTMLInputElement | null;
                      el?.click();
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg bg-white/95 border border-border shadow-sm flex items-center justify-center text-on-surface-20 hover:bg-white"
                    aria-label="이미지 삭제"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = [...normalized];
                      next.splice(i, 1);
                      onChange(next);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    {...handleProps}
                    className="w-7 h-7 rounded-lg bg-white/95 border border-border shadow-sm flex items-center justify-center text-on-surface-20 hover:bg-white cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="이미지 이동"
                  >
                    <Move className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {normalized.length < max && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-[100px] ${thumbAspectClass} rounded-lg border border-dashed border-border bg-transparent hover:bg-transparent flex items-center justify-center text-3xl text-on-surface-30`}
              aria-label="갤러리 이미지 추가"
            >
              +
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (!files.length) return;
          const next = [...normalized];
          const remain = Math.max(0, max - next.length);
          files.slice(0, remain).forEach((f) => next.push(URL.createObjectURL(f)));
          onChange(next);
          e.currentTarget.value = "";
        }}
      />

      {slots.map((_, i) => (
        <input
          key={`gallery-image-input-${i}`}
          id={`gallery-image-${i}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const next = [...normalized];
            next[i] = URL.createObjectURL(file);
            onChange(next);
            e.currentTarget.value = "";
          }}
        />
      ))}
    </div>
  );
}

export default function BuilderPageClient({ initialParams, initialSearchParams }: any) {
  const [activeSection, setActiveSection] = useState(sidebarItems[0].id);
  const { data, updateData } = useCardStore();
  const baseLayoutOrder = ['main', 'greeting', 'hosts', 'eventInfo', 'location'];
  const sectionEnabled = data.sectionEnabled ?? {};
  const setSectionEnabled = (updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    const next = typeof updater === 'function' ? updater(sectionEnabled) : updater;
    updateData('sectionEnabled', next);
  };
  const [editorWidth, setEditorWidth] = useState(560);
  const isResizingEditorRef = useRef(false);
  const editorResizeStartRef = useRef<{ x: number; width: number } | null>(null);
  const editorResizePointerIdRef = useRef<number | null>(null);
  const editorScrollRef = useRef<HTMLDivElement | null>(null);
  // 선택사항 목록 순서 (드래그로 변경)
  const [optionalOrder, setOptionalOrder] = useState<string[]>(() =>
    sidebarItems
      .filter((i) => i.category === '선택' && !OTHER_OPTION_IDS.includes(i.id as any))
      .map((i) => i.id)
  );

  const showHostContacts = !!(data.hosts as any).showContacts;
  const setShowHostContacts = (v: boolean) => updateData('hosts.showContacts', v);
  const [bankModalIndex, setBankModalIndex] = useState<number | null>(null);
  const [bankSearch, setBankSearch] = useState('');
  const [greetingSampleOpen, setGreetingSampleOpen] = useState(false);
  const [greetingSampleTab, setGreetingSampleTab] = useState<'general' | 'hosts' | 'religion'>('general');
  const [greetingSelectedSample, setGreetingSelectedSample] = useState<{ title: string; content: string } | null>(null);
  const [noticeSampleOpen, setNoticeSampleOpen] = useState(false);
  const [noticeSampleTab, setNoticeSampleTab] = useState<'general' | 'parking' | 'meal'>('general');
  const [noticeSelectedSample, setNoticeSelectedSample] = useState<{ title: string; content: string } | null>(null);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchSelected, setLocationSearchSelected] = useState<string | null>(null);
  const [locationPreviewCoords, setLocationPreviewCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationPreviewLoading, setLocationPreviewLoading] = useState(false);
  const [naverPreviewFailed, setNaverPreviewFailed] = useState(false);
  const [previewVisibleSections, setPreviewVisibleSections] = useState<Record<string, boolean>>({});
  const [sharePreviewOpen, setSharePreviewOpen] = useState(false);
  const [galleryDetailOpen, setGalleryDetailOpen] = useState(false);
  const [galleryDetailIndex, setGalleryDetailIndex] = useState(0);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNaverPreviewFailed(false);
  }, [locationPreviewCoords?.lat, locationPreviewCoords?.lon]);

  useEffect(() => {
    if (!data.theme.scrollEffect) {
      setPreviewVisibleSections({});
      return;
    }
    const root = previewScrollRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-preview-section-id]'));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setPreviewVisibleSections((prev) => {
          const next = { ...prev };
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const id = (entry.target as HTMLElement).dataset.previewSectionId;
              if (id) next[id] = true;
            }
          }
          return next;
        });
      },
      { root, threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [data.theme.scrollEffect, data.sectionEnabled, optionalOrder]);

  const [mainPreviewIndex, setMainPreviewIndex] = useState(0);
  const [mainPreviewPrevIndex, setMainPreviewPrevIndex] = useState<number | null>(null);
  const [mainPreviewAnimKey, setMainPreviewAnimKey] = useState(0);
  const [galleryPreviewIndex, setGalleryPreviewIndex] = useState(0);
  const [galleryGridVisibleRows, setGalleryGridVisibleRows] = useState(3);
  const [guestbookPreviewPage, setGuestbookPreviewPage] = useState(1);
  const gallerySwipeStartXRef = useRef<number | null>(null);
  const [mainPreviewRandomEffect, setMainPreviewRandomEffect] = useState<
    | '크로스페이드'
    | '디졸브'
    | '슬라이드(오→왼)'
    | '켄번즈(줌 인)'
    | '켄번즈(줌 아웃)'
  >('크로스페이드');

  useEffect(() => {
    setGalleryGridVisibleRows(3);
  }, [
    (data.gallery as any)?.layoutType,
    (data.gallery as any)?.gridColumns,
    (data.gallery as any)?.useLoadMore,
    Array.isArray((data.gallery as any)?.images) ? (data.gallery as any).images.length : 0,
  ]);

  useEffect(() => {
    setGuestbookPreviewPage(1);
  }, [Array.isArray((data.guestbook as any)?.entries) ? (data.guestbook as any).entries.length : 0]);

  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [imageEditorSrc, setImageEditorSrc] = useState<string>('');
  const [imageEditorZoom, setImageEditorZoom] = useState(1);
  const [imageEditorRotation, setImageEditorRotation] = useState(0);
  const [imageEditorFlipX, setImageEditorFlipX] = useState(false);
  const [imageEditorPan, setImageEditorPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageEditorAspect, setImageEditorAspect] = useState<'square' | 'portrait'>('portrait');
  const [imageEditorTarget, setImageEditorTarget] = useState<{ kind: 'single' } | { kind: 'multi'; index: number } | { kind: 'gallery'; index: number } | null>(null);
  const imageEditorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageEditorImageRef = useRef<HTMLImageElement | null>(null);
  const imageEditorZoomRef = useRef(1);
  const imageEditorRotationRef = useRef(0);
  const imageEditorFlipXRef = useRef(false);
  const imageEditorPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imageEditorLoadedRef = useRef(false);
  const imageEditorPanningRef = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null);

  // location 교통수단 목록: 기존 subway/bus 값을 1개 항목으로 호환
  const transportItems = useMemo(() => {
    const transports = (data.location as any)?.transports;
    if (Array.isArray(transports) && transports.length > 0) return transports as Array<{ mode: string; detail: string }>;
    return [{ mode: data.location.subway || '', detail: data.location.bus || '' }];
  }, [data.location]);

  const setTransportItems = (next: Array<{ mode: string; detail: string }>) => {
    updateData('location.transports', next);
    // 기존 필드도 1번째 항목과 동기화(하위호환)
    updateData('location.subway', next[0]?.mode ?? '');
    updateData('location.bus', next[0]?.detail ?? '');
  };

  const galleryDetailImages = useMemo(
    () =>
      Array.isArray((data.gallery as any)?.images)
        ? (data.gallery as any).images.filter((u: unknown) => typeof u === "string" && u.trim().length > 0)
        : [],
    [data.gallery],
  );

  useEffect(() => {
    if (!galleryDetailImages.length) {
      setGalleryDetailOpen(false);
      setGalleryDetailIndex(0);
      return;
    }
    if (galleryDetailIndex > galleryDetailImages.length - 1) {
      setGalleryDetailIndex(galleryDetailImages.length - 1);
    }
  }, [galleryDetailImages, galleryDetailIndex]);

  const galleryDetailRatioClass =
    ((data.gallery as any)?.imageRatio ?? 'portrait') === 'square' ? 'aspect-square' : 'aspect-[3/4]';

  const locationSearchResults = useMemo(() => {
    const all = [
      '서울 중구 동호로 249 (신라호텔)',
      '서울 강남구 테헤란로 152 (역삼동)',
      '서울 서초구 반포대로 222 (서초동)',
      '서울 송파구 올림픽로 300 (잠실)',
      '서울 용산구 한강대로 405 (용산역)',
      '서울 마포구 월드컵북로 400 (상암)',
      '서울 종로구 세종대로 175 (광화문)',
    ];
    const q = locationSearchQuery.trim();
    if (!q) return all;
    return all.filter((a) => a.includes(q));
  }, [locationSearchQuery]);

  const greetingSamples = useMemo(() => {
    return {
      general: [
        {
          title: '새 마음의 초대',
          content: `새로운 마음을 담아 초대드립니다.
두 사람이 한 가정의 첫 걸음을 내딛는 이 날,
귀한 분들의 축복과 격려를 부탁드립니다.
함께해 주시면 평생 간직하겠습니다.`,
        },
        {
          title: '사랑과 존중의 약속',
          content: `사랑으로 만나 서로를 존중하며 더 단단한 믿음으로 살아가려 합니다.
이 자리에서 마음을 나눌 수 있도록 오셔서 축하해 주세요.`,
        },
        {
          title: '설렘이 닿는 자리',
          content: `오늘의 설렘이 내일의 기쁨이 되도록,
두 사람은 같은 방향을 바라보며 준비했습니다.
바쁘시더라도 귀한 걸음으로 함께해 주시면 감사하겠습니다.`,
        },
        {
          title: '새 출발의 다짐',
          content: `마음이 닿은 두 사람이 새 출발을 준비하고 있습니다.
서로를 따뜻하게 지켜주며 살겠습니다.
오셔서 축복해 주세요.`,
        },
        {
          title: '행복을 모아',
          content: `작은 행복을 모아 서로의 곁을 지켜온 시간처럼,
앞으로도 사랑과 배려로 함께하겠습니다.
귀한 분들과 함께하는 이날을 기다립니다.`,
        },
        {
          title: '봄처럼 시작하는 마음',
          content: `봄의 향기처럼 새로운 출발의 마음을 전합니다.
서로에게 든든한 울타리가 되겠습니다.
따뜻한 축복을 부탁드립니다.`,
        },
        {
          title: '서로를 잇는 사랑',
          content: `서로 다른 삶이 만나 같은 꿈을 꾸게 되었습니다.
사랑으로 함께하며 좋은 사람이 되겠습니다.
이 날 함께 웃어주시면 더없이 기쁩니다.`,
        },
        {
          title: '기쁨으로 맞이하는 결혼',
          content: `두 사람의 결혼을 기쁨으로 맞이하며,
여러분의 축복을 부탁드립니다.
항상 겸손하고 성실한 마음으로 가정을 지켜나가겠습니다.`,
        },
        {
          title: '함께 걷는 가정의 약속',
          content: `서로를 더 깊이 이해하며 함께 걸어갈 가정을 약속합니다.
귀한 걸음으로 이 자리를 빛내 주시면 감사하겠습니다.`,
        },
        {
          title: '평생 잊지 않겠습니다',
          content: `새로운 길 위에서 서로를 바라보는 마음으로 가정을 이루겠습니다.
축하해 주신 마음은 평생 잊지 않겠습니다.`,
        },
      ],
      hosts: [
        {
          title: '부모님 인사',
          content: `양가 부모님을 대표하여 인사드립니다.
두 사람이 가정을 이루게 되어 기쁨이 큽니다.
바쁘시더라도 참석하시어 축복과 격려로 함께해 주시면 감사하겠습니다.`,
        },
        {
          title: '출발을 응원합니다',
          content: `부모로서 지켜온 마음을 담아 이제 새 보금자리로 보내려 합니다.
두 사람의 출발에 힘이 될 수 있도록 따뜻한 말씀 부탁드립니다.`,
        },
        {
          title: '가정의 약속',
          content: `어느새 사랑이 가정의 약속이 되었습니다.
양가 부모님은 귀한 분들을 모시고 함께 축하하고자 합니다.
많은 축복 부탁드립니다.`,
        },
        {
          title: '성실한 삶을 약속',
          content: `그동안 베풀어주신 사랑에 보답하고자 두 사람은 성실한 가정을 약속합니다.
부디 오셔서 축복해 주시면 부모된 마음으로도 더없이 기쁘겠습니다.`,
        },
        {
          title: '앞날을 기도합니다',
          content: `부모의 마음으로 두 사람의 앞날을 기도합니다.
이 기쁜 날 함께해 주셔서 격려와 축복을 나눠 주시면 감사하겠습니다.`,
        },
        {
          title: '따뜻한 축복을 부탁드립니다',
          content: `준비한 마음을 담아 인사드립니다.
오늘의 시작이 더 밝아질 수 있도록 귀한 분들의 축복을 부탁드립니다.`,
        },
        {
          title: '양가 부모님 마음',
          content: `가족이 된다는 약속의 자리에서 마음을 전합니다.
양가 부모님을 대신해 인사드립니다.
오셔서 따뜻한 축복 부탁드립니다.`,
        },
        {
          title: '조언과 축복을 부탁드립니다',
          content: `두 사람이 한 가정을 이루어 서로를 살피며 살아갈 수 있도록
어른들의 조언과 축복을 부탁드립니다.
이 날 함께해 주시면 감사하겠습니다.`,
        },
        {
          title: '기쁨을 오래도록',
          content: `오늘의 기쁨이 오래도록 이어지도록 마음을 모아 축복의 인사를 드립니다.
귀한 걸음으로 함께해 주시면 영광이겠습니다.`,
        },
        {
          title: '진심으로 감사드립니다',
          content: `그동안 곁에서 응원해 주신 모든 분들께 진심으로 감사드립니다.
두 사람의 시작을 축하해 주시고 앞으로도 따뜻한 관심 부탁드립니다.`,
        },
      ],
      religion: [
        {
          title: '하나님의 은혜',
          content: `하나님의 은혜로 두 사람이 만나 새 가정을 이루려 합니다.
이 시작을 함께 기뻐해 주시고 기도로 축복해 주시면 감사하겠습니다.`,
        },
        {
          title: '주님의 사랑으로 세우는 가정',
          content: `주님의 사랑 안에서 서로를 섬기며 살아갈 가정을 세우고자 합니다.
바쁘시더라도 함께해 주셔서 축복과 기도 부탁드립니다.`,
        },
        {
          title: '계획하심을 믿으며',
          content: `하나님의 계획하심 안에서 두 사람은 평생을 함께 걸어가려 합니다.
귀한 발걸음으로 이 자리를 빛내 주시면 더없는 기쁨이 되겠습니다.`,
        },
        {
          title: '기도하는 마음으로',
          content: `기도하는 마음으로 준비한 자리입니다.
두 사람의 믿음 위에 가정의 기쁨이 더해지도록 함께 축하해 주세요.`,
        },
        {
          title: '사랑과 존중의 약속',
          content: `서로를 존중하고 사랑으로 섬기며 주님의 뜻 안에서 가정을 이루겠습니다.
부디 오셔서 기도와 축복을 나눠 주시기 바랍니다.`,
        },
        {
          title: '감사로 채워가는 결혼',
          content: `오늘의 결혼을 통해 하나님의 선하심을 기억하며 늘 감사하는 삶을 약속드립니다.
귀한 분들을 모시고자 합니다.`,
        },
        {
          title: '새 출발의 은혜',
          content: `주님의 은혜 아래 두 사람이 새로운 마음으로 출발합니다.
함께해 주셔서 따뜻한 축복과 격려의 말씀 부탁드립니다.`,
        },
        {
          title: '사랑과 믿음으로 하나',
          content: `사랑과 믿음으로 하나 되는 날,
함께 기도해 주시면 감사하겠습니다.
이 자리에서 주님의 평안이 두 사람의 가정에 머물길 바랍니다.`,
        },
        {
          title: '함께하시는 하나님',
          content: `하나님께서 함께하심을 믿으며 가정의 기쁨을 열어가겠습니다.
부디 오셔서 축하해 주시고 기도로 지켜봐 주시면 고맙겠습니다.`,
        },
        {
          title: '주님께 맡기는 가정',
          content: `두 사람의 앞날을 주님의 손에 맡기며 늘 기쁨으로 섬기는 가정을 이루겠습니다.
축하와 기도로 함께해 주세요.`,
        },
      ],
    } as const;
  }, []);

  const noticeSamples = useMemo(() => {
    return {
      general: [
        {
          title: '예식 안내',
          content: `예식은 정시에 시작될 예정입니다.
원활한 진행을 위해 예식 20분 전까지
도착해 주시면 감사하겠습니다.`,
        },
        {
          title: '참석 안내',
          content: `바쁘신 와중에도 귀한 걸음으로
함께해 주셔서 진심으로 감사드립니다.
따뜻한 축복 부탁드립니다.`,
        },
        {
          title: '식장 안내',
          content: `예식 후 식사는 같은 건물 내 연회장에서
진행됩니다. 안내 표지판을 따라
이동해 주시면 됩니다.`,
        },
      ],
      parking: [
        {
          title: '주차 안내',
          content: `예식장 지하 주차장을 이용하실 수 있으며,
주차 등록 시 2시간 무료입니다.
혼잡 시간에는 대중교통 이용을 권장드립니다.`,
        },
        {
          title: '발렛 안내',
          content: `혼잡한 시간대에는 발렛 서비스가 운영됩니다.
발렛 비용은 현장에서 별도 결제 부탁드립니다.`,
        },
        {
          title: '대중교통 안내',
          content: `주말 교통 혼잡이 예상됩니다.
가급적 지하철 또는 버스 이용을 부탁드립니다.`,
        },
      ],
      meal: [
        {
          title: '식사 안내',
          content: `식사는 예식 종료 후 순차적으로 이용 가능합니다.
혼잡을 피하기 위해 안내에 따라 입장 부탁드립니다.`,
        },
        {
          title: '답례 안내',
          content: `마음 전해주신 모든 분들께 감사드립니다.
정성껏 준비한 식사와 답례를
편하게 즐겨 주시기 바랍니다.`,
        },
        {
          title: '좌석 안내',
          content: `동행하신 분들과 같은 테이블 이용이 가능하도록
현장 안내 스태프가 도와드릴 예정입니다.`,
        },
      ],
    } as const;
  }, []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mainImageInputRef = useRef<HTMLInputElement | null>(null);
  const mainMultiBatchInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playIntentRef = useRef(false);
  const objectUrlRef = useRef<string | null>(null);
  const mainImageObjectUrlRef = useRef<string | null>(null);
  const simulateTimerRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const progressPercent = useMemo(() => {
    if (!duration || !Number.isFinite(duration)) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const formatTime = (value: number) => {
    if (!value || !Number.isFinite(value)) return "0:00";
    const total = Math.max(0, Math.floor(value));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const musicSrc = useMemo(() => {
    if (data.music?.uploadedFile?.url) return data.music.uploadedFile.url;
    const builtIn = builtInTracks.find((t) => t.id === data.music?.selectedId);
    return builtIn?.url || '';
  }, [data.music?.selectedId, data.music?.uploadedFile?.url]);

  useEffect(() => {
    if (simulateTimerRef.current) {
      window.clearInterval(simulateTimerRef.current);
      simulateTimerRef.current = null;
    }
    const prev = audioRef.current;
    if (prev) {
      prev.pause();
      prev.src = '';
      prev.load();
    }
    setCurrentTime(0);
    setDuration(0);
    // 선택 변경으로 src가 바뀌어도, 사용자가 "재생 의도"를 가진 상태면 유지
    setIsPlaying(playIntentRef.current);

    if (!musicSrc) {
      audioRef.current = null;
      // 기본 음원이 아직 연결되지 않은 상태에서도 UI 동작 확인을 위한 가상 길이
      setDuration(205); // 3:25
      return;
    }

    const audio = new Audio(musicSrc);
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';
    audio.loop = !!data.music?.isLoop;
    audio.muted = muted;
    audio.volume = volume;

    const onLoaded = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onEnded = () => setIsPlaying(false);
    const onCanPlay = async () => {
      if (!playIntentRef.current) return;
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('canplay', onCanPlay);
    audioRef.current = audio;
    // 이미 충분히 로드된 경우(캐시 등) 즉시 시도
    void onCanPlay();

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, [musicSrc, data.music?.isLoop]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = muted;
    audioRef.current.volume = volume;
  }, [muted, volume]);

  const startSimulatedPlayback = () => {
    if (simulateTimerRef.current) return;
    simulateTimerRef.current = window.setInterval(() => {
      setCurrentTime((t) => {
        const next = t + 0.5;
        if (next >= (duration || 0)) {
          if (data.music?.isLoop) return 0;
          window.clearInterval(simulateTimerRef.current!);
          simulateTimerRef.current = null;
          setIsPlaying(false);
          return duration || 0;
        }
        return next;
      });
    }, 500);
  };

  const stopSimulatedPlayback = () => {
    if (simulateTimerRef.current) {
      window.clearInterval(simulateTimerRef.current);
      simulateTimerRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (mainImageObjectUrlRef.current) URL.revokeObjectURL(mainImageObjectUrlRef.current);
    };
  }, []);

  useEffect(() => {
    imageEditorZoomRef.current = imageEditorZoom;
    imageEditorRotationRef.current = imageEditorRotation;
    imageEditorFlipXRef.current = imageEditorFlipX;
    imageEditorPanRef.current = imageEditorPan;
  }, [imageEditorZoom, imageEditorRotation, imageEditorFlipX, imageEditorPan]);

  const drawImageEditor = React.useCallback((): boolean => {
    const canvas = imageEditorCanvasRef.current;
    const img = imageEditorImageRef.current;
    if (!canvas) return false;

    const parent = canvas.parentElement;
    if (!parent) return false;
    const rect = parent.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    if (!img || !img.complete || !img.naturalWidth) {
      ctx.clearRect(0, 0, w, h);
      return false;
    }

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2 + imageEditorPanRef.current.x, h / 2 + imageEditorPanRef.current.y);

    if (imageEditorFlipXRef.current) ctx.scale(-1, 1);
    const rad = (imageEditorRotationRef.current * Math.PI) / 180;
    ctx.rotate(rad);

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const rotW = Math.abs(Math.cos(rad)) * iw + Math.abs(Math.sin(rad)) * ih;
    const rotH = Math.abs(Math.sin(rad)) * iw + Math.abs(Math.cos(rad)) * ih;

    const baseScale = Math.max(w / rotW, h / rotH);
    const scale = baseScale * imageEditorZoomRef.current;
    const dw = iw * scale;
    const dh = ih * scale;

    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    return true;
  }, []);

  useEffect(() => {
    if (!imageEditorOpen) return;
    if (!imageEditorSrc) return;

    imageEditorLoadedRef.current = false;
    const img = new Image();
    if (imageEditorSrc.startsWith('http')) img.crossOrigin = 'anonymous';
    imageEditorImageRef.current = img;

    let cancelled = false;
    const rafUntilDrawn = (attempt = 0) => {
      if (cancelled) return;
      // 첫 오픈/포탈 마운트/이미지 디코드 지연까지 감안
      if (attempt > 600) return;
      if (!drawImageEditor()) {
        requestAnimationFrame(() => rafUntilDrawn(attempt + 1));
      }
    };

    img.onload = () => {
      imageEditorLoadedRef.current = true;
      rafUntilDrawn(0);
    };
    img.onerror = () => {
      rafUntilDrawn(0);
    };
    img.src = imageEditorSrc;

    const canvas = imageEditorCanvasRef.current;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => drawImageEditor());
    });
    if (canvas?.parentElement) ro.observe(canvas.parentElement);

    // 이미지 로드 전이라도 캔버스 사이즈를 먼저 맞춰둠
    rafUntilDrawn(0);

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [imageEditorOpen, imageEditorSrc, drawImageEditor]);

  useEffect(() => {
    if (!imageEditorOpen) return;
    if (!imageEditorLoadedRef.current) return;
    requestAnimationFrame(() => drawImageEditor());
  }, [imageEditorOpen, imageEditorZoom, imageEditorRotation, imageEditorFlipX, imageEditorPan, drawImageEditor]);


  useEffect(() => {
    const query = ((data.location.address || '').trim() || '경복궁').trim();
    if (!query) return;

    let cancelled = false;
    const controller = new AbortController();

    setLocationPreviewLoading(true);
    setLocationPreviewCoords(DEFAULT_LOCATION_PREVIEW_COORDS);

    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Accept-Language': 'ko',
            },
          }
        );
        if (!res.ok) throw new Error('geocode failed');
        const json = (await res.json()) as Array<{ lat: string; lon: string }>;
        const first = json?.[0];
        const lat = first ? Number(first.lat) : NaN;
        const lon = first ? Number(first.lon) : NaN;
        if (!cancelled && Number.isFinite(lat) && Number.isFinite(lon)) {
          setLocationPreviewCoords({ lat, lon });
        }
      } catch {
        // 지오코딩 실패 시에도 경복궁 기본 위치를 유지
        if (!cancelled) setLocationPreviewCoords(DEFAULT_LOCATION_PREVIEW_COORDS);
      } finally {
        if (!cancelled) setLocationPreviewLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(t);
    };
  }, [data.location.address]);

  useEffect(() => {
    const mode = ((data.main as any).imageMode ?? 'single') as 'single' | 'multi';
    const imagesRaw = Array.isArray((data.main as any).images) ? (data.main as any).images : [];
    const images = (imagesRaw as any[]).filter((u) => typeof u === 'string' && u.trim().length > 0) as string[];
    if (mode !== 'multi' || images.length < 2) {
      setMainPreviewIndex(0);
      setMainPreviewPrevIndex(null);
      return;
    }

    // 모드/이미지 목록 변경 시 인덱스 클램프
    setMainPreviewIndex((i) => (i >= images.length ? 0 : i));

    const selected = normalizeTransitionEffect((data.main as any).transitionEffect ?? '없음');
    const durationMs = 650;
    const randomPool = [
      '크로스페이드',
      '디졸브',
      '슬라이드(오→왼)',
      '켄번즈(줌 인)',
      '켄번즈(줌 아웃)',
    ] as const;
    const pickRandomEffect = () => {
      const prev = mainPreviewRandomEffect;
      if (randomPool.length <= 1) return randomPool[0];
      let next = prev;
      for (let i = 0; i < 6 && next === prev; i++) {
        next = randomPool[Math.floor(Math.random() * randomPool.length)];
      }
      return next;
    };
    const tick = () => {
      setMainPreviewPrevIndex((prev) => {
        void prev;
        return null;
      });
      setMainPreviewIndex((current) => {
        const next = (current + 1) % images.length;
        const effectToApply = selected === '랜덤' ? pickRandomEffect() : selected;
        if (selected !== '없음') {
          if (selected === '랜덤') setMainPreviewRandomEffect(effectToApply);
          setMainPreviewPrevIndex(current);
          setMainPreviewAnimKey((k) => k + 1);
          window.setTimeout(() => setMainPreviewPrevIndex(null), durationMs + 30);
        }
        return next;
      });
    };

    const intervalSec = Number((data.main as any).transitionIntervalSec ?? 3);
    const intervalMs = (Number.isFinite(intervalSec) ? intervalSec : 3) * 1000;
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [data.main, (data.main as any).imageMode, (data.main as any).transitionEffect, mainPreviewRandomEffect]);

  useEffect(() => {
    const clamp = (v: number) => Math.min(560, Math.max(400, v));
    const onMove = (e: PointerEvent) => {
      if (!isResizingEditorRef.current || !editorResizeStartRef.current) return;
      const dx = e.clientX - editorResizeStartRef.current.x;
      setEditorWidth(clamp(editorResizeStartRef.current.width + dx));
    };
    const onUp = () => {
      if (!isResizingEditorRef.current) return;
      isResizingEditorRef.current = false;
      editorResizeStartRef.current = null;
      editorResizePointerIdRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const requiredItems = sidebarItems.filter((i) => i.category === '필수');
  const orderedContentOptionalItems = optionalOrder
    .map((id) => sidebarItems.find((i) => i.id === id))
    .filter(Boolean) as typeof sidebarItems;
  const otherOptionItems = sidebarItems.filter((i) =>
    OTHER_OPTION_IDS.includes(i.id as any),
  );
  const layoutOrder = [
    ...baseLayoutOrder,
    ...orderedContentOptionalItems
      .map((i) => i.id)
      .filter((id) => (sectionEnabled[id] ?? false) && id !== "share" && id !== "protect"),
  ];
  const orderedItems = [...requiredItems, ...orderedContentOptionalItems, ...otherOptionItems];

  const sidebarSortable = useSortable({
    items: orderedContentOptionalItems.map((it) => ({ ...it, id: it.id })),
    onReorder: (reordered) => setOptionalOrder(reordered.map((x) => x.id)),
  });

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    const container = editorScrollRef.current;
    if (!element || !container) return;

    // scrollIntoView는 스크롤 컨테이너에서 가끔 과하게 정렬되어
    // 최대치를 넘어가며 잘린 것처럼 보일 수 있어 clamp된 scrollTop으로 이동
    const elementTop = element.offsetTop;
    const paddingTop = 16; // p-4
    const targetTop = elementTop - paddingTop;
    const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const nextTop = Math.min(maxTop, Math.max(0, targetTop));
    container.scrollTo({ top: nextTop, behavior: 'smooth' });
  };

  const openImageEditor = (target: { kind: 'single' } | { kind: 'multi'; index: number } | { kind: 'gallery'; index: number }, src: string) => {
    if (!src) return;
    setImageEditorTarget(target);
    setImageEditorSrc(src);
    setImageEditorZoom(1);
    setImageEditorRotation(0);
    setImageEditorFlipX(false);
    setImageEditorPan({ x: 0, y: 0 });
    if (target.kind === 'gallery') {
      const ratio = ((data.gallery as any)?.imageRatio ?? 'portrait') as string;
      setImageEditorAspect(ratio === 'square' ? 'square' : 'portrait');
    } else {
      setImageEditorAspect('portrait');
    }
    setImageEditorOpen(true);
  };

  const closeImageEditor = () => {
    setImageEditorOpen(false);
    setImageEditorTarget(null);
    setImageEditorSrc('');
    setImageEditorAspect('portrait');
  };

  const saveImageEditor = async () => {
    const canvas = imageEditorCanvasRef.current;
    if (!canvas || !imageEditorTarget) return;

    const cropH = canvas.height;
    const cropRatio = imageEditorAspect === 'square' ? 1 : (9 / 16);
    const cropW = Math.round(cropH * cropRatio);
    const offsetX = Math.round((canvas.width - cropW) / 2);

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;
    cropCtx.drawImage(canvas, offsetX, 0, cropW, cropH, 0, 0, cropW, cropH);

    const blob: Blob | null = await new Promise((resolve) => cropCanvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) return;
    const url = URL.createObjectURL(blob);

    if (imageEditorTarget.kind === 'single') {
      if (mainImageObjectUrlRef.current) {
        URL.revokeObjectURL(mainImageObjectUrlRef.current);
      }
      mainImageObjectUrlRef.current = url;
      updateData('main.image', url);
    } else if (imageEditorTarget.kind === 'multi') {
      const prev = Array.isArray((data.main as any).images) ? [...(data.main as any).images] : [];
      // 기존 blob url이면 정리
      const prevUrl = prev[imageEditorTarget.index];
      if (typeof prevUrl === 'string' && prevUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(prevUrl); } catch {}
      }
      prev[imageEditorTarget.index] = url;
      updateData('main.images', prev);
    } else {
      const prev = Array.isArray((data.gallery as any).images) ? [...(data.gallery as any).images] : [];
      const prevUrl = prev[imageEditorTarget.index];
      if (typeof prevUrl === 'string' && prevUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(prevUrl); } catch {}
      }
      prev[imageEditorTarget.index] = url;
      updateData('gallery.images', prev);
    }

    closeImageEditor();
  };

  const renderPreviewSection = (sectionId: string) => {
    switch (sectionId) {
      case 'main': {
        const groomName = data.hosts.groom.name;
        const brideName = data.hosts.bride.name;
        const mode = ((data.main as any).imageMode ?? 'single') as 'single' | 'multi';
        const normalizedEffect = normalizeTransitionEffect((data.main as any).transitionEffect ?? '없음');
        const transitionEffect = normalizedEffect === '랜덤' ? mainPreviewRandomEffect : normalizedEffect;
        const imagesRaw = Array.isArray((data.main as any).images) ? (data.main as any).images : [];
        const images = (imagesRaw as any[]).filter((u) => typeof u === 'string' && u.trim().length > 0) as string[];
        const singleUrl = typeof (data.main as any).image === 'string' ? (data.main as any).image : '';
        const currentUrl =
          mode === 'multi' && images.length > 0 ? images[Math.min(mainPreviewIndex, images.length - 1)] : singleUrl;
        const prevUrl =
          mode === 'multi' && mainPreviewPrevIndex !== null && images.length > 0
            ? images[Math.min(mainPreviewPrevIndex, images.length - 1)]
            : null;

        const animClassForCurrent = (() => {
          switch (transitionEffect) {
            case '크로스페이드':
              return 'animate-[preview-fade-in_650ms_ease-out_forwards]';
            case '디졸브':
              return 'animate-[preview-dissolve-in_650ms_ease-out_forwards]';
            case '슬라이드(왼→오)':
              return 'animate-[preview-slide-in-right_650ms_cubic-bezier(0.2,0.8,0.2,1)_forwards]';
            case '슬라이드(오→왼)':
              return 'animate-[preview-slide-in-left_650ms_cubic-bezier(0.2,0.8,0.2,1)_forwards]';
            case '켄번즈(줌 인)':
              return 'animate-[preview-kenburns-in_650ms_ease-out_forwards]';
            case '켄번즈(줌 아웃)':
              return 'animate-[preview-kenburns-out_650ms_ease-out_forwards]';
            default:
              return '';
          }
        })();

        const animClassForPrev =
          transitionEffect === '디졸브'
            ? 'animate-[preview-dissolve-out_650ms_ease-out_forwards]'
            : transitionEffect === '크로스페이드'
              ? 'animate-[preview-fade-out_650ms_ease-out_forwards]'
              : '';

        return (
          <div className="w-full flex flex-col items-stretch gap-0">
            <div className="w-full aspect-[9/16] rounded-none flex flex-col justify-end items-stretch text-white shadow-none overflow-hidden relative">
              {/* 배경 이미지 레이어 */}
              {transitionEffect === '디졸브' || transitionEffect === '크로스페이드' ? (
                <>
                  {/* 새 이미지(아래) */}
                  <div
                    className="absolute inset-0 bg-center bg-cover"
                    style={{ backgroundImage: currentUrl ? `url(${currentUrl})` : 'none' }}
                  />
                  {/* 이전 이미지(위) — 페이드 아웃 */}
                  {prevUrl && (
                    <div
                      key={`prev-${mainPreviewAnimKey}`}
                      className={`absolute inset-0 bg-center bg-cover ${animClassForPrev}`}
                      style={{ backgroundImage: `url(${prevUrl})` }}
                    />
                  )}
                </>
              ) : (
                <>
                  {/* 이전 이미지(아래, 고정) */}
                  {prevUrl ? (
                    <div
                      className="absolute inset-0 bg-center bg-cover"
                      style={{ backgroundImage: `url(${prevUrl})` }}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 bg-center bg-cover"
                      style={{ backgroundImage: currentUrl ? `url(${currentUrl})` : 'none' }}
                    />
                  )}
                  {/* 현재 이미지(위) — 선택 효과 */}
                  {currentUrl && (
                    <div
                      key={`cur-${mainPreviewAnimKey}`}
                      className={`absolute inset-0 bg-center bg-cover ${transitionEffect === '없음' ? '' : animClassForCurrent}`}
                      style={{ backgroundImage: `url(${currentUrl})` }}
                    />
                  )}
                </>
              )}

              <div className="w-full bg-black/35 px-3 py-3 flex flex-col items-center text-center">
                <p className="text-[0.75em] tracking-[0.2em] uppercase text-white/80">
                  Wedding Invitation
                </p>
                <h1 className="text-[1.25em] font-semibold tracking-tight">
                  {data.main.title}
                </h1>
                <p className="text-[0.875em] text-white/90">
                  {groomName} &amp; {brideName}
                </p>
              </div>
            </div>
          </div>
        );
      }
      case 'greeting':
        return (
          <div className="max-w-[320px] mx-auto">
            <h3 className="text-[0.875em] font-semibold text-on-surface-10 mb-3">
              {data.greeting.title}
            </h3>
            <p className="text-[0.8125em] leading-relaxed text-on-surface-20 whitespace-pre-wrap">
              {data.greeting.content}
            </p>
          </div>
        );
      case 'hosts': {
        const groom = data.hosts.groom;
        const bride = data.hosts.bride;
        const renderParentLabel = (
          parent: typeof groom.father,
          fallback: string,
        ) => (
          <>
            {parent.isDeceased && (
              <img
                src="/gukhwa.svg"
                alt=""
                className="inline-block w-4 h-4 align-middle mr-1"
              />
            )}
            <span className="align-middle">{parent.name || fallback}</span>
          </>
        );
        return (
          <div className="max-w-[320px] mx-auto space-y-4 text-[0.8125em] text-on-surface-20">
            <div>
              <p className="text-[0.75em] font-semibold tracking-[0.2em] text-on-surface-30 mb-2">
                GROOM&apos;S FAMILY
              </p>
              <p className="text-center flex justify-center items-center">
                {renderParentLabel(groom.father, '신랑 부')} ·{' '}
                {renderParentLabel(groom.mother, '신랑 모')}
                의 아들{' '}
                <span className="font-semibold text-on-surface-10">{groom.name}</span>
              </p>
            </div>
            <div>
              <p className="text-[0.75em] font-semibold tracking-[0.2em] text-on-surface-30 mb-2">
                BRIDE&apos;S FAMILY
              </p>
              <p className="text-center flex justify-center items-center">
                {renderParentLabel(bride.father, '신부 부')} ·{' '}
                {renderParentLabel(bride.mother, '신부 모')}
                의 딸{' '}
                <span className="font-semibold text-on-surface-10">{bride.name}</span>
              </p>
            </div>
          </div>
        );
      }
      case 'eventInfo':
        return (
          <div className="max-w-[320px] mx-auto space-y-2 text-[0.8125em] text-on-surface-20">
            <p className="text-[0.75em] font-semibold tracking-[0.2em] text-on-surface-30">
              WEDDING DAY
            </p>
            <p className="text-[0.875em] font-semibold text-on-surface-10">
              {data.eventInfo.date} · {data.eventInfo.time}
            </p>
            <p>{data.eventInfo.venueName}</p>
            <p className="text-on-surface-30">{data.eventInfo.venueDetail}</p>
          </div>
        );
      case 'location':
        {
          const addressInput = (data.location.address || '').trim();
          const address = addressInput || '경복궁';
          const title = ((data.location as any).title ?? '오시는 길') as string;
          const enc = encodeURIComponent(address);
          const naverWeb = address ? `https://map.naver.com/v5/search/${enc}` : '';

          const transportsRaw = (data.location as any)?.transports;
          const transports: Array<{ mode: string; detail: string }> = Array.isArray(transportsRaw) && transportsRaw.length > 0
            ? transportsRaw
            : [
                { mode: (data.location as any).subway || '', detail: (data.location as any).bus || '' },
              ];
          const transportsClean = transports
            .map((t) => ({ mode: (t?.mode ?? '').trim(), detail: (t?.detail ?? '').trim() }))
            .filter((t) => t.mode || t.detail);

          // 앱 딥링크(주소 검색 기반). 설치되어 있지 않으면 웹으로 fallback.
          const appLinks = address
            ? {
                naver: {
                  scheme: `nmap://search?query=${enc}`,
                  web: naverWeb,
                  label: '네이버 지도',
                },
                kakao: {
                  // 카카오내비는 좌표 기반이 가장 확실하지만, 여기서는 주소 검색으로 연결(앱 없으면 웹)
                  scheme: `kakaomap://search?q=${enc}`,
                  web: `https://map.kakao.com/?q=${enc}`,
                  label: '카카오 내비',
                },
                tmap: {
                  scheme: `tmap://search?name=${enc}`,
                  web: `https://www.tmap.co.kr/search?keyword=${enc}`,
                  label: '티맵',
                },
              }
            : null;

          const openAppOrWeb = (scheme: string, web: string) => (e: React.MouseEvent) => {
            e.preventDefault();
            // iOS/Android: scheme 시도 후, 실패 시 웹으로
            window.location.href = scheme;
            window.setTimeout(() => {
              window.open(web, '_blank', 'noopener,noreferrer');
            }, 600);
          };

          return (
            <div className="w-full px-0 space-y-3 text-[0.8125em] text-on-surface-20 text-center">
              <p className="text-[0.75em] font-semibold tracking-[0.2em] text-on-surface-30">
                LOCATION
              </p>
              <p className="text-[0.875em] font-semibold text-on-surface-10">{title}</p>

              <>
                <p className="font-semibold text-on-surface-10">{address}</p>

                <div className="w-full rounded-xl overflow-hidden border border-border bg-[color:var(--surface-20)]">
                  <div className="w-full aspect-[16/10] relative">
                    {locationPreviewCoords ? (
                      <>
                        <NaverMapEmbed
                          lat={locationPreviewCoords.lat}
                          lon={locationPreviewCoords.lon}
                          className="absolute inset-0 w-full h-full"
                          onAuthError={() => setNaverPreviewFailed(true)}
                          onMapReady={() => setNaverPreviewFailed(false)}
                        />
                        {(!process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID || naverPreviewFailed) && (
                          <iframe
                            title="지도 미리보기"
                            className="absolute inset-0 w-full h-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            src={buildOsmEmbedUrl(locationPreviewCoords.lat, locationPreviewCoords.lon)}
                          />
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.06),transparent_55%),radial-gradient(circle_at_70%_40%,rgba(0,0,0,0.05),transparent_55%),linear-gradient(135deg,rgba(0,0,0,0.03),rgba(0,0,0,0.01))] text-on-surface-20">
                        <div className="flex flex-col items-center gap-2 px-4">
                          <div className="w-10 h-10 rounded-full bg-white/90 border border-black/10 flex items-center justify-center shadow-sm">
                            <span className="text-[1.125em]">📍</span>
                          </div>
                          <div className="text-[0.75em] text-on-surface-30">
                            {locationPreviewLoading ? '지도를 불러오는 중…' : '지도를 불러오지 못했어요'}
                          </div>
                          <div className="text-[0.8125em] font-semibold text-on-surface-10 max-w-[240px] truncate">
                            {address}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 하단 앱 전송 바 (캡처 스타일) */}
                  {appLinks && (
                    <div className="w-full bg-[#f2f2f2] border-t border-black/5 grid grid-cols-3 divide-x divide-black/10 text-[13px]">
                      <a
                        href={appLinks.naver.scheme}
                        onClick={openAppOrWeb(appLinks.naver.scheme, appLinks.naver.web)}
                        className="h-12 flex items-center justify-center gap-2 text-on-surface-10 min-w-0 px-2"
                      >
                        <span className="w-6 h-6 rounded-md bg-white border border-black/10 flex items-center justify-center text-[12px] font-bold text-green-600">
                          N
                        </span>
                        {appLinks.naver.label}
                      </a>
                      <a
                        href={appLinks.kakao.scheme}
                        onClick={openAppOrWeb(appLinks.kakao.scheme, appLinks.kakao.web)}
                        className="h-12 flex items-center justify-center gap-2 text-on-surface-10 min-w-0 px-2"
                      >
                        <span className="w-6 h-6 rounded-md bg-[#FEE500] border border-black/10 flex items-center justify-center text-[12px] font-black text-black">
                          K
                        </span>
                        {appLinks.kakao.label}
                      </a>
                      <a
                        href={appLinks.tmap.scheme}
                        onClick={openAppOrWeb(appLinks.tmap.scheme, appLinks.tmap.web)}
                        className="h-12 flex items-center justify-center gap-2 text-on-surface-10 min-w-0 px-2"
                      >
                        <span className="w-6 h-6 rounded-md bg-white border border-black/10 flex items-center justify-center text-[12px] font-black text-[#4B6BFF]">
                          T
                        </span>
                        {appLinks.tmap.label}
                      </a>
                    </div>
                  )}
                </div>

                {transportsClean.length > 0 && (
                  <div className="pt-1 space-y-2">
                    {transportsClean.map((t, idx) => (
                      <div key={`${t.mode}-${idx}`} className="text-[0.8125em] text-on-surface-20">
                        {t.mode && (
                          <div className="font-semibold text-on-surface-10">{t.mode}</div>
                        )}
                        {t.detail && (
                          <div className="text-on-surface-30 whitespace-pre-line">{t.detail}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            </div>
          );
        }
      case 'notice': {
        const title = (data.notice as any)?.title?.trim() || "안내사항";
        const content =
          (data.notice as any)?.content?.trim() ||
          "마음 편히 오셔서 함께 축복해 주세요.\n예식장 내 주차가 가능하며, 식전 30분 전부터 입장이 가능합니다.";
        return (
          <div className="max-w-[320px] mx-auto text-[0.8125em] text-on-surface-20 space-y-3">
            <p className="text-[0.75em] font-semibold tracking-[0.2em] text-on-surface-30">NOTICE</p>
            <p className="text-[0.875em] font-semibold text-on-surface-10">{title}</p>
            <p className="whitespace-pre-line leading-relaxed">{content}</p>
          </div>
        );
      }
      case 'gallery': {
        const images = Array.isArray((data.gallery as any)?.images)
          ? (data.gallery as any).images.filter((u: unknown) => typeof u === "string" && u.trim().length > 0)
          : [];
        const layoutType = ((data.gallery as any)?.layoutType ?? "grid") as "grid" | "slide";
        const imageRatio = ((data.gallery as any)?.imageRatio ?? "portrait") as "square" | "portrait";
        const imageGap = (((data.gallery as any)?.imageGap ?? 'middle') as 'none' | 'small' | 'middle' | 'large');
        const imageGapPx = imageGap === 'none' ? 0 : imageGap === 'small' ? 2 : imageGap === 'large' ? 8 : 4;
        const gridPreviewRadiusClass = imageGap === 'none' ? 'rounded-none' : 'rounded';
        const gridPreviewBorderClass = imageGap === 'none' ? 'border-0' : 'border-border';
        const gridColumns = Number((data.gallery as any)?.gridColumns ?? 3);
        const useLoadMore = !!((data.gallery as any)?.useLoadMore);
        const enableDetailView = !!((data.gallery as any)?.enableDetailView);
        const ratioClass = imageRatio === "square" ? "aspect-square" : "aspect-[3/4]";
        if (!images.length) {
          return (
            <div className="max-w-[320px] mx-auto w-full rounded-xl border border-dashed border-border py-10 text-[0.8125em] text-on-surface-30">
              갤러리 이미지를 추가해 주세요.
            </div>
          );
        }
        if (layoutType === "slide") {
          const currentIndex = Math.min(galleryPreviewIndex, Math.max(0, images.length - 1));
          const moveToPrev = () => {
            if (images.length <= 1) return;
            setGalleryPreviewIndex((prev) => (prev - 1 + images.length) % images.length);
          };
          const moveToNext = () => {
            if (images.length <= 1) return;
            setGalleryPreviewIndex((prev) => (prev + 1) % images.length);
          };
          return (
            <div className="max-w-full mx-auto w-full space-y-2">
              <div className="relative">
                <div
                  className={`w-full rounded overflow-hidden border border-border ${ratioClass}`}
                  onTouchStart={(e) => {
                    gallerySwipeStartXRef.current = e.changedTouches[0]?.clientX ?? null;
                  }}
                  onTouchEnd={(e) => {
                    const startX = gallerySwipeStartXRef.current;
                    const endX = e.changedTouches[0]?.clientX;
                    gallerySwipeStartXRef.current = null;
                    if (startX === null || typeof endX !== 'number') return;
                    const deltaX = endX - startX;
                    if (Math.abs(deltaX) < 30) return;
                    if (deltaX < 0) {
                      moveToNext();
                      return;
                    }
                    moveToPrev();
                  }}
                >
                  <img
                    src={images[currentIndex]}
                    alt={`갤러리 이미지 ${currentIndex + 1}`}
                    className={`w-full h-full object-cover ${enableDetailView ? 'cursor-zoom-in' : ''}`}
                    onClick={() => {
                      if (!enableDetailView) return;
                      setGalleryDetailIndex(currentIndex);
                      setGalleryDetailOpen(true);
                    }}
                  />
                </div>
                <div className="absolute right-2 bottom-2 px-2 py-1 bg-black/50 rounded-[999px] inline-flex justify-start items-center gap-0.5">
                  <div className="justify-start text-white text-xs font-normal">{currentIndex + 1}</div>
                  <div className="opacity-50 justify-start text-white text-xs font-normal">/</div>
                  <div className="opacity-50 justify-start text-white text-xs font-normal">{images.length}</div>
                </div>
              </div>
              <div className="inline-flex justify-start items-center gap-0">
                {images.map((_, idx) => (
                  <button
                    key={`gallery-dot-${idx}`}
                    type="button"
                    onClick={() => setGalleryPreviewIndex(idx)}
                    className={`w-5 h-0.5 transition-colors ${idx === currentIndex ? 'bg-[color:var(--key)]' : 'bg-zinc-300'}`}
                    aria-label={`갤러리 ${idx + 1}번 이미지`}
                  />
                ))}
              </div>
            </div>
          );
        }
        const totalRows = Math.ceil(images.length / gridColumns);
        const shouldShowLoadMoreButton = useLoadMore && totalRows > 3;
        const visibleRows = useLoadMore ? Math.min(galleryGridVisibleRows, totalRows) : totalRows;
        const visibleCount = Math.min(images.length, visibleRows * gridColumns);
        return (
          <div className="max-w-full mx-auto w-full space-y-2">
            <div
              className={`w-full grid ${gridColumns === 2 ? "grid-cols-2" : gridColumns === 4 ? "grid-cols-4" : "grid-cols-3"}`}
              style={{ gap: `${imageGapPx}px` }}
            >
              {images.slice(0, visibleCount).map((src: string, idx: number) => (
                <div key={`${src}-${idx}`} className={`${gridPreviewRadiusClass} overflow-hidden border ${gridPreviewBorderClass} ${ratioClass}`}>
                  <img
                    src={src}
                    alt={`갤러리 이미지 ${idx + 1}`}
                    className={`w-full h-full object-cover ${enableDetailView ? 'cursor-zoom-in' : ''}`}
                    onClick={() => {
                      if (!enableDetailView) return;
                      setGalleryDetailIndex(idx);
                      setGalleryDetailOpen(true);
                    }}
                  />
                </div>
              ))}
            </div>
            {shouldShowLoadMoreButton && visibleRows < totalRows && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
                  onClick={() => setGalleryGridVisibleRows((prev) => Math.min(prev + 3, totalRows))}
                >
                  더보기
                </Button>
              </div>
            )}
          </div>
        );
      }
      case 'account': {
        const title = data.accounts?.title || "마음 전하실 곳";
        const content = data.accounts?.content || "";
        const list = Array.isArray(data.accounts?.list) ? data.accounts.list : [];
        const visibleList = list.filter((acc) => acc.isExpanded);
        return (
          <div className="max-w-full mx-auto w-full space-y-3 text-[0.8125em] text-on-surface-20">
            <p className="text-[0.75em] font-semibold tracking-[0.2em] text-on-surface-30">ACCOUNT</p>
            <p className="text-[0.875em] font-semibold text-on-surface-10">{title}</p>
            {content && <p className="whitespace-pre-line leading-relaxed">{content}</p>}
            <div className="space-y-2">
              {visibleList.length === 0 && (
                <div className="rounded-lg border border-dashed border-border py-4 text-on-surface-30">
                  노출할 계좌정보가 없습니다.
                </div>
              )}
              {visibleList.map((acc) => (
                <div key={acc.id} className="rounded-lg border border-border bg-[color:var(--surface-20)] px-3 py-3 text-left">
                  <div className="text-[0.75em] text-on-surface-30">{acc.groupName || "그룹명"}</div>
                  <div className="font-semibold text-on-surface-10">{acc.bank || "은행"} {acc.accountNumber || "계좌번호"}</div>
                  <div className="text-on-surface-30">{acc.holder || "예금주"}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'guestbook': {
        const title = ((data.guestbook as any)?.title ?? "방명록") as string;
        const description = ((data.guestbook as any)?.description ?? "축하 인사를 남겨주세요.") as string;
        const hasPassword = Boolean(data.guestbook?.password?.trim());
        const allowAnonymous = !!(data.guestbook as any)?.allowAnonymous;
        const entries = Array.isArray((data.guestbook as any)?.entries) ? (data.guestbook as any).entries : [];
        const orderedEntries = entries;
        const perPage = 5;
        const totalPages = Math.max(1, Math.ceil(orderedEntries.length / perPage));
        const currentPage = Math.min(guestbookPreviewPage, totalPages);
        const pagedEntries = orderedEntries.slice((currentPage - 1) * perPage, currentPage * perPage);
        const pageStart = Math.max(1, currentPage - 2);
        const pageEnd = Math.min(totalPages, pageStart + 4);
        const pageNumbers = Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i);
        return (
          <div className="max-w-full mx-auto w-full space-y-3 text-[0.8125em] text-on-surface-20 text-left">
            <p className="text-[0.75em] font-semibold tracking-[0.2em] text-on-surface-30">GUESTBOOK</p>
            <p className="text-[0.875em] font-semibold text-on-surface-10">{title}</p>
            <p className="whitespace-pre-line leading-relaxed">{description}</p>
            <div className="space-y-2">
              {orderedEntries.length === 0 && (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-on-surface-30">
                  아직 등록된 축하 메시지가 없습니다.
                </div>
              )}
              {pagedEntries.map((entry: any) => (
                <div key={entry.id} className="rounded-2xl border border-border bg-white px-4 py-4 space-y-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-on-surface-10">
                      {entry.name || (allowAnonymous ? "익명" : "작성자")}
                    </span>
                    <span className="text-[0.75em] text-on-surface-30">{entry.createdAt}</span>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed text-on-surface-20">
                    {entry.isSecret ? "🔒 비밀글입니다." : entry.message}
                  </p>
                </div>
              ))}
            </div>
            {orderedEntries.length > perPage && (
              <div className="pt-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[15px]">
                  {pageNumbers.map((num) => (
                    <button
                      key={`guestbook-page-${num}`}
                      type="button"
                      onClick={() => setGuestbookPreviewPage(num)}
                      className={`${num === currentPage ? 'text-on-surface-10 font-semibold' : 'text-on-surface-30'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg px-4 h-10 text-[13px]"
                >
                  축하메시지 남기기
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2 text-[0.75em] text-on-surface-30">
              {hasPassword && <span>비밀번호 보호</span>}
            </div>
          </div>
        );
      }
      case 'youtube': {
        const title = ((data.youtube as any)?.title ?? "영상으로 전하는 마음") as string;
        const videoId = getYoutubeVideoId(data.youtube?.url ?? "");
        const isLoop = !!(data.youtube as any)?.isLoop;
        const embedUrl = videoId
          ? `https://www.youtube.com/embed/${videoId}${isLoop ? `?loop=1&playlist=${videoId}` : ""}`
          : null;
        return (
          <div className="max-w-full mx-auto w-full space-y-3 text-[0.8125em] text-on-surface-20">
            <p className="text-[0.75em] font-semibold tracking-[0.2em] text-on-surface-30">YOUTUBE</p>
            <p className="text-[0.875em] font-semibold text-on-surface-10">{title}</p>
            {embedUrl ? (
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-black">
                <iframe
                  src={embedUrl}
                  title="유튜브 영상 미리보기"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="w-full h-28 rounded-xl border border-dashed border-border flex items-center justify-center text-on-surface-30">
                유튜브 링크를 입력해 주세요.
              </div>
            )}
          </div>
        );
      }
      case 'share': {
        const title = data.share?.title || "모바일 청첩장";
        const description = data.share?.description || "소중한 날에 초대합니다.";
        const useThumbnail = (data.share as any)?.useThumbnail ?? true;
        const thumb = data.share?.thumbnail?.trim() || "";
        return (
          <div className="max-w-full mx-auto w-full space-y-3 text-[0.8125em] text-on-surface-20">
            <p className="text-[0.75em] font-semibold tracking-[0.2em] text-on-surface-30">SHARE</p>
            <div className="rounded-xl border border-border overflow-hidden bg-white text-left">
              {useThumbnail && (
                <div className="h-36 w-full bg-[color:var(--surface-20)]">
                  {thumb ? (
                    <img src={thumb} alt="공유 썸네일" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-30">썸네일 미리보기</div>
                  )}
                </div>
              )}
              <div className="px-3 py-3 space-y-1">
                <p className="font-semibold text-on-surface-10 line-clamp-1">{title}</p>
                <p className="text-on-surface-30 line-clamp-2">{description}</p>
              </div>
            </div>
            <p className="text-[0.75em] text-on-surface-30">공유 시 썸네일/제목/설명으로 노출됩니다.</p>
          </div>
        );
      }
      case 'protect': {
        const items = [
          { label: "캡처 방지", enabled: !!data.protect?.preventCapture },
          { label: "줌 방지", enabled: !!data.protect?.preventZoom },
          { label: "다운로드 방지", enabled: !!data.protect?.preventDownload },
        ];
        return (
          <div className="max-w-full mx-auto w-full space-y-3 text-[0.8125em] text-on-surface-20">
            <p className="text-[0.75em] font-semibold tracking-[0.2em] text-on-surface-30">PROTECT</p>
            <div className="rounded-xl border border-border bg-white text-left px-3 py-3 space-y-2">
              {items.map((it) => (
                <div key={it.label} className="flex items-center justify-between">
                  <span>{it.label}</span>
                  <span className={it.enabled ? "text-[color:var(--key)] font-semibold" : "text-on-surface-30"}>
                    {it.enabled ? "ON" : "OFF"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-0 h-screen w-full bg-gray-50 overflow-hidden">
      
      {/* 상단 헤더 */}
      <header className="w-full flex-shrink-0 bg-white border-b border-border z-30">
        <div className="h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tighter text-on-surface-10">온서로</span>
          </div>
          <button className="bg-[color:var(--key)] text-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-[color:var(--key-dark)] transition-colors shadow-none">
            저장하기
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">

        {/* 1. 좌측 사이드바 내비게이션 */}
        <aside className="w-[100px] flex-shrink-0 bg-white border-r border-border flex flex-col items-center py-6 z-20 overflow-y-auto no-scrollbar">
          
          <div className="w-full text-center mb-2"><span className="text-[12px] font-bold text-on-surface-30">필수 사항</span></div>
          <div className="flex flex-col gap-y-2 mb-6 w-full items-center">
            {sidebarItems.filter(i => i.category === '필수').map((item) => {
              const isActive = activeSection === item.id;
              return (
                <div 
                  key={item.id} onClick={() => scrollToSection(item.id)}
                  className={`flex flex-col items-center justify-center gap-y-1 w-[80px] h-[64px] rounded-lg cursor-pointer transition-colors shadow-none ${isActive ? 'bg-slate-100' : 'text-on-surface-20 hover:bg-slate-100'}`}
                >
                  <item.icon className={`w-6 h-6 ${isActive ? 'text-[color:var(--key)]' : 'text-on-surface-30'}`} strokeWidth={1.5} />
                  <span className={`text-[12px] font-normal ${isActive ? 'text-[color:var(--key)]' : 'text-on-surface-20'}`}>{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="w-full border-t border-border mb-4"></div>
          
          <div className="w-full text-center mb-2"><span className="text-[12px] font-bold text-on-surface-30">선택 사항</span></div>
          <div className="flex flex-col gap-y-2 pb-10 w-full items-center">
            {orderedContentOptionalItems.map((item) => {
              const isActive = activeSection === item.id;
              const isDisabled = item.hasSwitch && !(sectionEnabled[item.id] ?? false);
              const { handleProps, wrapperProps, isDragging } = sidebarSortable.getItemProps(item.id);
              return (
                <div
                  key={item.id}
                  {...wrapperProps}
                  className={`${wrapperProps.className} flex flex-col items-center justify-center gap-y-1 w-[80px] h-[64px] rounded-lg shadow-none cursor-grab active:cursor-grabbing ${
                    isDisabled
                      ? 'opacity-50 text-on-surface-30 hover:bg-slate-100'
                      : `${isActive ? 'bg-slate-100' : 'text-on-surface-20 hover:bg-slate-100'}`
                  }`}
                  {...handleProps}
                  onClick={() => { if (!isDragging) scrollToSection(item.id); }}
                >
                  <item.icon className={`w-6 h-6 ${isDisabled ? 'text-on-surface-30' : isActive ? 'text-[color:var(--key)]' : 'text-on-surface-30'}`} strokeWidth={1.5} />
                  <span className={`text-[12px] font-normal ${isDisabled ? 'text-on-surface-30' : isActive ? 'text-[color:var(--key)]' : 'text-on-surface-20'}`}>{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="w-full border-t border-border mb-4"></div>
          <div className="w-full text-center mb-2"><span className="text-[12px] font-bold text-on-surface-30">기타옵션</span></div>
          <div className="flex flex-col gap-y-2 pb-10 w-full items-center">
            {otherOptionItems.map((item) => {
              const isActive = activeSection === item.id;
              const isDisabled = item.hasSwitch && !(sectionEnabled[item.id] ?? false);
              return (
                <div
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex flex-col items-center justify-center gap-y-1 w-[80px] h-[64px] rounded-lg cursor-pointer transition-colors shadow-none ${
                    isDisabled
                      ? 'opacity-50 text-on-surface-30 hover:bg-slate-100'
                      : `${isActive ? 'bg-slate-100' : 'text-on-surface-20 hover:bg-slate-100'}`
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${isDisabled ? 'text-on-surface-30' : isActive ? 'text-[color:var(--key)]' : 'text-on-surface-30'}`} strokeWidth={1.5} />
                  <span className={`text-[12px] font-normal ${isDisabled ? 'text-on-surface-30' : isActive ? 'text-[color:var(--key)]' : 'text-on-surface-20'}`}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* 2. 중앙 에디터 패널 */}
        <section
          id="editor-scroll-area"
          className="flex-shrink-0 self-stretch min-h-0 bg-white border-r border-border flex flex-col relative z-10 overflow-hidden"
          style={{ width: editorWidth }}
        >
          <div ref={editorScrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth no-scrollbar">
            <div
              className="p-4 flex-1 flex flex-col gap-4 [&>div]:p-0"
              style={{ backgroundColor: data.style.bgColor || 'var(--surface-10)' }}
            >
              {orderedItems.map((item, idx) => {
                const isInitiallyExpanded = true;
                const isContentOptional = item.category === '선택' && !OTHER_OPTION_IDS.includes(item.id as any);
                const isOtherOption = OTHER_OPTION_IDS.includes(item.id as any);
                const prevItem = orderedItems[idx - 1];
                const prevIsContentOptional = !!prevItem && prevItem.category === '선택' && !OTHER_OPTION_IDS.includes(prevItem.id as any);
                const prevIsOtherOption = !!prevItem && OTHER_OPTION_IDS.includes(prevItem.id as any);
                const isFirstContentOptional = isContentOptional && !prevIsContentOptional;
                const isFirstOtherOption = isOtherOption && !prevIsOtherOption;
                const editorSortProps = isContentOptional ? sidebarSortable.getItemProps(item.id) : null;
                const isDragging = editorSortProps?.isDragging ?? false;
                return (
                  <React.Fragment key={item.id}>
                {isFirstContentOptional && (
                  <div className="text-[13px] font-bold text-on-surface-30 pt-2 mt-10">선택사항</div>
                )}
                {isFirstOtherOption && (
                  <div className="text-[13px] font-bold text-on-surface-30 pt-2 mt-10">기타옵션</div>
                )}
                <div
                  id={item.id}
                  className={`scroll-mt-6 border rounded-xl overflow-hidden bg-white transition-all duration-200 ease-out ${
                    item.id === 'main' ? 'mb-0' : ''
                  } ${
                    isDragging
                      ? 'border-[color:var(--key)] ring-2 ring-[color:var(--key)]/20 shadow-lg scale-[1.01] opacity-60 z-10 relative'
                      : activeSection === item.id
                        ? 'border-[color:var(--key)] ring-1 ring-[color:var(--key)]/25 shadow-sm'
                        : 'border-border'
                  }`}
                  onFocusCapture={() => setActiveSection(item.id)}
                  onPointerEnter={() => editorSortProps?.wrapperProps.onPointerEnter()}
                >
                  <div
                    className="h-14 py-5 pl-5 pr-3 flex items-center justify-between bg-[color:var(--surface-1)] hover:bg-[color:var(--surface-1)] cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {!isInitiallyExpanded && <CheckCircle2 className="w-5 h-5 text-on-surface-10 flex-shrink-0" />}
                      <h2 className="text-[15px] font-semibold text-on-surface-10 truncate m-0 pt-1">
                        {item.id === 'hosts' ? '신랑&신부 정보' : item.label}
                      </h2>
                      {item.hasSwitch && (
                        <Switch
                          className="ml-2 flex-shrink-0"
                          checked={sectionEnabled[item.id] ?? false}
                          onCheckedChange={(checked) => setSectionEnabled((prev) => ({ ...prev, [item.id]: checked }))}
                        />
                      )}
                    </div>
                    {isContentOptional && editorSortProps && (
                      <button
                        type="button"
                        {...editorSortProps.handleProps}
                        className="flex-shrink-0 inline-flex items-center justify-center p-1 rounded hover:bg-slate-200/80 text-on-surface-30 hover:text-on-surface-20 active:text-on-surface-10 cursor-grab active:cursor-grabbing touch-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="w-5 h-5 text-on-surface-disabled" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>

                  {isInitiallyExpanded && (!item.hasSwitch || sectionEnabled[item.id]) && (
                    <div className="p-6 bg-white flex flex-col gap-5 border-t border-border">
                      {/* 테마 섹션 */}
                      {item.id === 'theme' && (
                        <>
                          {/* 글꼴 선택 */}
                          <FormItem label="글꼴">
                            <div className="flex flex-wrap gap-2">
                              {[
                                'Pretendard',
                                'Noto Sans KR',
                                'Noto Serif KR',
                                'Gowun Dodum',
                                'Gowun Batang',
                              ].map((font) => {
                                const isActive = data.theme.fontFamily === font;
                                return (
                                  <OptionChip
                                    key={font}
                                    label={font}
                                    active={isActive}
                                    onClick={() => updateData('theme.fontFamily', font)}
                                  />
                                );
                              })}
                            </div>
                          </FormItem>

                          {/* 글꼴 크기 */}
                          <FormItem label="글꼴 크기">
                            <div className="flex flex-wrap gap-2">
                              {[
                                { value: 'sm' as const, label: '작게' },
                                { value: 'md' as const, label: '중간' },
                                { value: 'lg' as const, label: '크게' },
                              ].map((opt) => {
                                const isActive = (data.theme as any).fontScale === opt.value || (!(data.theme as any).fontScale && opt.value === 'md');
                                return (
                                  <OptionChip
                                    key={opt.value}
                                    label={opt.label}
                                    active={isActive}
                                    onClick={() => updateData('theme.fontScale', opt.value)}
                                  />
                                );
                              })}
                            </div>
                          </FormItem>

                          <div className="w-full h-px bg-border/60" />

                          {/* 배경 컬러 */}
                          <FormItem label="배경 컬러">
                            {[
                              '#FFFFFF',
                              '#F5F5F5',
                              '#FFF8F5',
                              '#FCFBF7',
                              '#F5F8FA',
                              '#F8F5FA',
                            ].map((color) => {
                              const isActive = data.style.bgColor === color;
                              return (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => updateData('style.bgColor', color)}
                                  className={`w-7 h-7 rounded-full transition-shadow flex items-center justify-center ${
                                      isActive ? 'border-2 border-[color:var(--on-surface-10)]' : 'border border-[color:var(--border-10)]'
                                  }`}
                                >
                                  <span
                                    className="w-6 h-6 rounded-full"
                                    style={{ backgroundColor: color }}
                                  />
                                </button>
                              );
                            })}
                          </FormItem>

                          {/* 파티클 효과 */}
                          <FormItem label="파티클 효과">
                            <div className="flex flex-wrap gap-2">
                              {[
                                { value: 'none', label: '사용 안 함' },
                                { value: 'cherryBlossom', label: '벚꽃 날림' },
                                { value: 'snow', label: '눈송이' },
                                { value: 'sparkle', label: '반짝임' },
                                { value: 'heart', label: '하트' },
                              ].map((option) => {
                                const isActive = data.theme.particleEffect === option.value;
                                return (
                                  <OptionChip
                                    key={option.value}
                                    label={option.label}
                                    active={isActive}
                                    onClick={() =>
                                      updateData('theme.particleEffect', option.value)
                                    }
                                  />
                                );
                              })}
                            </div>
                          </FormItem>

                          {/* 스크롤 등장 효과 */}
                          <FormItem label="스크롤효과">
                            <div className="flex flex-wrap gap-2">
                              <OptionChip
                                label="켜짐"
                                active={!!data.theme.scrollEffect}
                                onClick={() => updateData('theme.scrollEffect', true)}
                              />
                              <OptionChip
                                label="꺼짐"
                                active={!data.theme.scrollEffect}
                                onClick={() => updateData('theme.scrollEffect', false)}
                              />
                            </div>
                          </FormItem>
                        </>
                      )}

                      {/* 메인 섹션 */}
                      {item.id === 'main' && (
                        <>
                          <FormItem label="인트로 디자인">
                            <div className="flex flex-wrap gap-2">
                              {(['A', 'B', 'C', 'D', 'E'] as const).map((t) => (
                                <OptionChip
                                  key={t}
                                  label={`타입 ${t}`}
                                  active={(data.main as any).introType === t}
                                  onClick={() => updateData('main.introType', t)}
                                />
                              ))}
                            </div>
                          </FormItem>

                          <div className="border-t border-dashed border-[color:var(--border-20)]" />

                          <FormItem label="사진타입">
                            <div className="flex flex-wrap gap-2">
                              <OptionChip
                                label="단일 이미지"
                                active={((data.main as any).imageMode ?? 'single') === 'single'}
                                onClick={() => updateData('main.imageMode', 'single')}
                              />
                              <OptionChip
                                label="다중 이미지 전환"
                                active={((data.main as any).imageMode ?? 'single') === 'multi'}
                                onClick={() => updateData('main.imageMode', 'multi')}
                              />
                            </div>
                          </FormItem>

                          <FormItem label="사진">
                            <div className="flex flex-col gap-2 w-full">
                              {((data.main as any).imageMode ?? 'single') === 'single' ? (
                                <div className="w-full">
                                  <div className="relative w-[120px] aspect-[9/16] group">
                                    <button
                                      type="button"
                                      className={[
                                        "w-full h-full rounded-lg border bg-white flex items-center justify-center text-3xl text-on-surface-30 bg-center bg-cover bg-clip-border bg-origin-border",
                                        data.main.image
                                          ? "border-transparent"
                                          : "border-dashed border-border hover:bg-slate-50",
                                      ].join(" ")}
                                      style={
                                        data.main.image
                                          ? { backgroundImage: `url(${data.main.image})` }
                                          : undefined
                                      }
                                      onClick={() => mainImageInputRef.current?.click()}
                                      aria-label="이미지 추가"
                                    >
                                      {data.main.image ? '' : '+'}
                                    </button>
                                    {!!data.main.image && (
                                      <div className="absolute right-2 top-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          className="w-8 h-8 rounded-lg bg-white/95 border border-border shadow-sm flex items-center justify-center text-on-surface-20 hover:bg-white"
                                          aria-label="이미지 수정"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openImageEditor({ kind: 'single' }, data.main.image);
                                          }}
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          className="w-8 h-8 rounded-lg bg-white/95 border border-border shadow-sm flex items-center justify-center text-on-surface-20 hover:bg-white"
                                          aria-label="이미지 삭제"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (mainImageObjectUrlRef.current) {
                                              URL.revokeObjectURL(mainImageObjectUrlRef.current);
                                              mainImageObjectUrlRef.current = null;
                                            }
                                            updateData('main.image', '');
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <input
                                    ref={mainImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      if (mainImageObjectUrlRef.current) {
                                        URL.revokeObjectURL(mainImageObjectUrlRef.current);
                                      }
                                      const url = URL.createObjectURL(file);
                                      mainImageObjectUrlRef.current = url;
                                      updateData('main.image', url);
                                    }}
                                  />
                                </div>
                              ) : (
                                <>
                                  <MultiImageGrid
                                    images={Array.isArray((data.main as any).images) ? (data.main as any).images : []}
                                    onReorder={(next) => updateData('main.images', next)}
                                    onSlotClick={(i, hasImg) => {
                                      if (!hasImg) { mainMultiBatchInputRef.current?.click(); return; }
                                      const el = document.getElementById(`main-multi-image-${i}`) as HTMLInputElement | null;
                                      el?.click();
                                    }}
                                    onEdit={(i, src) => openImageEditor({ kind: 'multi', index: i }, src)}
                                    onDelete={(i) => {
                                      const next = Array.isArray((data.main as any).images) ? [...(data.main as any).images] : [];
                                      next[i] = '';
                                      updateData('main.images', next);
                                    }}
                                  />
                                  <div className="text-[12px] text-on-surface-30">* 이미지를 한 번에 최대 4장까지 선택해서 추가할 수 있어요.</div>
                                  <input
                                    ref={mainMultiBatchInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files ?? []);
                                      if (!files.length) return;

                                      const prev = Array.isArray((data.main as any).images) ? [...(data.main as any).images] : [];
                                      const next = Array.from({ length: 4 }).map((_, i) => prev[i] ?? '');

                                      let fileIdx = 0;
                                      for (let slot = 0; slot < 4 && fileIdx < files.length; slot++) {
                                        if (next[slot]) continue;
                                        const url = URL.createObjectURL(files[fileIdx]);
                                        next[slot] = url;
                                        fileIdx += 1;
                                      }

                                      updateData('main.images', next);
                                      // 같은 파일 다시 선택 가능하도록 reset
                                      e.currentTarget.value = '';
                                    }}
                                  />
                                  {Array.from({ length: 4 }).map((_, i) => (
                                    <input
                                      key={i}
                                      id={`main-multi-image-${i}`}
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const url = URL.createObjectURL(file);
                                        const next = Array.isArray((data.main as any).images) ? [...(data.main as any).images] : [];
                                        next[i] = url;
                                        updateData('main.images', next);
                                        // multi 업로드는 별도 revoke 관리가 필요하지만, 현재는 미리보기/사용이 없어서 누수 영향이 작음
                                      }}
                                    />
                                  ))}
                                </>
                              )}
                            </div>
                          </FormItem>

                          {((data.main as any).imageMode ?? 'single') === 'multi' && (
                            <FormItem label="전환효과">
                              <div className="flex flex-wrap gap-2">
                                {(
                                  [
                                    { value: '없음', label: '없음' },
                                    { value: '크로스페이드', label: '크로스페이드' },
                                    { value: '디졸브', label: '디졸브' },
                                    { value: '슬라이드(오→왼)', label: '슬라이드' },
                                    { value: '켄번즈(줌 인)', label: '줌 인' },
                                    { value: '켄번즈(줌 아웃)', label: '줌 아웃' },
                                    { value: '랜덤', label: '랜덤' },
                                  ] as const
                                ).map(({ value, label }) => (
                                  <OptionChip
                                    key={value}
                                    label={label}
                                    active={normalizeTransitionEffect((data.main as any).transitionEffect) === value}
                                    onClick={() => updateData('main.transitionEffect', value)}
                                  />
                                ))}
                              </div>
                            </FormItem>
                          )}
                          {((data.main as any).imageMode ?? 'single') === 'multi' && (
                            <FormItem label="전환시간">
                              <div className="flex flex-wrap gap-2">
                                {([2, 3, 4, 5] as const).map((sec) => (
                                  <OptionChip
                                    key={sec}
                                    label={`${sec}초`}
                                    active={Number((data.main as any).transitionIntervalSec ?? 3) === sec}
                                    onClick={() => updateData('main.transitionIntervalSec', sec)}
                                  />
                                ))}
                              </div>
                            </FormItem>
                          )}

                          <div className="border-t border-dashed border-[color:var(--border-20)]" />

                          <FormItem label="프레임 이펙트">
                            <div className="flex flex-wrap gap-2">
                              {(['적용 안함', '물결', '안개', '방울'] as const).map((v) => (
                                <OptionChip
                                  key={v}
                                  label={v}
                                  active={(data.main as any).frameEffect === v}
                                  onClick={() => updateData('main.frameEffect', v)}
                                />
                              ))}
                            </div>
                          </FormItem>

                          <FormItem label="제목 색상">
                            <div className="relative w-10 h-10 flex-shrink-0">
                              <button
                                type="button"
                                className="w-10 h-10 rounded-xl transition-shadow flex items-center justify-center border border-[color:var(--border-10)] bg-white"
                                aria-label="제목 색상 선택"
                              >
                                <span className="w-8 h-8 rounded-lg" style={{ backgroundColor: data.main.titleColor }} />
                              </button>
                              <input
                                type="color"
                                value={data.main.titleColor}
                                onChange={(e) => updateData('main.titleColor', e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label="제목 색상 선택"
                              />
                            </div>
                            <Input
                              value={data.main.titleColor}
                              onChange={(e) => updateData('main.titleColor', e.target.value)}
                              className="shadow-none flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => updateData('main.titleColor', '#333333')}
                              className="flex-shrink-0 text-[12px] text-on-surface-30 hover:text-on-surface-10 transition-colors"
                            >
                              초기화
                            </button>
                          </FormItem>

                          <FormItem label="본문 색상">
                            <div className="relative w-10 h-10 flex-shrink-0">
                              <button
                                type="button"
                                className="w-10 h-10 rounded-xl transition-shadow flex items-center justify-center border border-[color:var(--border-10)] bg-white"
                                aria-label="본문 색상 선택"
                              >
                                <span className="w-8 h-8 rounded-lg" style={{ backgroundColor: data.main.bodyColor }} />
                              </button>
                              <input
                                type="color"
                                value={data.main.bodyColor}
                                onChange={(e) => updateData('main.bodyColor', e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label="본문 색상 선택"
                              />
                            </div>
                            <Input
                              value={data.main.bodyColor}
                              onChange={(e) => updateData('main.bodyColor', e.target.value)}
                              className="shadow-none flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => updateData('main.bodyColor', '#666666')}
                              className="flex-shrink-0 text-[12px] text-on-surface-30 hover:text-on-surface-10 transition-colors"
                            >
                              초기화
                            </button>
                          </FormItem>
                        </>
                      )}

                      {/* 배경음악 섹션 */}
                      {item.id === 'bgm' && (
                        <>
                          {/* Player Bar */}
                          <div className="w-full mb-0">
                            <div className="flex w-full h-16 items-center gap-5 rounded-lg bg-[color:var(--surface-disabled)] px-3 py-2">
                              {/* 재생 / 정지 버튼 (상태에 따라 스왑) */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!isPlaying ? (
                                  <button
                                    type="button"
                                    className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full border border-border bg-transparent text-on-surface-30 hover:bg-white/60 hover:text-on-surface-10 transition-colors"
                                    onClick={async () => {
                                      const audio = audioRef.current;
                                      if (!musicSrc) {
                                        playIntentRef.current = true;
                                        setIsPlaying(true);
                                        startSimulatedPlayback();
                                        return;
                                      }
                                      if (!audio) return;
                                      try {
                                        playIntentRef.current = true;
                                        await audio.play();
                                        setIsPlaying(true);
                                      } catch {
                                        playIntentRef.current = false;
                                        setIsPlaying(false);
                                      }
                                    }}
                                    aria-label="재생"
                                  >
                                    <Play className="w-4 h-4 text-[color:var(--on-surface-10)] fill-current" fill="currentColor" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full border border-border bg-transparent text-on-surface-30 hover:bg-white/60 hover:text-on-surface-10 transition-colors"
                                    onClick={() => {
                                      const audio = audioRef.current;
                                      if (!musicSrc) {
                                        playIntentRef.current = false;
                                        stopSimulatedPlayback();
                                        setCurrentTime(0);
                                        return;
                                      }
                                      if (!audio) return;
                                      playIntentRef.current = false;
                                      audio.pause();
                                      audio.currentTime = 0;
                                      setCurrentTime(0);
                                      setIsPlaying(false);
                                    }}
                                    aria-label="정지"
                                  >
                                    <div className="w-3 h-3 rounded-[2px] bg-[color:var(--on-surface-10)]" />
                                  </button>
                                )}
                              </div>

                              {/* 타임라인 + 시간 정보 */}
                              <div className="flex-1 inline-flex flex-col justify-center items-start gap-1">
                                <div className="w-full h-4 relative flex items-center">
                                  {/* 커스텀 트랙 */}
                                  <div className="absolute inset-y-1 left-0 right-0 flex items-center gap-0">
                                    <div
                                      className="h-1 rounded-[999px] bg-[color:var(--primary-custom)]"
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                    <div className="flex-1 h-1 rounded-[999px] bg-[color:var(--border-20)]" />
                                  </div>
                                  {/* 썸(동그라미) */}
                                  <div
                                    className="w-4 h-4 rounded-full bg-white border border-black/20 absolute"
                                    style={{ left: `${progressPercent}%`, transform: "translateX(-50%)" }}
                                  />
                                  {/* 실제 range 입력 (투명) */}
                                  <input
                                    type="range"
                                    min={0}
                                    max={duration || 0}
                                    step={0.1}
                                    value={Math.min(currentTime, duration || 0)}
                                    disabled={!duration}
                                    onChange={(e) => {
                                      const next = Number(e.target.value);
                                      const audio = audioRef.current;
                                      if (!musicSrc) {
                                        setCurrentTime(next);
                                        return;
                                      }
                                      if (!audio) return;
                                      audio.currentTime = next;
                                      setCurrentTime(next);
                                    }}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                  />
                                </div>
                                <div className="text-xs text-on-surface-30/70">
                                  {formatTime(currentTime)} / {formatTime(duration)}
                                </div>
                              </div>

                              {/* 볼륨 아이콘 (우측) */}
                              <button
                                type="button"
                                className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full border border-border bg-transparent text-on-surface-30 hover:bg-white/60 hover:text-on-surface-10 transition-colors"
                                onClick={() => setMuted((v) => !v)}
                                aria-label={muted ? "음소거 해제" : "음소거"}
                              >
                                {muted ? (
                                  <VolumeX className="w-4 h-4 fill-current" fill="currentColor" />
                                ) : (
                                  <Volume2 className="w-4 h-4 fill-current" fill="currentColor" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Built-in dropdown */}
                          <FormItem label="기본 음원">
                            <div className="w-full">
                              <div className="grid grid-cols-2 gap-2">
                                {builtInTracks.map((t) => {
                                  const selected = (data.music?.selectedId ?? builtInTracks[0].id) === t.id;
                                  const disabled = !!data.music?.uploadedFile;
                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      disabled={disabled}
                                      aria-pressed={selected}
                                      onClick={() => {
                                        // 트랙 목록은 '선택'만. 실제 재생은 플레이 버튼으로만.
                                        playIntentRef.current = false;
                                        stopSimulatedPlayback();
                                        const audio = audioRef.current;
                                        if (audio) {
                                          audio.pause();
                                          audio.currentTime = 0;
                                        }
                                        setCurrentTime(0);
                                        setIsPlaying(false);
                                        updateData('music.selectedId', t.id);
                                      }}
                                      className={[
                                        'h-10 rounded-lg px-4 text-[13px] font-medium transition-colors border text-left truncate',
                                        disabled
                                          ? 'bg-input/50 text-on-surface-30/70 border-input cursor-not-allowed'
                                          : selected
                                            ? 'bg-transparent text-on-surface-10 border-[color:var(--on-surface-10)]'
                                            : 'bg-[color:var(--surface-disabled)] text-[color:var(--on-surface-30)] opacity-70 border-transparent hover:bg-slate-50 hover:text-on-surface-10',
                                      ].join(' ')}
                                    >
                                      {t.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </FormItem>

                          {/* Upload */}
                          <FormItem label={data.music?.uploadedFile ? "나의 음원" : "파일 첨부"}>
                            <div className="flex flex-col gap-1 w-full">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
                                  const url = URL.createObjectURL(file);
                                  objectUrlRef.current = url;
                                  updateData('music.uploadedFile', { name: file.name, url });
                                  playIntentRef.current = false;
                                  setIsPlaying(false);
                                  // 같은 파일을 다시 선택해도 onChange가 뜨도록 리셋
                                  e.currentTarget.value = '';
                                }}
                              />

                              {data.music?.uploadedFile ? (
                                <button
                                  type="button"
                                  className="w-full h-10 rounded-lg border border-border bg-white px-4 flex items-center gap-3 text-[13px] text-on-surface-10 text-left"
                                  onClick={() => fileInputRef.current?.click()}
                                  aria-label="첨부 음원 변경"
                                >
                                  <span className="w-0 flex-1 truncate">
                                    {data.music.uploadedFile.name}
                                  </span>
                                  <span
                                    role="button"
                                    tabIndex={-1}
                                    className="shrink-0 w-7 h-7 rounded-full border border-border bg-white inline-flex items-center justify-center text-on-surface-30 hover:text-on-surface-10"
                                    aria-label="첨부 파일 삭제"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (objectUrlRef.current) {
                                        URL.revokeObjectURL(objectUrlRef.current);
                                        objectUrlRef.current = null;
                                      }
                                      updateData('music.uploadedFile', null);
                                      playIntentRef.current = false;
                                      setIsPlaying(false);
                                      // 삭제 후 같은 파일 재선택 가능하도록 리셋
                                      if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </span>
                                </button>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
                                      onClick={() => fileInputRef.current?.click()}
                                    >
                                      파일 선택
                                    </Button>
                                  </div>

                                  <span className="text-[12px] text-on-surface-30">
                                    mp3, wav, m4a 형식의 음원 파일을 첨부할 수 있습니다.
                                  </span>
                                </>
                              )}

                            </div>
                          </FormItem>

                          {/* Options */}
                          <FormItem label="옵션">
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                              onClick={() => updateData('music.isLoop', !data.music?.isLoop)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') updateData('music.isLoop', !data.music?.isLoop);
                              }}
                            >
                              <CircleCheckbox
                                checked={!!data.music?.isLoop}
                                onChange={(e) => updateData('music.isLoop', e.target.checked)}
                              />
                              음악 반복 재생
                            </span>
                          </FormItem>
                        </>
                      )}

                      {/* 신랑신부 섹션 (입력 폼 + 요약 레이아웃) */}
                      {item.id === 'hosts' && (
                        <>
                          <FormItem label="옵션">
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                              onClick={() => setShowHostContacts(!showHostContacts)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') setShowHostContacts(!showHostContacts);
                              }}
                            >
                              <CircleCheckbox
                                checked={showHostContacts}
                                onChange={(e) => setShowHostContacts(e.target.checked)}
                              />
                              연락처 추가
                            </span>
                          </FormItem>

                          <div className="flex flex-col gap-5">
                            <FormItem label="신랑">
                              <Input
                                placeholder="이름"
                                value={data.hosts.groom.name}
                                onChange={(e) => updateData('hosts.groom.name', e.target.value)}
                                className="flex-1 shadow-none"
                              />
                            </FormItem>
                            {showHostContacts && (
                              <FormItem label="">
                                <Input
                                  placeholder="연락처"
                                  value={data.hosts.groom.phone}
                                  onChange={(e) => updateData('hosts.groom.phone', e.target.value)}
                                  className="flex-1 shadow-none"
                                />
                              </FormItem>
                            )}
                            <FormItem label="부">
                              <Input
                                placeholder="이름"
                                value={data.hosts.groom.father.name}
                                onChange={(e) => updateData('hosts.groom.father.name', e.target.value)}
                                className="flex-1 shadow-none"
                              />
                              <span className="text-base font-medium text-on-surface-30 whitespace-nowrap ml-2">故</span>
                              <CircleCheckbox
                                checked={data.hosts.groom.father.isDeceased}
                                onChange={(e) => updateData('hosts.groom.father.isDeceased', e.target.checked)}
                              />
                            </FormItem>
                            {showHostContacts && !data.hosts.groom.father.isDeceased && (
                              <FormItem label="">
                                <Input
                                  placeholder="연락처"
                                  value={data.hosts.groom.father.phone}
                                  onChange={(e) => updateData('hosts.groom.father.phone', e.target.value)}
                                  className="flex-1 shadow-none"
                                />
                              </FormItem>
                            )}
                            <FormItem label="모">
                              <Input
                                placeholder="이름"
                                value={data.hosts.groom.mother.name}
                                onChange={(e) => updateData('hosts.groom.mother.name', e.target.value)}
                                className="flex-1 shadow-none"
                              />
                              <span className="text-base font-medium text-on-surface-30 whitespace-nowrap ml-2">故</span>
                              <CircleCheckbox
                                checked={data.hosts.groom.mother.isDeceased}
                                onChange={(e) => updateData('hosts.groom.mother.isDeceased', e.target.checked)}
                              />
                            </FormItem>
                            {showHostContacts && !data.hosts.groom.mother.isDeceased && (
                              <FormItem label="">
                                <Input
                                  placeholder="연락처"
                                  value={data.hosts.groom.mother.phone}
                                  onChange={(e) => updateData('hosts.groom.mother.phone', e.target.value)}
                                  className="flex-1 shadow-none"
                                />
                              </FormItem>
                            )}
                            <div className="border-t border-dashed border-[color:var(--border-20)]" />
                            <FormItem label="신부">
                              <Input
                                placeholder="이름"
                                value={data.hosts.bride.name}
                                onChange={(e) => updateData('hosts.bride.name', e.target.value)}
                                className="flex-1 shadow-none"
                              />
                            </FormItem>
                            {showHostContacts && (
                              <FormItem label="">
                                <Input
                                  placeholder="연락처"
                                  value={data.hosts.bride.phone}
                                  onChange={(e) => updateData('hosts.bride.phone', e.target.value)}
                                  className="flex-1 shadow-none"
                                />
                              </FormItem>
                            )}
                            <FormItem label="부">
                              <Input
                                placeholder="이름"
                                value={data.hosts.bride.father.name}
                                onChange={(e) => updateData('hosts.bride.father.name', e.target.value)}
                                className="flex-1 shadow-none"
                              />
                              <span className="text-base font-medium text-on-surface-30 whitespace-nowrap ml-2">故</span>
                              <CircleCheckbox
                                checked={data.hosts.bride.father.isDeceased}
                                onChange={(e) => updateData('hosts.bride.father.isDeceased', e.target.checked)}
                              />
                            </FormItem>
                            {showHostContacts && !data.hosts.bride.father.isDeceased && (
                              <FormItem label="">
                                <Input
                                  placeholder="연락처"
                                  value={data.hosts.bride.father.phone}
                                  onChange={(e) => updateData('hosts.bride.father.phone', e.target.value)}
                                  className="flex-1 shadow-none"
                                />
                              </FormItem>
                            )}
                            <FormItem label="모">
                              <Input
                                placeholder="이름"
                                value={data.hosts.bride.mother.name}
                                onChange={(e) => updateData('hosts.bride.mother.name', e.target.value)}
                                className="flex-1 shadow-none"
                              />
                              <span className="text-base font-medium text-on-surface-30 whitespace-nowrap ml-2">故</span>
                              <CircleCheckbox
                                checked={data.hosts.bride.mother.isDeceased}
                                onChange={(e) => updateData('hosts.bride.mother.isDeceased', e.target.checked)}
                              />
                            </FormItem>
                            {showHostContacts && !data.hosts.bride.mother.isDeceased && (
                              <FormItem label="">
                                <Input
                                  placeholder="연락처"
                                  value={data.hosts.bride.mother.phone}
                                  onChange={(e) => updateData('hosts.bride.mother.phone', e.target.value)}
                                  className="flex-1 shadow-none"
                                />
                              </FormItem>
                            )}
                          </div>
                        </>
                      )}

                      {/* 예식 정보 섹션 */}
                      {item.id === 'eventInfo' && (
                        <div className="flex flex-col gap-5">
                          <FormItem label="예식 날짜">
                            <Input type="date" value={data.eventInfo.date} onChange={(e) => updateData('eventInfo.date', e.target.value)} className="shadow-none flex-1" />
                          </FormItem>
                          <FormItem label="시간">
                            {(() => {
                              const { period, hour, minute } = parseKoreanTime(data.eventInfo.time);
                              const hourValue = `${period} ${hour}`;
                              const setHourValue = (nextHourValue: string) => {
                                const [p, h] = nextHourValue.split(' ');
                                const hh = Number(h);
                                const next = `${p} ${Number.isFinite(hh) ? hh : hour}:${minute}`;
                                updateData('eventInfo.time', next);
                              };
                              const setMinuteValue = (nextMinute: string) => {
                                const mm = String(nextMinute).padStart(2, '0');
                                updateData('eventInfo.time', `${period} ${hour}:${mm}`);
                              };

                              return (
                                <div className="grid grid-cols-2 gap-2 w-full">
                                  <div className="relative w-full">
                                    <select
                                      value={hourValue}
                                      onChange={(e) => setHourValue(e.target.value)}
                                      className="h-10 w-full min-w-0 rounded-lg border border-input bg-white px-3 py-1 text-[13px] text-on-surface-20 appearance-none transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
                                    >
                                      {(['오전', '오후'] as const).flatMap((p) =>
                                        Array.from({ length: 12 }, (_, i) => {
                                          const h = i + 1;
                                          const v = `${p} ${h}`;
                                          return (
                                            <option key={v} value={v}>
                                              {p} {h}시
                                            </option>
                                          );
                                        })
                                      )}
                                    </select>
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                      <ChevronDown className="w-4 h-4 text-on-surface-30" />
                                    </span>
                                  </div>

                                  <div className="relative w-full">
                                    <select
                                      value={minute}
                                      onChange={(e) => setMinuteValue(e.target.value)}
                                      className="h-10 w-full min-w-0 rounded-lg border border-input bg-white px-3 py-1 text-[13px] text-on-surface-20 appearance-none transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
                                    >
                                      {['00', '10', '20', '30', '40', '50'].map((mm) => (
                                        <option key={mm} value={mm}>
                                          {mm}분
                                        </option>
                                      ))}
                                    </select>
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                      <ChevronDown className="w-4 h-4 text-on-surface-30" />
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </FormItem>
                          <FormItem label="웨딩홀">
                            <Input placeholder="예: 더 신라 서울" value={data.eventInfo.venueName} onChange={(e) => updateData('eventInfo.venueName', e.target.value)} className="shadow-none flex-1" />
                          </FormItem>
                          <FormItem label="상세 위치">
                            <Input placeholder="예: 다이너스티 홀 3F" value={data.eventInfo.venueDetail} onChange={(e) => updateData('eventInfo.venueDetail', e.target.value)} className="shadow-none flex-1" />
                          </FormItem>

                          <FormItem label="옵션">
                            <div className="flex flex-col gap-3 w-full">
                              <span
                                role="button"
                                tabIndex={0}
                                className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                onClick={() => updateData('eventInfo.useCalendar', !data.eventInfo.useCalendar)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') updateData('eventInfo.useCalendar', !data.eventInfo.useCalendar);
                                }}
                              >
                                <CircleCheckbox
                                  checked={!!data.eventInfo.useCalendar}
                                  onChange={(e) => updateData('eventInfo.useCalendar', e.target.checked)}
                                />
                                달력 사용
                              </span>
                              <span
                                role="button"
                                tabIndex={0}
                                className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                onClick={() => updateData('eventInfo.showDday', !data.eventInfo.showDday)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') updateData('eventInfo.showDday', !data.eventInfo.showDday);
                                }}
                              >
                                <CircleCheckbox
                                  checked={!!data.eventInfo.showDday}
                                  onChange={(e) => updateData('eventInfo.showDday', e.target.checked)}
                                />
                                D-Day 표시
                              </span>
                            </div>
                          </FormItem>
                        </div>
                      )}

                      {/* 인사말 섹션 */}
                      {item.id === 'greeting' && (
                        <>
                          <div className="flex flex-col gap-5">
                            <FormItem label="제목">
                              <Input type="text" value={data.greeting.title} onChange={(e) => updateData('greeting.title', e.target.value)} className="shadow-none flex-1" />
                            </FormItem>
                            <FormItem label="본문">
                              <Textarea rows={4} value={data.greeting.content} onChange={(e) => updateData('greeting.content', e.target.value)} className="resize-none shadow-none flex-1" />
                            </FormItem>

                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
                                onClick={() => {
                                  setGreetingSampleTab('general');
                                  setGreetingSelectedSample(null);
                                  setGreetingSampleOpen(true);
                                }}
                              >
                                샘플보기
                              </Button>
                            </div>
                          </div>

                          {greetingSampleOpen && createPortal(
                            <div
                              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
                              onClick={() => setGreetingSampleOpen(false)}
                            >
                              <div
                                className="w-full max-w-md rounded-2xl bg-white border border-[color:var(--border-10)] p-6 flex flex-col gap-5 h-[min(800px,calc(100vh-48px))] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="text-[15px] font-semibold text-on-surface-10">샘플 문구</h3>
                                  <button
                                    type="button"
                                    onClick={() => setGreetingSampleOpen(false)}
                                    className="p-1 rounded-full hover:bg-slate-100 text-on-surface-30 hover:text-on-surface-10"
                                    aria-label="닫기"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="relative">
                                  <div className="grid grid-cols-3 border-b border-[color:var(--border-10)]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGreetingSampleTab('general');
                                        setGreetingSelectedSample(null);
                                      }}
                                      className={[
                                        'h-10 flex items-center justify-center text-[16px] font-medium transition-colors',
                                        greetingSampleTab === 'general'
                                          ? 'text-on-surface-10'
                                          : 'text-[color:var(--on-surface-disabled)] hover:text-on-surface-30',
                                      ].join(' ')}
                                    >
                                      일반
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGreetingSampleTab('hosts');
                                        setGreetingSelectedSample(null);
                                      }}
                                      className={[
                                        'h-10 flex items-center justify-center text-[16px] font-medium transition-colors',
                                        greetingSampleTab === 'hosts'
                                          ? 'text-on-surface-10'
                                          : 'text-[color:var(--on-surface-disabled)] hover:text-on-surface-30',
                                      ].join(' ')}
                                    >
                                      혼주
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGreetingSampleTab('religion');
                                        setGreetingSelectedSample(null);
                                      }}
                                      className={[
                                        'h-10 flex items-center justify-center text-[16px] font-medium transition-colors',
                                        greetingSampleTab === 'religion'
                                          ? 'text-on-surface-10'
                                          : 'text-[color:var(--on-surface-disabled)] hover:text-on-surface-30',
                                      ].join(' ')}
                                    >
                                      종교
                                    </button>
                                  </div>
                                  <div
                                    className={[
                                      'absolute bottom-0 left-0 h-[2px] w-1/3 bg-black transition-transform duration-200',
                                      greetingSampleTab === 'general'
                                        ? 'translate-x-0'
                                        : greetingSampleTab === 'hosts'
                                          ? 'translate-x-full'
                                          : 'translate-x-[200%]',
                                    ].join(' ')}
                                  />
                                </div>

                                <div className="flex-1 overflow-y-auto no-scrollbar">
                                  <div className="flex flex-col gap-3">
                                    {greetingSamples[greetingSampleTab].map((sample) => (
                                      <div
                                        key={`${sample.title}-${sample.content.slice(0, 20)}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setGreetingSelectedSample(sample)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') setGreetingSelectedSample(sample);
                                        }}
                                        className={[
                                          'rounded-lg border bg-white px-4 py-5 cursor-pointer transition-colors outline-none',
                                          greetingSelectedSample?.content === sample.content && greetingSelectedSample?.title === sample.title
                                            ? 'border-black'
                                            : 'border-[color:var(--border-10)] hover:border-[color:var(--border-20)]',
                                        ].join(' ')}
                                      >
                                        <div className="text-[13px] font-semibold text-on-surface-10 text-center mb-2">
                                          {sample.title}
                                        </div>
                                        <div className="text-[14px] leading-relaxed text-on-surface-10 text-center whitespace-pre-line">
                                          {sample.content}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-0 flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-fit h-10 px-5 rounded-lg text-[14px] font-semibold border-[color:var(--border-30)] bg-white text-on-surface-20 hover:bg-slate-50 hover:text-on-surface-10"
                                    onClick={() => {
                                      setGreetingSelectedSample(null);
                                      setGreetingSampleOpen(false);
                                    }}
                                  >
                                    취소
                                  </Button>
                                  <Button
                                    type="button"
                                    className="w-fit h-10 px-5 rounded-lg text-[14px] font-semibold"
                                    disabled={!greetingSelectedSample}
                                    onClick={() => {
                                      if (!greetingSelectedSample) return;
                                      updateData('greeting.title', greetingSelectedSample.title);
                                      updateData('greeting.content', greetingSelectedSample.content);
                                      setGreetingSampleOpen(false);
                                    }}
                                  >
                                    적용하기
                                  </Button>
                                </div>
                              </div>
                            </div>,
                            document.body
                          )}
                        </>
                      )}

                      {/* 오시는 길 섹션 */}
                      {item.id === 'location' && (
                        <>
                          <div className="flex flex-col gap-5">
                            <FormItem label="제목">
                              <Input
                                value={(data.location as any).title ?? '오시는 길'}
                                onChange={(e) => updateData('location.title', e.target.value)}
                                className="shadow-none flex-1"
                              />
                            </FormItem>
                            <FormItem label="주소">
                              <div className="flex flex-1 gap-2">
                                <Input
                                  value={data.location.address}
                                  onChange={(e) => updateData('location.address', e.target.value)}
                                  className="shadow-none flex-1"
                                  placeholder="주소를 입력하거나 검색하여 추가해 주세요"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-10 px-3 rounded-lg text-[13px] flex-shrink-0 border-[color:var(--border-30)] bg-white text-on-surface-20 hover:bg-slate-50 hover:text-on-surface-10"
                                  onClick={() => {
                                    setLocationSearchQuery('');
                                    setLocationSearchSelected(null);
                                    setLocationSearchOpen(true);
                                  }}
                                >
                                  검색
                                </Button>
                              </div>
                            </FormItem>

                            <div className="border-t border-dashed border-[color:var(--border-20)]" />

                            {transportItems.map((t, idx) => (
                              <div key={idx} className="flex flex-col gap-2">
                                <FormItem label={idx === 0 ? "교통수단" : ""}>
                                  <Input
                                    value={t.mode}
                                    onChange={(e) => {
                                      const next = [...transportItems];
                                      next[idx] = { ...next[idx], mode: e.target.value };
                                      setTransportItems(next);
                                    }}
                                    className="shadow-none flex-1"
                                    placeholder="예: 지하철"
                                  />
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = transportItems.filter((_, i) => i !== idx);
                                        setTransportItems(next);
                                      }}
                                      className="flex-shrink-0 text-[12px] text-on-surface-30 hover:text-on-surface-10 transition-colors"
                                    >
                                      삭제
                                    </button>
                                  )}
                                </FormItem>
                                <FormItem label="">
                                  <Textarea
                                    rows={3}
                                    value={t.detail}
                                    onChange={(e) => {
                                      const next = [...transportItems];
                                      next[idx] = { ...next[idx], detail: e.target.value };
                                      setTransportItems(next);
                                    }}
                                    className="resize-none shadow-none flex-1"
                                    placeholder="버스/도보/기타 안내를 입력해 주세요"
                                  />
                                </FormItem>
                              </div>
                            ))}

                            <div className="pt-0 flex justify-center">
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-lg px-4 h-10 text-[13px]"
                                onClick={() => {
                                  setTransportItems([
                                    ...transportItems,
                                    { mode: '', detail: '' },
                                  ]);
                                }}
                              >
                                + 교통수단 추가
                              </Button>
                            </div>
                          </div>

                          {locationSearchOpen && createPortal(
                            <div
                              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
                              onClick={() => setLocationSearchOpen(false)}
                            >
                              <div
                                className="w-full max-w-md rounded-2xl bg-white border border-[color:var(--border-10)] p-6 flex flex-col gap-5 h-[min(680px,calc(100vh-48px))] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="text-[15px] font-semibold text-on-surface-10">주소 검색</h3>
                                  <button
                                    type="button"
                                    onClick={() => setLocationSearchOpen(false)}
                                    className="p-1 rounded-full hover:bg-slate-100 text-on-surface-30 hover:text-on-surface-10"
                                    aria-label="닫기"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="relative">
                                  <Input
                                    value={locationSearchQuery}
                                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                                    placeholder="도로명/지번/건물명으로 검색"
                                    className="pl-9 pr-3 text-[13px] h-10 bg-[color:var(--surface-10)]"
                                  />
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-30">
                                    🔍
                                  </span>
                                </div>

                                <div className="flex-1 overflow-y-auto no-scrollbar">
                                  <div className="flex flex-col">
                                    {locationSearchResults.map((addr) => (
                                      <button
                                        key={addr}
                                        type="button"
                                        onClick={() => {
                                          setLocationSearchSelected(addr);
                                        }}
                                        className={[
                                          'px-3 py-3 text-left text-[13px] rounded-lg border transition-colors',
                                          locationSearchSelected === addr
                                            ? 'bg-slate-50 border-black/20 text-on-surface-10'
                                            : 'bg-transparent border-transparent text-on-surface-20 hover:bg-slate-50',
                                        ].join(' ')}
                                      >
                                        {addr}
                                      </button>
                                    ))}
                                    {locationSearchResults.length === 0 && (
                                      <div className="px-3 py-6 text-center text-[13px] text-on-surface-30">
                                        검색 결과가 없어요.
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-0 flex justify-end">
                                  <Button
                                    type="button"
                                    className="w-fit h-11 px-5 rounded-lg text-[14px] font-semibold"
                                    disabled={!locationSearchSelected}
                                    onClick={() => {
                                      if (!locationSearchSelected) return;
                                      updateData('location.address', locationSearchSelected);
                                      setLocationSearchOpen(false);
                                    }}
                                  >
                                    적용
                                  </Button>
                                </div>
                              </div>
                            </div>,
                            document.body
                          )}
                        </>
                      )}

                      {/* 계좌정보 섹션 - 새로운 시안 기반 */}
                      {item.id === 'account' && (
                        <>
                          {/* 1. 상단 공통 영역 */}
                          <div className="flex flex-col gap-5">
                            <FormItem label="제목">
                              <Input
                                value={data.accounts.title}
                                onChange={(e) => updateData('accounts.title', e.target.value)}
                                placeholder="마음 전하실 곳"
                                className="shadow-none flex-1"
                              />
                            </FormItem>
                            <FormItem label="내용">
                              <Textarea
                                rows={3}
                                value={data.accounts.content}
                                onChange={(e) => updateData('accounts.content', e.target.value)}
                                placeholder="축의금을 전달하실 때 필요한 안내 문구를 입력해 주세요."
                                className="resize-none shadow-none flex-1"
                              />
                            </FormItem>
                          </div>

                          {/* 2. 계좌 리스트 */}
                          {data.accounts.list.map((item, index) => (
                            <React.Fragment key={item.id}>
                              <div className="border-t border-dashed border-[color:var(--border-20)]" />
                              <div className="flex flex-col gap-5 mb-0">
                                {/* 상단 행: 그룹명 + 삭제 */}
                                <FormItem label="그룹명">
                                  <Input
                                    value={item.groupName}
                                    onChange={(e) => {
                                      const next = [...data.accounts.list];
                                      next[index] = { ...item, groupName: e.target.value };
                                      updateData('accounts.list', next);
                                    }}
                                    placeholder="예: 신랑측 계좌"
                                    className="text-[13px]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = data.accounts.list.filter((_, i) => i !== index);
                                      updateData('accounts.list', next);
                                    }}
                                    className="flex-shrink-0 text-[12px] text-on-surface-30 hover:text-on-surface-10 transition-colors"
                                  >
                                    삭제
                                  </button>
                                </FormItem>

                                {/* 계좌번호: 은행 + 계좌번호 */}
                                <FormItem label="계좌번호">
                                  <div className="flex flex-1 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBankSearch('');
                                        setBankModalIndex(index);
                                      }}
                                      className="h-10 w-[120px] flex-shrink-0 rounded-lg border border-input bg-white px-3 py-1 text-[13px] flex items-center justify-between text-left text-on-surface-20 hover:bg-slate-50"
                                    >
                                      <span className={item.bank ? 'truncate' : 'truncate text-on-surface-30'}>
                                        {item.bank || '은행 선택'}
                                      </span>
                                      <ChevronDown className="w-4 h-4 text-on-surface-30 flex-shrink-0" />
                                    </button>
                                    <Input
                                      value={item.accountNumber}
                                      onChange={(e) => {
                                        const next = [...data.accounts.list];
                                        next[index] = { ...item, accountNumber: e.target.value };
                                        updateData('accounts.list', next);
                                      }}
                                      placeholder="계좌번호"
                                      className="text-[13px] basis-0 flex-[2] min-w-0"
                                    />
                                  </div>
                                </FormItem>

                                {/* 예금주 */}
                                <FormItem label="예금주">
                                  <Input
                                    value={item.holder}
                                    onChange={(e) => {
                                      const next = [...data.accounts.list];
                                      next[index] = { ...item, holder: e.target.value };
                                      updateData('accounts.list', next);
                                    }}
                                    placeholder="예금주"
                                    className="text-[13px] flex-1"
                                  />
                                </FormItem>

                                {/* 간편송금 / 계좌정보 보이기 */}
                                <FormItem label="옵션">
                                  <div className="flex flex-col gap-1 text-[13px] text-on-surface-20">
                                    <div className="flex items-center gap-2">
                                      <CircleCheckbox
                                        checked={item.isExpanded}
                                        onChange={(e) => {
                                          const next = [...data.accounts.list];
                                          next[index] = { ...item, isExpanded: e.target.checked };
                                          updateData('accounts.list', next);
                                        }}
                                      />
                                      <span>계좌정보 보이기</span>
                                    </div>
                                  </div>
                                </FormItem>
                              </div>
                            </React.Fragment>
                          ))}

                          {/* 3. 하단 추가 버튼 */}
                          <div className="pt-4 flex justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-lg px-4 h-10 text-[13px]"
                              onClick={() => {
                                const next = [
                                  ...data.accounts.list,
                                  {
                                    id: `new-${Date.now()}`,
                                    groupName: '',
                                    bank: '',
                                    accountNumber: '',
                                    holder: '',
                                    isKakaoPay: false,
                                    isExpanded: true,
                                  } as any,
                                ];
                                updateData('accounts.list', next);
                              }}
                            >
                              + 계좌정보 추가
                            </Button>
                          </div>

                          {/* 은행 선택 모달 (Portal로 body에 렌더링) */}
                          {bankModalIndex !== null && createPortal(
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setBankModalIndex(null)}>
                              <div className="w-full max-w-md rounded-2xl bg-white border border-[color:var(--border-10)] p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between">
                                  <h3 className="text-[15px] font-semibold text-on-surface-10">은행선택</h3>
                                  <button
                                    type="button"
                                    onClick={() => setBankModalIndex(null)}
                                    className="p-1 rounded-full hover:bg-slate-100 text-on-surface-30 hover:text-on-surface-10"
                                    aria-label="닫기"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="w-full">
                                  <div className="relative">
                                    <Input
                                      value={bankSearch}
                                      onChange={(e) => setBankSearch(e.target.value)}
                                      placeholder="은행검색"
                                      className="pl-9 pr-3 text-[13px] h-10 bg-[color:var(--surface-10)]"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-30">
                                      🔍
                                    </span>
                                  </div>
                                </div>

                                <div className="max-h-[360px] overflow-y-auto pr-1">
                                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[13px] text-on-surface-20">
                                    {BANK_OPTIONS.filter((name) =>
                                      name.toLowerCase().includes(bankSearch.toLowerCase().trim()),
                                    ).map((name) => (
                                      <button
                                        key={name}
                                        type="button"
                                        onClick={() => {
                                          if (bankModalIndex === null) return;
                                          const next = [...data.accounts.list];
                                          next[bankModalIndex] = { ...next[bankModalIndex], bank: name };
                                          updateData('accounts.list', next);
                                          setBankModalIndex(null);
                                        }}
                                        className="flex items-center gap-2 text-left hover:text-on-surface-10 hover:bg-slate-50 rounded-full px-2 py-1"
                                      >
                                        <BankLogo name={name as (typeof BANK_OPTIONS)[number]} />
                                        <span className="truncate">{name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>,
                            document.body
                          )}
                        </>
                      )}

                      {/* 갤러리 섹션 */}
                      {item.id === 'gallery' && (
                        <>
                          <FormItem label={`사진 ${Array.isArray((data.gallery as any).images) ? (data.gallery as any).images.length : 0}/50`}>
                            <div className="flex-1 flex flex-col gap-2 w-full">
                              <GalleryImageGrid
                                images={Array.isArray((data.gallery as any).images) ? (data.gallery as any).images : []}
                                onChange={(next) => updateData('gallery.images', next)}
                                onEdit={(i, src) => openImageEditor({ kind: 'gallery', index: i }, src)}
                                imageRatio={((data.gallery as any).imageRatio ?? 'portrait') as 'square' | 'portrait'}
                                max={50}
                              />
                              <div className="text-[12px] text-on-surface-30">
                                * 이미지를 한 번에 최대 50장까지 선택해서 추가할 수 있어요.
                              </div>
                            </div>
                          </FormItem>

                          <FormItem label="사진 비율">
                            <div className="flex flex-wrap gap-2">
                              {([
                                { value: 'square', label: '정사각형' },
                                { value: 'portrait', label: '직사각형' },
                              ] as const).map((opt) => (
                                <OptionChip
                                  key={opt.value}
                                  label={opt.label}
                                  active={(((data.gallery as any).imageRatio ?? 'portrait') === opt.value)}
                                  onClick={() => updateData('gallery.imageRatio', opt.value)}
                                />
                              ))}
                            </div>
                          </FormItem>

                          <FormItem label="갤러리 타입">
                            <div className="flex flex-wrap gap-2">
                              {([
                                { value: 'grid', label: '그리드' },
                                { value: 'slide', label: '슬라이드' },
                              ] as const).map((opt) => (
                                <OptionChip
                                  key={opt.value}
                                  label={opt.label}
                                  active={(((data.gallery as any).layoutType ?? 'grid') === opt.value)}
                                  onClick={() => updateData('gallery.layoutType', opt.value)}
                                />
                              ))}
                            </div>
                          </FormItem>

                          {(((data.gallery as any).layoutType ?? 'grid') === 'grid') && (
                            <>
                              <FormItem label="배치 방법">
                                <div className="flex flex-wrap gap-2">
                                  {([2, 3, 4] as const).map((col) => (
                                    <OptionChip
                                      key={col}
                                      label={`${col}단 그리드`}
                                      active={Number(((data.gallery as any).gridColumns ?? 4)) === col}
                                      onClick={() => updateData('gallery.gridColumns', col)}
                                    />
                                  ))}
                                </div>
                              </FormItem>
                              <FormItem label="사진 간격">
                                <div className="flex flex-wrap gap-2">
                                  {([
                                    { value: 'none', label: '없음' },
                                    { value: 'small', label: '작게' },
                                    { value: 'middle', label: '중간' },
                                    { value: 'large', label: '많이' },
                                  ] as const).map((opt) => (
                                    <OptionChip
                                      key={opt.value}
                                      label={opt.label}
                                      active={(((data.gallery as any).imageGap ?? 'middle') === opt.value)}
                                      onClick={() => updateData('gallery.imageGap', opt.value)}
                                    />
                                  ))}
                                </div>
                              </FormItem>
                              <FormItem label="옵션">
                                <div className="flex-1 flex flex-col gap-4">
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                    onClick={() => updateData('gallery.useLoadMore', !((data.gallery as any)?.useLoadMore))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        updateData('gallery.useLoadMore', !((data.gallery as any)?.useLoadMore));
                                      }
                                    }}
                                  >
                                    <CircleCheckbox
                                      checked={!!(data.gallery as any)?.useLoadMore}
                                      onChange={(e) => updateData('gallery.useLoadMore', e.target.checked)}
                                    />
                                    3줄 이상 더보기 사용
                                  </span>
                                </div>
                              </FormItem>
                            </>
                          )}

                          <FormItem label="옵션">
                            <div className="flex-1 flex flex-col gap-4">
                              <span
                                role="button"
                                tabIndex={0}
                                className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                onClick={() => updateData('gallery.enableDetailView', !((data.gallery as any)?.enableDetailView))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    updateData('gallery.enableDetailView', !((data.gallery as any)?.enableDetailView));
                                  }
                                }}
                              >
                                <CircleCheckbox
                                  checked={!!(data.gallery as any)?.enableDetailView}
                                  onChange={(e) => updateData('gallery.enableDetailView', e.target.checked)}
                                />
                                상세보기 허용
                              </span>
                            </div>
                          </FormItem>
                        </>
                      )}

                      {/* 안내사항 섹션 */}
                      {item.id === 'notice' && (
                        <>
                          <FormItem label="제목">
                            <Input
                              value={(data.notice as any)?.title ?? ""}
                              onChange={(e) => updateData('notice.title', e.target.value)}
                              placeholder="안내사항"
                              className="shadow-none flex-1"
                            />
                          </FormItem>
                          <FormItem label="내용">
                            <Textarea
                              rows={4}
                              value={(data.notice as any)?.content ?? ""}
                              onChange={(e) => updateData('notice.content', e.target.value)}
                              placeholder="하객 안내 문구를 입력해 주세요."
                              className="resize-none shadow-none flex-1"
                            />
                          </FormItem>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
                              onClick={async () => {
                                const linkToCopy = ((data.share as any)?.link ?? '').trim() || window.location.href;
                                try {
                                  await navigator.clipboard.writeText(linkToCopy);
                                } catch {
                                  // ignore clipboard permission failures
                                }
                              }}
                            >
                              링크복사
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
                              onClick={() => {
                                setNoticeSampleTab('general');
                                setNoticeSelectedSample(null);
                                setNoticeSampleOpen(true);
                              }}
                            >
                              샘플보기
                            </Button>
                          </div>

                          {noticeSampleOpen && createPortal(
                            <div
                              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
                              onClick={() => setNoticeSampleOpen(false)}
                            >
                              <div
                                className="w-full max-w-md rounded-2xl bg-white border border-[color:var(--border-10)] p-6 flex flex-col gap-5 h-[min(800px,calc(100vh-48px))] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="text-[15px] font-semibold text-on-surface-10">샘플 문구</h3>
                                  <button
                                    type="button"
                                    onClick={() => setNoticeSampleOpen(false)}
                                    className="p-1 rounded-full hover:bg-slate-100 text-on-surface-30 hover:text-on-surface-10"
                                    aria-label="닫기"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="relative">
                                  <div className="grid grid-cols-3 border-b border-[color:var(--border-10)]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNoticeSampleTab('general');
                                        setNoticeSelectedSample(null);
                                      }}
                                      className={[
                                        'h-10 flex items-center justify-center text-[16px] font-medium transition-colors',
                                        noticeSampleTab === 'general'
                                          ? 'text-on-surface-10'
                                          : 'text-[color:var(--on-surface-disabled)] hover:text-on-surface-30',
                                      ].join(' ')}
                                    >
                                      일반
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNoticeSampleTab('parking');
                                        setNoticeSelectedSample(null);
                                      }}
                                      className={[
                                        'h-10 flex items-center justify-center text-[16px] font-medium transition-colors',
                                        noticeSampleTab === 'parking'
                                          ? 'text-on-surface-10'
                                          : 'text-[color:var(--on-surface-disabled)] hover:text-on-surface-30',
                                      ].join(' ')}
                                    >
                                      주차/교통
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNoticeSampleTab('meal');
                                        setNoticeSelectedSample(null);
                                      }}
                                      className={[
                                        'h-10 flex items-center justify-center text-[16px] font-medium transition-colors',
                                        noticeSampleTab === 'meal'
                                          ? 'text-on-surface-10'
                                          : 'text-[color:var(--on-surface-disabled)] hover:text-on-surface-30',
                                      ].join(' ')}
                                    >
                                      식사/안내
                                    </button>
                                  </div>
                                  <div
                                    className={[
                                      'absolute bottom-0 left-0 h-[2px] w-1/3 bg-black transition-transform duration-200',
                                      noticeSampleTab === 'general'
                                        ? 'translate-x-0'
                                        : noticeSampleTab === 'parking'
                                          ? 'translate-x-full'
                                          : 'translate-x-[200%]',
                                    ].join(' ')}
                                  />
                                </div>

                                <div className="flex-1 overflow-y-auto no-scrollbar">
                                  <div className="flex flex-col gap-3">
                                    {noticeSamples[noticeSampleTab].map((sample) => (
                                      <div
                                        key={`${sample.title}-${sample.content.slice(0, 20)}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setNoticeSelectedSample(sample)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') setNoticeSelectedSample(sample);
                                        }}
                                        className={[
                                          'rounded-lg border bg-white px-4 py-5 cursor-pointer transition-colors outline-none',
                                          noticeSelectedSample?.content === sample.content && noticeSelectedSample?.title === sample.title
                                            ? 'border-black'
                                            : 'border-[color:var(--border-10)] hover:border-[color:var(--border-20)]',
                                        ].join(' ')}
                                      >
                                        <div className="text-[13px] font-semibold text-on-surface-10 text-center mb-2">
                                          {sample.title}
                                        </div>
                                        <div className="text-[14px] leading-relaxed text-on-surface-10 text-center whitespace-pre-line">
                                          {sample.content}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-0 flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-fit h-10 px-5 rounded-lg text-[14px] font-semibold border-[color:var(--border-30)] bg-white text-on-surface-20 hover:bg-slate-50 hover:text-on-surface-10"
                                    onClick={() => {
                                      setNoticeSelectedSample(null);
                                      setNoticeSampleOpen(false);
                                    }}
                                  >
                                    취소
                                  </Button>
                                  <Button
                                    type="button"
                                    className="w-fit h-10 px-5 rounded-lg text-[14px] font-semibold"
                                    disabled={!noticeSelectedSample}
                                    onClick={() => {
                                      if (!noticeSelectedSample) return;
                                      updateData('notice.title', noticeSelectedSample.title);
                                      updateData('notice.content', noticeSelectedSample.content);
                                      setNoticeSampleOpen(false);
                                    }}
                                  >
                                    적용하기
                                  </Button>
                                </div>
                              </div>
                            </div>,
                            document.body
                          )}
                        </>
                      )}

                      {/* 방명록 섹션 */}
                      {item.id === 'guestbook' && (
                        <>
                          <FormItem label="제목">
                            <Input
                              value={(data.guestbook as any)?.title ?? ""}
                              onChange={(e) => updateData('guestbook.title', e.target.value)}
                              placeholder="방명록"
                              className="shadow-none flex-1"
                            />
                          </FormItem>
                          <FormItem label="설명">
                            <Textarea
                              rows={3}
                              value={(data.guestbook as any)?.description ?? ""}
                              onChange={(e) => updateData('guestbook.description', e.target.value)}
                              placeholder="축하 인사를 남겨주세요."
                              className="resize-none shadow-none flex-1"
                            />
                          </FormItem>
                          <FormItem label="비밀번호">
                            <div className="flex-1 flex flex-col gap-2">
                              <Input
                                type="password"
                                value={data.guestbook?.password ?? ""}
                                onChange={(e) => updateData('guestbook.password', e.target.value)}
                                placeholder="선택 입력 (방명록 보호)"
                                className="shadow-none flex-1"
                              />
                              <div className="text-[12px] text-on-surface-30">
                                관리자 비밀번호를 사용하여 방명록 글을 강제로 삭제할 수 있습니다.
                              </div>
                            </div>
                          </FormItem>
                          <FormItem label="운영 옵션">
                            <div className="flex-1 flex flex-col gap-2 text-[13px] text-on-surface-20">
                              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                <CircleCheckbox
                                  checked={!!(data.guestbook as any)?.allowAnonymous}
                                  onChange={(e) => updateData('guestbook.allowAnonymous', e.target.checked)}
                                />
                                익명 작성 허용
                              </label>
                            </div>
                          </FormItem>
                        </>
                      )}

                      {/* 유튜브 섹션 */}
                      {item.id === 'youtube' && (
                        <>
                          <FormItem label="제목">
                            <Input
                              value={(data.youtube as any)?.title ?? ""}
                              onChange={(e) => updateData('youtube.title', e.target.value)}
                              placeholder="영상으로 전하는 마음"
                              className="shadow-none flex-1"
                            />
                          </FormItem>
                          <FormItem label="유튜브 링크">
                            <Input
                              value={data.youtube?.url ?? ""}
                              onChange={(e) => updateData('youtube.url', e.target.value)}
                              placeholder="https://youtu.be/... 또는 https://www.youtube.com/watch?v=..."
                              className="shadow-none flex-1"
                            />
                          </FormItem>
                          <FormItem label="옵션">
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                              onClick={() => updateData('youtube.isLoop', !((data.youtube as any)?.isLoop))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  updateData('youtube.isLoop', !((data.youtube as any)?.isLoop));
                                }
                              }}
                            >
                              <CircleCheckbox
                                checked={!!(data.youtube as any)?.isLoop}
                                onChange={(e) => updateData('youtube.isLoop', e.target.checked)}
                              />
                              반복 재생
                            </span>
                          </FormItem>
                        </>
                      )}

                      {/* 공유 섹션 */}
                      {item.id === 'share' && (
                        <>
                          <FormItem label="옵션">
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                              onClick={() => updateData('share.useThumbnail', !((data.share as any)?.useThumbnail ?? true))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  updateData('share.useThumbnail', !((data.share as any)?.useThumbnail ?? true));
                                }
                              }}
                            >
                              <CircleCheckbox
                                checked={!!((data.share as any)?.useThumbnail ?? true)}
                                onChange={(e) => updateData('share.useThumbnail', e.target.checked)}
                              />
                              썸네일 사용하기
                            </span>
                          </FormItem>
                          {((data.share as any)?.useThumbnail ?? true) && (
                            <FormItem label="썸네일">
                              <div className="flex-1 flex flex-col gap-2">
                                <div className="w-full h-[120px] flex items-center gap-2">
                                  <div className="h-full aspect-video rounded-lg border border-border bg-[color:var(--surface-20)] overflow-hidden">
                                    {data.share?.thumbnail ? (
                                      <img
                                        src={data.share.thumbnail}
                                        alt="공유 썸네일 미리보기"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[12px] text-on-surface-30">
                                        썸네일 이미지가 없습니다.
                                      </div>
                                    )}
                                  </div>
                                  <div className="h-full flex flex-col justify-start gap-2">
                                    <label className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50">
                                      이미지 선택
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          const url = URL.createObjectURL(file);
                                          updateData('share.thumbnail', url);
                                          e.currentTarget.value = '';
                                        }}
                                      />
                                    </label>
                                    {data.share?.thumbnail && (
                                      <button
                                        type="button"
                                        className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-30 hover:text-on-surface-10 hover:bg-slate-50"
                                        onClick={() => updateData('share.thumbnail', '')}
                                      >
                                        삭제
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </FormItem>
                          )}
                          <FormItem label="공유 제목">
                            <Input
                              value={data.share?.title ?? ""}
                              onChange={(e) => updateData('share.title', e.target.value)}
                              placeholder="공유 시 노출될 제목"
                              className="shadow-none flex-1"
                            />
                          </FormItem>
                          <FormItem label="공유 설명">
                            <Textarea
                              rows={3}
                              value={data.share?.description ?? ""}
                              onChange={(e) => updateData('share.description', e.target.value)}
                              placeholder="공유 시 노출될 설명"
                              className="resize-none shadow-none flex-1"
                            />
                          </FormItem>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
                              onClick={() => setSharePreviewOpen(true)}
                            >
                              미리보기
                            </Button>
                          </div>
                        </>
                      )}

                      {/* 보호 섹션 */}
                      {item.id === 'protect' && (
                        <>
                          <FormItem label="옵션">
                            <div className="flex-1 flex flex-col gap-4">
                              <span
                                role="button"
                                tabIndex={0}
                                className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                onClick={() => updateData('protect.preventCapture', !data.protect?.preventCapture)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') updateData('protect.preventCapture', !data.protect?.preventCapture);
                                }}
                              >
                                <CircleCheckbox
                                  checked={!!data.protect?.preventCapture}
                                  onChange={(e) => updateData('protect.preventCapture', e.target.checked)}
                                />
                                캡처 방지
                              </span>
                              <span
                                role="button"
                                tabIndex={0}
                                className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                onClick={() => updateData('protect.preventZoom', !data.protect?.preventZoom)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') updateData('protect.preventZoom', !data.protect?.preventZoom);
                                }}
                              >
                                <CircleCheckbox
                                  checked={!!data.protect?.preventZoom}
                                  onChange={(e) => updateData('protect.preventZoom', e.target.checked)}
                                />
                                줌 방지
                              </span>
                              <span
                                role="button"
                                tabIndex={0}
                                className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                onClick={() => updateData('protect.preventDownload', !data.protect?.preventDownload)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') updateData('protect.preventDownload', !data.protect?.preventDownload);
                                }}
                              >
                                <CircleCheckbox
                                  checked={!!data.protect?.preventDownload}
                                  onChange={(e) => updateData('protect.preventDownload', e.target.checked)}
                                />
                                다운로드 방지
                              </span>
                            </div>
                          </FormItem>
                        </>
                      )}

                      {/* 아직 구체화되지 않은 나머지 섹션들의 플레이스홀더 */}
                      {!['theme', 'bgm', 'main', 'hosts', 'eventInfo', 'greeting', 'account', 'location', 'gallery', 'notice', 'guestbook', 'youtube', 'share', 'protect'].includes(item.id) && (
                        <div className="h-20 flex items-center justify-center text-on-surface-30 text-sm bg-slate-50 rounded-lg border border-dashed border-border">
                          {item.label} 세부 입력 폼이 조립될 영역입니다.
                        </div>
                      )}

                    </div>
                  )}
                </div>
                </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* 우측 리사이즈 핸들 (400~560px) */}
          <div
            role="separator"
            aria-label="에디터 패널 너비 조절"
            className="absolute -right-2 top-0 bottom-0 w-6 cursor-ew-resize z-20 pointer-events-auto bg-transparent"
            style={{ height: '100%' }}
            onPointerDown={(e) => {
              e.preventDefault();
              isResizingEditorRef.current = true;
              editorResizeStartRef.current = { x: e.clientX, width: editorWidth };
              editorResizePointerIdRef.current = e.pointerId;
              (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
              document.body.style.cursor = 'ew-resize';
              document.body.style.userSelect = 'none';
            }}
            onPointerUp={(e) => {
              if (!isResizingEditorRef.current) return;
              if (editorResizePointerIdRef.current !== null) {
                try {
                  (e.currentTarget as HTMLDivElement).releasePointerCapture(editorResizePointerIdRef.current);
                } catch {
                  // ignore
                }
              }
              isResizingEditorRef.current = false;
              editorResizeStartRef.current = null;
              editorResizePointerIdRef.current = null;
              document.body.style.cursor = '';
              document.body.style.userSelect = '';
            }}
          />
        </section>

        {/* 3. 우측 미리보기 패널 (화면 전체 높이, 위아래 20px 간격) */}
        <main className="flex-1 flex flex-col items-center min-h-0 overflow-hidden py-5 px-6 bg-gray-50 shadow-none">
          {/* 바깥 컨테이너는 고정, 내부 프레임만 스크롤 */}
          <div className="flex-1 min-h-0 flex justify-center w-full max-w-[400px] min-h-full bg-transparent items-stretch shadow-none">
            <div
              className="w-full border border-border rounded-lg bg-white flex flex-col items-stretch text-center overflow-hidden relative"
              style={{
                // 향후 theme.bgColor / theme.fontFamily를 전역 테마로 사용
                backgroundColor: data.style.bgColor,
                fontFamily: data.theme.fontFamily,
                fontSize: `${fontScaleToPercent((data.theme as any).fontScale)}%`,
              }}
            >
              <div ref={previewScrollRef} className="flex-1 overflow-y-auto no-scrollbar">
                {layoutOrder.map((sectionId) => (
                  <div
                    key={sectionId}
                    data-preview-section-id={sectionId}
                    className={`${sectionId === 'main'
                      ? "w-full flex flex-col items-stretch text-center"
                      : "w-full py-6 px-6 flex flex-col items-center text-center"
                      } ${data.theme.scrollEffect
                        ? (previewVisibleSections[sectionId]
                          ? 'opacity-100 translate-y-0 duration-500 ease-out'
                          : 'opacity-0 translate-y-3 duration-500 ease-out')
                        : 'opacity-100 translate-y-0'
                      } transition-[opacity,transform]`}
                  >
                    {renderPreviewSection(sectionId)}
                  </div>
                ))}
              </div>
              {galleryDetailOpen && galleryDetailImages.length > 0 && (
                <div
                  className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center p-6"
                  onClick={() => setGalleryDetailOpen(false)}
                >
                  <div
                    className="relative w-full max-w-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={`w-full ${galleryDetailRatioClass} rounded-xl border-2 border-white/90 overflow-hidden`}>
                      <img
                        src={galleryDetailImages[galleryDetailIndex]}
                        alt={`갤러리 상세 이미지 ${galleryDetailIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {galleryDetailImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 text-on-surface-10 hover:bg-white flex items-center justify-center"
                          aria-label="이전 이미지"
                          onClick={() =>
                            setGalleryDetailIndex((prev) =>
                              (prev - 1 + galleryDetailImages.length) % galleryDetailImages.length,
                            )
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 text-on-surface-10 hover:bg-white flex items-center justify-center"
                          aria-label="다음 이미지"
                          onClick={() => setGalleryDetailIndex((prev) => (prev + 1) % galleryDetailImages.length)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="absolute left-1/2 -translate-x-1/2 -bottom-12 h-9 w-9 rounded-full bg-white/25 text-white hover:bg-white/35 flex items-center justify-center text-[20px] leading-none"
                      aria-label="상세보기 닫기"
                      onClick={() => setGalleryDetailOpen(false)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        
      </div>

      <Dialog open={imageEditorOpen} onOpenChange={(o) => !o && closeImageEditor()}>
        <DialogContent className="bg-[color:var(--surface-10)] w-[420px] rounded-2xl shadow-[0px_8px_16px_8px_rgba(0,0,0,0.16)] outline outline-1 outline-offset-[-1px] outline-[color:var(--border-10)]/5 p-0 overflow-hidden border-0">
          <div className="p-5 flex flex-col justify-start items-center gap-5">
            {/* 프리뷰 */}
            <div className="w-96 h-96 relative rounded-lg overflow-hidden bg-neutral-900">
              {/* 이미지(캔버스) — 정사각형 전체에 깔림 */}
              <canvas
                ref={imageEditorCanvasRef}
                className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  const canvas = imageEditorCanvasRef.current;
                  if (!canvas) return;
                  imageEditorPanningRef.current = {
                    pointerId: e.pointerId,
                    lastX: e.clientX,
                    lastY: e.clientY,
                  };
                  try {
                    canvas.setPointerCapture(e.pointerId);
                  } catch {
                    // ignore
                  }
                  e.preventDefault();
                }}
                onPointerMove={(e) => {
                  const pan = imageEditorPanningRef.current;
                  if (!pan || pan.pointerId !== e.pointerId) return;
                  e.preventDefault();
                  const dx = e.clientX - pan.lastX;
                  const dy = e.clientY - pan.lastY;
                  pan.lastX = e.clientX;
                  pan.lastY = e.clientY;

                  const dpr = Math.max(1, window.devicePixelRatio || 1);
                  const ddx = dx * dpr;
                  const ddy = dy * dpr;
                  setImageEditorPan((prev) => ({ x: prev.x + ddx, y: prev.y + ddy }));
                }}
                onPointerUp={(e) => {
                  const pan = imageEditorPanningRef.current;
                  if (!pan || pan.pointerId !== e.pointerId) return;
                  imageEditorPanningRef.current = null;
                  const canvas = imageEditorCanvasRef.current;
                  if (canvas) {
                    try {
                      canvas.releasePointerCapture(e.pointerId);
                    } catch {
                      // ignore
                    }
                  }
                }}
                onPointerCancel={() => {
                  imageEditorPanningRef.current = null;
                }}
              />

              {imageEditorAspect === 'square' ? (
                <div className="absolute inset-0 pointer-events-none outline outline-2 outline-offset-[-2px] outline-[color:var(--key)] rounded-lg" />
              ) : (
                <>
                  {/* 9:16 가이드 프레임 + 바깥 딤(정사각형 내부) */}
                  <div className="absolute inset-0 grid grid-cols-[1fr_auto_1fr] pointer-events-none">
                    <div className="bg-black/50" />
                    <div className="h-full aspect-[9/16] outline outline-2 outline-offset-[-2px] outline-[color:var(--key)]" />
                    <div className="bg-black/50" />
                  </div>
                </>
              )}
            </div>

            {/* 컨트롤 */}
            <div className="self-stretch inline-flex justify-center items-center gap-5">
              <div className="w-full flex items-center gap-4">
                {/* 반전 / 회전 */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    aria-label="반전"
                    onClick={() => setImageEditorFlipX((v) => !v)}
                  >
                    <span
                      aria-hidden="true"
                      className="text-[16px] leading-none select-none"
                      style={{ transform: 'scaleX(-1)' }}
                    >
                      ↔
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    aria-label="회전"
                    onClick={() => setImageEditorRotation((r) => (r + 90) % 360)}
                  >
                    <RotateCw className="w-5 h-5" />
                  </Button>
                </div>

                {/* 슬라이더(확대/축소) */}
                <div className="flex-1">
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={imageEditorZoom}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setImageEditorZoom(val);
                    }}
                    className="image-editor-slider w-full"
                    style={{ '--slider-progress': `${((imageEditorZoom - 1) / 2) * 100}%` } as React.CSSProperties}
                  />
                </div>

                {/* 리셋 */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  aria-label="초기화"
                  onClick={() => {
                    setImageEditorZoom(1);
                    setImageEditorRotation(0);
                    setImageEditorFlipX(false);
                  }}
                >
                  <RefreshCcw className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="self-stretch w-full p-5 border-t border-[color:var(--border-10)]/5 inline-flex justify-end items-center gap-2 bg-[color:var(--surface-10)]">
            <Button
              type="button"
              variant="outline"
              onClick={closeImageEditor}
              className="h-10 min-w-20 px-3 rounded-lg outline outline-1 outline-offset-[-1px] outline-[color:var(--border-20)]/10 border-0 text-[16px] font-medium leading-5"
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={saveImageEditor}
              className="h-10 min-w-20 px-3 rounded-lg bg-neutral-700 hover:bg-neutral-800 text-white border-0 text-[16px] font-medium leading-5"
            >
              저장
            </Button>
          </div>

          <DialogTitle className="sr-only">이미지 편집</DialogTitle>
        </DialogContent>
      </Dialog>

      <Dialog open={sharePreviewOpen} onOpenChange={setSharePreviewOpen}>
        <DialogContent className="w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border p-0 overflow-hidden">
          <div className="p-5 border-b border-border">
            <DialogTitle className="text-[16px] font-semibold text-on-surface-10">공유 썸네일 미리보기</DialogTitle>
          </div>
          <div className="p-5 bg-[color:var(--surface-10)]">
            <div className="w-full rounded-xl border border-border bg-white overflow-hidden">
              {((data.share as any)?.useThumbnail ?? true) &&
                (!!data.share?.thumbnail ? (
                  <img
                    src={data.share.thumbnail}
                    alt="공유 썸네일"
                    className="w-full aspect-[1.91/1] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[1.91/1] bg-[color:var(--surface-20)] flex items-center justify-center text-[12px] text-on-surface-30">
                    썸네일 이미지가 없습니다.
                  </div>
                ))}
              <div className="p-4 flex flex-col gap-1.5 text-left">
                <p className="text-[14px] font-semibold text-on-surface-10 line-clamp-1">
                  {data.share?.title?.trim() || "모바일 청첩장"}
                </p>
                <p className="text-[12px] text-on-surface-20 line-clamp-2">
                  {data.share?.description?.trim() || "소중한 날에 초대합니다."}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-border bg-white flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
              onClick={() => setSharePreviewOpen(false)}
            >
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}