"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Palette, Music, Image as ImageIcon, Users, MessageSquare, MessageCircle, Phone, CalendarHeart, MapPin, Bell, Images, Wallet, BookOpen, Youtube, Share2, Shield, CheckCircle2, GripVertical, Play, Pause, VolumeX, Volume2, X, ChevronDown, ChevronLeft, ChevronRight, MoreVertical, Pencil, Trash2, RotateCw, RefreshCcw, Move, ArrowUpDown, ClipboardCheck, Calendar, Settings, Bus, Train, Car, ParkingCircle, Route, AlertCircle } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import type { CardData, EventInfo } from "../store/useCardStore";
import { DEFAULT_MAIN_PRESET_URL, MAIN_IMAGE_PRESETS } from "@/lib/main-image-presets";
import { searchWeddingVenues, type WeddingVenue } from "@/lib/wedding-venues";
import { getDefaultTransitGuides } from "@/lib/default-transit-guides";
import { HostsIntroPreview } from "./hosts-intro-preview";
import { cn } from "@/lib/utils";
import {
  buildDesignerCalendarCells,
  parseEventDateLocal,
  type DesignerCalendarCell,
} from "@/lib/designer-calendar";

const DEFAULT_LOCATION_PREVIEW_COORDS = { lat: 37.579617, lon: 126.977041 }; // 경복궁

type VenueSuggestion = WeddingVenue & {
  phone?: string;
  mapImages?: string[];
};

type KeyColorPreset = {
  id: string;
  label: string;
  key: string;
  keyDark: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  background: string;
};

const KEY_COLOR_PRESETS: KeyColorPreset[] = [
  { id: "spring-blossom", label: "스프링 블라썸", key: "#E8AFAB", keyDark: "#D3948F", primaryContainer: "#FCF9F8", onPrimaryContainer: "#5C4A48", background: "#FCF9F8" },
  { id: "greenery-garden", label: "그리너리 가든", key: "#A9C2B6", keyDark: "#8EA79B", primaryContainer: "#F8FAF9", onPrimaryContainer: "#45524B", background: "#F8FAF9" },
  { id: "twilight-mood", label: "트와일라잇 무드", key: "#BCAED1", keyDark: "#A291BB", primaryContainer: "#F9F9FB", onPrimaryContainer: "#4E4856", background: "#F9F9FB" },
  { id: "golden-hour", label: "골든 아워", key: "#D4C4AE", keyDark: "#B9A98E", primaryContainer: "#FCFBF9", onPrimaryContainer: "#544E47", background: "#FCFBF9" },
  { id: "urban-gallery", label: "어반 갤러리", key: "#1A1A1A", keyDark: "#000000", primaryContainer: "#FAFAFA", onPrimaryContainer: "#333333", background: "#FAFAFA" },
];

const PREVIEW_TYPOGRAPHY_GUIDE = {
  subtitle: "text-[22px] font-medium text-on-surface-10",
  body: "whitespace-pre-line leading-[26px]",
  subtitle2: "text-[13px] font-normal text-on-surface-30 opacity-70 [font-stretch:120%]",
} as const;

/** 방명록 섹션 제목 — 에디터에서 프리셋만 선택 */
const GUESTBOOK_TITLE_OPTIONS = [
  "축하해 주세요",
  "방명록",
  "축하 메시지",
  "축하 인사 남기기",
] as const;

/** 참석 여부(RSVP) 섹션 제목 — 에디터에서 프리셋만 선택 */
const RSVP_TITLE_OPTIONS = [
  "참석 여부",
  "함께해 주실 마음을 알려주세요",
  "소중한 날 함께해 주세요",
  "마음을 전해 주세요",
] as const;

/** 오시는 길 섹션 제목 — 에디터에서 프리셋만 선택 */
const LOCATION_TITLE_OPTIONS = [
  "오시는 길",
  "위치 안내",
  "찾아오시는 길",
  "교통 안내",
] as const;

/** 안내사항 미리보기 상단 큰 제목(기존 고정 '안내' 대체) */
const NOTICE_HEADING_OPTIONS = [
  "안내사항",
  "예식 안내",
  "함께해 주셔서 감사합니다",
  "소중한 분들께 전하는 안내",
] as const;

const TRANSPORT_MODE_OPTIONS = [
  "버스",
  "지하철",
  "주차장",
  "대중교통",
  "셔틀버스",
  "대절버스",
  "기차(KTX,SRT)",
  "자가용",
] as const;

/** 유튜브 섹션 제목 — 에디터에서 프리셋만 선택 */
const YOUTUBE_TITLE_OPTIONS = [
  "영상으로 전하는 마음",
  "우리의 이야기",
  "식전 영상",
  "추억을 담아",
] as const;

/** 계좌정보 섹션 제목 — 에디터에서 프리셋만 선택 */
const ACCOUNT_TITLE_OPTIONS = [
  "마음 전하실 곳",
  "축의금 안내",
  "계좌 안내",
  "신랑·신부에게",
] as const;

/** 하객 사진 업로드 섹션 제목 — 에디터에서 프리셋만 선택 */
const GUEST_UPLOAD_TITLE_OPTIONS = [
  "추억을 공유해 주세요",
  "하객 사진 올리기",
  "예식 사진 나눔",
  "소중한 순간을 남겨 주세요",
] as const;

function upperCaseFirst(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function getOptionalSubtitle2(sectionId: string) {
  const subtitleBySection: Record<string, string> = {
    account: "Account",
    guestbook: "Guestbook",
    youtube: "Video",
    rsvp: "RSVP",
    guestUpload: "Guest Upload",
    share: "Share",
  };
  return upperCaseFirst(subtitleBySection[sectionId] ?? "Section");
}

function getTransportModeIcon(modeRaw: string): React.ReactNode {
  const mode = modeRaw.trim().toLowerCase();
  const cls = "h-4 w-4";
  const withBadge = (icon: React.ReactNode, badge: string) => (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      {icon}
      <span className="absolute -right-1 -top-1 rounded-full bg-[color:var(--key)] px-0.5 text-[8px] leading-none text-white">
        {badge}
      </span>
    </span>
  );
  if (!mode) return <Route className={cls} strokeWidth={1.8} />;
  if (mode.includes("버스")) return <Bus className={cls} strokeWidth={1.8} />;
  if (mode.includes("지하철")) {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-semibold leading-none">
        M
      </span>
    );
  }
  if (mode.includes("주차")) return <ParkingCircle className={cls} strokeWidth={1.8} />;
  if (mode.includes("대중교통")) return <Route className={cls} strokeWidth={1.8} />;
  if (mode.includes("셔틀")) return withBadge(<Bus className={cls} strokeWidth={1.8} />, "S");
  if (mode.includes("대절")) return withBadge(<Bus className={cls} strokeWidth={1.8} />, "C");
  if (mode.includes("기차") || mode.includes("ktx") || mode.includes("srt")) return <Train className={cls} strokeWidth={1.8} />;
  if (mode.includes("자가용") || mode.includes("자동차") || mode.includes("car")) return <Car className={cls} strokeWidth={1.8} />;
  return <MapPin className={cls} strokeWidth={1.8} />;
}

function buildOsmEmbedUrl(lat: number, lon: number) {
  const delta = 0.01;
  const left = lon - delta;
  const bottom = lat - delta;
  const right = lon + delta;
  const top = lat + delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

function normalizeMainImageMode(m: unknown): 'single' | 'multi' | 'default' {
  if (m === 'single' || m === 'multi' || m === 'default') return m;
  if (m === 'none') return 'default';
  return 'default';
}

type MainImageFrameId = 'full' | 'border' | 'oval' | 'ellipse' | 'arch';

const MAIN_IMAGE_FRAME_OPTIONS: { id: MainImageFrameId; label: string }[] = [
  { id: 'full', label: '기본' },
  { id: 'border', label: '테두리' },
  { id: 'oval', label: '타원형' },
  { id: 'ellipse', label: '세로 타원' },
  { id: 'arch', label: '아치형' },
];

function normalizeMainImageFrame(raw: unknown): MainImageFrameId {
  const v = String(raw ?? 'full');
  /** 예전 '여백(inset)' 옵션 제거 — 기존 저장값은 기본 프레임으로 표시 */
  if (v === 'inset') return 'full';
  if (v === 'full' || v === 'border' || v === 'oval' || v === 'ellipse' || v === 'arch') return v;
  return 'full';
}

/** 에디터 프레임 미리보기 스와치 (회색=이미지 영역) */
function MainFrameSwatch({ variant }: { variant: MainImageFrameId }) {
  const g = 'bg-[#c5c5c5]';
  return (
    <span
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-white p-[3px]"
      aria-hidden
    >
      {variant === 'full' && <span className={cn('h-full w-full', g)} />}
      {variant === 'border' && (
        <span className="flex h-full w-full items-center justify-center">
          <span className="box-border flex h-[72%] w-[80%] items-center justify-center rounded-none border border-[#b8b8b8]">
            <span className={cn('block h-full w-full', g)} />
          </span>
        </span>
      )}
      {variant === 'oval' && <span className={cn('h-[78%] w-[52%] rounded-[9999px]', g)} />}
      {variant === 'ellipse' && (
        <span className={cn('h-[80%] w-[46%]', g)} style={{ borderRadius: '50%' }} />
      )}
      {variant === 'arch' && (
        <span className={cn('h-[76%] w-[68%] rounded-t-[999px]', g)} />
      )}
    </span>
  );
}

/** 미리보기 메인 히어로 이미지 영역에 프레임 적용 */
function MainHeroFrameShell({
  frame,
  aspectClass,
  children,
}: {
  frame: MainImageFrameId;
  aspectClass: string;
  children: React.ReactNode;
}) {
  const baseOuter = cn('w-full', aspectClass);
  if (frame === 'full') {
    return (
      <div className={cn(baseOuter, 'relative overflow-hidden rounded-none')}>
        {children}
      </div>
    );
  }

  if (frame === 'border') {
    return (
      <div className="w-full px-10">
        <div className={cn(baseOuter, 'relative overflow-hidden rounded-none bg-[color:var(--surface-20)]')}>
          <div className="relative h-full w-full">{children}</div>
        </div>
      </div>
    );
  }

  /** 바깥은 aspect 고정 없이 내부 프레임 높이에 맞춤(hug) */
  if (frame === 'oval') {
    return (
      <div
        className={cn(
          'relative flex w-full max-w-full items-center justify-center px-6 py-0',
          aspectClass.includes('mx-auto') && 'mx-auto',
        )}
      >
        <div
          className="relative w-[min(72%,280px)] overflow-hidden rounded-[9999px] bg-[color:var(--surface-20)] shadow-sm"
          style={{ aspectRatio: '3 / 4' }}
        >
          <div className="relative flex h-full w-full flex-col">
            <div className="relative min-h-0 flex-1 w-full overflow-hidden rounded-[inherit]">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /** 세로로 긴 진짜 타원(타원 마스크, border-radius 50%) — 타원형(pill)과 구분 */
  if (frame === 'ellipse') {
    return (
      <div
        className={cn(
          'relative flex w-full max-w-full items-center justify-center px-5 py-0',
          aspectClass.includes('mx-auto') && 'mx-auto',
        )}
      >
        <div
          className="relative overflow-hidden bg-[color:var(--surface-20)] shadow-sm"
          style={{
            width: 'min(62%, 220px)',
            aspectRatio: '3 / 5',
            borderRadius: '50%',
          }}
        >
          <div className="relative flex h-full w-full flex-col">
            <div className="relative min-h-0 flex-1 w-full overflow-hidden rounded-[inherit]">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (frame === 'arch') {
    return (
      <div className={cn(baseOuter, 'relative')}>
        <div className="absolute inset-x-[40px] inset-y-0 overflow-hidden rounded-t-[999px] bg-[color:var(--surface-20)]">
          <div className="relative h-full w-full">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(baseOuter, 'relative overflow-hidden rounded-none bg-[color:var(--surface-20)]')}>
      {children}
    </div>
  );
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
  const { className = '', checked, onChange, disabled, ...rest } = props;
  const emitToggle = () => {
    if (disabled) return;
    const nextChecked = !Boolean(checked);
    if (onChange) {
      const syntheticEvent = {
        target: { checked: nextChecked },
        currentTarget: { checked: nextChecked },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };
  return (
    <label
      className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      onClick={(e) => {
        // 바깥 옵션 row(onClick)와 중복 토글 방지 + 커스텀 토글 보장
        e.preventDefault();
        e.stopPropagation();
        emitToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          emitToggle();
        }
      }}
      role="checkbox"
      aria-checked={Boolean(checked)}
      tabIndex={disabled ? -1 : 0}
    >
      <input
        type="checkbox"
        className={`sr-only peer ${className}`}
        checked={Boolean(checked)}
        onChange={onChange}
        disabled={disabled}
        {...(rest as Omit<React.InputHTMLAttributes<HTMLInputElement>, 'checked' | 'onChange' | 'disabled'>)}
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

function ThemeColorChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-lg inline-flex items-center gap-2 text-[13px] font-medium border transition-colors ${
        active
          ? "bg-transparent text-on-surface-10 border-[color:var(--on-surface-10)] hover:bg-slate-50"
          : "bg-[color:var(--surface-disabled)] text-[color:var(--on-surface-30)] opacity-70 border-transparent hover:bg-slate-50"
      }`}
      aria-label={label}
      title={label}
    >
      <span
        className="w-3 h-3 rounded-full border border-black/10 shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span>{label}</span>
    </button>
  );
}

function fontScaleToPercent(scale: unknown) {
  // 예전 '작게(sm)' 제거: 저장 데이터가 남아 있으면 중간(md)과 동일(100%)
  if (scale === 'sm') return 100;
  switch (scale) {
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useCardStore } from "../store/useCardStore";
import { useSortable } from "@/lib/useSortable";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import GuestPhotoUploadForm from "@/components/GuestPhotoUploadForm";
import AddressSearchDialog from "@/components/AddressSearchDialog";
import ParticleCanvasOverlay from "@/components/ParticleCanvasOverlay";

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
        draggable: false,
        scrollWheel: false,
        keyboardShortcuts: false,
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
        zoomControl: false,
      });
      // 일부 SDK 버전/환경에서는 옵션만으로는 제스처 드래그가 남는 경우가 있어,
      // 안전하게 한 번 더 비활성화합니다.
      try {
        (map as any).setOptions?.({ draggable: false, scrollWheel: false, keyboardShortcuts: false });
      } catch {
        // ignore
      }
      if (containerRef.current) {
        containerRef.current.style.touchAction = "none";
        containerRef.current.style.cursor = "default";
      }
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

/** 하단 '옵션' 그룹(콘텐츠 순서/미리보기 본문에 포함하지 않음) */
const OTHER_OPTION_IDS = ['share', 'protect', 'publish', 'i18n'] as const;

type SidebarNavGroup = 1 | 2 | 3 | 4 | 5;
const SIDEBAR_NAV_SECTIONS: { navGroup: SidebarNavGroup; title: string }[] = [
  { navGroup: 1, title: '기본정보' },
  { navGroup: 2, title: '디자인' },
  { navGroup: 3, title: '필수 콘텐츠' },
  { navGroup: 4, title: '선택 콘텐츠' },
  { navGroup: 5, title: '기타옵션' },
];


// Sidebar: navGroup 1-5; optionalOrder applies to reorderable optional sections only.
const sidebarItems = [
  { id: 'hosts', icon: Users, label: '기본정보', category: '필수', navGroup: 1 as SidebarNavGroup },
  { id: 'eventInfo', icon: CalendarHeart, label: '예식정보', category: '필수', navGroup: 1 as SidebarNavGroup },
  { id: 'theme', icon: Palette, label: '테마', category: '필수', navGroup: 2 as SidebarNavGroup },
  { id: 'main', icon: ImageIcon, label: '메인', category: '필수', navGroup: 2 as SidebarNavGroup },
  { id: 'bgm', icon: Music, label: '배경음악', category: '필수', navGroup: 2 as SidebarNavGroup, hasSwitch: true },
  { id: 'greeting', icon: MessageSquare, label: '인사말', category: '필수', navGroup: 3 as SidebarNavGroup },
  { id: 'contact', icon: Phone, label: '연락처', category: '필수', navGroup: 3 as SidebarNavGroup, hasSwitch: true },
  { id: 'eventDate', icon: Calendar, label: 'D-Day', category: '필수', navGroup: 3 as SidebarNavGroup },
  { id: 'location', icon: MapPin, label: '오시는 길', category: '필수', navGroup: 3 as SidebarNavGroup },
  { id: 'notice', icon: Bell, label: '안내사항', category: '선택', navGroup: 4 as SidebarNavGroup, hasSwitch: true },
  { id: 'gallery', icon: Images, label: '갤러리', category: '선택', navGroup: 4 as SidebarNavGroup, hasSwitch: true },
  { id: 'account', icon: Wallet, label: '계좌정보', category: '선택', navGroup: 4 as SidebarNavGroup, hasSwitch: true },
  { id: 'guestbook', icon: BookOpen, label: '방명록', category: '선택', navGroup: 4 as SidebarNavGroup, hasSwitch: true },
  { id: 'rsvp', icon: ClipboardCheck, label: '참석여부', category: '선택', navGroup: 4 as SidebarNavGroup, hasSwitch: true },
  { id: 'youtube', icon: Youtube, label: '영상', category: '선택', navGroup: 4 as SidebarNavGroup, hasSwitch: true },
  { id: 'guestUpload', icon: Images, label: '하객사진 받기', category: '선택', navGroup: 4 as SidebarNavGroup, hasSwitch: true },
  { id: 'share', icon: Share2, label: '공유', category: '선택', navGroup: 5 as SidebarNavGroup },
  { id: 'protect', icon: Shield, label: '보호', category: '선택', navGroup: 5 as SidebarNavGroup },
  { id: 'publish', icon: Calendar, label: '공개일 설정', category: '선택', navGroup: 5 as SidebarNavGroup, hasSwitch: true },
  { id: 'i18n', icon: Settings, label: '설정', category: '선택', navGroup: 5 as SidebarNavGroup },
];

const builtInTracks = [
  // NOTE: 샘플 내장 음원(스트리밍 URL). 필요하면 추후 public/로 옮겨서 로컬 제공 가능.
  { id: 'classic-1', label: '클래식 (잔잔한)' , url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'jazz-1', label: '재즈 (스윙)' , url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 'march-1', label: '발랄한 행진곡' , url: '/audio/neti-main-theme.mp3' },
  { id: 'piano-1', label: '피아노 (로맨틱)' , url: '/audio/piano-romantic.mp4' },
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
    <div className="flex min-w-0 items-start gap-3">
      <AppLabel
        className={`w-[90px] flex-shrink-0 text-[13px] font-medium text-on-surface-30 leading-tight ${
          label ? 'pt-1' : ''
        }`}
      >
        {label}
      </AppLabel>
      <div className="flex min-w-0 flex-1 gap-2 items-center">
        {children}
      </div>
    </div>
  );
}

/** Location editor: single-line venue from event info (detail omitted if already in name). */
function eventVenueReadonlyDisplay(eventInfo: EventInfo): string {
  const venueName = String(eventInfo.venueName ?? "").trim();
  const venueDetail = String(eventInfo.venueDetail ?? "").trim();
  if (venueName && venueDetail && !venueName.includes(venueDetail)) {
    return `${venueName} ${venueDetail}`;
  }
  return venueName || venueDetail;
}

const BRIDE_RELATION_OPTIONS = ['딸', '장녀', '차녀', '삼녀', '사녀', '오녀', '육녀', '독녀', '막내', '조카', '손녀', '동생', '외동'] as const;
const GROOM_RELATION_OPTIONS = ['아들', '장남', '차남', '삼남', '사남', '오남', '육남', '독남', '막내', '조카', '손자', '동생', '외동'] as const;

function formatKoreanPhone(value: string) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function HostContactField({
  label,
  nameValue,
  onNameChange,
  relationValue,
  onRelationChange,
  relationOptions,
  phoneValue,
  onPhoneChange,
  showPhone,
  deceasedChecked,
  onDeceasedChange,
  keepDeceasedInline = false,
}: {
  label: string;
  nameValue: string;
  onNameChange: (value: string) => void;
  relationValue?: string;
  onRelationChange?: (value: string) => void;
  relationOptions?: readonly string[];
  phoneValue?: string;
  onPhoneChange?: (value: string) => void;
  showPhone: boolean;
  deceasedChecked?: boolean;
  onDeceasedChange?: (checked: boolean) => void;
  keepDeceasedInline?: boolean;
}) {
  const hasDeceasedControl = typeof deceasedChecked === 'boolean' && !!onDeceasedChange;

  return (
    <FormItem label={label}>
      <div className="flex flex-col gap-2 flex-1 w-full">
        {hasDeceasedControl && keepDeceasedInline ? (
          <div className="flex items-center gap-2 w-full">
            <Input
              placeholder="이름"
              value={nameValue}
              onChange={(e) => onNameChange(e.target.value)}
              className="flex-1 shadow-none"
            />
            <span className="text-base font-medium text-on-surface-30 whitespace-nowrap">故</span>
            <CircleCheckbox
              checked={deceasedChecked}
              onChange={(e) => onDeceasedChange(e.target.checked)}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <Input
              placeholder="이름"
              value={nameValue}
              onChange={(e) => onNameChange(e.target.value)}
              className="flex-1 shadow-none"
            />
            {!!relationOptions?.length && !!onRelationChange && (
              <div className="relative w-[80px] min-w-[80px] max-w-[100px]">
                <select
                  value={relationValue ?? ''}
                  onChange={(e) => onRelationChange(e.target.value)}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-white px-3 py-1 text-[13px] text-on-surface-20 appearance-none transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
                >
                  {relationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <ChevronDown className="w-4 h-4 text-on-surface-30" />
                </span>
              </div>
            )}
          </div>
        )}

        {showPhone && !!onPhoneChange && (
          <Input
            placeholder="전화번호를 입력하세요"
            value={phoneValue ?? ''}
            onChange={(e) => onPhoneChange(formatKoreanPhone(e.target.value))}
            inputMode="numeric"
            autoComplete="tel"
            className="shadow-none"
          />
        )}
      </div>

      {hasDeceasedControl && !keepDeceasedInline && (
        <>
          <span className="text-base font-medium text-on-surface-30 whitespace-nowrap ml-2">故</span>
          <CircleCheckbox
            checked={deceasedChecked}
            onChange={(e) => onDeceasedChange(e.target.checked)}
          />
        </>
      )}
    </FormItem>
  );
}

function ContactPhoneField({
  label,
  name,
  phoneValue,
  onPhoneChange,
}: {
  label: string;
  name: string;
  phoneValue?: string;
  onPhoneChange: (value: string) => void;
}) {
  return (
    <FormItem label={label}>
      <div className="flex flex-col gap-1.5 flex-1 w-full">
        <span className="text-[13px] text-on-surface-10 font-medium">{name}</span>
        <Input
          placeholder="전화번호를 입력하세요"
          value={phoneValue ?? ''}
          onChange={(e) => onPhoneChange(formatKoreanPhone(e.target.value))}
          inputMode="numeric"
          autoComplete="tel"
          className="shadow-none"
        />
      </div>
    </FormItem>
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

/** e.g. 오후 1:30 → 오후 1시 30분 */
function formatKoreanTimeSpaced(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  const { period, hour, minute } = parseKoreanTime(v);
  const mm = Number(minute);
  if (Number.isFinite(mm) && mm > 0) return `${period} ${hour}시 ${minute}분`;
  return `${period} ${hour}시`;
}

function formatTimeEnglish12h(value: string | undefined | null): string {
  const { period, hour, minute } = parseKoreanTime(value);
  let h24 = period === "오전" ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12;
  const ampm = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, "0")}:${minute} ${ampm}`;
}

function formatMonthEnglishUpper(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(d).toUpperCase();
}

const WEEKDAY_EN_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const WEEKDAY_LETTERS_EN = ["S", "M", "T", "W", "T", "F", "S"] as const;
const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

function normalizeCalendarDisplayType(raw: unknown): 'A' | 'B' | 'C' {
  return raw === 'B' || raw === 'C' ? raw : 'A';
}

/** Calendar layouts A/B/C: presentation only. Month grid uses `cells`; header uses `eventDate`. */
function DesignerCalendarPreview({
  layout,
  cells,
  eventDate,
  timeRaw,
  useThemeColor = false,
}: {
  layout: 'A' | 'B' | 'C';
  cells: DesignerCalendarCell[];
  eventDate: Date;
  timeRaw: string;
  useThemeColor?: boolean;
}) {
  const y = eventDate.getFullYear();
  const mo = eventDate.getMonth() + 1;
  const d = eventDate.getDate();
  const dow = eventDate.getDay();
  const dotYmd = `${y}.${mo}.${d}`;
  const yyMmDd = `${String(y).slice(-2)}.${String(mo).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
  const weekdayLongKo = `${WEEKDAY_KO[dow]}요일`;
  const timeKo = formatKoreanTimeSpaced(timeRaw);
  const sublineA =
    timeKo.length > 0 ? `${weekdayLongKo} ${timeKo}` : weekdayLongKo;
  const timeEn = formatTimeEnglish12h(timeRaw);
  const monthEn = formatMonthEnglishUpper(eventDate);
  const weekLabels = layout === "A" ? WEEKDAY_LETTERS_EN : WEEKDAY_KO;

  const eventDay = cells.find((c) => c.isEvent)?.day ?? d;

  const cellText = useThemeColor ? "text-[#413830]" : "text-neutral-700";
  const prevRing = useThemeColor ? "ring-[#413830]/20" : "ring-black/15";
  const eventDayBg = useThemeColor ? "bg-[color:var(--key)]" : "bg-neutral-600";

  const cellShell = (cell: DesignerCalendarCell) => {
    const base =
      "w-10 h-10 shrink-0 rounded-[999px] p-2.5 inline-flex flex-col items-center justify-center text-center text-sm font-normal font-sans";
    if (!cell.day) {
      return <div key={cell.key} className={`${base}`} aria-hidden />;
    }
    const isPrev = cell.day === eventDay - 1 && eventDay > 1;
    const isEvent = cell.isEvent;
    if (isEvent) {
      return (
        <div key={cell.key} className={`${base} ${eventDayBg} text-white`}>
          <span>{cell.day}</span>
        </div>
      );
    }
    if (isPrev) {
      return (
        <div
          key={cell.key}
          className={`${base} ${cellText} ring-1 ${prevRing} bg-transparent`}
        >
          <span>{cell.day}</span>
        </div>
      );
    }
    return (
      <div key={cell.key} className={`${base} ${cellText}`}>
        <span>{cell.day}</span>
      </div>
    );
  };

  const weekRow = weekLabels.map((label, i) => (
    <div
      key={`w-${i}-${label}`}
      className={`w-10 h-10 shrink-0 rounded-[999px] p-2.5 inline-flex flex-col items-center justify-center text-center text-sm font-normal font-sans ${cellText}`}
    >
      <span>{label}</span>
    </div>
  ));

  const grid = (
    <div className="grid w-full grid-cols-7 gap-1 justify-items-center">
      {weekRow}
      {cells.map((c) => cellShell(c))}
    </div>
  );

  const topGap = layout === "B" ? "gap-10" : layout === "A" ? "gap-5" : "gap-3";
  const subMuted = useThemeColor ? "text-[#413830]/60" : "text-neutral-500";
  const headStrong = useThemeColor ? "text-[#413830]" : "text-neutral-900";
  const dividerClass = useThemeColor ? "bg-[#413830]/10" : "bg-black/10";
  const pipeClass = useThemeColor ? "bg-[#413830]/25" : "bg-zinc-300";

  let header: React.ReactNode = null;
  if (layout === "A") {
    header = (
      <div className="flex w-44 max-w-[11rem] flex-col items-center gap-1">
        <div className={`w-full text-center text-2xl font-bold ${headStrong}`}>{dotYmd}</div>
        <div className={`w-full text-center text-base font-light ${subMuted}`}>{sublineA}</div>
      </div>
    );
  } else if (layout === "B") {
    header = (
      <div className="flex flex-col items-center gap-3">
        <div className={`text-center text-3xl font-bold ${headStrong}`}>{monthEn}</div>
        <div className={`inline-flex items-center justify-center gap-2 text-base font-light ${subMuted}`}>
          <span>{yyMmDd}</span>
          <span className={`h-4 w-px ${pipeClass}`} aria-hidden />
          <span>{WEEKDAY_EN_SHORT[dow]}</span>
          {timeRaw.trim() ? (
            <>
              <span className={`h-4 w-px ${pipeClass}`} aria-hidden />
              <span>{timeEn}</span>
            </>
          ) : null}
        </div>
      </div>
    );
  } else {
    header = (
      <div className="flex flex-col items-center gap-3">
        <div className={`inline-flex items-center justify-center gap-4 text-3xl font-bold ${headStrong}`}>
          <span>{String(y).slice(-2)}</span>
          <span className={`h-6 w-px ${pipeClass}`} aria-hidden />
          <span>{String(mo).padStart(2, "0")}</span>
          <span className={`h-6 w-px ${pipeClass}`} aria-hidden />
          <span>{String(d).padStart(2, "0")}</span>
        </div>
        <div className={`w-full text-center text-base font-light ${subMuted}`}>
          {timeKo ? `${weekdayLongKo} ${timeKo}` : weekdayLongKo}
        </div>
      </div>
    );
  }

  const placeHeaderOutsideBody = layout === "C";
  const body = (
    <div className={`mx-auto flex w-full flex-col items-center py-0 px-0 ${topGap}`}>
      {layout !== "A" && !placeHeaderOutsideBody ? header : null}
      <div className={`h-px w-full ${dividerClass}`} aria-hidden />
      {grid}
      <div className={`h-px w-full ${dividerClass}`} aria-hidden />
    </div>
  );
  const previewWrapperClass =
    "relative mx-auto flex h-fit w-full max-w-[384px] flex-col items-center justify-start gap-10";

  if (layout === "A") {
    return (
      <>
        {header}
        <div className={previewWrapperClass}>{body}</div>
      </>
    );
  }

  return (
    <div className={previewWrapperClass}>
      {placeHeaderOutsideBody ? header : null}
      {body}
    </div>
  );
}

function MultiImageGrid({
  images,
  onReorder,
  onSlotClick,
  onEdit,
  onDelete,
  touchMode = false,
}: {
  images: string[];
  onReorder: (next: string[]) => void;
  onSlotClick: (index: number, hasImg: boolean) => void;
  onEdit: (index: number, src: string) => void;
  onDelete: (index: number) => void;
  touchMode?: boolean;
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
  const allowReorder = !touchMode;

  return (
    <div className="flex gap-2 flex-wrap w-full bg-[color:var(--surface-20)] p-4 rounded-lg">
      {slots.map((slot, realIndex) => {
        const hasImg = !!slot.src;
        const sortableProps = allowReorder
          ? sortable.getItemProps(slot.id)
          : {
              handleProps: {
                onPointerDown: () => {},
                style: {},
                "aria-label": "이미지 이동 비활성화",
              },
              wrapperProps: {
                onPointerEnter: () => {},
                style: {},
                className: "",
                ref: () => {},
              },
            };
        const { handleProps, wrapperProps } = sortableProps;
        return (
          <div
            key={slot.id}
            {...wrapperProps}
            className={`${wrapperProps.className} relative w-[100px] min-w-[80px] aspect-[3/4] group`}
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
              <div className={cn("absolute right-1 top-1 flex flex-col gap-1 transition-opacity", touchMode ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
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
                {allowReorder && (
                  <button
                    type="button"
                    {...handleProps}
                    className="w-7 h-7 rounded-lg bg-white/95 border border-border shadow-sm flex items-center justify-center text-on-surface-20 hover:bg-white cursor-grab active:cursor-grabbing"
                    aria-label="이미지 이동"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Move className="w-4 h-4" />
                  </button>
                )}
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
  touchMode = false,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  onEdit?: (index: number, src: string) => void;
  imageRatio?: "square" | "portrait";
  max?: number;
  touchMode?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const normalized = images.slice(0, max);
  const slots = normalized.map((src, i) => ({ id: src ? `g-${src}` : `empty-${i}`, src }));

  const sortable = useSortable({
    items: slots,
    onReorder: (reordered) => onChange(reordered.map((x) => x.src)),
  });
  const allowReorder = !touchMode;
  const thumbAspectClass = imageRatio === "square" ? "aspect-square" : "aspect-[3/4]";
  const thumbMinWidthClass = imageRatio === "square" ? "" : "min-w-[80px]";

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="pr-1">
        <div className="flex gap-2 flex-wrap w-full bg-[color:var(--surface-20)] p-4 rounded-lg max-h-[420px] overflow-y-auto">
          {slots.map((slot, i) => {
            const sortableProps = allowReorder
              ? sortable.getItemProps(slot.id)
              : {
                  handleProps: {
                    onPointerDown: () => {},
                    style: {},
                    "aria-label": "이미지 이동 비활성화",
                  },
                  wrapperProps: {
                    onPointerEnter: () => {},
                    style: {},
                    className: "",
                    ref: () => {},
                  },
                };
            const { handleProps, wrapperProps } = sortableProps;
            return (
              <div
                key={`${slot.id}-${i}`}
                {...wrapperProps}
                className={`${wrapperProps.className} relative w-[100px] ${thumbMinWidthClass} ${thumbAspectClass} group`}
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
                <div className={cn("absolute right-1 top-1 flex flex-col gap-1 transition-opacity", touchMode ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
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
                  {allowReorder && (
                    <button
                      type="button"
                      {...handleProps}
                      className="w-7 h-7 rounded-lg bg-white/95 border border-border shadow-sm flex items-center justify-center text-on-surface-20 hover:bg-white cursor-grab active:cursor-grabbing"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="이미지 이동"
                    >
                      <Move className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {normalized.length < max && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-[100px] ${thumbMinWidthClass} ${thumbAspectClass} rounded-lg border border-dashed border-border bg-white hover:bg-slate-50 active:bg-slate-50 flex items-center justify-center text-3xl text-on-surface-30 bg-center bg-cover bg-clip-border bg-origin-border`}
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
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(sidebarItems[0].id);
  const { data, updateData, setData, updateLocation } = useCardStore();
  const cloneCardData = (source: CardData): CardData => {
    try {
      return structuredClone(source);
    } catch {
      return JSON.parse(JSON.stringify(source));
    }
  };
  const [invitationTabs, setInvitationTabs] = useState<Array<{ id: string; label: string; data: CardData }>>([]);
  const [activeInvitationTabId, setActiveInvitationTabId] = useState<string>("");
  const [editingInvitationTabId, setEditingInvitationTabId] = useState<string | null>(null);
  const [editingInvitationTabName, setEditingInvitationTabName] = useState("");
  const isSwitchingInvitationRef = useRef(false);
  const onboardingAppliedRef = useRef(false);
  const shareTitleManuallyEditedRef = useRef(false);

  const autoShareTitle = useMemo(() => {
    const brideFirst = !!((data as any).i18n?.brideFirstInfo ?? false);
    const groom = (data.hosts.groom.name ?? "").trim();
    const bride = (data.hosts.bride.name ?? "").trim();
    const firstDisplayName = brideFirst ? (bride || "신부") : (groom || "신랑");
    const secondDisplayName = brideFirst ? (groom || "신랑") : (bride || "신부");
    return `${firstDisplayName} ♥ ${secondDisplayName} 결혼식`;
  }, [data.hosts.groom.name, data.hosts.bride.name, (data as any).i18n?.brideFirstInfo]);

  useEffect(() => {
    shareTitleManuallyEditedRef.current = false;
  }, [activeInvitationTabId]);

  useEffect(() => {
    if (shareTitleManuallyEditedRef.current) return;
    const current = (data.share?.title ?? "").trim();
    if (current === autoShareTitle.trim()) return;
    updateData("share.title", autoShareTitle);
  }, [autoShareTitle, data.share?.title, updateData]);

  /** Preview order: calendar / D-Day (`eventInfo`) sits directly above location. */
  const baseLayoutOrder = ['hosts', 'main', 'greeting', 'contact', 'eventInfo', 'location'];
  const sectionEnabled = data.sectionEnabled ?? {};
  const isSectionEnabled = (id: string) => sectionEnabled[id] ?? (id === 'bgm' || id === 'contact');
  const isBgmEnabled = isSectionEnabled('bgm');
  const setSectionEnabled = (updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    const next = typeof updater === 'function' ? updater(sectionEnabled) : updater;
    updateData('sectionEnabled', next);
  };
  const [editorWidth, setEditorWidth] = useState(560);
  const [isTabletViewport, setIsTabletViewport] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'editor' | 'preview'>('editor');
  const [viewportHeightPx, setViewportHeightPx] = useState<number | null>(null);
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
  useEffect(() => {
    // 새 선택 섹션이 추가되면 기존 순서 상태에 자동 편입
    setOptionalOrder((prev) => {
      const currentIds = sidebarItems
        .filter((i) => i.category === '선택' && !OTHER_OPTION_IDS.includes(i.id as any))
        .map((i) => i.id);
      const normalizedPrev = prev.filter((id) => currentIds.includes(id));
      const missing = currentIds.filter((id) => !normalizedPrev.includes(id));
      if (missing.length === 0 && normalizedPrev.length === prev.length) return prev;
      return [...normalizedPrev, ...missing];
    });
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    const handleViewportChange = () => setIsTabletViewport(mediaQuery.matches);
    handleViewportChange();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleViewportChange);
      return () => mediaQuery.removeEventListener('change', handleViewportChange);
    }
    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, []);

  useEffect(() => {
    if (!isTabletViewport) setMobilePanel('editor');
  }, [isTabletViewport]);

  useEffect(() => {
    if (!isTabletViewport || mobilePanel !== 'editor') return;
    if (!shouldRestoreEditorScrollRef.current) return;
    requestAnimationFrame(() => {
      const container = editorScrollRef.current;
      if (!container) return;
      container.scrollTop = editorScrollTopRef.current;
      shouldRestoreEditorScrollRef.current = false;
    });
  }, [isTabletViewport, mobilePanel]);

  useEffect(() => {
    const updateViewportHeight = () => {
      const vv = window.visualViewport;
      const visualHeight = vv?.height;
      const visualOffsetTop = vv?.offsetTop ?? 0;
      const rawHeight = (visualHeight && visualHeight > 0 ? visualHeight : window.innerHeight) + visualOffsetTop;
      const next = Math.round(Math.max(0, Math.min(rawHeight, window.innerHeight)));
      setViewportHeightPx(next);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    window.visualViewport?.addEventListener('resize', updateViewportHeight);
    window.visualViewport?.addEventListener('scroll', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      window.visualViewport?.removeEventListener('resize', updateViewportHeight);
      window.visualViewport?.removeEventListener('scroll', updateViewportHeight);
    };
  }, []);

  const [bankModalIndex, setBankModalIndex] = useState<number | null>(null);
  const [bankSearch, setBankSearch] = useState('');
  const [greetingSampleOpen, setGreetingSampleOpen] = useState(false);
  const [greetingSampleTab, setGreetingSampleTab] = useState<'general' | 'hosts' | 'religion'>('general');
  const [greetingSelectedSample, setGreetingSelectedSample] = useState<{ title: string; content: string } | null>(null);
  const [greetingEditorIndex, setGreetingEditorIndex] = useState(0);
  const [noticeSampleOpen, setNoticeSampleOpen] = useState(false);
  const [noticeSampleTab, setNoticeSampleTab] = useState<'general' | 'parking' | 'meal'>('general');
  const [noticeSelectedSample, setNoticeSelectedSample] = useState<{ title: string; content: string } | null>(null);
  const [noticeEditorTabIndex, setNoticeEditorTabIndex] = useState(0);
  const [noticePreviewTabIndex, setNoticePreviewTabIndex] = useState(0);
  const [rsvpSampleOpen, setRsvpSampleOpen] = useState(false);
  const [rsvpSampleTab, setRsvpSampleTab] = useState<'general' | 'formal' | 'friendly'>('general');
  const [rsvpSelectedSample, setRsvpSelectedSample] = useState<{ title: string; content: string } | null>(null);
  const [guestUploadSampleOpen, setGuestUploadSampleOpen] = useState(false);
  const [guestUploadSelectedSample, setGuestUploadSelectedSample] = useState<string | null>(null);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  // 사용자가 검색어(키워드)를 입력하는 로컬 상태
  // 최종 주소 확정은 모달에서 '적용'을 눌렀을 때만 updateData('location.address', ...)로 반영
  const [locationAddressKeyword, setLocationAddressKeyword] = useState('');
  const [selectedTransportMode, setSelectedTransportMode] = useState('');
  const [locationPreviewCoords, setLocationPreviewCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationPreviewLoading, setLocationPreviewLoading] = useState(false);
  const [naverPreviewFailed, setNaverPreviewFailed] = useState(false);
  const [venueSuggestOpen, setVenueSuggestOpen] = useState(false);
  const [venueDropdownStyle, setVenueDropdownStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [previewVisibleSections, setPreviewVisibleSections] = useState<Record<string, boolean>>({});
  const venueInputWrapRef = useRef<HTMLDivElement | null>(null);
  const venueDropdownRef = useRef<HTMLDivElement | null>(null);
  const autoAppliedVenueRef = useRef<string>("");
  const venueInputValue = String((data.eventInfo as any)?.venueName ?? "");
  const hasVenueQuery = venueInputValue.trim().length > 0;
  const [remoteVenueSuggestions, setRemoteVenueSuggestions] = useState<VenueSuggestion[]>([]);
  const localVenueSuggestions = useMemo(() => searchWeddingVenues(venueInputValue, 8), [venueInputValue]);
  const venueSuggestions = useMemo(() => {
    const map = new Map<string, VenueSuggestion>();
    for (const venue of [...remoteVenueSuggestions, ...localVenueSuggestions]) {
      const key = venue.name.replace(/\s+/g, "").toLowerCase();
      if (!key) continue;
      if (!map.has(key)) map.set(key, venue);
    }
    return Array.from(map.values()).slice(0, 8);
  }, [localVenueSuggestions, remoteVenueSuggestions]);

  useEffect(() => {
    const q = venueInputValue.trim();
    if (q.length < 2) {
      setRemoteVenueSuggestions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/weddinghall-search?q=${encodeURIComponent(q)}&limit=8`);
        if (!res.ok) return;
        const json = (await res.json()) as { results?: VenueSuggestion[] };
        if (cancelled) return;
        setRemoteVenueSuggestions(Array.isArray(json.results) ? json.results : []);
      } catch {
        if (!cancelled) setRemoteVenueSuggestions([]);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [venueInputValue]);

  const applyVenueSuggestion = async (venue: VenueSuggestion) => {
    setVenueSuggestOpen(false);
    autoAppliedVenueRef.current = venue.name.replace(/\s+/g, "").toLowerCase();
    updateData('eventInfo.venueName', venue.name);
    updateData('location.address', venue.address);
    setLocationAddressKeyword(venue.address);
    let guides = Array.isArray(venue.transportGuides) ? venue.transportGuides.slice(0, 3) : [];
    if (guides.length === 0) {
      try {
        const transitRes = await fetch(`/api/weddinghall-transit?address=${encodeURIComponent(venue.address)}`);
        if (transitRes.ok) {
          const transitJson = (await transitRes.json()) as { guides?: Array<{ mode: string; detail: string }> };
          guides = Array.isArray(transitJson.guides) ? transitJson.guides.slice(0, 3) : [];
        }
      } catch {
        // 네트워크 실패 시 기존 값 유지
      }
    }

    if (guides.length === 0) {
      guides = getDefaultTransitGuides();
    }

    if (guides.length > 0) {
      const nextTransports = guides.map((item) => ({
        mode: item.mode,
        detail: item.detail,
      }));
      const pickDetail = (matcher: RegExp) =>
        nextTransports.find((item) => matcher.test(item.mode))?.detail ?? '';
      updateLocation({
        transports: nextTransports,
        subway: pickDetail(/지하철/),
        bus: pickDetail(/버스/),
        car: pickDetail(/주차|자동차|자차/),
      });
    }
  };

  useEffect(() => {
    const normalized = venueInputValue.replace(/\s+/g, "").toLowerCase();
    if (!normalized || normalized === autoAppliedVenueRef.current) return;
    const exact = venueSuggestions.find(
      (venue) => venue.name.replace(/\s+/g, "").toLowerCase() === normalized
    );
    if (!exact) return;
    void applyVenueSuggestion(exact);
  }, [venueInputValue, venueSuggestions]);

  useEffect(() => {
    if (locationSearchOpen) return;
    setLocationAddressKeyword((data.location as any)?.address ?? '');
  }, [data.location, locationSearchOpen]);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  useEffect(() => {
    if (!venueSuggestOpen) return;
    const handleDocumentMouseDown = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (venueInputWrapRef.current?.contains(targetNode)) return;
      if (venueDropdownRef.current?.contains(targetNode)) return;
      setVenueSuggestOpen(false);
    };
    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, [venueSuggestOpen]);

  useEffect(() => {
    if (!venueSuggestOpen || !hasVenueQuery) return;
    const updateDropdownPosition = () => {
      const rect = venueInputWrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      setVenueDropdownStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };
    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    document.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      document.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [venueSuggestOpen, hasVenueQuery]);

  const [sharePreviewOpen, setSharePreviewOpen] = useState(false);
  const [shareThumbnailPickerOpen, setShareThumbnailPickerOpen] = useState(false);
  const [greetingThumbnailPickerOpen, setGreetingThumbnailPickerOpen] = useState(false);
  const [mainPresetPickerOpen, setMainPresetPickerOpen] = useState(false);
  const [rsvpPreviewModalOpen, setRsvpPreviewModalOpen] = useState(false);
  const [rsvpPreviewSide, setRsvpPreviewSide] = useState<'신랑측' | '신부측'>('신랑측');
  const [rsvpPreviewIntent, setRsvpPreviewIntent] = useState<'참석' | '불참'>('참석');
  const [rsvpPreviewName, setRsvpPreviewName] = useState('');
  const [rsvpPreviewGuestCount, setRsvpPreviewGuestCount] = useState('0');
  const [rsvpPreviewPrivacyAgreed, setRsvpPreviewPrivacyAgreed] = useState(false);
  const [pendingDeleteTab, setPendingDeleteTab] = useState<{ id: string; label: string } | null>(null);
  const [galleryDetailOpen, setGalleryDetailOpen] = useState(false);
  const [galleryDetailIndex, setGalleryDetailIndex] = useState(0);
  const editorScrollTopRef = useRef(0);
  const shouldRestoreEditorScrollRef = useRef(false);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const previewFrameRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (invitationTabs.length > 0) return;
    const initialId = "invitation-1";
    setInvitationTabs([{ id: initialId, label: "기본", data: cloneCardData(data) }]);
    setActiveInvitationTabId(initialId);
  }, [invitationTabs.length, data]);

  useEffect(() => {
    if (!activeInvitationTabId) return;
    if (isSwitchingInvitationRef.current) {
      isSwitchingInvitationRef.current = false;
      return;
    }
    setInvitationTabs((prev) =>
      prev.map((tab) => (tab.id === activeInvitationTabId ? { ...tab, data: cloneCardData(data) } : tab)),
    );
  }, [activeInvitationTabId, data]);

  const switchInvitationTab = (tabId: string) => {
    if (tabId === activeInvitationTabId) return;
    const target = invitationTabs.find((tab) => tab.id === tabId);
    if (!target) return;
    isSwitchingInvitationRef.current = true;
    setActiveInvitationTabId(tabId);
    setData(cloneCardData(target.data));
  };

  const addInvitationTab = () => {
    const nextIndex = invitationTabs.length + 1;
    const nextId = `invitation-${Date.now()}-${nextIndex}`;
    const sourceTab =
      invitationTabs.find((tab) => tab.id === activeInvitationTabId) ?? invitationTabs[0];
    const duplicated = sourceTab ? cloneCardData(sourceTab.data) : cloneCardData(data);
    setInvitationTabs((prev) => [...prev, { id: nextId, label: `청첩장 ${nextIndex}`, data: duplicated }]);
    isSwitchingInvitationRef.current = true;
    setActiveInvitationTabId(nextId);
    setData(cloneCardData(duplicated));
  };

  const removeInvitationTab = (tabId: string) => {
    if (invitationTabs.length <= 1) return;
    // 첫 번째 기본 탭은 항상 유지
    if (invitationTabs[0]?.id === tabId) return;
    const targetIndex = invitationTabs.findIndex((tab) => tab.id === tabId);
    if (targetIndex < 0) return;

    const nextTabs = invitationTabs.filter((tab) => tab.id !== tabId);
    setInvitationTabs(nextTabs);

    if (activeInvitationTabId === tabId) {
      const fallback = nextTabs[Math.max(0, targetIndex - 1)] ?? nextTabs[0];
      if (!fallback) return;
      isSwitchingInvitationRef.current = true;
      setActiveInvitationTabId(fallback.id);
      setData(cloneCardData(fallback.data));
    }
  };

  const requestRemoveInvitationTab = (tabId: string, label: string) => {
    if (invitationTabs.length <= 1) return;
    if (invitationTabs[0]?.id === tabId) return;
    setPendingDeleteTab({ id: tabId, label });
  };

  const confirmRemoveInvitationTab = () => {
    if (!pendingDeleteTab) return;
    removeInvitationTab(pendingDeleteTab.id);
    setPendingDeleteTab(null);
  };

  const startEditInvitationTabName = (tabId: string, currentLabel: string) => {
    setEditingInvitationTabId(tabId);
    setEditingInvitationTabName(currentLabel);
  };

  const commitInvitationTabName = () => {
    if (!editingInvitationTabId) return;
    const nextLabel = editingInvitationTabName.trim();
    if (!nextLabel) {
      setEditingInvitationTabId(null);
      setEditingInvitationTabName("");
      return;
    }
    setInvitationTabs((prev) =>
      prev.map((tab) => (tab.id === editingInvitationTabId ? { ...tab, label: nextLabel } : tab)),
    );
    setEditingInvitationTabId(null);
    setEditingInvitationTabName("");
  };

  const pickSearchParam = (key: string) => {
    const query = initialSearchParams ?? {};
    const value = query[key];
    if (Array.isArray(value)) return value[0] ?? '';
    return typeof value === 'string' ? value : '';
  };

  useEffect(() => {
    if (onboardingAppliedRef.current) return;
    const isOnboarding = pickSearchParam('onboarding') === '1';
    if (!isOnboarding) return;
    onboardingAppliedRef.current = true;

    const groomName = pickSearchParam('groomName').trim();
    const brideName = pickSearchParam('brideName').trim();
    const weddingDate = pickSearchParam('weddingDate').trim();
    const weddingTime = pickSearchParam('weddingTime').trim();
    const venueName = pickSearchParam('venueName').trim();
    const venueDetail = pickSearchParam('venueDetail').trim();
    const mergedVenueName = [venueName, venueDetail].filter(Boolean).join(' ');
    const venueAddress = pickSearchParam('venueAddress').trim();
    const themeType = pickSearchParam('themeType').trim().toUpperCase();
    const brideFirstInfo = !!((data as any).i18n?.brideFirstInfo ?? false);

    if (groomName) updateData('hosts.groom.name', groomName);
    if (brideName) updateData('hosts.bride.name', brideName);
    if (weddingDate) updateData('eventInfo.date', weddingDate);
    if (weddingTime) updateData('eventInfo.time', weddingTime);
    if (mergedVenueName) updateData('eventInfo.venueName', mergedVenueName);
    if (venueDetail) updateData('eventInfo.venueDetail', venueDetail);
    if (venueAddress) updateData('location.address', venueAddress);
    if (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].includes(themeType)) {
      updateData('main.introType', themeType);
    }
    if (groomName || brideName) {
      const firstDisplayName = brideFirstInfo ? (brideName || '신부') : (groomName || '신랑');
      const secondDisplayName = brideFirstInfo ? (groomName || '신랑') : (brideName || '신부');
      const composedTitle = `${firstDisplayName} ♥ ${secondDisplayName} 결혼식`;
      updateData('main.title', composedTitle);
      updateData('share.title', composedTitle);
    }
  }, [initialSearchParams, updateData]);

  // 공유 섹션 썸네일 프리셋 (사용자 제공 배너 리소스)
  const shareThumbnailPresets = useMemo(
    () => [
      { id: 'banner-01', label: '배너 1', url: '/images/share-thumbnails/banner_01.png' },
      { id: 'banner-02', label: '배너 2', url: '/images/share-thumbnails/banner_02.png' },
      { id: 'banner-03', label: '배너 3', url: '/images/share-thumbnails/banner_03.png' },
      { id: 'banner-04', label: '배너 4', url: '/images/share-thumbnails/banner_04.png' },
      { id: 'banner-05', label: '배너 5', url: '/images/share-thumbnails/banner_05.png' },
    ],
    [],
  );

  const flowerThumbnailPresets = useMemo(
    () => [
      { id: 'flower01', label: '꽃 1', url: '/flower01.svg' },
      { id: 'flower02', label: '꽃 2', url: '/flower02.svg' },
      { id: 'flower03', label: '꽃 3', url: '/flower03.svg' },
      { id: 'flower04', label: '꽃 4', url: '/flower04.svg' },
      { id: 'flower05', label: '꽃 5', url: '/flower05.svg' },
      { id: 'flower06', label: '꽃 6', url: '/flower06.svg' },
      { id: 'flower07', label: '꽃 7', url: '/flower07.svg' },
      { id: 'flower08', label: '꽃 8', url: '/flower08.svg' },
      { id: 'flower09', label: '꽃 9', url: '/flower09.svg' },
      { id: 'flower10', label: '꽃 10', url: '/flower10.svg' },
      { id: 'flower11', label: '꽃 11', url: '/flower11.svg' },
      { id: 'flower12', label: '꽃 12', url: '/flower12.svg' },
      { id: 'flower13', label: '꽃 13', url: '/flower13.svg' },
    ],
    [],
  );
  const greetingDefaultThumbnail = flowerThumbnailPresets[0]?.url ?? '/flower01.svg';

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

  const scrollPreviewToSection = (sectionId: string) => {
    if (sectionId === "hosts" || sectionId === "eventInfo") return;
    const root = previewScrollRef.current;
    if (!root) return;
    const previewSectionId = sectionId === "eventDate" ? "eventInfo" : sectionId;
    const target = root.querySelector<HTMLElement>(`[data-preview-section-id="${previewSectionId}"]`);
    if (!target) return;

    // 현재 편집 중인 섹션이 미리보기 중앙 부근에 오도록 자동 정렬
    const targetTop = target.offsetTop;
    const targetHeight = target.offsetHeight;
    const centerOffset = (root.clientHeight - targetHeight) / 2;
    const desiredTop = targetTop - centerOffset;
    const maxTop = Math.max(0, root.scrollHeight - root.clientHeight);
    const nextTop = Math.min(maxTop, Math.max(0, desiredTop));
    root.scrollTo({ top: nextTop, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollPreviewToSection(activeSection);
  }, [activeSection]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    const target = sidebar.querySelector<HTMLElement>(`[data-sidebar-item-id="${activeSection}"]`);
    if (!target) return;
    target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [activeSection]);

  const [mainPreviewIndex, setMainPreviewIndex] = useState(0);
  const [mainPreviewPrevIndex, setMainPreviewPrevIndex] = useState<number | null>(null);
  const [mainPreviewAnimKey, setMainPreviewAnimKey] = useState(0);
  const [galleryPreviewIndex, setGalleryPreviewIndex] = useState(0);
  const [galleryGridVisibleRows, setGalleryGridVisibleRows] = useState(3);
  const [guestbookPreviewPage, setGuestbookPreviewPage] = useState(1);
  const [guestbookMenuEntryId, setGuestbookMenuEntryId] = useState<string | null>(null);
  const [guestbookComposerOpen, setGuestbookComposerOpen] = useState(false);
  const [guestbookEditingEntryId, setGuestbookEditingEntryId] = useState<string | null>(null);
  const [guestbookDraftName, setGuestbookDraftName] = useState("");
  const [guestbookDraftMessage, setGuestbookDraftMessage] = useState("");
  const [guestbookDraftPassword, setGuestbookDraftPassword] = useState("");
  const [guestbookComposerPasswordError, setGuestbookComposerPasswordError] = useState("");
  const [guestbookDeleteTargetEntryId, setGuestbookDeleteTargetEntryId] = useState<string | null>(null);
  const [guestbookDeletePassword, setGuestbookDeletePassword] = useState("");
  const [guestbookDeletePasswordError, setGuestbookDeletePasswordError] = useState("");
  const [accountPreviewExpandedMap, setAccountPreviewExpandedMap] = useState<Record<string, boolean>>({});
  const [contactPreviewExpanded, setContactPreviewExpanded] = useState(false);
  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const [copyToastMessage, setCopyToastMessage] = useState("계좌정보가 복사되었습니다.");
  const copyToastTimeoutRef = useRef<number | null>(null);
  const gallerySwipeStartXRef = useRef<number | null>(null);
  const [mainPreviewRandomEffect, setMainPreviewRandomEffect] = useState<
    | '크로스페이드'
    | '디졸브'
    | '슬라이드(오→왼)'
    | '켄번즈(줌 인)'
    | '켄번즈(줌 아웃)'
  >('크로스페이드');
  const selectedKeyColorPreset = useMemo(() => {
    const selectedId = (data.theme as any)?.colorPreset;
    return KEY_COLOR_PRESETS.find((preset) => preset.id === selectedId) ?? KEY_COLOR_PRESETS[0];
  }, [(data.theme as any)?.colorPreset]);

  useEffect(() => {
    setGalleryGridVisibleRows(3);
  }, [
    (data.gallery as any)?.layoutType,
    (data.gallery as any)?.gridColumns,
    (data.gallery as any)?.useLoadMore,
    Array.isArray((data.gallery as any)?.images) ? (data.gallery as any).images.length : 0,
  ]);

  useEffect(() => {
    const layoutType = ((data.gallery as any)?.layoutType ?? 'grid') as 'grid' | 'slide';
    const autoSlide = !!((data.gallery as any)?.autoSlide);
    const intervalSec = Number((data.gallery as any)?.autoSlideIntervalSec ?? 3);
    const images = Array.isArray((data.gallery as any)?.images)
      ? (data.gallery as any).images.filter((u: unknown) => typeof u === 'string' && u.trim().length > 0)
      : [];
    if (layoutType !== 'slide' || !autoSlide || images.length <= 1) return;

    const timerId = window.setInterval(() => {
      setGalleryPreviewIndex((prev) => (prev + 1) % images.length);
    }, Math.max(2, intervalSec) * 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [
    (data.gallery as any)?.layoutType,
    (data.gallery as any)?.autoSlide,
    (data.gallery as any)?.autoSlideIntervalSec,
    Array.isArray((data.gallery as any)?.images) ? (data.gallery as any).images.length : 0,
  ]);

  useEffect(() => {
    const displayMode = ((data.accounts as any)?.displayMode ?? 'accordion') as 'accordion' | 'expanded';
    if (displayMode !== 'accordion') return;
    const list = Array.isArray(data.accounts?.list) ? data.accounts.list : [];
    setAccountPreviewExpandedMap((prev) => {
      const next: Record<string, boolean> = {};
      for (const acc of list) {
        next[acc.id] = prev[acc.id] ?? false;
      }
      return next;
    });
  }, [data.accounts?.list, (data.accounts as any)?.displayMode]);

  useEffect(() => {
    setGuestbookPreviewPage(1);
  }, [Array.isArray((data.guestbook as any)?.entries) ? (data.guestbook as any).entries.length : 0]);

  useEffect(() => {
    if (!guestbookMenuEntryId) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-guestbook-menu-root="true"]')) return;
      if (target.closest('[data-guestbook-menu-trigger="true"]')) return;
      setGuestbookMenuEntryId(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [guestbookMenuEntryId]);

  useEffect(() => {
    return () => {
      if (copyToastTimeoutRef.current) {
        window.clearTimeout(copyToastTimeoutRef.current);
      }
    };
  }, []);

  const showCopyToast = (message = "계좌정보가 복사되었습니다.") => {
    setCopyToastMessage(message);
    setCopyToastVisible(true);
    if (copyToastTimeoutRef.current) {
      window.clearTimeout(copyToastTimeoutRef.current);
    }
    copyToastTimeoutRef.current = window.setTimeout(() => {
      setCopyToastVisible(false);
      copyToastTimeoutRef.current = null;
    }, 2000);
  };

  const copyTextToClipboard = async (text: string) => {
    const value = String(text ?? "").trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      showCopyToast("계좌정보가 복사되었습니다.");
      return;
    } catch {
      // ignore and fallback
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (copied) {
        showCopyToast("계좌정보가 복사되었습니다.");
      } else {
        showCopyToast("복사에 실패했습니다.");
      }
    } catch {
      showCopyToast("복사에 실패했습니다.");
    }
  };

  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [imageEditorSrc, setImageEditorSrc] = useState<string>('');
  const [imageEditorZoom, setImageEditorZoom] = useState(1);
  const [imageEditorRotation, setImageEditorRotation] = useState(0);
  const [imageEditorFlipX, setImageEditorFlipX] = useState(false);
  const [imageEditorPan, setImageEditorPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageEditorAspect, setImageEditorAspect] = useState<'square' | 'portrait' | 'landscape10x4'>('portrait');
  const [imageEditorTarget, setImageEditorTarget] = useState<
    { kind: 'single' } | { kind: 'multi'; index: number } | { kind: 'gallery'; index: number } | { kind: 'shareThumbnail' } | null
  >(null);
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
    if (Array.isArray(transports)) {
      const list = transports as Array<{ mode: string; detail: string }>;
      if (list.length === 0) return [];
      const hasAny = list.some(
        (t) => String(t?.mode ?? "").trim() || String(t?.detail ?? "").trim(),
      );
      if (!hasAny) return [];
      return list;
    }
    const mode = String(data.location.subway ?? "").trim();
    const detail = String(data.location.bus ?? "").trim();
    if (!mode && !detail) return [];
    return [{ mode, detail }];
  }, [data.location]);

  const setTransportItems = (next: Array<{ mode: string; detail: string }>) => {
    updateData('location.transports', next);
    // 기존 필드도 1번째 항목과 동기화(하위호환)
    updateData('location.subway', next[0]?.mode ?? '');
    updateData('location.bus', next[0]?.detail ?? '');
  };
  const availableTransportModeOptions = useMemo(() => {
    const used = new Set(transportItems.map((item) => String(item.mode ?? "").trim()).filter(Boolean));
    return TRANSPORT_MODE_OPTIONS.filter((option) => !used.has(option));
  }, [transportItems]);

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

  // 주소 검색 모달 로직은 AddressSearchDialog로 분리

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

  const greetingEntries = useMemo(() => {
    const raw = (data.greeting as any)?.entries;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((entry: any) => ({
        title: String(entry?.title ?? ''),
        content: String(entry?.content ?? ''),
      }));
    }
    return [
      {
        title: String((data.greeting as any)?.title ?? ''),
        content: String((data.greeting as any)?.content ?? ''),
      },
    ];
  }, [data.greeting]);

  useEffect(() => {
    setGreetingEditorIndex((prev) => Math.min(prev, Math.max(0, greetingEntries.length - 1)));
  }, [greetingEntries.length]);

  const setGreetingEntries = (next: Array<{ title: string; content: string }>) => {
    const normalized = next.length > 0 ? next : [{ title: '', content: '' }];
    updateData('greeting.entries', normalized);
    updateData('greeting.title', normalized[0].title);
    updateData('greeting.content', normalized[0].content);
  };

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

  const rsvpSamples = useMemo(() => {
    return {
      general: [
        {
          title: '참석 회신 안내',
          content: `원활한 예식 준비를 위해 참석 여부를 남겨주세요.
소중한 답변 하나하나 큰 도움이 됩니다.`,
        },
        {
          title: '회신 부탁드립니다',
          content: `식사와 좌석 준비를 위해 참석 여부를 부탁드립니다.
잠시만 시간 내어 응답해 주시면 감사하겠습니다.`,
        },
        {
          title: '간단 응답 안내',
          content: `아래 버튼으로 참석/불참을 간단히 남겨주세요.
회신해 주신 내용은 예식 준비에만 사용됩니다.`,
        },
      ],
      formal: [
        {
          title: '예식 참석 의사 확인',
          content: `예식 진행 및 하객 안내 준비를 위해
참석 의사를 회신해 주시길 부탁드립니다.`,
        },
        {
          title: '회신 요청',
          content: `원활한 행사 운영을 위해 참석 여부를 확인하고 있습니다.
바쁘시더라도 회신 부탁드립니다.`,
        },
        {
          title: '하객 응답 안내',
          content: `식순 및 연회 준비를 위해 하객 응답을 받고 있습니다.
간단한 확인 부탁드립니다.`,
        },
      ],
      friendly: [
        {
          title: '편하게 알려주세요',
          content: `오실 수 있는지 편하게 알려주세요 :)
따뜻한 마음으로 기다리고 있겠습니다.`,
        },
        {
          title: '짧게 체크 부탁해요',
          content: `아래에서 참석 여부만 가볍게 체크해 주세요!
준비하는 데 큰 힘이 됩니다.`,
        },
        {
          title: '함께해 주실까요?',
          content: `바쁜 일정 중에도 함께해 주실 수 있다면 정말 기쁠 것 같아요.
참석 여부를 남겨주세요.`,
        },
      ],
    } as const;
  }, []);

  const guestUploadSamples = useMemo(() => {
    return [
      `예식 후 촬영하신 사진과 영상을 업로드해 주세요.
소중한 순간을 함께 모아 오래 간직하고 싶습니다.`,
      `하객분들이 담아주신 장면이 큰 선물이 됩니다.
편하실 때 사진/영상을 올려주세요.`,
      `예식 당일의 생생한 순간을 공유해 주세요.
모든 사진은 감사한 마음으로 소중히 보관하겠습니다.`,
      `찍어주신 인생샷, 짧은 영상 모두 환영해요!
함께 만든 추억을 공유해 주세요.`,
      `예쁜 장면을 많이 남겨주셨다면
아래에서 간단히 업로드 부탁드려요 :)`,
      `하객분들의 시선으로 담긴 장면이 궁금해요.
사진/영상을 자유롭게 올려주세요!`,
      `가로/세로 사진 모두 업로드 가능합니다.
여러 장 선택도 가능하니 편하게 등록해 주세요.`,
      `영상은 용량이 큰 경우 업로드에 시간이 걸릴 수 있습니다.
와이파이 환경에서 등록하시면 더 안정적입니다.`,
      `업로드된 파일은 예식 추억 공유 용도로만 사용됩니다.
원치 않으시는 사진은 제외 후 업로드해 주세요.`,
    ] as const;
  }, []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mainImageInputRef = useRef<HTMLInputElement | null>(null);
  const mainMultiBatchInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playIntentRef = useRef(true);
  const objectUrlRef = useRef<string | null>(null);
  const mainImageObjectUrlRef = useRef<string | null>(null);
  const simulateTimerRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
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

  const handleBgmPlay = async () => {
    const audio = audioRef.current;
    if (!musicSrc) {
      playIntentRef.current = true;
      setMuted(false);
      if (volume <= 0) setVolume(0.8);
      setIsPlaying(true);
      startSimulatedPlayback();
      return;
    }
    if (!audio) return;
    try {
      playIntentRef.current = true;
      audio.muted = false;
      audio.volume = volume > 0 ? volume : 0.8;
      setMuted(false);
      if (volume <= 0) setVolume(0.8);
      await audio.play();
      setIsPlaying(true);
    } catch {
      playIntentRef.current = false;
      setIsPlaying(false);
    }
  };

  const handleBgmStop = () => {
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
  };

  useEffect(() => {
    if (isBgmEnabled) return;
    // 배경음악 섹션 OFF 시 실제 재생도 즉시 중지
    playIntentRef.current = false;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    stopSimulatedPlayback();
    setCurrentTime(0);
  }, [isBgmEnabled]);

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
    const mode = normalizeMainImageMode((data.main as any).imageMode);
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
      .filter(
        (id) =>
          isSectionEnabled(id) &&
          id !== "share" &&
          id !== "protect" &&
          id !== "publish" &&
          id !== "i18n",
      ),
  ];
  const itemById = Object.fromEntries(sidebarItems.map((i) => [i.id, i])) as Record<
    string,
    (typeof sidebarItems)[number]
  >;
  const orderedItems = [
    ...(["hosts", "eventInfo"] as const).map((id) => itemById[id]),
    ...(["theme", "main", "bgm"] as const).map((id) => itemById[id]),
    ...(["greeting", "contact", "eventDate", "location"] as const).map((id) => itemById[id]),
    ...orderedContentOptionalItems,
    ...otherOptionItems,
  ];
  const isRsvpPreviewExpired = (() => {
    const deadline = String((data as any)?.rsvp?.deadline ?? "").trim();
    if (!deadline) return false;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayYmd = `${y}-${m}-${d}`;
    return todayYmd > deadline;
  })();

  const sidebarSortable = useSortable({
    items: orderedContentOptionalItems.map((it) => ({ ...it, id: it.id })),
    onReorder: (reordered) => setOptionalOrder(reordered.map((x) => x.id)),
  });

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    const container = editorScrollRef.current;
    if (!element || !container) return;

    // 선택한 섹션의 상단이 편집 패널 상단 30% 지점에 오도록 정렬
    setActiveSection(id);
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const elementTop = elementRect.top - containerRect.top + container.scrollTop;
    const anchorOffset = container.clientHeight * 0.3;
    const targetTop = elementTop - anchorOffset;
    const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const nextTop = Math.min(maxTop, Math.max(0, targetTop));
    container.scrollTo({ top: nextTop, behavior: 'smooth' });
  };

  const handleMobileTabSelect = (id: string) => {
    if (!isTabletViewport || mobilePanel === 'editor') {
      scrollToSection(id);
      return;
    }
    setMobilePanel('editor');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToSection(id));
    });
  };

  const openImageEditor = (
    target: { kind: 'single' } | { kind: 'multi'; index: number } | { kind: 'gallery'; index: number } | { kind: 'shareThumbnail' },
    src: string,
  ) => {
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
    } else if (target.kind === 'shareThumbnail') {
      setImageEditorAspect('landscape10x4');
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
    const cropRatio = imageEditorAspect === 'square' ? 1 : imageEditorAspect === 'landscape10x4' ? (10 / 4) : (3 / 4);
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
    } else if (imageEditorTarget.kind === 'gallery') {
      const prev = Array.isArray((data.gallery as any).images) ? [...(data.gallery as any).images] : [];
      const prevUrl = prev[imageEditorTarget.index];
      if (typeof prevUrl === 'string' && prevUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(prevUrl); } catch {}
      }
      prev[imageEditorTarget.index] = url;
      updateData('gallery.images', prev);
    } else {
      const prevUrl = String((data.share as any)?.thumbnail ?? '');
      if (prevUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(prevUrl); } catch {}
      }
      updateData('share.thumbnail', url);
    }

    closeImageEditor();
  };

  const noticeSections = useMemo(() => {
    const rawSections = (data.notice as any)?.sections;
    if (Array.isArray(rawSections) && rawSections.length > 0) {
      return rawSections.slice(0, 3).map((section: any, idx: number) => ({
        id: String(section?.id ?? `notice-${idx + 1}`),
        title: String(section?.title ?? "").trim() || `안내 ${idx + 1}`,
        content: String(section?.content ?? ""),
      }));
    }
    const fallbackTitle = (data.notice as any)?.title ?? "안내사항";
    const fallbackContent =
      (data.notice as any)?.content ??
      "마음 편히 오셔서 함께 축복해 주세요.\n예식장 내 주차가 가능하며, 식전 30분 전부터 입장이 가능합니다.";
    return [
      {
        id: "notice-1",
        title: String(fallbackTitle).trim() || "안내사항",
        content: String(fallbackContent),
      },
    ];
  }, [data.notice]);

  useEffect(() => {
    setNoticeEditorTabIndex((prev) => Math.min(prev, Math.max(0, noticeSections.length - 1)));
    setNoticePreviewTabIndex((prev) => Math.min(prev, Math.max(0, noticeSections.length - 1)));
  }, [noticeSections.length]);

  const updateNoticeSections = (nextSections: Array<{ id: string; title: string; content: string }>) => {
    const normalized = nextSections.slice(0, 3).map((section, idx) => ({
      id: String(section.id || `notice-${idx + 1}`),
      title: String(section.title ?? "").trim() || `안내 ${idx + 1}`,
      content: String(section.content ?? ""),
    }));
    updateData('notice.sections', normalized);
    if (normalized[0]) {
      updateData('notice.title', normalized[0].title);
      updateData('notice.content', normalized[0].content);
    }
  };

  const renderPreviewSection = (sectionId: string) => {
    switch (sectionId) {
      case 'main': {
        const frame = normalizeMainImageFrame((data.main as any).imageFrame);
        const mode = normalizeMainImageMode((data.main as any).imageMode);
        const mainBlackAndWhiteEnabled = !!((data.main as any).blackAndWhite ?? false);
        const mainImageFilterStyle = mainBlackAndWhiteEnabled ? { filter: "grayscale(100%)" } : undefined;
        if (mode === 'default') {
          const presetUrl = String((data.main as any).presetImage ?? '').trim();
          if (!presetUrl) {
            return null;
          }
          return (
            <MainHeroFrameShell frame={frame} aspectClass="aspect-square max-w-full mx-auto">
              <div
                className="absolute inset-0 bg-center bg-cover"
                style={{ backgroundImage: `url(${presetUrl})`, ...mainImageFilterStyle }}
              />
            </MainHeroFrameShell>
          );
        }
        const groomName = data.hosts.groom.name;
        const brideName = data.hosts.bride.name;
        const brideFirstInfo = !!((data as any).i18n?.brideFirstInfo ?? false);
        const firstDisplayName = brideFirstInfo ? brideName : groomName;
        const secondDisplayName = brideFirstInfo ? groomName : brideName;
        const normalizedEffect = normalizeTransitionEffect((data.main as any).transitionEffect ?? '없음');
        const transitionEffect = normalizedEffect === '랜덤' ? mainPreviewRandomEffect : normalizedEffect;
        const imagesRaw = Array.isArray((data.main as any).images) ? (data.main as any).images : [];
        const images = (imagesRaw as any[]).filter((u) => typeof u === 'string' && u.trim().length > 0) as string[];
        const singleUrl = typeof (data.main as any).image === 'string' ? (data.main as any).image : '';
        const currentUrl =
          mode === 'multi' && images.length > 0
            ? images[Math.min(mainPreviewIndex, images.length - 1)]
            : singleUrl;
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
          <MainHeroFrameShell frame={frame} aspectClass="aspect-[3/4]">
            {/* 배경 이미지 레이어 */}
            {transitionEffect === '디졸브' || transitionEffect === '크로스페이드' ? (
              <>
                {/* 새 이미지(아래) */}
                <div
                  className="absolute inset-0 bg-center bg-cover"
                  style={{
                    backgroundImage: currentUrl ? `url(${currentUrl})` : 'none',
                    backgroundColor: currentUrl ? undefined : '#eee',
                    ...mainImageFilterStyle,
                  }}
                />
                {/* 이전 이미지(위) — 페이드 아웃 */}
                {prevUrl && (
                  <div
                    key={`prev-${mainPreviewAnimKey}`}
                    className={`absolute inset-0 bg-center bg-cover ${animClassForPrev}`}
                    style={{ backgroundImage: `url(${prevUrl})`, ...mainImageFilterStyle }}
                  />
                )}
              </>
            ) : (
              <>
                {/* 이전 이미지(아래, 고정) */}
                {prevUrl ? (
                  <div
                    className="absolute inset-0 bg-center bg-cover"
                    style={{ backgroundImage: `url(${prevUrl})`, ...mainImageFilterStyle }}
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-center bg-cover"
                    style={{
                      backgroundImage: currentUrl ? `url(${currentUrl})` : 'none',
                      backgroundColor: currentUrl ? undefined : '#eee',
                      ...mainImageFilterStyle,
                    }}
                  />
                )}
                {/* 현재 이미지(위) — 선택 효과 */}
                {currentUrl && (
                  <div
                    key={`cur-${mainPreviewAnimKey}`}
                    className={`absolute inset-0 bg-center bg-cover ${transitionEffect === '없음' ? '' : animClassForCurrent}`}
                    style={{ backgroundImage: `url(${currentUrl})`, ...mainImageFilterStyle }}
                  />
                )}
              </>
            )}
          </MainHeroFrameShell>
        );
      }
      case 'greeting': {
        const greetingUseImage = !!((data.greeting as any)?.useImage ?? true);
        const greetingThumb = ((data.greeting as any)?.thumbnail ?? '').trim();
        const greetingThumbnailForPreview = greetingThumb || greetingDefaultThumbnail;
        return (
          <div className="max-w-[320px] mx-auto flex flex-col justify-start items-center">
            {greetingUseImage && (
              <div className="w-[56px] h-[56px] rounded-xl bg-white overflow-hidden mb-4 flex items-center justify-center">
                <img src={greetingThumbnailForPreview} alt="인사말 이미지" className="w-[56px] h-[56px] object-contain" />
              </div>
            )}
            <div className="space-y-5">
              {greetingEntries.map((entry, idx) => (
                <div key={`greeting-entry-${idx}`}>
                  <h3 className="text-[18px] font-semibold text-on-surface-10 mb-6">{entry.title}</h3>
                  <p className="text-[16px] font-[400] leading-[26px] text-on-surface-20 whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'hosts': {
        const groom = data.hosts.groom;
        const bride = data.hosts.bride;
        const brideFirstInfo = !!((data as any).i18n?.brideFirstInfo ?? false);
        const groomRelation = (groom.relation ?? '').trim() || '아들';
        const brideRelation = (bride.relation ?? '').trim() || '딸';
        const renderParentLabel = (
          parent: typeof groom.father,
          fallback: string,
        ) => (
          <span className="inline-flex items-center gap-1">
            {parent.isDeceased ? (
              <img
                src="/chrysanthemum.svg"
                alt="국화"
                className="w-3.5 h-3.5 object-contain"
                aria-hidden
              />
            ) : null}
            <span>{parent.name || fallback}</span>
          </span>
        );
        const renderParentNames = (
          father: typeof groom.father,
          mother: typeof groom.mother,
          fatherFallback: string,
          motherFallback: string,
        ) => (
          <>
            {renderParentLabel(father, fatherFallback)} <span aria-hidden>·</span>{' '}
            {renderParentLabel(mother, motherFallback)}
          </>
        );
        const groomParents = renderParentNames(groom.father, groom.mother, '신랑 부', '신랑 모');
        const brideParents = renderParentNames(bride.father, bride.mother, '신부 부', '신부 모');
        return (
          <div className="w-full max-w-[340px] mx-auto text-center">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2 rounded-xl border border-border bg-white/70 px-3 py-4">
                <p className="text-[0.8125em] tracking-[0.08em] text-on-surface-30 leading-none">신랑</p>
                <p className="text-[1.375em] font-semibold text-on-surface-10 leading-none">
                  {groom.name || '신랑 이름'}
                </p>
                <p className="text-[0.8125em] text-on-surface-30 leading-relaxed break-keep">
                  {groomParents} 의 {groomRelation}
                </p>
              </div>
              <div className="space-y-2 rounded-xl border border-border bg-white/70 px-3 py-4">
                <p className="text-[0.8125em] tracking-[0.08em] text-on-surface-30 leading-none">신부</p>
                <p className="text-[1.375em] font-semibold text-on-surface-10 leading-none">
                  {bride.name || '신부 이름'}
                </p>
                <p className="text-[0.8125em] text-on-surface-30 leading-relaxed break-keep">
                  {brideParents} 의 {brideRelation}
                </p>
              </div>
            </div>
          </div>
        );
      }
      case 'contact': {
        const contactEnabled = isSectionEnabled('contact');
        const useContactThumbnail = (data.share as any)?.useThumbnail ?? true;
        const brideFirstInfo = !!((data as any).i18n?.brideFirstInfo ?? false);
        const groomName = (data.hosts.groom.name ?? '').trim() || '신랑';
        const brideName = (data.hosts.bride.name ?? '').trim() || '신부';
        const groomRelation = (data.hosts.groom.relation ?? '').trim() || '아들';
        const brideRelation = (data.hosts.bride.relation ?? '').trim() || '딸';
        const groomFatherName = (data.hosts.groom.father.name ?? '').trim();
        const groomMotherName = (data.hosts.groom.mother.name ?? '').trim();
        const brideFatherName = (data.hosts.bride.father.name ?? '').trim();
        const brideMotherName = (data.hosts.bride.mother.name ?? '').trim();
        const groomParentsText = [groomFatherName, groomMotherName].filter(Boolean).join(' · ');
        const brideParentsText = [brideFatherName, brideMotherName].filter(Boolean).join(' · ');
        const hasParentsText = groomParentsText.length > 0 || brideParentsText.length > 0;
        const renderParentLabel = (
          key: string,
          name: string,
          isDeceased: boolean,
        ) => (
          <span key={key} className="inline-flex items-center gap-1">
            {isDeceased ? (
              <img
                src="/chrysanthemum.svg"
                alt="국화"
                className="w-3.5 h-3.5 object-contain"
                aria-hidden
              />
            ) : null}
            <span>{name}</span>
          </span>
        );
        const renderParentsInline = (
          fatherName: string,
          motherName: string,
          fatherDeceased: boolean,
          motherDeceased: boolean,
        ) => {
          const parentNodes: React.ReactNode[] = [];
          if (fatherName) {
            parentNodes.push(renderParentLabel('father', fatherName, fatherDeceased));
          }
          if (motherName) {
            if (parentNodes.length > 0) {
              parentNodes.push(<span key="divider"> · </span>);
            }
            parentNodes.push(renderParentLabel('mother', motherName, motherDeceased));
          }
          return parentNodes;
        };
        const groomParentsInline = renderParentsInline(
          groomFatherName,
          groomMotherName,
          data.hosts.groom.father.isDeceased,
          data.hosts.groom.mother.isDeceased,
        );
        const brideParentsInline = renderParentsInline(
          brideFatherName,
          brideMotherName,
          data.hosts.bride.father.isDeceased,
          data.hosts.bride.mother.isDeceased,
        );
        const contactRows = (
          brideFirstInfo
            ? [
                { role: '신부', name: brideName, phone: data.hosts.bride.phone, hidden: false },
                { role: '신랑', name: groomName, phone: data.hosts.groom.phone, hidden: false },
                { role: '신부 아버님', name: brideFatherName, phone: data.hosts.bride.father.phone, hidden: data.hosts.bride.father.isDeceased || brideFatherName.length === 0 },
                { role: '신부 어머님', name: brideMotherName, phone: data.hosts.bride.mother.phone, hidden: data.hosts.bride.mother.isDeceased || brideMotherName.length === 0 },
                { role: '신랑 아버님', name: groomFatherName, phone: data.hosts.groom.father.phone, hidden: data.hosts.groom.father.isDeceased || groomFatherName.length === 0 },
                { role: '신랑 어머님', name: groomMotherName, phone: data.hosts.groom.mother.phone, hidden: data.hosts.groom.mother.isDeceased || groomMotherName.length === 0 },
              ]
            : [
                { role: '신랑', name: groomName, phone: data.hosts.groom.phone, hidden: false },
                { role: '신부', name: brideName, phone: data.hosts.bride.phone, hidden: false },
                { role: '신랑 아버님', name: groomFatherName, phone: data.hosts.groom.father.phone, hidden: data.hosts.groom.father.isDeceased || groomFatherName.length === 0 },
                { role: '신랑 어머님', name: groomMotherName, phone: data.hosts.groom.mother.phone, hidden: data.hosts.groom.mother.isDeceased || groomMotherName.length === 0 },
                { role: '신부 아버님', name: brideFatherName, phone: data.hosts.bride.father.phone, hidden: data.hosts.bride.father.isDeceased || brideFatherName.length === 0 },
                { role: '신부 어머님', name: brideMotherName, phone: data.hosts.bride.mother.phone, hidden: data.hosts.bride.mother.isDeceased || brideMotherName.length === 0 },
              ]
        )
          .filter((row) => !row.hidden)
          .filter((row) => (row.phone ?? '').trim().length > 0);
        const orderedCoupleRows = brideFirstInfo
          ? [
              { role: '신부', name: brideName, relation: brideRelation, parentsText: brideParentsText, parentsInline: brideParentsInline },
              { role: '신랑', name: groomName, relation: groomRelation, parentsText: groomParentsText, parentsInline: groomParentsInline },
            ]
          : [
              { role: '신랑', name: groomName, relation: groomRelation, parentsText: groomParentsText, parentsInline: groomParentsInline },
              { role: '신부', name: brideName, relation: brideRelation, parentsText: brideParentsText, parentsInline: brideParentsInline },
            ];

        if (contactRows.length === 0) {
          return (
            <div className="max-w-[340px] mx-auto w-full rounded-xl border border-dashed border-border py-8 text-[0.8125em] text-on-surface-30">
              신랑신부 섹션에서 연락처를 입력해 주세요.
            </div>
          );
        }

        return (
          <div className="mx-auto w-full px-5 space-y-5">
            {contactEnabled && useContactThumbnail && !!(data.share?.thumbnail ?? '').trim() && (
              <div className="w-full aspect-[10/4] bg-[color:var(--surface-20)] overflow-hidden mb-[40px]">
                <img
                  src={(data.share?.thumbnail ?? '').trim()}
                  alt="혼주 섹션 이미지"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {hasParentsText ? (
              <div className="preview-hosts-parents-line space-y-1 text-[18px] text-on-surface-20 tracking-tight text-center">
                {orderedCoupleRows.map((row) => (
                  <div key={row.role} className="min-h-[27px] flex items-center justify-center" style={{ gap: '8px' }}>
                    {row.parentsText ? (
                      <div className="flex items-center gap-1">
                        {row.parentsInline}
                        <span
                          className="text-[13px]"
                          style={{ color: 'color-mix(in srgb, var(--on-surface-disabled) 60%, var(--on-surface-30) 40%)' }}
                        >
                          의 {row.relation}
                        </span>
                      </div>
                    ) : ''}
                    <span className="font-semibold text-on-surface-10">{row.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="min-h-[27px] flex items-center justify-center text-[18px] text-on-surface-20 tracking-tight text-center">
                {orderedCoupleRows[0].role} <span className="font-semibold text-on-surface-10 ml-1">{orderedCoupleRows[0].name}</span>
                <span className="mx-2 text-on-surface-30">·</span>
                {orderedCoupleRows[1].role} <span className="font-semibold text-on-surface-10 ml-1">{orderedCoupleRows[1].name}</span>
              </p>
            )}

            {contactEnabled && (
              <div className="w-[320px] mx-auto rounded-2xl border border-border bg-white/85 pt-0 pb-0 px-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setContactPreviewExpanded((prev) => !prev)}
                  className="w-full h-11 rounded-t-[inherit] rounded-b-none bg-transparent text-[0.95em] text-on-surface-20 inline-flex items-center justify-center gap-2 hover:bg-[color:var(--surface-10)] transition-colors"
                  aria-expanded={contactPreviewExpanded}
                  aria-label="연락처 상세 열기"
                >
                  <Phone className="w-4.5 h-4.5" />
                  <span>연락하기</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${contactPreviewExpanded ? 'rotate-180' : ''}`} />
                </button>

                {contactPreviewExpanded ? (
                  <div className="mt-2 mx-0 mb-2 space-y-0 animate-[preview-fade-in_220ms_ease-out_forwards]">
                    {contactRows.map((row) => {
                      const phone = (row.phone ?? '').trim();
                      return (
                      <div key={row.role} className="rounded-xl mb-0 bg-white px-4 py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0 text-left">
                          <p className="text-[15px] font-medium tracking-[0.06em] text-on-surface-30">{row.role}</p>
                        </div>
                        <div className="inline-flex items-center gap-1.5 shrink-0">
                          <a
                            href={`tel:${phone}`}
                            className="w-8 h-8 rounded-full inline-flex items-center justify-center bg-[color:var(--key)]/12 text-[color:var(--key)] hover:text-[color:var(--key-dark)] hover:bg-[color:var(--key)]/20"
                            aria-label={`${row.name} 전화하기`}
                            onClick={(event) => {
                              if (!phone) {
                                event.preventDefault();
                                return;
                              }
                              const shouldCall = window.confirm(`${row.name}님에게 전화를 거시겠어요?`);
                              if (!shouldCall) {
                                event.preventDefault();
                              }
                            }}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <a
                            href={`sms:${phone}`}
                            className="w-8 h-8 rounded-full inline-flex items-center justify-center bg-[color:var(--key)]/12 text-[color:var(--key)] hover:text-[color:var(--key-dark)] hover:bg-[color:var(--key)]/20"
                            aria-label={`${row.name} 문자 보내기`}
                            onClick={(event) => {
                              if (!phone) {
                                event.preventDefault();
                                return;
                              }
                              const shouldSendMessage = window.confirm(`${row.name}님에게 문자를 보내시겠어요?`);
                              if (!shouldSendMessage) {
                                event.preventDefault();
                              }
                            }}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )})}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      }
      case 'eventInfo': {
        const brideFirstInfo = !!((data as any).i18n?.brideFirstInfo ?? false);
        const dateText = (data.eventInfo.date ?? "").trim();
        const eventDate = parseEventDateLocal(dateText);
        const isValidEventDate = eventDate !== null;
        const showDday = (data.eventInfo as any)?.showDday !== false;
        const calendarDisplayType = normalizeCalendarDisplayType((data.eventInfo as any)?.calendarDisplayType);
        const calendarUseThemeColor = true;
        const timeTrimmed = (data.eventInfo.time ?? "").trim();
        let ddayStatusText = "";
        if (showDday && isValidEventDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const target = new Date(eventDate!);
          target.setHours(0, 0, 0, 0);
          const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
          const absDays = Math.abs(diffDays);
          if (diffDays > 0) ddayStatusText = `${absDays}일 남았습니다`;
          else if (diffDays < 0) ddayStatusText = `${absDays}일 지났습니다`;
          else ddayStatusText = "오늘입니다";
        }
        const ddayMatch = ddayStatusText.match(/^(\d+)(일 .+)$/);
        const ddayNumber = ddayMatch?.[1] ?? "";
        const ddaySuffix = ddayMatch?.[2] ?? ddayStatusText;
        const ddayHeartCls = "text-[color:var(--key)]";
        const ddayNumCls = "text-[color:var(--key-dark)] font-medium";
        const ddayMessage = ddayStatusText ? (
          <>
            {brideFirstInfo ? '신부' : '신랑'} <span className={ddayHeartCls}>&hearts;</span> {brideFirstInfo ? '신랑' : '신부'}의 결혼식이{" "}
            {ddayNumber ? (
              <>
                <span className={ddayNumCls}>{ddayNumber}</span>
                {ddaySuffix}
              </>
            ) : (
              ddayStatusText
            )}
            .
          </>
        ) : null;



        const calendarCells = isValidEventDate ? buildDesignerCalendarCells(eventDate!) : [];

        const eventInfoPreviewBg = !isValidEventDate
          ? "bg-transparent"
          : calendarUseThemeColor
            ? "bg-[color:var(--primary-container-2)]"
            : "bg-transparent";
        const eventInfoPreviewBorder = calendarUseThemeColor ? "border-y-0" : "border-y border-border";
        const ddayBlockCls = calendarUseThemeColor ? "text-[#413830]" : "text-neutral-600";
        const eventInfoPreviewText = calendarUseThemeColor ? "text-[#413830]" : "text-neutral-700";

        return (
          <div
            className={`max-w-full w-full mx-auto space-y-3 px-10 text-[0.8125em] ${eventInfoPreviewText} ${eventInfoPreviewBg} ${eventInfoPreviewBorder}`}
          >
            {isValidEventDate && (
              <div className="my-[60px] flex w-full flex-col items-center gap-10 rounded-none border-0 px-0 text-center shadow-none">
                <DesignerCalendarPreview
                  layout={calendarDisplayType}
                  cells={calendarCells}
                  eventDate={eventDate!}
                  timeRaw={timeTrimmed}
                  useThemeColor={calendarUseThemeColor}
                />
                {showDday && ddayMessage && (
                  <div
                    className={`w-full max-w-[19rem] text-[16px] font-normal leading-relaxed text-center ${ddayBlockCls}`}
                  >
                    {ddayMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      case 'location':
        {
          const addressInput = (data.location.address || '').trim();
          const address = addressInput || '경복궁';
          const venueName = String((data.eventInfo as any)?.venueName ?? '').trim();
          const venueDetail = String((data.eventInfo as any)?.venueDetail ?? '').trim();
          const venueDisplay = venueName
            ? (venueDetail && !venueName.includes(venueDetail) ? `${venueName} ${venueDetail}` : venueName)
            : address;
          const simplifiedAddress = (() => {
            const normalized = address
              .replace(/\b대한민국\b/g, '')
              .replace(/\b\d{5,6}\b/g, '')
              .replace(/\s{2,}/g, ' ')
              .trim();
            const stripVenueWords = (value: string) => {
              let next = value;
              if (venueName) next = next.replace(venueName, '').trim();
              if (venueDetail) next = next.replace(venueDetail, '').trim();
              return next.replace(/\s{2,}/g, ' ').trim();
            };

            const cleaned = stripVenueWords(normalized);
            const parts = cleaned
              .split(/[,\s]+/)
              .map((part) => part.trim())
              .filter(Boolean)
              .filter((part) => !/^\d{5,6}$/.test(part))
              .filter((part) => part !== '대한민국');

            const pickFirst = (matcher: (part: string) => boolean) => parts.find(matcher) || '';
            const gu = pickFirst((part) => /구$/.test(part));
            const dong = pickFirst((part) => /(동|읍|면|리)$/.test(part));
            const road = pickFirst((part) => /(로|길)$/.test(part));
            const bunji = pickFirst((part) => /^\d+(?:-\d+)?(?:번지)?$/.test(part));

            const ordered = [gu, dong, road, bunji].filter(Boolean);
            if (ordered.length > 0) return ordered.join(' ').trim();

            const locationLikeParts = parts.filter((part) => /[시군구읍면동리로길]/.test(part));
            const compactParts = (locationLikeParts.length > 0 ? locationLikeParts : parts).slice(-3);
            return compactParts.join(' ').trim();
          })();
          const title =
            String((data.location as any).title ?? LOCATION_TITLE_OPTIONS[0]).trim() || LOCATION_TITLE_OPTIONS[0];
          const enc = encodeURIComponent(address);
          const naverWeb = address ? `https://map.naver.com/v5/search/${enc}` : '';

          const transportsRaw = (data.location as any)?.transports;
          const transports: Array<{ mode: string; detail: string }> = Array.isArray(transportsRaw)
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
            <div className="w-full px-0 text-[0.8125em] text-on-surface-20 text-center">
              <p className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle} mb-1`}>{title}</p>
              <p className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle2} mb-0`}>Directions</p>

              <>
                <div className="mx-auto mt-[10px] mb-[10px] h-10 w-px bg-border" aria-hidden="true" />
                <p className="text-[16px] font-normal text-on-surface-10 mb-1">{venueDisplay}</p>
                {simplifiedAddress && simplifiedAddress !== venueDisplay && (
                  <p className="text-[14px] font-normal text-on-surface-30 mb-6">{simplifiedAddress}</p>
                )}

                <div className="w-full rounded-xl overflow-hidden border border-border bg-[color:var(--surface-20)]">
                  <div className="w-full aspect-[16/10] relative">
                    {locationPreviewCoords ? (
                      <>
                        <iframe
                          title="지도 미리보기"
                          className={cn(
                            "absolute inset-0 w-full h-full border-0 z-0",
                            naverPreviewFailed ? "opacity-100" : "opacity-100",
                          )}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          src={buildOsmEmbedUrl(locationPreviewCoords.lat, locationPreviewCoords.lon)}
                        />
                        {process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID && !naverPreviewFailed && (
                          <NaverMapEmbed
                            lat={locationPreviewCoords.lat}
                            lon={locationPreviewCoords.lon}
                            className="absolute inset-0 z-[1] w-full h-full"
                            onAuthError={() => setNaverPreviewFailed(true)}
                            onMapReady={() => setNaverPreviewFailed(false)}
                          />
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.06),transparent_55%),radial-gradient(circle_at_70%_40%,rgba(0,0,0,0.05),transparent_55%),linear-gradient(135deg,rgba(0,0,0,0.03),rgba(0,0,0,0.01))] text-on-surface-20">
                        <div className="flex flex-col items-center gap-2 px-4">
                          <div className="w-10 h-10 rounded-full bg-white/90 border border-black/10 flex items-center justify-center shadow-sm">
                            <span className="text-[1.125em] text-[color:var(--key)]">📍</span>
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
                    {/* 미리보기에서는 지도 상호작용(드래그/확대/축소) 비활성화 */}
                    <div className="absolute inset-0 z-10" aria-hidden />
                    {/* 지도 우측 상단 줌 컨트롤(+/-) 비노출 처리 */}
                    <div className="absolute right-2 top-2 z-20 h-20 w-10 rounded-md bg-[color:var(--surface-20)]" aria-hidden />
                  </div>

                  {/* 하단 앱 전송 바 (캡처 스타일) */}
                  {appLinks && (
                    <div className="preview-map-app-links w-full bg-[color:var(--surface-10)] border-t border-black/5 grid grid-cols-3 divide-x divide-black/10 text-[13px]">
                      <a
                        href={appLinks.naver.scheme}
                        onClick={openAppOrWeb(appLinks.naver.scheme, appLinks.naver.web)}
                        className="h-12 flex items-center justify-center gap-1 text-[13px] text-on-surface-10 min-w-0 px-2"
                        style={{ fontSize: "13px" }}
                      >
                        <span className="w-5 h-5 rounded-md bg-white border border-black/10 flex items-center justify-center text-[13px] font-bold text-green-600">
                          N
                        </span>
                        {appLinks.naver.label}
                      </a>
                      <a
                        href={appLinks.kakao.scheme}
                        onClick={openAppOrWeb(appLinks.kakao.scheme, appLinks.kakao.web)}
                        className="h-12 flex items-center justify-center gap-1 text-[13px] text-on-surface-10 min-w-0 px-2"
                        style={{ fontSize: "13px" }}
                      >
                        <span className="w-5 h-5 rounded-md bg-[#FEE500] border border-black/10 flex items-center justify-center text-[13px] font-black text-black">
                          K
                        </span>
                        {appLinks.kakao.label}
                      </a>
                      <a
                        href={appLinks.tmap.scheme}
                        onClick={openAppOrWeb(appLinks.tmap.scheme, appLinks.tmap.web)}
                        className="h-12 flex items-center justify-center gap-1 text-[13px] text-on-surface-10 min-w-0 px-2"
                        style={{ fontSize: "13px" }}
                      >
                        <span className="w-5 h-5 rounded-md bg-white border border-black/10 flex items-center justify-center text-[13px] font-black text-[#4B6BFF]">
                          T
                        </span>
                        {appLinks.tmap.label}
                      </a>
                    </div>
                  )}
                </div>

                {transportsClean.length > 0 && (
                  <div className="w-full pt-5 pb-5 flex flex-col gap-1 justify-start items-start">
                    {transportsClean.map((t, idx) => (
                      <div key={`${t.mode}-${idx}`} className="w-full mt-4 mb-4 text-[0.8125em] text-on-surface-20 text-left">
                        {t.mode && (
                          <div className="mb-1 text-[15px] font-semibold text-on-surface-10 text-left flex items-center justify-start gap-1.5 leading-none">
                            <span aria-hidden className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[color:var(--key)] leading-none">
                              {getTransportModeIcon(t.mode)}
                            </span>
                            <span>{t.mode}</span>
                          </div>
                        )}
                        {t.detail && (
                          <div className="text-[15px] leading-[24px] text-on-surface-30 whitespace-pre-line text-left">{t.detail}</div>
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
        const activeTabIndex = Math.min(noticePreviewTabIndex, noticeSections.length - 1);
        const activeSection = noticeSections[activeTabIndex] ?? noticeSections[0];
        const rawContent = String(activeSection?.content ?? "");
        const content = rawContent.trim().length > 0 ? rawContent : "안내 내용을 입력해 주세요.";
        const noticeHeading =
          String((data.notice as any)?.sectionHeading ?? "").trim() || NOTICE_HEADING_OPTIONS[0];
        const noticeTitle = (
          <div className="space-y-1">
            <div className={PREVIEW_TYPOGRAPHY_GUIDE.subtitle}>{noticeHeading}</div>
            <div className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle2} pb-[30px]`}>
              Information
            </div>
          </div>
        );
        return (
          <div className="max-w-full mx-auto w-full text-[13px] text-on-surface-20 space-y-2">
            {noticeTitle}
            <div className="mb-[10px] flex items-center justify-center w-full gap-0">
              {noticeSections.map((section, idx) => {
                const active = idx === activeTabIndex;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setNoticePreviewTabIndex(idx)}
                    className={[
                      'h-10 w-fit min-w-0 px-2 text-[16px]',
                      active
                        ? 'text-on-surface-10 font-semibold'
                        : 'text-[color:var(--on-surface-disabled)]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'block w-fit truncate text-[16px]',
                        active ? 'underline underline-offset-4 decoration-[1px]' : 'no-underline',
                      ].join(' ')}
                    >
                      {section.title}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="px-5 py-0">
              <p className="whitespace-pre-line leading-[26px] text-[16px] font-[400] text-center">{content}</p>
            </div>
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
        const requestedGridColumns = Number((data.gallery as any)?.gridColumns ?? 3);
        const gridColumns = requestedGridColumns === 2 ? 2 : 3;
        const useLoadMore = ((data.gallery as any)?.useLoadMore ?? true) === true;
        const enableDetailView = ((data.gallery as any)?.enableDetailView ?? true) === true;
        const effectiveDetailViewEnabled = layoutType === "slide" ? false : enableDetailView;
        const ratioClass = imageRatio === "square" ? "aspect-square" : "aspect-[3/4]";
        if (!images.length) {
          return (
            <div className="max-w-[320px] mx-auto w-full rounded-xl border border-dashed border-border py-10 text-[0.8125em] text-on-surface-30">
              갤러리 이미지를 추가해 주세요.
            </div>
          );
        }
        const galleryTitle = (
          <div className="space-y-1">
            <div className={PREVIEW_TYPOGRAPHY_GUIDE.subtitle}>갤러리</div>
            <div className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle2} pb-5`}>
              Gallery
            </div>
          </div>
        );
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
              {galleryTitle}
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
                    className={`w-full h-full object-cover ${effectiveDetailViewEnabled ? 'cursor-zoom-in' : ''}`}
                    onClick={() => {
                      if (!effectiveDetailViewEnabled) return;
                      setGalleryDetailIndex(currentIndex);
                      setGalleryDetailOpen(true);
                    }}
                  />
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/50 text-on-surface-10 hover:bg-white/70 flex items-center justify-center"
                      aria-label="이전 이미지"
                      onClick={moveToPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/50 text-on-surface-10 hover:bg-white/70 flex items-center justify-center"
                      aria-label="다음 이미지"
                      onClick={moveToNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
                <div className="absolute right-2 bottom-2 px-2 py-1 bg-black/50 rounded-[999px] inline-flex justify-start items-center gap-0.5">
                  <div className="justify-start text-white font-normal" style={{ fontSize: "12px", lineHeight: "12px" }}>{currentIndex + 1}</div>
                  <div className="opacity-50 justify-start text-white font-normal" style={{ fontSize: "12px", lineHeight: "12px" }}>/</div>
                  <div className="opacity-50 justify-start text-white font-normal" style={{ fontSize: "12px", lineHeight: "12px" }}>{images.length}</div>
                </div>
              </div>
              <div className="inline-flex w-full max-w-[320px] justify-start items-center gap-0">
                {images.map((_: string, idx: number) => (
                  <button
                    key={`gallery-dot-${idx}`}
                    type="button"
                    onClick={() => setGalleryPreviewIndex(idx)}
                    className={`flex-1 h-0.5 transition-colors ${idx === currentIndex ? 'bg-[color:var(--key)]' : 'bg-zinc-300 opacity-50'}`}
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
            {galleryTitle}
            <div
              className={`w-full grid mb-4 ${gridColumns === 2 ? "grid-cols-2" : "grid-cols-3"}`}
              style={{ gap: `${imageGapPx}px` }}
            >
              {images.slice(0, visibleCount).map((src: string, idx: number) => (
                <div key={`${src}-${idx}`} className={`${gridPreviewRadiusClass} overflow-hidden border ${gridPreviewBorderClass} ${ratioClass}`}>
                  <img
                    src={src}
                    alt={`갤러리 이미지 ${idx + 1}`}
                    className={`w-full h-full object-cover ${effectiveDetailViewEnabled ? 'cursor-zoom-in' : ''}`}
                    onClick={() => {
                      if (!effectiveDetailViewEnabled) return;
                      setGalleryDetailIndex(idx);
                      setGalleryDetailOpen(true);
                    }}
                  />
                </div>
              ))}
            </div>
            {shouldShowLoadMoreButton && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
                  onClick={() => {
                    if (visibleRows < totalRows) {
                      setGalleryGridVisibleRows((prev) => Math.min(prev + 3, totalRows));
                      return;
                    }
                    setGalleryGridVisibleRows(3);
                  }}
                >
                  {visibleRows < totalRows ? '더보기' : '접기'}
                </Button>
              </div>
            )}
          </div>
        );
      }
      case 'account': {
        const title = String(data.accounts?.title ?? ACCOUNT_TITLE_OPTIONS[0]).trim() || ACCOUNT_TITLE_OPTIONS[0];
        const subtitle2 = getOptionalSubtitle2('account');
        const content = data.accounts?.content || "";
        const list = Array.isArray(data.accounts?.list) ? data.accounts.list : [];
        const displayMode = ((data.accounts as any)?.displayMode ?? 'accordion') as 'accordion' | 'expanded';
        return (
          <div className="max-w-full mx-auto w-full space-y-3 text-[0.8125em] text-on-surface-20">
            <div className="space-y-0">
              <p className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle} mb-1`}>{title}</p>
              <p className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle2} mb-0 pb-5`}>{subtitle2}</p>
            </div>
            {content && <p className="whitespace-pre-line text-[14px] leading-[24px]">{content}</p>}
            <div className="space-y-2">
              {list.map((acc) => {
                const isOpen = displayMode === 'expanded' ? true : !!accountPreviewExpandedMap[acc.id];
                return (
                  <div
                    key={acc.id}
                    className="rounded-lg border text-left overflow-hidden bg-[color:var(--primary-container)] border-[color:var(--key)]/20"
                  >
                    {displayMode === 'accordion' ? (
                      <button
                        type="button"
                        className="w-full px-3 py-3 flex items-center justify-between gap-2 text-left"
                        onClick={() =>
                          setAccountPreviewExpandedMap((prev) => ({
                            ...prev,
                            [acc.id]: !prev[acc.id],
                          }))
                        }
                      >
                        <span className="font-semibold text-[color:var(--on-primary-container)]">{acc.groupName || "계좌명"}</span>
                        <ChevronDown className={`w-4 h-4 text-[color:var(--on-primary-container)]/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    ) : (
                      <div className="px-3 pt-3 text-[0.75em] text-[color:var(--on-primary-container)]/70">{acc.groupName || "계좌명"}</div>
                    )}
                    {isOpen && (
                      <div className={`${displayMode === 'accordion' ? 'px-3 pb-3' : 'px-3 py-3'}`}>
                        <div className="text-[color:var(--on-primary-container)]/75">{acc.holder || "예금주"}</div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-[color:var(--on-primary-container)]">{acc.bank || "은행"} {acc.accountNumber || "계좌번호"}</div>
                          <button
                            type="button"
                            className="h-7 px-2 rounded-md border border-[color:var(--key)]/30 bg-white/70 text-[11px] font-medium text-[color:var(--on-primary-container)] hover:bg-white transition-colors"
                            onClick={() => {
                              const accountNumber = String(acc.accountNumber ?? "").trim();
                              if (!accountNumber) return;
                              copyTextToClipboard(accountNumber);
                            }}
                          >
                            복사
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case 'guestbook': {
        const rawTitle = ((data.guestbook as any)?.title ?? "축하해 주세요") as string;
        const title = rawTitle.trim() || "축하해 주세요";
        const descriptionRaw = ((data.guestbook as any)?.description ?? "guestbook") as string;
        const description = descriptionRaw === "축하 인사를 남겨주세요." || descriptionRaw === "Guestbook"
          ? "Guestbook"
          : upperCaseFirst(descriptionRaw);
        const showCreatedAt = ((data.guestbook as any)?.showCreatedAt ?? true) as boolean;
        const hasPassword = Boolean(data.guestbook?.password?.trim());
        const entries = Array.isArray((data.guestbook as any)?.entries) ? (data.guestbook as any).entries : [];
        const masterPassword = ((data.guestbook as any)?.password ?? "").trim();
        const orderedEntries = entries;
        const perPageRaw = Number((data.guestbook as any)?.displayCount ?? 5);
        const perPage = perPageRaw === 3 || perPageRaw === 5 || perPageRaw === 7 ? perPageRaw : 5;
        const totalPages = Math.max(1, Math.ceil(orderedEntries.length / perPage));
        const currentPage = Math.min(guestbookPreviewPage, totalPages);
        const pagedEntries = orderedEntries.slice((currentPage - 1) * perPage, currentPage * perPage);
        const pageStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
        const pageEnd = Math.min(totalPages, pageStart + 4);
        const pageNumbers = Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i);
        const draftMessageLength = guestbookDraftMessage.length;
        const closeGuestbookComposer = () => {
          setGuestbookComposerOpen(false);
          setGuestbookEditingEntryId(null);
          setGuestbookDraftName("");
          setGuestbookDraftMessage("");
          setGuestbookDraftPassword("");
          setGuestbookComposerPasswordError("");
        };
        const closeGuestbookDeleteDialog = () => {
          setGuestbookDeleteTargetEntryId(null);
          setGuestbookDeletePassword("");
          setGuestbookDeletePasswordError("");
        };
        const canManageGuestbookEntry = (entry: any, password: string) => {
          const pass = password.trim();
          if (!pass) return false;
          const entryPassword = String((entry as any)?.password ?? "").trim();
          if (masterPassword && pass === masterPassword) return true;
          if (entryPassword && pass === entryPassword) return true;
          return false;
        };
        const getEntryDateText = (entry: any) => {
          const createdAtRaw = String((entry as any)?.createdAt ?? "").trim();
          const fromCreatedAt = createdAtRaw ? new Date(createdAtRaw) : null;
          if (fromCreatedAt && Number.isFinite(fromCreatedAt.getTime())) {
            return fromCreatedAt.toLocaleDateString("ko-KR");
          }
          const id = String((entry as any)?.id ?? "");
          const match = id.match(/guestbook-(\d{10,13})/);
          if (!match) return "";
          const ts = Number(match[1]);
          if (!Number.isFinite(ts)) return "";
          const d = new Date(ts);
          if (!Number.isFinite(d.getTime())) return "";
          return d.toLocaleDateString("ko-KR");
        };
        return (
          <div className="max-w-full mx-auto w-full text-[0.8125em] text-on-surface-20 text-left">
            <p className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle} text-center mb-[4px]`}>{title}</p>
            <p className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle2} whitespace-pre-line leading-relaxed text-center mb-[10px]`}>{description}</p>
            {orderedEntries.length === 0 ? (
              <>
                <div className="mt-0 mb-0 pb-[30px] flex justify-center items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit rounded-[999px] px-6 h-10 text-[13px] border-transparent bg-[color:var(--key)] text-white hover:bg-[color:var(--key-dark)] hover:text-white"
                    onClick={() => setGuestbookComposerOpen(true)}
                  >
                    축하글 작성하기
                  </Button>
                </div>
                <div className="rounded-xl border border-border bg-white h-[160px] flex flex-col items-center justify-center gap-4 text-on-surface-30">
                  <Pencil className="h-6 w-6" />
                  <p className="text-[13px] leading-none">첫 번째 축하 글을 남겨주세요</p>
                </div>
              </>
            ) : (
              <div className="mt-0 mb-0 pb-[30px] flex justify-center items-center">
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit rounded-lg px-4 h-10 text-[13px] border-transparent bg-[color:var(--key)] text-white hover:bg-[color:var(--key-dark)] hover:text-white"
                  onClick={() => setGuestbookComposerOpen(true)}
                >
                  축하메시지 남기기
                </Button>
              </div>
            )}
            <div className="space-y-2">
              {pagedEntries.map((entry: any) => (
                <div key={entry.id} className="rounded-lg border border-border bg-white px-4 pt-3 pb-3 flex flex-col gap-1 space-y-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between -mr-2">
                    <div className="min-w-0 flex flex-col">
                      <span className="font-semibold text-on-surface-10 truncate">
                        {entry.name || "작성자"}
                      </span>
                      {showCreatedAt && getEntryDateText(entry) && (
                        <span className="text-[11px] text-on-surface-30 leading-none mt-0.5">
                          {getEntryDateText(entry)}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        data-guestbook-menu-trigger="true"
                        className="h-6 w-6 inline-flex items-center justify-center rounded-md text-on-surface-20 hover:bg-slate-100 hover:text-on-surface-10"
                        onClick={() => setGuestbookMenuEntryId((prev) => (prev === entry.id ? null : entry.id))}
                        aria-label="방명록 더보기"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {guestbookMenuEntryId === entry.id && (
                        <div
                          data-guestbook-menu-root="true"
                          className="absolute right-0 mt-1 min-w-[84px] rounded-md border border-border bg-white shadow-sm z-10 overflow-hidden"
                        >
                          <button
                            type="button"
                            className="w-full h-8 px-3 text-left text-[12px] text-on-surface-20 hover:bg-slate-50"
                            onClick={() => {
                              setGuestbookEditingEntryId(String(entry.id));
                              setGuestbookDraftName(String(entry.name ?? ""));
                              setGuestbookDraftMessage(String(entry.message ?? ""));
                              setGuestbookDraftPassword("");
                              setGuestbookComposerPasswordError("");
                              setGuestbookComposerOpen(true);
                              setGuestbookMenuEntryId(null);
                            }}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="w-full h-8 px-3 text-left text-[12px] text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setGuestbookDeleteTargetEntryId(String(entry.id));
                              setGuestbookDeletePassword("");
                              setGuestbookMenuEntryId(null);
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed text-on-surface-20">
                    {entry.isSecret ? "🔒 비밀글입니다." : entry.message}
                  </p>
                </div>
              ))}
            </div>
            {orderedEntries.length > perPage && (
              <>
                <Pagination className="m-0 w-full justify-start p-0">
                  <PaginationContent className="w-full items-center pt-5">
                    <PaginationItem className="shrink-0">
                      <PaginationPrevious
                        onClick={() => setGuestbookPreviewPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                      />
                    </PaginationItem>
                    <PaginationItem className="flex-1">
                      <div className="flex items-center justify-center gap-1">
                        {pageNumbers.map((num) => (
                          <PaginationLink
                            key={`guestbook-page-${num}`}
                            isActive={num === currentPage}
                            onClick={() => setGuestbookPreviewPage(num)}
                          >
                            {num}
                          </PaginationLink>
                        ))}
                      </div>
                    </PaginationItem>
                    <PaginationItem className="shrink-0">
                      <PaginationNext
                        onClick={() => setGuestbookPreviewPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            )}
            {guestbookComposerOpen && previewFrameRef.current &&
              createPortal(
                <div
                  className="absolute inset-0 z-40 bg-black/45 p-4 flex items-center justify-center"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                      closeGuestbookComposer();
                    }
                  }}
                >
                  <div className="w-full max-w-[360px] rounded-2xl border border-border bg-white p-4 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-semibold text-on-surface-10">
                        {guestbookEditingEntryId ? "축하메시지 수정" : "축하메시지 남기기"}
                      </p>
                    </div>
                    <Input
                      value={guestbookDraftName}
                      onChange={(e) => {
                        setGuestbookDraftName(e.target.value);
                        setGuestbookComposerPasswordError("");
                      }}
                      placeholder="이름"
                      className="shadow-none"
                    />
                    <div className="space-y-1">
                      <Textarea
                        rows={4}
                        maxLength={200}
                        value={guestbookDraftMessage}
                        onChange={(e) => {
                          setGuestbookDraftMessage(e.target.value.slice(0, 200));
                          setGuestbookComposerPasswordError("");
                        }}
                        placeholder="축하 메시지를 입력해 주세요."
                        className="min-h-[200px] max-h-[400px] resize-none shadow-none"
                      />
                      <div className="text-[12px] text-on-surface-30 text-right">{draftMessageLength}/200</div>
                    </div>
                    <div className="space-y-1">
                      <Input
                        type="password"
                        value={guestbookDraftPassword}
                        onChange={(e) => {
                          setGuestbookDraftPassword(e.target.value);
                          if (guestbookComposerPasswordError) setGuestbookComposerPasswordError("");
                        }}
                        placeholder="글 비밀번호"
                        className="shadow-none"
                      />
                      {guestbookComposerPasswordError ? (
                        <p className="text-[12px] text-destructive leading-relaxed text-right">
                          {guestbookComposerPasswordError}
                        </p>
                      ) : (
                        <p className="text-[12px] text-on-surface-30 leading-relaxed text-right">
                          수정/삭제 시 필요해요.
                        </p>
                      )}
                    </div>
                    <div className="pt-1 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 px-4 text-[12px]"
                        onClick={closeGuestbookComposer}
                      >
                        취소
                      </Button>
                      <Button
                        type="button"
                        className="h-9 px-4 text-[12px]"
                        disabled={!guestbookDraftMessage.trim() || !guestbookDraftPassword.trim()}
                        onClick={() => {
                          const message = guestbookDraftMessage.trim();
                          const password = guestbookDraftPassword.trim();
                          if (!message || !password) return;
                          if (guestbookEditingEntryId) {
                            const targetEntry = orderedEntries.find((it: any) => String(it.id) === guestbookEditingEntryId);
                            if (!targetEntry || !canManageGuestbookEntry(targetEntry, password)) {
                              setGuestbookComposerPasswordError("비밀번호가 올바르지 않습니다.");
                              return;
                            }
                            const nextEntries = orderedEntries.map((it: any) =>
                              String(it.id) === guestbookEditingEntryId
                                ? {
                                    ...it,
                                    name: guestbookDraftName.trim(),
                                    message,
                                  }
                                : it,
                            );
                            updateData("guestbook.entries", nextEntries);
                            closeGuestbookComposer();
                            return;
                          }
                          const nextEntry = {
                            id: `guestbook-${Date.now()}`,
                            name: guestbookDraftName.trim(),
                            message,
                            password,
                            createdAt: new Date().toISOString(),
                          };
                          updateData("guestbook.entries", [nextEntry, ...orderedEntries]);
                          setGuestbookPreviewPage(1);
                          closeGuestbookComposer();
                        }}
                      >
                        {guestbookEditingEntryId ? "수정" : "등록"}
                      </Button>
                    </div>
                  </div>
                </div>,
                previewFrameRef.current
              )}
            {guestbookDeleteTargetEntryId && previewFrameRef.current &&
              createPortal(
                <div
                  className="absolute inset-0 z-40 bg-black/45 p-4 flex items-center justify-center"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                      closeGuestbookDeleteDialog();
                    }
                  }}
                >
                  <div className="w-full max-w-[320px] rounded-2xl border border-border bg-white p-4 space-y-3 shadow-xl">
                    <p className="text-[15px] font-semibold text-on-surface-10">축하메시지 삭제</p>
                    <Input
                      type="password"
                      value={guestbookDeletePassword}
                      onChange={(e) => {
                        setGuestbookDeletePassword(e.target.value);
                        if (guestbookDeletePasswordError) setGuestbookDeletePasswordError("");
                      }}
                      placeholder="비밀번호를 입력해 주세요."
                      className="shadow-none"
                    />
                    {!!guestbookDeletePasswordError && (
                      <p className="text-[12px] text-red-600 mt-1">{guestbookDeletePasswordError}</p>
                    )}
                    <div className="pt-1 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 px-4 text-[12px]"
                        onClick={closeGuestbookDeleteDialog}
                      >
                        취소
                      </Button>
                      <Button
                        type="button"
                        className="h-9 px-4 text-[12px] bg-red-600 hover:bg-red-700"
                        disabled={!guestbookDeletePassword.trim()}
                        onClick={() => {
                          const targetEntry = orderedEntries.find((it: any) => String(it.id) === guestbookDeleteTargetEntryId);
                          if (!targetEntry || !canManageGuestbookEntry(targetEntry, guestbookDeletePassword)) {
                            setGuestbookDeletePasswordError("비밀번호가 틀립니다.");
                            return;
                          }
                          const nextEntries = orderedEntries.filter((it: any) => String(it.id) !== guestbookDeleteTargetEntryId);
                          updateData("guestbook.entries", nextEntries);
                          closeGuestbookDeleteDialog();
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>,
                previewFrameRef.current
              )}
            <div className="flex flex-wrap gap-2 text-[0.75em] text-on-surface-30">
              {hasPassword && <span>비밀번호 보호</span>}
            </div>
          </div>
        );
      }
      case 'youtube': {
        const title = String((data.youtube as any)?.title ?? YOUTUBE_TITLE_OPTIONS[0]).trim() || YOUTUBE_TITLE_OPTIONS[0];
        const subtitle2 = getOptionalSubtitle2('youtube');
        const sourceType = ((data.youtube as any)?.sourceType ?? 'url') as 'file' | 'url';
        const fileUrl = ((data.youtube as any)?.fileUrl ?? '').trim();
        const videoId = getYoutubeVideoId(data.youtube?.url ?? "");
        const isLoop = !!(data.youtube as any)?.isLoop;
        const embedUrl = videoId
          ? `https://www.youtube.com/embed/${videoId}${isLoop ? `?loop=1&playlist=${videoId}` : ""}`
          : null;
        return (
          <div className="max-w-full mx-auto w-full space-y-3 text-[0.8125em] text-on-surface-20">
            <div className="space-y-0 text-center">
              <p className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle} mb-1`}>{title}</p>
              <p className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle2} mb-0 pb-5`}>{subtitle2}</p>
            </div>
            {sourceType === 'file' ? (
              fileUrl ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-black">
                  <video
                    src={fileUrl}
                    className="w-full h-full"
                    controls
                    loop={isLoop}
                    playsInline
                  />
                </div>
              ) : (
                <div className="w-full h-28 rounded-xl border border-dashed border-border flex items-center justify-center text-on-surface-30">
                  영상 파일을 첨부해 주세요.
                </div>
              )
            ) : embedUrl ? (
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
      case 'rsvp': {
        const r = (data as any).rsvp ?? {};
        const title = String(r.title ?? RSVP_TITLE_OPTIONS[0]).trim() || RSVP_TITLE_OPTIONS[0];
        const subtitle2 = getOptionalSubtitle2('rsvp');
        const description = (r.description ?? "") as string;
        return (
          <div className="max-w-full mx-auto w-full space-y-3 text-[0.8125em] text-on-surface-20 text-left">
            <div className="space-y-0">
              <p className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle} text-center mb-[4px]`}>{title}</p>
              <p className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle2} text-center mb-[20px]`}>{subtitle2}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4 space-y-3">
              {description ? <p className="whitespace-pre-line leading-relaxed text-center">{description}</p> : null}
              <button
                type="button"
                onClick={() => setRsvpPreviewModalOpen(true)}
                className="h-10 w-full rounded-lg bg-[color:var(--key)] text-white text-[13px] font-semibold inline-flex items-center justify-center hover:brightness-95 transition"
              >
                참석여부 전달하기
              </button>
            </div>
          </div>
        );
      }
      case 'guestUpload': {
        const title = String((data.guestUpload as any)?.title ?? GUEST_UPLOAD_TITLE_OPTIONS[0]).trim() || GUEST_UPLOAD_TITLE_OPTIONS[0];
        const subtitle2 = getOptionalSubtitle2('guestUpload');
        const description = ((data.guestUpload as any)?.description ?? "예식 후 촬영하신 사진/영상을 업로드해 주세요.") as string;
        return (
          <div className="max-w-full mx-auto w-full space-y-3 text-[0.8125em] text-on-surface-20 text-left">
            <div className="space-y-0 text-center">
              <p className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle} mb-1`}>{title}</p>
              <p className={`${PREVIEW_TYPOGRAPHY_GUIDE.subtitle2} mb-0 pb-5`}>{subtitle2}</p>
            </div>
            {description && <p className="whitespace-pre-line text-[14px] leading-[24px] text-center mb-[24px]">{description}</p>}
            <GuestPhotoUploadForm maxTotalMB={50} />
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

  const focusSelectableTarget = useCallback((event: React.SyntheticEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const selectable = target.closest<HTMLElement>('button,[role="button"],a,[tabindex]');
    if (!selectable) return;
    if (selectable.hasAttribute("disabled") || selectable.getAttribute("aria-disabled") === "true") return;

    requestAnimationFrame(() => {
      selectable.focus({ preventScroll: true });
    });
  }, []);

  return (
    <div
      className="flex flex-col gap-0 w-full bg-gray-50 overflow-hidden"
      style={{ height: viewportHeightPx ? `${viewportHeightPx}px` : '100dvh' }}
    >
      <AppHeader
        hideSiteNav
        rightSlot={
          <div className="flex items-center gap-2">
            {isTabletViewport && (
              <button
                type="button"
                onClick={() => {
                  if (mobilePanel === 'editor') {
                    editorScrollTopRef.current = editorScrollRef.current?.scrollTop ?? 0;
                    setMobilePanel('preview');
                    requestAnimationFrame(() => scrollPreviewToSection(activeSection));
                    return;
                  }
                  shouldRestoreEditorScrollRef.current = true;
                  setMobilePanel('editor');
                }}
                className="h-9 shrink-0 rounded-lg border border-[color:var(--key)] bg-white px-3 text-[12px] font-semibold text-[color:var(--key)] hover:bg-[color:var(--primary-container)]/30"
              >
                {mobilePanel === 'editor' ? '미리보기 전환' : '에디터 전환'}
              </button>
            )}
            <button
              type="button"
              className="bg-[color:var(--key)] text-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-[color:var(--key-dark)] transition-colors shadow-none"
              onClick={async () => {
                updateData("billing.savedAt", new Date().toISOString());
                let savedDraftMeta: { id: string; title: string; deleteAt: string; status: string } | null = null;
                const draftTitle = String(data.main?.title || "새 청첩장").trim() || "새 청첩장";

                try {
                  const res = await fetch("/api/invitations/draft", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: draftTitle,
                      payload: data,
                    }),
                  });
                  if (res.status === 401) {
                    router.push(`/login?next=${encodeURIComponent("/editor")}`);
                    return;
                  }
                  if (!res.ok) {
                    window.alert("저장을 위해 로그인이 필요하거나 서버 설정이 아직 완료되지 않았습니다.");
                    return;
                  }
                  if (res.ok) {
                    const json = (await res.json()) as { id: string; expiresAt?: string | null };
                    savedDraftMeta = {
                      id: json.id,
                      title: draftTitle,
                      deleteAt: json.expiresAt ? String(json.expiresAt).slice(0, 10) : "미정",
                      status: "결제 전",
                    };
                  }
                } catch {
                  window.alert("저장 중 네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
                  return;
                }

                try {
                  window.localStorage.setItem('mcard:hasDraft', '1');
                  window.localStorage.setItem(
                    'mcard:lastDraft',
                    JSON.stringify({
                      id: savedDraftMeta?.id ?? `draft-${Date.now()}`,
                      title: savedDraftMeta?.title ?? draftTitle,
                      deleteAt: savedDraftMeta?.deleteAt ?? "저장 직후",
                      status: savedDraftMeta?.status ?? "결제 전",
                    }),
                  );
                } catch (_e) {
                  // ignore localStorage errors
                }
                router.push('/mypage?saved=1');
              }}
            >
              저장하기
            </button>
          </div>
        }
      />

      {isTabletViewport && mobilePanel === 'editor' && (
        <div className="bg-white border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 w-max">
                {orderedItems.map((item) => {
                  const isActive = activeSection === item.id;
                  const isDisabled = item.hasSwitch && !isSectionEnabled(item.id);
                  return (
                    <button
                      key={`mobile-tab-${item.id}`}
                      type="button"
                      onClick={() => handleMobileTabSelect(item.id)}
                      className={cn(
                        'h-8 rounded-lg border px-3 text-[12px] font-medium whitespace-nowrap transition-colors',
                        isDisabled
                          ? 'border-border text-on-surface-disabled bg-[color:var(--surface-20)]'
                          : isActive
                            ? 'border-[color:var(--key)] text-[color:var(--key)] bg-white'
                            : 'border-border text-on-surface-20 bg-white hover:bg-slate-50',
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={cn("flex flex-1 overflow-hidden relative", isTabletViewport ? "flex-col" : "flex-row")}>

        {/* 1. 좌측 사이드바 내비게이션 */}
        <aside
          ref={sidebarRef}
          className={cn(
            "w-[100px] flex-shrink-0 bg-white border-r border-border flex flex-col items-center py-6 z-20 overflow-y-auto no-scrollbar",
            isTabletViewport && "hidden",
          )}
        >
          {SIDEBAR_NAV_SECTIONS.map(({ navGroup, title }, sectionIdx) => {
            const itemsForNav =
              navGroup === 1
                ? (["hosts", "eventInfo"] as const).map((id) => itemById[id])
                : navGroup === 2
                  ? (["theme", "main", "bgm"] as const).map((id) => itemById[id])
                  : navGroup === 3
                    ? (["greeting", "contact", "eventDate", "location"] as const).map((id) => itemById[id])
                    : navGroup === 4
                      ? orderedContentOptionalItems
                      : otherOptionItems;
            return (
              <div key={navGroup} className="w-full flex flex-col items-center mb-1">
                <div className="w-full text-center mb-1.5 px-0.5">
                  <span className="text-[12px] font-bold text-on-surface-30 leading-tight block">{title}</span>
                </div>
                <div className="flex flex-col gap-y-2 w-full items-center">
                  {itemsForNav.map((item) => {
                    const isActive = activeSection === item.id;
                    const isDisabled = item.hasSwitch && !isSectionEnabled(item.id);
                    if (navGroup === 4) {
                      const { handleProps, wrapperProps, isDragging } = sidebarSortable.getItemProps(item.id);
                      return (
                        <div
                          key={item.id}
                          {...wrapperProps}
                          data-sidebar-item-id={item.id}
                          className={`${wrapperProps.className} relative flex flex-col items-center justify-center gap-y-1 w-[80px] min-h-[64px] py-1 rounded-lg shadow-none cursor-grab active:cursor-grabbing ${
                            isDisabled
                              ? "opacity-50 text-on-surface-30 hover:bg-slate-100"
                              : `${isActive ? "bg-slate-100" : "text-on-surface-20 hover:bg-slate-100"}`
                          }`}
                          {...handleProps}
                          onClick={() => {
                            if (!isDragging) scrollToSection(item.id);
                          }}
                        >
                          <span className="absolute top-1 right-1 pointer-events-none text-[color:var(--on-surface-disabled)]">
                            <ArrowUpDown className="w-3 h-3" strokeWidth={1.75} />
                          </span>
                          <item.icon
                            className={`w-6 h-6 shrink-0 ${isDisabled ? "text-on-surface-30" : isActive ? "text-[color:var(--key)]" : "text-on-surface-30"}`}
                            strokeWidth={1.5}
                          />
                          <span
                            className={`text-[12px] font-normal text-center leading-tight px-0.5 ${isDisabled ? "text-on-surface-30" : isActive ? "text-[color:var(--key)]" : "text-on-surface-20"}`}
                          >
                            {item.label}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        data-sidebar-item-id={item.id}
                        className={`flex flex-col items-center justify-center gap-y-1 w-[80px] min-h-[64px] py-1 rounded-lg cursor-pointer transition-colors shadow-none ${
                          isDisabled
                            ? "opacity-50 text-on-surface-30 hover:bg-slate-100"
                            : isActive
                              ? "bg-slate-100"
                              : "text-on-surface-20 hover:bg-slate-100"
                        }`}
                      >
                        <item.icon
                          className={`w-6 h-6 shrink-0 ${isDisabled ? "text-on-surface-30" : isActive ? "text-[color:var(--key)]" : "text-on-surface-30"}`}
                          strokeWidth={1.5}
                        />
                        <span
                          className={`text-[12px] font-normal text-center leading-tight px-0.5 ${isDisabled ? "text-on-surface-30" : isActive ? "text-[color:var(--key)]" : "text-on-surface-20"}`}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {sectionIdx < SIDEBAR_NAV_SECTIONS.length - 1 ? <div className="w-full border-t border-border my-2" /> : null}
              </div>
            );
          })}
        </aside>

        {/* 2. 중앙 에디터 패널 */}
        {(!isTabletViewport || mobilePanel === 'editor') && (
        <section
          id="editor-scroll-area"
          className={cn(
            "self-stretch min-h-0 bg-white flex flex-col relative z-10 overflow-hidden",
            isTabletViewport ? "flex-1 border-r-0" : "flex-shrink-0 border-r border-border",
          )}
          style={isTabletViewport ? undefined : { width: editorWidth }}
          onPointerUpCapture={focusSelectableTarget}
          onClickCapture={focusSelectableTarget}
        >
          <div ref={editorScrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth no-scrollbar">
            <div className="px-4 pt-4 pb-2 bg-[color:var(--surface-20)]">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {invitationTabs.map((tab) => {
                  const isActive = tab.id === activeInvitationTabId;
                  const isDefaultTab = invitationTabs[0]?.id === tab.id;
                  return (
                    <div key={tab.id} className="group flex items-center">
                      {editingInvitationTabId === tab.id ? (
                        <input
                          autoFocus
                          value={editingInvitationTabName}
                          onChange={(e) => setEditingInvitationTabName(e.target.value)}
                          onBlur={commitInvitationTabName}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitInvitationTabName();
                            }
                            if (e.key === "Escape") {
                              setEditingInvitationTabId(null);
                              setEditingInvitationTabName("");
                            }
                          }}
                          className="h-8 w-[120px] rounded-lg border border-[color:var(--key)] bg-white px-2 text-xs font-semibold text-[color:var(--key)] outline-none"
                        />
                      ) : (
                        <div
                          className={`inline-flex h-8 shrink-0 items-center rounded-lg border bg-white transition-all ${
                            isActive ? "border-[color:var(--key)] text-[color:var(--key)]" : "border-border text-on-surface-20"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => switchInvitationTab(tab.id)}
                            className={`h-full px-3 text-xs font-semibold ${isActive ? "text-[color:var(--key)]" : "text-on-surface-20"}`}
                          >
                            {tab.label}
                          </button>
                          <div
                            className={`flex h-full items-center gap-1 overflow-hidden transition-all duration-200 ${
                              isActive ? 'max-w-28 pr-2 opacity-100' : 'max-w-0 pr-0 opacity-0'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => startEditInvitationTabName(tab.id, tab.label)}
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-on-surface-20 hover:bg-slate-50"
                              aria-label={`${tab.label} 탭 이름 수정`}
                              title="탭 이름 수정"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            {!isDefaultTab ? (
                              <button
                                type="button"
                                onClick={() => requestRemoveInvitationTab(tab.id, tab.label)}
                                disabled={invitationTabs.length <= 1}
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-on-surface-20 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`${tab.label} 탭 제거`}
                                title={invitationTabs.length <= 1 ? "탭은 최소 1개 유지됩니다" : "탭 제거"}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addInvitationTab}
                  className="inline-flex h-8 shrink-0 items-center rounded-lg border border-dashed border-border bg-white px-3 text-xs font-semibold text-on-surface-20 hover:bg-slate-50"
                >
                  + 탭 추가
                </button>
              </div>
            </div>
            <div
              className="p-4 flex-1 flex flex-col gap-3 [&>div]:p-0"
              style={{ backgroundColor: 'var(--surface-20)' }}
            >
              {orderedItems.map((item, idx) => {
                const isInitiallyExpanded = true;
                const isContentOptional = item.category === '선택' && !OTHER_OPTION_IDS.includes(item.id as any);
                const prevItem = orderedItems[idx - 1];
                const editorSortProps = isContentOptional ? sidebarSortable.getItemProps(item.id) : null;
                const isDragging = editorSortProps?.isDragging ?? false;
                return (
                  <React.Fragment key={item.id}>
                {(!prevItem || prevItem.navGroup !== item.navGroup) && (
                  <>
                    {idx > 0 && (
                      <div className="border-t border-dashed border-[color:var(--border-20)] my-2 mt-10" />
                    )}
                    <div className="text-[13px] font-bold text-on-surface-30 pt-2">
                      {SIDEBAR_NAV_SECTIONS.find((s) => s.navGroup === item.navGroup)?.title ?? ""}
                    </div>
                  </>
                )}
                <div
                  id={item.id}
                  data-sortable-id={isContentOptional ? item.id : undefined}
                  ref={isContentOptional ? editorSortProps?.wrapperProps.ref : undefined}
                  style={isContentOptional ? editorSortProps?.wrapperProps.style : undefined}
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
                        {item.label}
                      </h2>
                      {item.hasSwitch && (
                        <Switch
                          className="ml-2 flex-shrink-0"
                          checked={isSectionEnabled(item.id)}
                          onCheckedChange={(checked) => {
                            setSectionEnabled((prev) => ({ ...prev, [item.id]: checked }));
                            if (checked) {
                              setActiveSection(item.id);
                              requestAnimationFrame(() => scrollPreviewToSection(item.id));
                            }
                          }}
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

                  {isInitiallyExpanded && (!item.hasSwitch || isSectionEnabled(item.id)) && (
                    <div className="p-6 bg-white flex flex-col gap-4 border-t border-border">
                      {/* 테마 섹션 */}
                      {item.id === 'theme' && (
                        <>
                          {/* 대표 컬러 */}
                          <FormItem label="테마컬러">
                            <div className="flex flex-wrap gap-2">
                              {KEY_COLOR_PRESETS.map((preset) => {
                                const isActive = ((data.theme as any)?.colorPreset ?? KEY_COLOR_PRESETS[0].id) === preset.id;
                                return (
                                  <ThemeColorChip
                                    key={preset.id}
                                    label={preset.label}
                                    color={preset.key}
                                    active={isActive}
                                    onClick={() => updateData('theme.colorPreset', preset.id)}
                                  />
                                );
                              })}
                            </div>
                          </FormItem>

                          <div className="w-full h-px bg-border/60 my-1" />

                          {/* 글꼴 선택 */}
                          <FormItem label="글꼴">
                            <div className="flex flex-wrap gap-2">
                              {[
                                { value: 'Pretendard', label: '모던고딕' },
                                { value: 'Noto Sans KR', label: '정갈한 고딕' },
                                { value: 'Noto Serif KR', label: '클래식 명조' },
                                { value: 'Gowun Dodum', label: '캐주얼 손글씨' },
                                { value: 'Gowun Batang', label: '감성 캘리체' },
                              ].map((fontOpt) => {
                                const isActive = data.theme.fontFamily === fontOpt.value;
                                return (
                                  <OptionChip
                                    key={fontOpt.value}
                                    label={fontOpt.label}
                                    active={isActive}
                                    onClick={() => updateData('theme.fontFamily', fontOpt.value)}
                                  />
                                );
                              })}
                            </div>
                          </FormItem>

                          <div className="w-full h-px bg-border/60 my-2" />

                          {/* 파티클 효과 */}
                          <FormItem label="파티클 효과">
                            <div className="flex flex-wrap gap-2">
                              {[
                                { value: 'none', label: '사용 안 함' },
                                { value: 'cherryBlossom', label: '꽃잎 날림' },
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
                          <FormItem label="다국어">
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                              onClick={() => updateData('theme.scrollEffect', !data.theme.scrollEffect)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  updateData('theme.scrollEffect', !data.theme.scrollEffect);
                                }
                              }}
                            >
                              <CircleCheckbox
                                checked={!!data.theme.scrollEffect}
                                onChange={(e) => updateData('theme.scrollEffect', e.target.checked)}
                              />
                              자연스러운 스크롤 노출 효과
                            </span>
                          </FormItem>
                        </>
                      )}

                      {/* 메인 섹션 */}
                      {item.id === 'main' && (
                        <>
                          <FormItem label="인트로 디자인">
                            <div className="flex flex-wrap gap-2">
                              {([
                                { value: 'A' as const, label: 'A' },
                                { value: 'B' as const, label: 'B' },
                                { value: 'E' as const, label: 'C' },
                                { value: 'F' as const, label: 'D' },
                                { value: 'G' as const, label: 'E' },
                                { value: 'H' as const, label: 'F' },
                                { value: 'I' as const, label: 'G' },
                              ] as const).map((opt) => (
                                <OptionChip
                                  key={opt.value}
                                  label={`타입 ${opt.label}`}
                                  active={(data.main as any).introType === opt.value}
                                  onClick={() => updateData('main.introType', opt.value)}
                                />
                              ))}
                            </div>
                          </FormItem>

                          <div className="border-t border-dashed border-[color:var(--border-20)] my-2" />

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
                              <OptionChip
                                label="기본 이미지"
                                active={normalizeMainImageMode((data.main as any).imageMode) === 'default'}
                                onClick={() => {
                                  updateData('main.imageMode', 'default');
                                }}
                              />
                            </div>
                          </FormItem>

                          <FormItem label="사진">
                            <div className="flex flex-col gap-2 w-full">
                              {normalizeMainImageMode((data.main as any).imageMode) === 'default' ? (
                                <div className="w-full min-h-[120px] flex items-start gap-3">
                                  <div className="w-[120px] h-[120px] rounded-lg border border-border bg-[color:var(--surface-20)] overflow-hidden flex items-center justify-center shrink-0">
                                    {String((data.main as any).presetImage ?? '').trim() ? (
                                      <img
                                        src={String((data.main as any).presetImage ?? '').trim()}
                                        alt="메인 기본 이미지 미리보기"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-[12px] text-on-surface-40 text-center px-2">기본 이미지 없음</span>
                                    )}
                                  </div>
                                  <div className="h-full flex flex-col justify-start gap-2 min-w-0">
                                    <button
                                      type="button"
                                      className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-20 hover:bg-slate-50 whitespace-nowrap leading-none flex-shrink-0 w-fit self-start"
                                      onClick={() => setMainPresetPickerOpen(true)}
                                    >
                                      이미지 고르기
                                    </button>
                                  </div>
                                </div>
                              ) : normalizeMainImageMode((data.main as any).imageMode) === 'single' ? (
                                <div className="w-full">
                                  {!!data.main.image ? (
                                    <div className="relative w-[120px] aspect-[3/4] group">
                                      <button
                                        type="button"
                                        className="w-full h-full rounded-lg border border-transparent bg-white flex items-center justify-center text-3xl text-on-surface-30 bg-center bg-cover bg-clip-border bg-origin-border"
                                        style={{ backgroundImage: `url(${data.main.image})` }}
                                        onClick={() => mainImageInputRef.current?.click()}
                                        aria-label="이미지 추가"
                                      />
                                      <div
                                        className={cn(
                                          "absolute right-2 top-2 flex flex-col gap-2 transition-opacity",
                                          isTabletViewport ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                        )}
                                      >
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
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="w-[100px] min-w-[80px] aspect-[3/4] rounded-lg border bg-white flex items-center justify-center text-3xl text-on-surface-30 bg-center bg-cover bg-clip-border bg-origin-border border-dashed border-border hover:bg-slate-50"
                                      onClick={() => mainImageInputRef.current?.click()}
                                      aria-label="이미지 추가"
                                    >
                                      +
                                    </button>
                                  )}
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
                                    touchMode={isTabletViewport}
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

                          <FormItem label="프레임">
                            <div className="flex flex-wrap gap-3">
                              {MAIN_IMAGE_FRAME_OPTIONS.map((opt) => {
                                const active =
                                  normalizeMainImageFrame((data.main as any).imageFrame) === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => updateData('main.imageFrame', opt.id)}
                                    className={cn(
                                      'flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition-[color,background-color,outline-color,outline-offset]',
                                      active
                                        ? 'bg-slate-50 outline outline-1 outline-offset-2 outline-[color:var(--on-surface-10)]'
                                        : 'outline-none ring-1 ring-transparent hover:bg-slate-50',
                                    )}
                                    title={opt.label}
                                  >
                                    <MainFrameSwatch variant={opt.id} />
                                    <span className="text-[11px] font-medium text-on-surface-20">
                                      {opt.label}
                                    </span>
                                  </button>
                                );
                              })}
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

                          <FormItem label="옵션">
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                              onClick={() => updateData('main.blackAndWhite', !((data.main as any).blackAndWhite ?? false))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  updateData('main.blackAndWhite', !((data.main as any).blackAndWhite ?? false));
                                }
                              }}
                            >
                              <CircleCheckbox
                                checked={!!((data.main as any).blackAndWhite ?? false)}
                                onChange={(e) => updateData('main.blackAndWhite', e.target.checked)}
                              />
                              흑백전환
                            </span>
                          </FormItem>

                          {/* 메인 제목/본문 색상 — 우선 비노출 (구분선 포함)
                          <div className="border-t border-dashed border-[color:var(--border-20)] my-2" />

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
                          */}
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
                                    onClick={handleBgmPlay}
                                    aria-label="재생"
                                  >
                                    <Play className="w-4 h-4 text-[color:var(--on-surface-10)] fill-current" fill="currentColor" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full border border-border bg-transparent text-on-surface-30 hover:bg-white/60 hover:text-on-surface-10 transition-colors"
                                    onClick={handleBgmStop}
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
                          <FormItem label="다국어">
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

                      {/* 신랑신부 섹션 (이름·관계 입력) */}
                      {item.id === 'hosts' && (
                        <div className="flex flex-col gap-5">
                          <HostContactField
                            label="신랑"
                            nameValue={data.hosts.groom.name}
                            onNameChange={(value) => updateData('hosts.groom.name', value)}
                            relationValue={data.hosts.groom.relation}
                            onRelationChange={(value) => updateData('hosts.groom.relation', value)}
                            relationOptions={GROOM_RELATION_OPTIONS}
                            showPhone={false}
                          />
                          <HostContactField
                            label="부"
                            nameValue={data.hosts.groom.father.name}
                            onNameChange={(value) => updateData('hosts.groom.father.name', value)}
                            showPhone={false}
                            deceasedChecked={data.hosts.groom.father.isDeceased}
                            onDeceasedChange={(checked) => updateData('hosts.groom.father.isDeceased', checked)}
                            keepDeceasedInline
                          />
                          <HostContactField
                            label="모"
                            nameValue={data.hosts.groom.mother.name}
                            onNameChange={(value) => updateData('hosts.groom.mother.name', value)}
                            showPhone={false}
                            deceasedChecked={data.hosts.groom.mother.isDeceased}
                            onDeceasedChange={(checked) => updateData('hosts.groom.mother.isDeceased', checked)}
                            keepDeceasedInline
                          />
                          <div className="border-t border-dashed border-[color:var(--border-20)] my-2" />
                          <HostContactField
                            label="신부"
                            nameValue={data.hosts.bride.name}
                            onNameChange={(value) => updateData('hosts.bride.name', value)}
                            relationValue={data.hosts.bride.relation}
                            onRelationChange={(value) => updateData('hosts.bride.relation', value)}
                            relationOptions={BRIDE_RELATION_OPTIONS}
                            showPhone={false}
                          />
                          <HostContactField
                            label="부"
                            nameValue={data.hosts.bride.father.name}
                            onNameChange={(value) => updateData('hosts.bride.father.name', value)}
                            showPhone={false}
                            deceasedChecked={data.hosts.bride.father.isDeceased}
                            onDeceasedChange={(checked) => updateData('hosts.bride.father.isDeceased', checked)}
                            keepDeceasedInline
                          />
                          <HostContactField
                            label="모"
                            nameValue={data.hosts.bride.mother.name}
                            onNameChange={(value) => updateData('hosts.bride.mother.name', value)}
                            showPhone={false}
                            deceasedChecked={data.hosts.bride.mother.isDeceased}
                            onDeceasedChange={(checked) => updateData('hosts.bride.mother.isDeceased', checked)}
                            keepDeceasedInline
                          />
                        </div>
                      )}

                      {/* 연락처 섹션 */}
                      {item.id === 'contact' && (
                        <>
                          <FormItem label="옵션">
                            <div className="flex min-w-0 flex-1 flex-col gap-3">
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
                                이미지
                              </span>
                            </div>
                          </FormItem>
                          {((data.share as any)?.useThumbnail ?? true) && (
                            <FormItem label="썸네일">
                              <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
                                  <div className="flex w-full min-w-0 justify-start sm:flex-1 sm:justify-start">
                                    <div className="aspect-[10/4] w-full max-w-[200px] rounded-lg border border-border bg-[color:var(--surface-20)] overflow-hidden">
                                      {data.share?.thumbnail ? (
                                        <img
                                          src={data.share.thumbnail}
                                          alt="공유 썸네일 미리보기"
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center px-2 text-center text-[clamp(10px,1.6vw,12px)] text-on-surface-30">
                                          썸네일 이미지가 없습니다.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex min-w-0 w-full flex-row flex-wrap gap-2 sm:flex-1 sm:max-w-[min(100%,200px)] sm:flex-col sm:flex-nowrap">
                                    <label className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50 w-fit max-w-full whitespace-nowrap leading-none flex-shrink-0">
                                      사진 업로드
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
                                    <button
                                      type="button"
                                      className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-20 hover:bg-slate-50 whitespace-nowrap leading-none flex-shrink-0 w-fit max-w-full"
                                      onClick={() => setShareThumbnailPickerOpen(true)}
                                    >
                                      이미지 고르기
                                    </button>
                                    {data.share?.thumbnail && (
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50 w-fit max-w-full whitespace-nowrap leading-none flex-shrink-0"
                                          onClick={() => openImageEditor({ kind: 'shareThumbnail' }, data.share.thumbnail)}
                                        >
                                          수정
                                        </button>
                                        <button
                                          type="button"
                                          className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50 w-fit max-w-full whitespace-nowrap leading-none flex-shrink-0"
                                          onClick={() => updateData('share.thumbnail', '')}
                                        >
                                          삭제
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </FormItem>
                          )}
                          <FormItem label="옵션">
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                              onClick={() => {
                                const nextChecked = !isSectionEnabled('contactParents');
                                setSectionEnabled((prev) => ({ ...prev, contactParents: nextChecked }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  const nextChecked = !isSectionEnabled('contactParents');
                                  setSectionEnabled((prev) => ({ ...prev, contactParents: nextChecked }));
                                }
                              }}
                            >
                              <CircleCheckbox
                                checked={isSectionEnabled('contactParents')}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSectionEnabled((prev) => ({ ...prev, contactParents: checked }));
                                }}
                              />
                              부모님 연락처
                            </span>
                          </FormItem>
                          {isSectionEnabled('contact') && (
                            <div className="flex flex-col gap-4">
                              <ContactPhoneField
                                label="신랑"
                                name={data.hosts.groom.name || '신랑'}
                                phoneValue={data.hosts.groom.phone}
                                onPhoneChange={(value) => updateData('hosts.groom.phone', value)}
                              />
                              {isSectionEnabled('contactParents') &&
                                !data.hosts.groom.father.isDeceased &&
                                (data.hosts.groom.father.name ?? '').trim().length > 0 && (
                                <ContactPhoneField
                                  label="신랑 부"
                                  name={data.hosts.groom.father.name}
                                  phoneValue={data.hosts.groom.father.phone}
                                  onPhoneChange={(value) => updateData('hosts.groom.father.phone', value)}
                                />
                              )}
                              {isSectionEnabled('contactParents') &&
                                !data.hosts.groom.mother.isDeceased &&
                                (data.hosts.groom.mother.name ?? '').trim().length > 0 && (
                                <ContactPhoneField
                                  label="신랑 모"
                                  name={data.hosts.groom.mother.name}
                                  phoneValue={data.hosts.groom.mother.phone}
                                  onPhoneChange={(value) => updateData('hosts.groom.mother.phone', value)}
                                />
                              )}
                              {isSectionEnabled('contactParents') && (
                                <div className="border-t border-dashed border-[color:var(--border-20)] my-1" />
                              )}
                              <ContactPhoneField
                                label="신부"
                                name={data.hosts.bride.name || '신부'}
                                phoneValue={data.hosts.bride.phone}
                                onPhoneChange={(value) => updateData('hosts.bride.phone', value)}
                              />
                              {isSectionEnabled('contactParents') &&
                                !data.hosts.bride.father.isDeceased &&
                                (data.hosts.bride.father.name ?? '').trim().length > 0 && (
                                <ContactPhoneField
                                  label="신부 부"
                                  name={data.hosts.bride.father.name}
                                  phoneValue={data.hosts.bride.father.phone}
                                  onPhoneChange={(value) => updateData('hosts.bride.father.phone', value)}
                                />
                              )}
                              {isSectionEnabled('contactParents') &&
                                !data.hosts.bride.mother.isDeceased &&
                                (data.hosts.bride.mother.name ?? '').trim().length > 0 && (
                                <ContactPhoneField
                                  label="신부 모"
                                  name={data.hosts.bride.mother.name}
                                  phoneValue={data.hosts.bride.mother.phone}
                                  onPhoneChange={(value) => updateData('hosts.bride.mother.phone', value)}
                                />
                              )}
                            </div>
                          )}
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
                              const timeRaw = (data.eventInfo.time ?? "").trim();
                              const m = timeRaw.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
                              const period = m?.[1] === "오전" ? "오전" : m?.[1] === "오후" ? "오후" : null;
                              const hourNum = m ? Number(m[2]) : NaN;
                              const minuteStr = m?.[3];
                              const hourOk =
                                period !== null &&
                                Number.isFinite(hourNum) &&
                                hourNum >= 1 &&
                                hourNum <= 12;
                              const hourValue = hourOk ? `${period} ${hourNum}` : "";
                              const minuteValue =
                                hourOk && minuteStr && ["00", "10", "20", "30", "40", "50"].includes(minuteStr)
                                  ? minuteStr
                                  : hourOk
                                    ? "00"
                                    : "";

                              const setHourValue = (nextHourValue: string) => {
                                if (!nextHourValue) {
                                  updateData("eventInfo.time", "");
                                  return;
                                }
                                const [p, h] = nextHourValue.split(" ");
                                const hh = Number(h);
                                if (!Number.isFinite(hh)) return;
                                const mm = minuteValue || "00";
                                updateData("eventInfo.time", `${p} ${hh}:${mm}`);
                              };
                              const setMinuteValue = (nextMinute: string) => {
                                if (!hourValue) return;
                                const [p, h] = hourValue.split(" ");
                                const hh = Number(h);
                                if (!Number.isFinite(hh)) return;
                                if (!nextMinute) {
                                  updateData("eventInfo.time", `${p} ${hh}:00`);
                                  return;
                                }
                                const mm = String(nextMinute).padStart(2, "0");
                                updateData("eventInfo.time", `${p} ${hh}:${mm}`);
                              };

                              return (
                                <div className="grid grid-cols-2 gap-2 w-full">
                                  <div className="relative w-full">
                                    <select
                                      value={hourValue}
                                      onChange={(e) => setHourValue(e.target.value)}
                                      className="h-10 w-full min-w-0 rounded-lg border border-input bg-white px-3 py-1 text-[13px] text-on-surface-20 appearance-none transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
                                    >
                                      <option value="">시 선택</option>
                                      {(["오전", "오후"] as const).flatMap((p) =>
                                        Array.from({ length: 12 }, (_, i) => {
                                          const h = i + 1;
                                          const v = `${p} ${h}`;
                                          return (
                                            <option key={v} value={v}>
                                              {p} {h}시
                                            </option>
                                          );
                                        }),
                                      )}
                                    </select>
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                      <ChevronDown className="w-4 h-4 text-on-surface-30" />
                                    </span>
                                  </div>

                                  <div className="relative w-full">
                                    <select
                                      value={hourValue ? minuteValue : ""}
                                      onChange={(e) => setMinuteValue(e.target.value)}
                                      disabled={!hourValue}
                                      className="h-10 w-full min-w-0 rounded-lg border border-input bg-white px-3 py-1 text-[13px] text-on-surface-20 appearance-none transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
                                    >
                                      <option value="">분 선택</option>
                                      {["00", "10", "20", "30", "40", "50"].map((mm) => (
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
                            <div ref={venueInputWrapRef} className="relative w-full">
                              <Input
                                placeholder="예: 더 신라 서울"
                                value={data.eventInfo.venueName}
                                onFocus={() => {
                                  if (hasVenueQuery) setVenueSuggestOpen(true);
                                }}
                                onChange={(e) => {
                                  updateData('eventInfo.venueName', e.target.value);
                                  setVenueSuggestOpen(e.target.value.trim().length > 0);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') setVenueSuggestOpen(false);
                                  if (e.key === 'Enter' && venueSuggestions.length > 0 && venueInputValue.trim().length > 0) {
                                    e.preventDefault();
                                    void applyVenueSuggestion(venueSuggestions[0]);
                                  }
                                }}
                                className="shadow-none flex-1"
                              />
                            </div>
                            {venueSuggestOpen && hasVenueQuery && venueDropdownStyle && portalRoot && createPortal(
                              <div
                                ref={venueDropdownRef}
                                className="fixed z-[200] overflow-hidden rounded-lg border border-border bg-white shadow-sm"
                                style={{
                                  top: venueDropdownStyle.top,
                                  left: venueDropdownStyle.left,
                                  width: venueDropdownStyle.width,
                                }}
                              >
                                {venueSuggestions.length > 0 ? (
                                  <ul className="max-h-56 overflow-y-auto py-1">
                                    {venueSuggestions.map((venue) => (
                                      <li key={`${venue.name}-${venue.address}`}>
                                        <button
                                          type="button"
                                          className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-slate-50"
                                          onClick={() => void applyVenueSuggestion(venue)}
                                        >
                                          <span className="text-[13px] text-on-surface-10">{venue.name}</span>
                                          <span className="text-[11px] text-on-surface-30">{venue.area}</span>
                                          <span className="text-[11px] text-on-surface-30/80">{venue.address}</span>
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="px-3 py-2 text-[12px] text-on-surface-30">
                                    일치하는 예식장이 없습니다.
                                  </p>
                                )}
                              </div>,
                              portalRoot
                            )}
                          </FormItem>
                          <FormItem label="웨딩홀 상세">
                            <Input
                              placeholder="층수, 홀 정보 입력"
                              value={String((data.eventInfo as any)?.venueDetail ?? "")}
                              onChange={(e) => updateData("eventInfo.venueDetail", e.target.value)}
                              className="shadow-none flex-1"
                            />
                          </FormItem>
                        </div>
                      )}

                      {item.id === 'eventDate' && (
                        <div className="flex flex-col gap-5">
                          <FormItem label="달력 화면">
                            <div className="flex flex-wrap gap-2 w-full">
                              {(
                                [
                                  { id: 'A' as const, label: '타입 A' },
                                  { id: 'B' as const, label: '타입 B' },
                                  { id: 'C' as const, label: '타입 C' },
                                ] as const
                              ).map(({ id, label }) => (
                                <OptionChip
                                  key={id}
                                  label={label}
                                  active={normalizeCalendarDisplayType((data.eventInfo as any)?.calendarDisplayType) === id}
                                  onClick={() => updateData('eventInfo.calendarDisplayType', id)}
                                />
                              ))}
                            </div>
                          </FormItem>
                          <FormItem label="옵션">
                            <div className="flex flex-col gap-3 w-full">
                              <span
                                role="button"
                                tabIndex={0}
                                className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                onClick={() =>
                                  updateData(
                                    'eventInfo.showDday',
                                    !((data.eventInfo as any)?.showDday !== false),
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    updateData(
                                      'eventInfo.showDday',
                                      !((data.eventInfo as any)?.showDday !== false),
                                    );
                                  }
                                }}
                              >
                                <CircleCheckbox
                                  checked={(data.eventInfo as any)?.showDday !== false}
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
                            <FormItem label="옵션">
                              <span
                                role="button"
                                tabIndex={0}
                                className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                onClick={() =>
                                  updateData('greeting.useImage', !(((data.greeting as any)?.useImage) ?? true))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    updateData('greeting.useImage', !(((data.greeting as any)?.useImage) ?? true));
                                  }
                                }}
                              >
                                <CircleCheckbox
                                  checked={!!(((data.greeting as any)?.useImage) ?? true)}
                                  onChange={(e) => updateData('greeting.useImage', e.target.checked)}
                                />
                                이미지 추가
                              </span>
                            </FormItem>
                            {!!((data.greeting as any)?.useImage ?? true) && (
                              <FormItem label="썸네일">
                                <div className="flex-1 flex flex-col gap-2">
                                  <div className="w-full min-h-[120px] flex items-start gap-3">
                                    <div className="w-[120px] h-[120px] rounded-lg border border-border bg-[color:var(--surface-20)] overflow-hidden flex items-center justify-center">
                                      <img
                                        src={((data.greeting as any)?.thumbnail || greetingDefaultThumbnail)}
                                        alt="인사말 썸네일 미리보기"
                                        className="w-full h-full object-fill"
                                      />
                                    </div>
                                    <div className="h-full flex flex-col justify-start gap-2">
                                      <button
                                        type="button"
                                        className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-20 hover:bg-slate-50 whitespace-nowrap leading-none flex-shrink-0 w-fit self-start"
                                        onClick={() => setGreetingThumbnailPickerOpen(true)}
                                      >
                                        이미지 고르기
                                      </button>
                                      {!!(data.greeting as any)?.thumbnail && (
                                        <button
                                          type="button"
                                          className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50 w-fit self-start whitespace-nowrap leading-none flex-shrink-0"
                                          onClick={() => updateData('greeting.thumbnail', '')}
                                        >
                                          삭제
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </FormItem>
                            )}
                            {greetingEntries.map((entry, idx) => (
                              <React.Fragment key={`greeting-entry-editor-${idx}`}>
                                {idx > 0 && <div className="border-t border-dashed border-[color:var(--border-20)] my-2" />}
                                <div className="flex flex-col gap-5 mb-0">
                                  <FormItem label="제목">
                                    {idx > 0 ? (
                                      <div className="flex items-center gap-2 flex-1">
                                        <Input
                                          type="text"
                                          value={entry.title ?? ''}
                                          onChange={(e) => {
                                            const next = greetingEntries.map((it, sectionIdx) =>
                                              sectionIdx === idx ? { ...it, title: e.target.value } : it,
                                            );
                                            setGreetingEntries(next);
                                          }}
                                          className="shadow-none flex-1"
                                          placeholder="제목"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const next = greetingEntries.filter((_, sectionIdx) => sectionIdx !== idx);
                                            setGreetingEntries(next);
                                          }}
                                          aria-label="인사말 삭제"
                                          className="flex-shrink-0 text-[12px] text-on-surface-30 hover:text-on-surface-10 transition-colors"
                                        >
                                          삭제
                                        </button>
                                      </div>
                                    ) : (
                                      <Input
                                        type="text"
                                        value={entry.title ?? ''}
                                        onChange={(e) => {
                                          const next = greetingEntries.map((it, sectionIdx) =>
                                            sectionIdx === idx ? { ...it, title: e.target.value } : it,
                                          );
                                          setGreetingEntries(next);
                                        }}
                                        className="shadow-none flex-1"
                                        placeholder="제목"
                                      />
                                    )}
                                  </FormItem>
                                  <FormItem label="본문">
                                    <Textarea
                                      rows={4}
                                      value={entry.content ?? ''}
                                      onChange={(e) => {
                                        const next = greetingEntries.map((it, sectionIdx) =>
                                          sectionIdx === idx ? { ...it, content: e.target.value } : it,
                                        );
                                        setGreetingEntries(next);
                                      }}
                                      className="resize-none shadow-none flex-1"
                                      placeholder="본문"
                                    />
                                  </FormItem>
                                  <div className="flex justify-end">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
                                      onClick={() => {
                                        setGreetingEditorIndex(idx);
                                        setGreetingSampleTab('general');
                                        setGreetingSelectedSample(null);
                                        setGreetingSampleOpen(true);
                                      }}
                                    >
                                      샘플보기
                                    </Button>
                                  </div>
                                </div>
                              </React.Fragment>
                            ))}

                          </div>

                          {greetingSampleOpen && createPortal(
                            <div
                              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-2 sm:p-4"
                              onClick={() => setGreetingSampleOpen(false)}
                            >
                              <div
                                className="w-full max-w-md rounded-2xl bg-white border border-[color:var(--border-10)] p-4 sm:p-6 flex flex-col gap-5 max-h-[60dvh] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="text-[15px] font-semibold text-on-surface-10">샘플 문구</h3>
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
                                        <div className="text-[14px] leading-relaxed text-on-surface-10 text-center whitespace-pre-wrap">
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
                                      const next = [...greetingEntries];
                                      const targetIndex = Math.max(0, Math.min(greetingEditorIndex, next.length - 1));
                                      if (!next[targetIndex]) next[targetIndex] = { title: '', content: '' };
                                      next[targetIndex] = {
                                        title: String(greetingSelectedSample.title),
                                        content: String(greetingSelectedSample.content).replace(/\r\n?/g, '\n'),
                                      };
                                      setGreetingEntries(next);
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
                              <div className="flex flex-wrap gap-2 w-full">
                                {LOCATION_TITLE_OPTIONS.map((opt) => {
                                  const current = String((data.location as any)?.title ?? "").trim();
                                  const active =
                                    current === opt ||
                                    (!current && opt === LOCATION_TITLE_OPTIONS[0]);
                                  return (
                                    <OptionChip
                                      key={opt}
                                      label={opt}
                                      active={active}
                                      onClick={() => updateData("location.title", opt)}
                                    />
                                  );
                                })}
                              </div>
                            </FormItem>
                            <FormItem label="웨딩홀">
                              <Input
                                disabled
                                readOnly
                                value={eventVenueReadonlyDisplay(data.eventInfo)}
                                placeholder="예식정보에서 웨딩홀을 입력하세요"
                                className="shadow-none flex-1"
                              />
                            </FormItem>
                            <FormItem label="주소">
                              <div className="flex flex-1 gap-2">
                                <Input
                                  value={locationAddressKeyword}
                                  onChange={(e) => setLocationAddressKeyword(e.target.value)}
                                  className="shadow-none flex-1"
                                  placeholder="도로명/지번/건물명 입력"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-10 px-3 rounded-lg text-[13px] flex-shrink-0 border-[color:var(--border-30)] bg-white text-on-surface-20 hover:bg-slate-50 hover:text-on-surface-10"
                                  onClick={() => {
                                    setLocationSearchOpen(true);
                                  }}
                                >
                                  검색
                                </Button>
                              </div>
                            </FormItem>

                            <div className="border-t border-dashed border-[color:var(--border-20)] my-2" />

                            {transportItems.map((t, idx) => (
                              <div key={idx} className="flex flex-col gap-2">
                                <FormItem label={idx === 0 ? "교통수단" : ""}>
                                  <div className="flex items-center gap-2 flex-1">
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
                                  </div>
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
                              <div className="relative w-max max-w-full">
                                <select
                                  value={selectedTransportMode}
                                  onChange={(e) => {
                                    const nextMode = e.target.value;
                                    setSelectedTransportMode(nextMode);
                                    if (!nextMode) return;
                                    setTransportItems([
                                      ...transportItems,
                                      { mode: nextMode, detail: '' },
                                    ]);
                                    setSelectedTransportMode('');
                                  }}
                                  disabled={availableTransportModeOptions.length === 0}
                                  className="group/button inline-flex h-10 w-max max-w-full min-w-0 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-4 pr-9 text-center text-[13px] font-medium text-foreground whitespace-nowrap appearance-none select-none transition-all outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:border-input dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                                >
                                  <option value="">
                                    {availableTransportModeOptions.length > 0 ? "+ 교통수단 추가" : "추가 가능한 항목 없음"}
                                  </option>
                                  {availableTransportModeOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                  <ChevronDown className="w-4 h-4 text-on-surface-30" />
                                </span>
                              </div>
                            </div>
                          </div>

                          <AddressSearchDialog
                            open={locationSearchOpen}
                            onOpenChange={setLocationSearchOpen}
                            initialQuery={locationAddressKeyword.trim()}
                            onSelectAddress={(addr) => {
                              updateData("location.address", addr);
                              setLocationAddressKeyword(addr);
                            }}
                          />
                        </>
                      )}

                      {/* 계좌정보 섹션 - 새로운 시안 기반 */}
                      {item.id === 'account' && (
                        <>
                          {/* 1. 상단 공통 영역 */}
                          <div className="flex flex-col gap-5">
                            <FormItem label="제목">
                              <div className="flex flex-wrap gap-2 w-full">
                                {ACCOUNT_TITLE_OPTIONS.map((opt) => {
                                  const current = String(data.accounts?.title ?? "").trim();
                                  const active =
                                    current === opt ||
                                    (!current && opt === ACCOUNT_TITLE_OPTIONS[0]);
                                  return (
                                    <OptionChip
                                      key={opt}
                                      label={opt}
                                      active={active}
                                      onClick={() => updateData("accounts.title", opt)}
                                    />
                                  );
                                })}
                              </div>
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
                            <FormItem label="옵션">
                              <div className="flex flex-col gap-1 text-[13px] text-on-surface-20">
                                <div className="flex items-center gap-2">
                                  <CircleCheckbox
                                    checked={(((data.accounts as any)?.displayMode ?? 'accordion') === 'expanded')}
                                    onChange={(e) => {
                                      const showAccounts = e.target.checked;
                                      // 체크: 전체 노출, 해제: 접힘/펼침 모드(초기 접힘)
                                      updateData('accounts.displayMode', showAccounts ? 'expanded' : 'accordion');
                                      if (!showAccounts) {
                                        setAccountPreviewExpandedMap({});
                                      }
                                    }}
                                  />
                                  <span>계좌 보이기</span>
                                </div>
                              </div>
                            </FormItem>
                          </div>

                          {/* 2. 계좌 리스트 */}
                          {data.accounts.list.map((item, index) => (
                            <React.Fragment key={item.id}>
                              <div className="border-t border-dashed border-[color:var(--border-20)] my-2" />
                              <div className="flex flex-col gap-5 mb-0">
                                {/* 상단 행: 계좌명 + 삭제 */}
                                <FormItem label="계좌명">
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
                              </div>
                            </React.Fragment>
                          ))}

                          {/* 3. 하단 추가 버튼 (최대 6개까지만 추가) */}
                          {data.accounts.list.length < 6 && (
                            <div className="pt-4 flex justify-center">
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-lg px-4 h-10 text-[13px]"
                                onClick={() => {
                                  if (data.accounts.list.length >= 6) return;
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
                          )}

                          {/* 은행 선택 모달 (Portal로 body에 렌더링) */}
                          {bankModalIndex !== null && createPortal(
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-2 sm:p-4" onClick={() => setBankModalIndex(null)}>
                              <div className="w-full max-w-md rounded-2xl bg-white border border-[color:var(--border-10)] p-4 sm:p-6 flex flex-col gap-5 max-h-[60dvh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between">
                                  <h3 className="text-[15px] font-semibold text-on-surface-10">은행선택</h3>
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

                                <div className="pt-0 flex justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-fit h-10 px-5 rounded-lg text-[14px] font-semibold border-[color:var(--border-30)] bg-white text-on-surface-20 hover:bg-slate-50 hover:text-on-surface-10"
                                    onClick={() => setBankModalIndex(null)}
                                  >
                                    닫기
                                  </Button>
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
                                touchMode={isTabletViewport}
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

                          {(((data.gallery as any).layoutType ?? 'grid') === 'slide') && (
                            <>
                              <FormItem label="옵션">
                                <div className="flex-1 flex flex-col gap-4">
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                    onClick={() => updateData('gallery.autoSlide', !((data.gallery as any)?.autoSlide))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        updateData('gallery.autoSlide', !((data.gallery as any)?.autoSlide));
                                      }
                                    }}
                                  >
                                    <CircleCheckbox
                                      checked={!!(data.gallery as any)?.autoSlide}
                                      onChange={(e) => updateData('gallery.autoSlide', e.target.checked)}
                                    />
                                    이미지 자동 전환
                                  </span>
                                </div>
                              </FormItem>
                              {!!((data.gallery as any)?.autoSlide) && (
                                <FormItem label="전환시간">
                                  <div className="flex flex-wrap gap-2">
                                    {([2, 3, 4, 5] as const).map((sec) => (
                                      <OptionChip
                                        key={sec}
                                        label={`${sec}초`}
                                        active={Number((data.gallery as any).autoSlideIntervalSec ?? 3) === sec}
                                        onClick={() => updateData('gallery.autoSlideIntervalSec', sec)}
                                      />
                                    ))}
                                  </div>
                                </FormItem>
                              )}
                            </>
                          )}

                          {(((data.gallery as any).layoutType ?? 'grid') === 'grid') && (
                            <>
                              <FormItem label="배치 방법">
                                <div className="flex flex-wrap gap-2">
                                  {([2, 3] as const).map((col) => (
                                    <OptionChip
                                      key={col}
                                      label={`${col}단 그리드`}
                                      active={(Number((data.gallery as any).gridColumns ?? 3) === 2 ? 2 : 3) === col}
                                      onClick={() => updateData('gallery.gridColumns', col)}
                                    />
                                  ))}
                                </div>
                              </FormItem>
                              <FormItem label="사진 간격">
                                <div className="flex flex-wrap gap-2">
                                  {([
                                    { value: 'none', label: '없음' },
                                    { value: 'small', label: '좁게' },
                                    { value: 'middle', label: '보통' },
                                    { value: 'large', label: '넓게' },
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
                                <div className="flex-1 flex flex-col gap-3">
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                    onClick={() => updateData('gallery.useLoadMore', !(((data.gallery as any)?.useLoadMore ?? true)))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        updateData('gallery.useLoadMore', !(((data.gallery as any)?.useLoadMore ?? true)));
                                      }
                                    }}
                                  >
                                    <CircleCheckbox
                                      checked={((data.gallery as any)?.useLoadMore ?? true)}
                                      onChange={(e) => updateData('gallery.useLoadMore', e.target.checked)}
                                    />
                                    3줄 이상 더보기 사용
                                  </span>
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                    onClick={() => updateData('gallery.enableDetailView', !(((data.gallery as any)?.enableDetailView ?? true)))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        updateData('gallery.enableDetailView', !(((data.gallery as any)?.enableDetailView ?? true)));
                                      }
                                    }}
                                  >
                                    <CircleCheckbox
                                      checked={((data.gallery as any)?.enableDetailView ?? true)}
                                      onChange={(e) => updateData('gallery.enableDetailView', e.target.checked)}
                                    />
                                    상세보기 허용
                                  </span>
                                </div>
                              </FormItem>
                            </>
                          )}
                        </>
                      )}

                      {/* 안내사항 섹션 */}
                      {item.id === 'notice' && (
                        <>
                          <div className="flex flex-col gap-5">
                            <FormItem label="제목">
                              <div className="flex flex-wrap gap-2 w-full">
                                {NOTICE_HEADING_OPTIONS.map((opt) => {
                                  const current = String((data.notice as any)?.sectionHeading ?? "").trim();
                                  const active =
                                    current === opt ||
                                    (!current && opt === NOTICE_HEADING_OPTIONS[0]);
                                  return (
                                    <OptionChip
                                      key={opt}
                                      label={opt}
                                      active={active}
                                      onClick={() => updateData("notice.sectionHeading", opt)}
                                    />
                                  );
                                })}
                              </div>
                            </FormItem>
                          </div>
                          {noticeSections.map((section, idx) => (
                            <React.Fragment key={section.id}>
                              {idx > 0 && <div className="border-t border-dashed border-[color:var(--border-20)] my-2" />}
                              <div className="flex flex-col gap-5 mb-0">
                                <FormItem label="소제목">
                                  {idx > 0 ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <Input
                                        value={section.title ?? ""}
                                        onChange={(e) => {
                                          const nextSections = noticeSections.map((it, sectionIdx) =>
                                            sectionIdx === idx ? { ...it, title: e.target.value } : it,
                                          );
                                          updateNoticeSections(nextSections);
                                        }}
                                        placeholder="안내사항"
                                        className="shadow-none flex-1"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextSections = noticeSections.filter((_, sectionIdx) => sectionIdx !== idx);
                                          updateNoticeSections(nextSections);
                                        }}
                                        aria-label="안내사항 삭제"
                                        className="flex-shrink-0 text-[12px] text-on-surface-30 hover:text-on-surface-10 transition-colors"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  ) : (
                                    <Input
                                      value={section.title ?? ""}
                                      onChange={(e) => {
                                        const nextSections = noticeSections.map((it, sectionIdx) =>
                                          sectionIdx === idx ? { ...it, title: e.target.value } : it,
                                        );
                                        updateNoticeSections(nextSections);
                                      }}
                                      placeholder="안내사항"
                                      className="shadow-none flex-1"
                                    />
                                  )}
                                </FormItem>
                                <FormItem label="내용">
                                  <Textarea
                                    rows={4}
                                    value={section.content ?? ""}
                                    onChange={(e) => {
                                      const nextSections = noticeSections.map((it, sectionIdx) =>
                                        sectionIdx === idx ? { ...it, content: e.target.value } : it,
                                      );
                                      updateNoticeSections(nextSections);
                                    }}
                                    placeholder="하객 안내 문구를 입력해 주세요."
                                    className="resize-none shadow-none flex-1"
                                  />
                                </FormItem>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
                                    onClick={() => {
                                      setNoticeEditorTabIndex(idx);
                                      setNoticeSampleTab('general');
                                      setNoticeSelectedSample(null);
                                      setNoticeSampleOpen(true);
                                    }}
                                  >
                                    샘플보기
                                  </Button>
                                </div>
                              </div>
                            </React.Fragment>
                          ))}

                          {noticeSampleOpen && createPortal(
                            <div
                              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-2 sm:p-4"
                              onClick={() => setNoticeSampleOpen(false)}
                            >
                              <div
                                className="w-full max-w-md rounded-2xl bg-white border border-[color:var(--border-10)] p-4 sm:p-6 flex flex-col gap-5 max-h-[60dvh] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="text-[15px] font-semibold text-on-surface-10">샘플 문구</h3>
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
                                        <div className="text-[14px] leading-relaxed text-on-surface-10 text-center whitespace-pre-wrap">
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
                                      const targetIndex = Math.min(noticeEditorTabIndex, noticeSections.length - 1);
                                      const nextSections = noticeSections.map((section, idx) =>
                                        idx === targetIndex
                                          ? {
                                              ...section,
                                              title: String(noticeSelectedSample.title),
                                              content: String(noticeSelectedSample.content).replace(/\r\n?/g, '\n'),
                                            }
                                          : section,
                                      );
                                      updateNoticeSections(nextSections);
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
                          {noticeSections.length < 3 && (
                            <div className="pt-0 flex justify-center">
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-lg px-4 h-10 text-[13px]"
                                onClick={() => {
                                  if (noticeSections.length >= 3) return;
                                  const nextIndex = noticeSections.length;
                                  const nextSections = [
                                    ...noticeSections,
                                    {
                                      id: `notice-${Date.now()}`,
                                      title: `안내 ${nextIndex + 1}`,
                                      content: '',
                                    },
                                  ];
                                  updateNoticeSections(nextSections);
                                  setNoticeEditorTabIndex(nextIndex);
                                  setNoticePreviewTabIndex(nextIndex);
                                }}
                              >
                                + 추가하기
                              </Button>
                            </div>
                          )}
                        </>
                      )}

                      {/* 방명록 섹션 */}
                      {item.id === 'guestbook' && (
                        <>
                          <FormItem label="제목">
                            <div className="flex flex-wrap gap-2 w-full">
                              {GUESTBOOK_TITLE_OPTIONS.map((opt) => {
                                const current = String((data.guestbook as any)?.title ?? "").trim();
                                const active =
                                  current === opt ||
                                  (!current && opt === GUESTBOOK_TITLE_OPTIONS[0]);
                                return (
                                  <OptionChip
                                    key={opt}
                                    label={opt}
                                    active={active}
                                    onClick={() => updateData("guestbook.title", opt)}
                                  />
                                );
                              })}
                            </div>
                          </FormItem>
                          <FormItem label="비밀번호">
                            <div className="flex-1 flex flex-col gap-2">
                              <Input
                                type="password"
                                value={data.guestbook?.password ?? ""}
                                onChange={(e) => updateData('guestbook.password', e.target.value)}
                                placeholder="비밀번호를 입력하세요."
                                className="shadow-none flex-1"
                              />
                              <div className="text-[12px] text-on-surface-30">
                                관리자 비밀번호는 모든 글 관리용 마스터 비밀번호이며, 각 작성자는 글 비밀번호로 본인 글 수정/삭제를 할 수 있습니다.
                              </div>
                            </div>
                          </FormItem>
                          <FormItem label="노출 수">
                            <div className="flex flex-wrap gap-2">
                              {([3, 5, 7] as const).map((count) => (
                                <OptionChip
                                  key={count}
                                  label={`${count}개`}
                                  active={Number((data.guestbook as any)?.displayCount ?? 5) === count}
                                  onClick={() => updateData('guestbook.displayCount', count)}
                                />
                              ))}
                            </div>
                          </FormItem>
                          <FormItem label="옵션">
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                              onClick={() => updateData('guestbook.showCreatedAt', !(((data.guestbook as any)?.showCreatedAt ?? true)))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  updateData('guestbook.showCreatedAt', !(((data.guestbook as any)?.showCreatedAt ?? true)));
                                }
                              }}
                            >
                              <CircleCheckbox
                                checked={!!(((data.guestbook as any)?.showCreatedAt ?? true))}
                                onChange={(e) => updateData('guestbook.showCreatedAt', e.target.checked)}
                              />
                              작성일 공개
                            </span>
                          </FormItem>
                        </>
                      )}

                      {/* 유튜브 섹션 */}
                      {item.id === 'youtube' && (
                        <>
                          <FormItem label="제목">
                            <div className="flex flex-wrap gap-2 w-full">
                              {YOUTUBE_TITLE_OPTIONS.map((opt) => {
                                const current = String((data.youtube as any)?.title ?? "").trim();
                                const active =
                                  current === opt ||
                                  (!current && opt === YOUTUBE_TITLE_OPTIONS[0]);
                                return (
                                  <OptionChip
                                    key={opt}
                                    label={opt}
                                    active={active}
                                    onClick={() => updateData("youtube.title", opt)}
                                  />
                                );
                              })}
                            </div>
                          </FormItem>
                          <FormItem label="타입">
                            <div className="flex flex-wrap gap-2">
                              <OptionChip
                                label="파일첨부"
                                active={(((data.youtube as any)?.sourceType ?? 'url') === 'file')}
                                onClick={() => updateData('youtube.sourceType', 'file')}
                              />
                              <OptionChip
                                label="URL"
                                active={(((data.youtube as any)?.sourceType ?? 'url') === 'url')}
                                onClick={() => updateData('youtube.sourceType', 'url')}
                              />
                            </div>
                          </FormItem>
                          {(((data.youtube as any)?.sourceType ?? 'url') === 'file') ? (
                            <FormItem label="영상 파일">
                              <div className="flex-1 flex flex-col gap-2">
                                <div className="w-full min-w-0 flex flex-col gap-3 sm:h-[120px] sm:flex-row sm:items-center">
                                  <div className="w-full max-w-[240px] aspect-video rounded-lg border border-border bg-[color:var(--surface-20)] overflow-hidden sm:h-full sm:w-auto sm:max-w-none">
                                    {((data.youtube as any)?.fileUrl ?? '') ? (
                                      <video
                                        src={(data.youtube as any).fileUrl}
                                        className="w-full h-full object-cover"
                                        muted
                                        playsInline
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[12px] text-on-surface-30">
                                        영상 파일이 없습니다.
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex w-full flex-wrap items-center gap-2 sm:h-full sm:w-auto sm:flex-col sm:items-start sm:justify-start">
                                    <label className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50">
                                      파일 선택
                                      <input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          const url = URL.createObjectURL(file);
                                          updateData('youtube.fileUrl', url);
                                          e.currentTarget.value = '';
                                        }}
                                      />
                                    </label>
                                    {!!((data.youtube as any)?.fileUrl ?? '') && (
                                      <button
                                        type="button"
                                        className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-30 hover:text-on-surface-10 hover:bg-slate-50"
                                        onClick={() => updateData('youtube.fileUrl', '')}
                                      >
                                        삭제
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </FormItem>
                          ) : (
                            <FormItem label="링크">
                              <Input
                                value={data.youtube?.url ?? ""}
                                onChange={(e) => updateData('youtube.url', e.target.value)}
                                placeholder="https://youtu.be/... 또는 https://www.youtube.com/watch?v=..."
                                className="shadow-none flex-1"
                              />
                            </FormItem>
                          )}
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

                      {item.id === 'rsvp' && (
                        <>
                          <FormItem label="제목">
                            <div className="flex flex-wrap gap-2 w-full">
                              {RSVP_TITLE_OPTIONS.map((opt) => {
                                const current = String((data as any).rsvp?.title ?? "").trim();
                                const active =
                                  current === opt ||
                                  (!current && opt === RSVP_TITLE_OPTIONS[0]);
                                return (
                                  <OptionChip
                                    key={opt}
                                    label={opt}
                                    active={active}
                                    onClick={() => updateData("rsvp.title", opt)}
                                  />
                                );
                              })}
                            </div>
                          </FormItem>
                          <FormItem label="안내 문구">
                            <div className="flex-1 flex flex-col gap-2">
                              <Textarea
                                rows={3}
                                value={(data as any).rsvp?.description ?? ""}
                                onChange={(e) => updateData("rsvp.description", e.target.value)}
                                placeholder="참석 여부를 알려주시면 준비에 도움이 됩니다."
                                className="resize-none shadow-none flex-1"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
                                  onClick={() => {
                                    setRsvpSampleTab('general');
                                    setRsvpSelectedSample(null);
                                    setRsvpSampleOpen(true);
                                  }}
                                >
                                  샘플보기
                                </Button>
                              </div>
                            </div>
                          </FormItem>
                          <FormItem label="옵션">
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                              onClick={() =>
                                updateData("rsvp.collectGuestCount", !((data as any).rsvp?.collectGuestCount ?? true))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  updateData(
                                    "rsvp.collectGuestCount",
                                    !((data as any).rsvp?.collectGuestCount ?? true),
                                  );
                                }
                              }}
                            >
                              <CircleCheckbox
                                checked={!!((data as any).rsvp?.collectGuestCount ?? true)}
                                onChange={(e) => updateData("rsvp.collectGuestCount", e.target.checked)}
                              />
                              동반 인원 수 받기
                            </span>
                          </FormItem>
                          <FormItem label="응답 마감일">
                            <div className="flex-1 flex flex-col gap-2">
                              <Input
                                type="date"
                                value={(data as any).rsvp?.deadline ?? ""}
                                onChange={(e) => updateData("rsvp.deadline", e.target.value)}
                                className="shadow-none max-w-[240px]"
                              />
                              <div className="text-[12px] text-on-surface-30 leading-relaxed">
                                비워 두면 마감일 없이 받습니다.
                              </div>
                            </div>
                          </FormItem>
                          {rsvpSampleOpen && createPortal(
                            <div
                              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-2 sm:p-4"
                              onClick={() => setRsvpSampleOpen(false)}
                            >
                              <div
                                className="w-full max-w-md rounded-2xl bg-white border border-[color:var(--border-10)] p-4 sm:p-6 flex flex-col gap-5 max-h-[60dvh] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="text-[15px] font-semibold text-on-surface-10">샘플 문구</h3>
                                </div>

                                <div className="relative">
                                  <div className="grid grid-cols-3 border-b border-[color:var(--border-10)]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRsvpSampleTab('general');
                                        setRsvpSelectedSample(null);
                                      }}
                                      className={[
                                        'h-10 flex items-center justify-center text-[16px] font-medium transition-colors',
                                        rsvpSampleTab === 'general'
                                          ? 'text-on-surface-10'
                                          : 'text-[color:var(--on-surface-disabled)] hover:text-on-surface-30',
                                      ].join(' ')}
                                    >
                                      일반
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRsvpSampleTab('formal');
                                        setRsvpSelectedSample(null);
                                      }}
                                      className={[
                                        'h-10 flex items-center justify-center text-[16px] font-medium transition-colors',
                                        rsvpSampleTab === 'formal'
                                          ? 'text-on-surface-10'
                                          : 'text-[color:var(--on-surface-disabled)] hover:text-on-surface-30',
                                      ].join(' ')}
                                    >
                                      정중
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRsvpSampleTab('friendly');
                                        setRsvpSelectedSample(null);
                                      }}
                                      className={[
                                        'h-10 flex items-center justify-center text-[16px] font-medium transition-colors',
                                        rsvpSampleTab === 'friendly'
                                          ? 'text-on-surface-10'
                                          : 'text-[color:var(--on-surface-disabled)] hover:text-on-surface-30',
                                      ].join(' ')}
                                    >
                                      친근
                                    </button>
                                  </div>
                                  <div
                                    className={[
                                      'absolute bottom-0 left-0 h-[2px] w-1/3 bg-black transition-transform duration-200',
                                      rsvpSampleTab === 'general'
                                        ? 'translate-x-0'
                                        : rsvpSampleTab === 'formal'
                                          ? 'translate-x-full'
                                          : 'translate-x-[200%]',
                                    ].join(' ')}
                                  />
                                </div>

                                <div className="flex-1 overflow-y-auto no-scrollbar">
                                  <div className="flex flex-col gap-3">
                                    {rsvpSamples[rsvpSampleTab].map((sample) => (
                                      <div
                                        key={`${sample.title}-${sample.content.slice(0, 20)}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setRsvpSelectedSample(sample)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') setRsvpSelectedSample(sample);
                                        }}
                                        className={[
                                          'rounded-lg border bg-white px-4 py-5 cursor-pointer transition-colors outline-none',
                                          rsvpSelectedSample?.content === sample.content && rsvpSelectedSample?.title === sample.title
                                            ? 'border-black'
                                            : 'border-[color:var(--border-10)] hover:border-[color:var(--border-20)]',
                                        ].join(' ')}
                                      >
                                        <div className="text-[14px] leading-relaxed text-on-surface-10 text-center whitespace-pre-wrap">
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
                                      setRsvpSelectedSample(null);
                                      setRsvpSampleOpen(false);
                                    }}
                                  >
                                    취소
                                  </Button>
                                  <Button
                                    type="button"
                                    className="w-fit h-10 px-5 rounded-lg text-[14px] font-semibold"
                                    disabled={!rsvpSelectedSample}
                                    onClick={() => {
                                      if (!rsvpSelectedSample) return;
                                      updateData('rsvp.description', String(rsvpSelectedSample.content).replace(/\r\n?/g, '\n'));
                                      setRsvpSampleOpen(false);
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

                      {item.id === 'guestUpload' && (
                        <>
                          <FormItem label="제목">
                            <div className="flex flex-wrap gap-2 w-full">
                              {GUEST_UPLOAD_TITLE_OPTIONS.map((opt) => {
                                const current = String((data.guestUpload as any)?.title ?? "").trim();
                                const active =
                                  current === opt ||
                                  (!current && opt === GUEST_UPLOAD_TITLE_OPTIONS[0]);
                                return (
                                  <OptionChip
                                    key={opt}
                                    label={opt}
                                    active={active}
                                    onClick={() => updateData("guestUpload.title", opt)}
                                  />
                                );
                              })}
                            </div>
                          </FormItem>
                          <FormItem label="안내 문구">
                            <div className="flex-1 flex flex-col gap-2">
                              <Textarea
                                rows={3}
                                value={(data.guestUpload as any)?.description ?? ""}
                                onChange={(e) => updateData('guestUpload.description', e.target.value)}
                                placeholder="예식 후 촬영하신 사진/영상을 업로드해 주세요."
                                className="resize-none shadow-none flex-1"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
                                  onClick={() => {
                                    setGuestUploadSelectedSample(null);
                                    setGuestUploadSampleOpen(true);
                                  }}
                                >
                                  샘플보기
                                </Button>
                              </div>
                            </div>
                          </FormItem>
                          <FormItem label="옵션">
                            <div className="flex flex-col gap-2 flex-1">
                              <span
                                role="button"
                                tabIndex={0}
                                className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                onClick={() =>
                                  updateData(
                                    "guestUpload.showAfterEventModal",
                                    !((data.guestUpload as any)?.showAfterEventModal ?? true),
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    updateData(
                                      "guestUpload.showAfterEventModal",
                                      !((data.guestUpload as any)?.showAfterEventModal ?? true),
                                    );
                                  }
                                }}
                              >
                                <CircleCheckbox
                                  checked={!!((data.guestUpload as any)?.showAfterEventModal ?? true)}
                                  onChange={(e) =>
                                    updateData("guestUpload.showAfterEventModal", e.target.checked)
                                  }
                                />
                                예식일 이후 모달 띄우기
                              </span>
                              <div className="text-[12px] text-on-surface-30 leading-relaxed">
                                예식 후 접속한 하객에게 사진 업로드를 바로 할 수 있도록 안내창을 띄웁니다
                              </div>
                            </div>
                          </FormItem>
                          <div className="rounded-2xl bg-[color:var(--surface-20)] px-4 py-3.5 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 text-on-surface-30 mt-0.5" />
                            <p className="text-[13px] text-on-surface-30 leading-relaxed">
                              기본 제공 용량(2GB)을 초과하는 업로드 용량을 이용할 경우 추가 결제가 발생할 수 있습니다.
                            </p>
                          </div>
                          {guestUploadSampleOpen && createPortal(
                            <div
                              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-2 sm:p-4"
                              onClick={() => setGuestUploadSampleOpen(false)}
                            >
                              <div
                                className="w-full max-w-md rounded-2xl bg-white border border-[color:var(--border-10)] p-4 sm:p-6 flex flex-col gap-5 max-h-[60dvh] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="text-[15px] font-semibold text-on-surface-10">샘플 문구</h3>
                                </div>

                                <div className="flex-1 overflow-y-auto no-scrollbar">
                                  <div className="flex flex-col gap-3">
                                    {guestUploadSamples.map((sample) => (
                                      <div
                                        key={sample.slice(0, 28)}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setGuestUploadSelectedSample(sample)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') setGuestUploadSelectedSample(sample);
                                        }}
                                        className={[
                                          'rounded-lg border bg-white px-4 py-5 cursor-pointer transition-colors outline-none',
                                          guestUploadSelectedSample === sample
                                            ? 'border-black'
                                            : 'border-[color:var(--border-10)] hover:border-[color:var(--border-20)]',
                                        ].join(' ')}
                                      >
                                        <div className="text-[14px] leading-relaxed text-on-surface-10 text-center whitespace-pre-wrap">
                                          {sample}
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
                                      setGuestUploadSelectedSample(null);
                                      setGuestUploadSampleOpen(false);
                                    }}
                                  >
                                    취소
                                  </Button>
                                  <Button
                                    type="button"
                                    className="w-fit h-10 px-5 rounded-lg text-[14px] font-semibold"
                                    disabled={!guestUploadSelectedSample}
                                    onClick={() => {
                                      if (!guestUploadSelectedSample) return;
                                      updateData('guestUpload.description', String(guestUploadSelectedSample).replace(/\r\n?/g, '\n'));
                                      setGuestUploadSampleOpen(false);
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
                                <div className="w-full min-w-0 flex flex-col gap-3 sm:h-[120px] sm:flex-row sm:items-center">
                                  <div className="w-full max-w-[240px] aspect-video rounded-lg border border-border bg-[color:var(--surface-20)] overflow-hidden sm:h-full sm:w-auto sm:max-w-none">
                                    {data.share?.thumbnail ? (
                                      <img
                                        src={data.share.thumbnail}
                                        alt="공유 썸네일 미리보기"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[clamp(10px,1.6vw,12px)] text-on-surface-30">
                                        썸네일 이미지가 없습니다.
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex w-full flex-wrap items-center gap-2 sm:h-full sm:w-auto sm:flex-col sm:items-start sm:justify-start">
                                    <label className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50 w-fit self-start whitespace-nowrap leading-none flex-shrink-0">
                                      사진 업로드
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
                                    <button
                                      type="button"
                                      className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-20 hover:bg-slate-50 whitespace-nowrap leading-none flex-shrink-0 w-fit self-start"
                                      onClick={() => setShareThumbnailPickerOpen(true)}
                                    >
                                      이미지 고르기
                                    </button>
                                    {data.share?.thumbnail && (
                                      <button
                                        type="button"
                                        className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50 w-fit self-start whitespace-nowrap leading-none flex-shrink-0"
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
                              onChange={(e) => {
                                const v = e.target.value;
                                if (!v.trim()) {
                                  shareTitleManuallyEditedRef.current = false;
                                  updateData("share.title", autoShareTitle);
                                  return;
                                }
                                shareTitleManuallyEditedRef.current = true;
                                updateData("share.title", v);
                              }}
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
                            <div className="flex-1 flex flex-col gap-3">
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

                      {item.id === "publish" && (
                        <>
                          <FormItem label="공개일">
                            <div className="flex-1 flex flex-col gap-2">
                              <Input
                                type="date"
                                value={(data as any).publish?.publicStartDate ?? ""}
                                onChange={(e) => updateData("publish.publicStartDate", e.target.value)}
                                className="shadow-none max-w-[240px]"
                              />
                              <div className="text-[12px] text-on-surface-30 leading-relaxed">
                                설정한 날짜 0시부터 공개돼요.
                              </div>
                            </div>
                          </FormItem>
                        </>
                      )}

                      {item.id === "i18n" && (
                        <>
                          <FormItem label="다국어">
                            <div className="flex flex-col gap-2 flex-1">
                              <span
                                role="button"
                                tabIndex={0}
                                className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                                onClick={() => updateData("i18n.enabled", !((data as any).i18n?.enabled ?? false))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    updateData("i18n.enabled", !((data as any).i18n?.enabled ?? false));
                                  }
                                }}
                              >
                                <CircleCheckbox
                                  checked={!!(data as any).i18n?.enabled}
                                  onChange={(e) => updateData("i18n.enabled", e.target.checked)}
                                />
                                다국어 지원
                              </span>
                              <div className="text-[12px] text-on-surface-30 leading-relaxed">
                                기본 제공 국가: 대한민국, 미국, 일본, 중국(간체), 대만(번체), 베트남, 태국. (추가/삭제 불가)
                              </div>
                            </div>
                          </FormItem>
                          <FormItem label="정보순서">
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center gap-2 text-[13px] text-on-surface-20 select-none cursor-pointer"
                              onClick={() => updateData("i18n.brideFirstInfo", !((data as any).i18n?.brideFirstInfo ?? false))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  updateData("i18n.brideFirstInfo", !((data as any).i18n?.brideFirstInfo ?? false));
                                }
                              }}
                            >
                              <CircleCheckbox
                                checked={!!((data as any).i18n?.brideFirstInfo ?? false)}
                                onChange={(e) => updateData("i18n.brideFirstInfo", e.target.checked)}
                              />
                              신부측 정보 먼저 노출
                            </span>
                          </FormItem>
                        </>
                      )}

                    </div>
                  )}
                </div>
                </React.Fragment>
                );
              })}
            </div>
          </div>

          {!isTabletViewport && (
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
          )}
        </section>
        )}

        {/* 3. 우측 미리보기 패널 */}
        {(!isTabletViewport || mobilePanel === 'preview') && (
        <main
          className={cn(
            "flex flex-1 min-h-0 flex-col min-w-0",
            isTabletViewport ? "items-stretch px-0 py-0" : "items-center px-4 py-4",
          )}
        >
          {/* 바깥 컨테이너는 고정, 내부 프레임만 스크롤 */}
          <div
            className={cn(
              "flex-1 min-h-0 flex w-full bg-transparent items-stretch shadow-none",
              isTabletViewport ? "justify-stretch max-w-none h-full" : "justify-center max-w-[400px] min-h-full",
            )}
          >
            <div
              ref={previewFrameRef}
              className={cn(
                "preview-font-floor w-full bg-white flex flex-col items-stretch text-center overflow-hidden relative",
                isTabletViewport ? "h-full border-0 rounded-none" : "border border-border rounded-lg",
              )}
              style={
                {
                  // 향후 theme.bgColor / theme.fontFamily를 전역 테마로 사용
                  // 미리보기에서는 배경 톤을 더 연하게 보이도록 화이트와 강하게 혼합
                  backgroundColor: `color-mix(in srgb, ${selectedKeyColorPreset.background} 42%, white)`,
                  fontFamily: data.theme.fontFamily,
                  fontSize: `${fontScaleToPercent((data.theme as any).fontScale)}%`,
                  '--primary-custom': selectedKeyColorPreset.key,
                  '--key': `color-mix(in srgb, ${selectedKeyColorPreset.key} 82%, ${selectedKeyColorPreset.keyDark})`,
                  '--key-dark': selectedKeyColorPreset.keyDark,
                  '--primary-container': `color-mix(in srgb, ${selectedKeyColorPreset.primaryContainer} 56%, white)`,
                  '--primary-container-2': `color-mix(in srgb, ${selectedKeyColorPreset.key} 8%, ${selectedKeyColorPreset.primaryContainer})`,
                  '--on-primary-container': selectedKeyColorPreset.onPrimaryContainer,
                  '--on-surface-10': `color-mix(in srgb, #282828 95%, ${selectedKeyColorPreset.key} 5%)`,
                  '--on-surface-20': `color-mix(in srgb, #424242 95%, ${selectedKeyColorPreset.key} 5%)`,
                  '--on-surface-30': `color-mix(in srgb, #616161 95%, ${selectedKeyColorPreset.key} 5%)`,
                  '--on-surface-disabled': `color-mix(in srgb, rgba(0, 0, 0, 0.22) 95%, ${selectedKeyColorPreset.key} 5%)`,
                } as React.CSSProperties
              }
            >
              <ParticleCanvasOverlay
                effect={(data.theme as any)?.particleEffect ?? 'none'}
                themeColor={selectedKeyColorPreset.key}
              />
              <div ref={previewScrollRef} className="flex-1 overflow-y-auto no-scrollbar">
                {layoutOrder.includes('hosts') && (
                  <div
                    data-preview-section-id="main"
                    className={`w-full flex flex-col items-stretch text-center ${(data.theme.scrollEffect && !isTabletViewport)
                      ? (previewVisibleSections.main
                        ? 'opacity-100 translate-y-0 duration-[750ms] ease-out'
                        : 'opacity-0 translate-y-3 duration-[750ms] ease-out')
                      : 'opacity-100 translate-y-0'
                    } transition-[opacity,transform]`}
                  >
                    <HostsIntroPreview
                      data={data}
                      hero={layoutOrder.includes('main') ? renderPreviewSection('main') : undefined}
                    />
                  </div>
                )}
                {layoutOrder
                  .filter((sectionId) => {
                    if (sectionId === "main" || sectionId === "hosts") return false;
                    if (sectionId === "rsvp" && isRsvpPreviewExpired) return false;
                    return true;
                  })
                  .map((sectionId) => {
                  return (
                    <React.Fragment key={sectionId}>
                      <div
                        data-preview-section-id={sectionId}
                        className={`${sectionId === 'main'
                          ? "w-full flex flex-col items-stretch text-center"
                          : sectionId === 'eventInfo'
                            ? "w-full p-0 flex flex-col items-center text-center"
                          : sectionId === 'guestbook'
                            ? "w-full pt-[80px] pb-[80px] px-6 flex flex-col items-center text-center bg-[color:var(--primary-container-2)]"
                          : sectionId === 'contact'
                            ? "w-full pt-[80px] pb-[80px] px-0 flex flex-col items-center text-center"
                          : sectionId === 'location'
                            ? "w-full pt-[80px] pb-[80px] px-6 flex flex-col items-center text-center border-b border-border"
                          : "w-full pt-[80px] pb-[80px] px-6 flex flex-col items-center text-center"
                          } ${(data.theme.scrollEffect && !isTabletViewport)
                            ? (previewVisibleSections[sectionId]
                              ? 'opacity-100 translate-y-0 duration-[750ms] ease-out'
                              : 'opacity-0 translate-y-3 duration-[750ms] ease-out')
                            : 'opacity-100 translate-y-0'
                          } transition-[opacity,transform]`}
                      >
                        {renderPreviewSection(sectionId)}
                      </div>
                    </React.Fragment>
                  );
                  })}
              </div>
              {isBgmEnabled && (
                <button
                  type="button"
                  onClick={() => (isPlaying ? handleBgmStop() : void handleBgmPlay())}
                  className={[
                    "absolute bottom-4 right-4 z-20 h-12 w-12 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.18)] flex items-center justify-center border border-white/25 transition-[transform,filter,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--key)] focus-visible:ring-offset-2",
                    "bg-[color:var(--key)] text-white hover:brightness-110 active:scale-[0.98]",
                  ].join(" ")}
                  aria-label={isPlaying ? "배경음악 끄기" : "배경음악 켜기"}
                >
                  <span
                    className="w-5 h-5 shrink-0 bg-current"
                    style={{
                      WebkitMaskImage: `url(${isPlaying ? "/music-note.svg" : "/music-off.svg"})`,
                      maskImage: `url(${isPlaying ? "/music-note.svg" : "/music-off.svg"})`,
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                    } as React.CSSProperties}
                    aria-hidden
                  />
                </button>
              )}
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
              {copyToastVisible && (
                <div className="absolute left-1/2 bottom-6 -translate-x-1/2 z-30 pointer-events-none">
                  <div className="rounded-full bg-black/85 px-4 py-2 text-[13px] font-medium text-white shadow-lg whitespace-nowrap">
                    {copyToastMessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        )}
        
      </div>

      <Dialog open={!!pendingDeleteTab} onOpenChange={(open) => !open && setPendingDeleteTab(null)}>
        <DialogContent className="w-[420px] max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-16px)] rounded-2xl border border-border p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border bg-white">
            <DialogTitle className="text-[16px] font-semibold text-on-surface-10">탭 삭제</DialogTitle>
          </div>
          <div className="p-4 sm:p-5 bg-[color:var(--surface-10)] text-[14px] leading-relaxed text-on-surface-20 flex-1 min-h-0 overflow-y-auto">
            {pendingDeleteTab ? `‘${pendingDeleteTab.label}’ 탭을 정말 삭제하시겠어요?` : "탭을 정말 삭제하시겠어요?"}
            <div className="mt-2 text-[12px] text-on-surface-30">삭제하면 탭 안의 작성 내용도 함께 제거됩니다.</div>
          </div>
          <div className="p-4 border-t border-border bg-white flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 text-[12px]"
              onClick={() => setPendingDeleteTab(null)}
            >
              취소
            </Button>
            <Button
              type="button"
              className="h-9 px-4 text-[12px] bg-red-600 hover:bg-red-700"
              onClick={confirmRemoveInvitationTab}
            >
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={imageEditorOpen} onOpenChange={(o) => !o && closeImageEditor()}>
        <DialogContent className="bg-[color:var(--surface-10)] w-[min(420px,calc(100vw-16px))] max-h-[calc(100dvh-16px)] rounded-2xl shadow-[0px_8px_16px_8px_rgba(0,0,0,0.16)] outline outline-1 outline-offset-[-1px] outline-[color:var(--border-10)]/5 p-0 overflow-hidden border-0 flex flex-col">
          <div className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto flex flex-col justify-start items-center gap-5">
            {/* 프리뷰 */}
            <div
              className={cn(
                "w-full max-w-[24rem] relative rounded-lg overflow-hidden bg-neutral-900",
                imageEditorAspect === 'landscape10x4' ? 'aspect-[10/4]' : 'aspect-square',
              )}
            >
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
              ) : imageEditorAspect === 'landscape10x4' ? (
                <div className="absolute inset-0 pointer-events-none outline outline-2 outline-offset-[-2px] outline-[color:var(--key)] rounded-lg" />
              ) : (
                <>
                  {/* 3:4 가이드 프레임 + 바깥 딤(정사각형 내부) */}
                  <div className="absolute inset-0 grid grid-cols-[1fr_auto_1fr] pointer-events-none">
                    <div className="bg-black/50" />
                    <div className="h-full aspect-[3/4] outline outline-2 outline-offset-[-2px] outline-[color:var(--key)]" />
                    <div className="bg-black/50" />
                  </div>
                </>
              )}
            </div>

            {/* 컨트롤 */}
            <div className="self-stretch inline-flex justify-center items-center gap-5">
              <div className="w-full flex items-center gap-3">
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
          <div className="self-stretch w-full p-4 sm:p-5 border-t border-[color:var(--border-10)]/5 inline-flex justify-end items-center gap-2 bg-[color:var(--surface-10)]">
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
        <DialogContent className="w-[420px] max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-16px)] rounded-2xl border border-border p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border">
            <DialogTitle className="text-[16px] font-semibold text-on-surface-10">공유 썸네일 미리보기</DialogTitle>
          </div>
          <div className="p-4 sm:p-5 bg-[color:var(--surface-10)] flex-1 min-h-0 overflow-y-auto">
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

      <Dialog open={shareThumbnailPickerOpen} onOpenChange={setShareThumbnailPickerOpen}>
        <DialogContent className="w-[680px] max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-16px)] rounded-2xl border border-border p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border bg-white">
            <DialogTitle className="text-[16px] font-semibold text-on-surface-10">
              기본 일러스트 썸네일 선택
            </DialogTitle>
            <div className="text-[12px] text-on-surface-30 mt-1">
              원하는 썸네일을 클릭하면 공유 썸네일로 적용됩니다.
            </div>
          </div>
          <div className="p-4 sm:p-5 bg-[color:var(--surface-10)] flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {shareThumbnailPresets.map((t) => {
                const selected = data.share?.thumbnail === t.url;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`rounded-lg overflow-hidden border bg-white ${
                      selected ? 'border-[color:var(--key)]' : 'border-border'
                    } hover:border-[color:var(--key)]/50`}
                    onClick={() => {
                      updateData('share.thumbnail', t.url);
                      setShareThumbnailPickerOpen(false);
                    }}
                  >
                    <img
                      src={t.url}
                      alt={`${t.label} 썸네일`}
                      className="w-full aspect-[1.91/1] object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-4 border-t border-border bg-white flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
              onClick={() => setShareThumbnailPickerOpen(false)}
            >
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={greetingThumbnailPickerOpen} onOpenChange={setGreetingThumbnailPickerOpen}>
        <DialogContent className="w-[424px] max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-16px)] rounded-2xl border border-border p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border bg-white">
            <DialogTitle className="text-[16px] font-semibold text-on-surface-10">
              인사말 이미지 선택
            </DialogTitle>
            <div className="text-[12px] text-on-surface-30 mt-1">
              원하는 이미지를 클릭하면 인사말 이미지로 적용됩니다.
            </div>
          </div>
          <div className="p-4 sm:p-5 w-full flex-1 min-h-0 overflow-y-auto bg-[color:var(--surface-10)]">
            <div className="grid w-full h-fit grid-cols-2 sm:grid-cols-3 gap-3 justify-items-center">
              {flowerThumbnailPresets.map((t) => {
                const selected = (data.greeting as any)?.thumbnail === t.url;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`w-full min-w-[120px] aspect-square rounded-lg overflow-hidden border bg-white flex items-center justify-center ${
                      selected ? 'border-[color:var(--key)]' : 'border-border'
                    } hover:border-[color:var(--key)]/50`}
                    onClick={() => {
                      updateData('greeting.thumbnail', t.url);
                      setGreetingThumbnailPickerOpen(false);
                    }}
                  >
                    <img
                      src={t.url}
                      alt={`${t.label} 썸네일`}
                      className="w-full h-full object-fill"
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-4 w-full border-t border-border bg-white flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
              onClick={() => setGreetingThumbnailPickerOpen(false)}
            >
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mainPresetPickerOpen} onOpenChange={setMainPresetPickerOpen}>
        <DialogContent className="w-[424px] max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-16px)] rounded-2xl border border-border p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border bg-white">
            <DialogTitle className="text-[16px] font-semibold text-on-surface-10">
              메인 기본 이미지 선택
            </DialogTitle>
            <div className="text-[12px] text-on-surface-30 mt-1">
              원하는 이미지를 클릭하면 메인 영역 기본 이미지로 적용됩니다.
            </div>
          </div>
          <div className="p-4 sm:p-5 w-full flex-1 min-h-0 overflow-y-auto bg-[color:var(--surface-10)]">
            <div className="grid w-full grid-cols-2 gap-4 justify-items-center">
              {MAIN_IMAGE_PRESETS.map((t) => {
                const current = String((data.main as any)?.presetImage ?? '').trim() || DEFAULT_MAIN_PRESET_URL;
                const selected = current === t.url;
                return (
                  <button
                    key={`main-preset-${t.id}`}
                    type="button"
                    className="flex w-full max-w-[168px] flex-col items-center gap-1.5"
                    onClick={() => {
                      updateData('main.presetImage', t.url);
                      setMainPresetPickerOpen(false);
                    }}
                  >
                    <div
                      className={`aspect-square w-full overflow-hidden rounded-lg border bg-white ${
                        selected ? 'border-[color:var(--key)]' : 'border-border'
                      } hover:border-[color:var(--key)]/50`}
                    >
                      <img
                        src={t.url}
                        alt={`${t.label} 예시`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-4 w-full border-t border-border bg-white flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3 rounded-lg border border-border bg-white text-[13px] text-on-surface-10 inline-flex items-center cursor-pointer hover:bg-slate-50"
              onClick={() => setMainPresetPickerOpen(false)}
            >
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rsvpPreviewModalOpen} onOpenChange={setRsvpPreviewModalOpen}>
        <DialogContent className="w-[420px] max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-16px)] rounded-2xl border border-border p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border bg-white">
            <DialogTitle className="text-[16px] font-semibold text-on-surface-10">참석의사 전달</DialogTitle>
          </div>
          <div className="p-4 sm:p-5 bg-[color:var(--surface-10)] space-y-4 flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-2">
              <p className="text-[12px] font-medium text-on-surface-20">구분</p>
              <div className="grid grid-cols-2 gap-2">
                {(['신랑측', '신부측'] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setRsvpPreviewSide(side)}
                    className={`h-10 rounded-lg border text-[13px] font-medium ${
                      rsvpPreviewSide === side
                        ? 'border-[color:var(--key)] bg-white text-on-surface-10'
                        : 'border-border bg-white text-on-surface-20'
                    }`}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[12px] font-medium text-on-surface-20">참석의사</p>
              <div className="grid grid-cols-2 gap-2">
                {(['참석', '불참'] as const).map((intent) => (
                  <button
                    key={intent}
                    type="button"
                    onClick={() => setRsvpPreviewIntent(intent)}
                    className={`h-10 rounded-lg border text-[13px] font-medium ${
                      rsvpPreviewIntent === intent
                        ? 'border-[color:var(--key)] bg-white text-on-surface-10'
                        : 'border-border bg-white text-on-surface-20'
                    }`}
                  >
                    {intent}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[12px] font-medium text-on-surface-20">성함</p>
              <input
                value={rsvpPreviewName}
                onChange={(e) => setRsvpPreviewName(e.target.value)}
                placeholder="성함을 입력해 주세요"
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-[color:var(--key)]"
              />
            </div>

            {rsvpPreviewIntent === '참석' ? (
              <div className="space-y-2">
                <p className="text-[12px] font-medium text-on-surface-20">동반 인원 (본인 제외)</p>
                <input
                  type="number"
                  min={0}
                  value={rsvpPreviewGuestCount}
                  onChange={(e) => setRsvpPreviewGuestCount(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-[13px] outline-none focus:border-[color:var(--key)]"
                />
              </div>
            ) : null}

            <label className="flex items-start gap-2 text-[12px] text-on-surface-20">
              <input
                type="checkbox"
                checked={rsvpPreviewPrivacyAgreed}
                onChange={(e) => setRsvpPreviewPrivacyAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[color:var(--key)]"
              />
              <span>개인정보 수집 및 이용에 동의합니다.</span>
            </label>
          </div>
          <div className="p-4 border-t border-border bg-white flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3 rounded-lg border-[color:var(--key)] bg-white text-[13px] text-[color:var(--key)] hover:bg-slate-50"
              onClick={() => setRsvpPreviewModalOpen(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              className="h-9 px-3 rounded-lg bg-[color:var(--key)] hover:brightness-95 text-white text-[13px]"
              disabled={!rsvpPreviewName.trim() || !rsvpPreviewPrivacyAgreed}
              onClick={() => setRsvpPreviewModalOpen(false)}
            >
              참석여부 전달하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}