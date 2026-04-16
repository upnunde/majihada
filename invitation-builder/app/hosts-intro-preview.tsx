"use client";

import React, { useMemo } from "react";
import type { CardData } from "../store/useCardStore";
import { parseEventDateLocal } from "@/lib/designer-calendar";

/** 인트로 미리보기 공통 파생 값 (타입별 컴포넌트에만 전달) */
export type HostsIntroPreviewBase = {
  titleColor: string;
  bodyColor: string;
  firstName: string;
  secondName: string;
  firstRoleEn: string;
  secondRoleEn: string;
  dateTimeLine: React.ReactNode;
  timeText: string;
  venueBlock: React.ReactNode;
  yy: string;
  mm: string;
  dd: string;
  weekdayKo: string;
  hasValidDate: boolean;
};

function buildHostsIntroBase(data: CardData): HostsIntroPreviewBase {
  const titleColor = data.main.titleColor;
  const bodyColor = data.main.bodyColor;
  const brideFirst = !!(data as any).i18n?.brideFirstInfo;
  const groom = (data.hosts.groom.name ?? "").trim() || "신랑";
  const bride = (data.hosts.bride.name ?? "").trim() || "신부";
  const firstName = brideFirst ? bride : groom;
  const secondName = brideFirst ? groom : bride;
  const firstRoleEn = brideFirst ? "BRIDE" : "GROOM";
  const secondRoleEn = brideFirst ? "GROOM" : "BRIDE";
  const eventDateText = (data.eventInfo.date ?? "").trim();
  const eventDate = parseEventDateLocal(eventDateText);
  const hasValidDate = eventDate !== null;
  const weekdayKo = hasValidDate ? ["일", "월", "화", "수", "목", "금", "토"][eventDate!.getDay()] : "";
  const summaryDateLine = hasValidDate
    ? `${eventDate!.getFullYear()}년 ${eventDate!.getMonth() + 1}월 ${eventDate!.getDate()}일 ${weekdayKo}요일`
    : eventDateText;
  const summaryTimeLine = (data.eventInfo.time ?? "").trim();
  const venueName = String((data.eventInfo as any)?.venueName ?? "").trim();
  const venueDetail = String((data.eventInfo as any)?.venueDetail ?? "").trim();
  const venueDisplay = venueName
    ? venueDetail && !venueName.includes(venueDetail)
      ? `${venueName} ${venueDetail}`
      : venueName
    : "";
  const yy = hasValidDate ? String(eventDate!.getFullYear()).slice(2) : "—";
  const mm = hasValidDate ? String(eventDate!.getMonth() + 1).padStart(2, "0") : "—";
  const dd = hasValidDate ? String(eventDate!.getDate()).padStart(2, "0") : "—";

  const dateTimeLine = (
    <>
      {summaryDateLine}
      {summaryTimeLine && ` ${summaryTimeLine}`}
    </>
  );

  const venueBlock =
    !!venueDisplay && (
      <p className="text-[1em] leading-relaxed" style={{ color: bodyColor }}>
        {venueDisplay}
      </p>
    );

  return {
    titleColor,
    bodyColor,
    firstName,
    secondName,
    firstRoleEn,
    secondRoleEn,
    dateTimeLine,
    timeText: summaryTimeLine,
    venueBlock,
    yy,
    mm,
    dd,
    weekdayKo,
    hasValidDate,
  };
}

/* ========== A 타입 ========== */

function HostsIntroPreviewHeroA({ base, hero }: { base: HostsIntroPreviewBase; hero: React.ReactNode }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock } = base;
  return (
    <div className="w-full flex flex-col items-stretch pt-[60px]">
      {hero}
      <div className="max-w-[340px] mx-auto w-full px-6 pt-10 pb-[50px] space-y-5 text-center">
        <p className="mb-6 flex justify-center items-center text-[26px] font-extralight tracking-[0.02em] leading-none" style={{ color: titleColor }}>
          {firstName}
          <span className="mx-2 inline-flex items-center align-middle leading-none" style={{ color: `var(--key, ${titleColor})` }}>
            ♥
          </span>
          {secondName}
        </p>
        <div className="space-y-1">
          <p className="text-[1em] leading-relaxed whitespace-nowrap" style={{ color: bodyColor }}>
            {dateTimeLine}
          </p>
          {venueBlock}
        </div>
      </div>
    </div>
  );
}

function HostsIntroPreviewSoloA({ base }: { base: HostsIntroPreviewBase }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock } = base;
  return (
    <div className="w-full max-w-[340px] mx-auto space-y-5 pt-[60px]">
      <p className="flex justify-center items-center text-[22px] font-medium tracking-[0.02em] leading-none" style={{ color: titleColor }}>
        {firstName}
        <span className="mx-2 inline-flex items-center align-middle leading-none" style={{ color: titleColor }}>
          ·
        </span>
        {secondName}
      </p>
      <div className="space-y-2">
        <p className="text-[1em] leading-relaxed whitespace-nowrap" style={{ color: bodyColor }}>
          {dateTimeLine}
        </p>
        {venueBlock}
      </div>
    </div>
  );
}

/* ========== B 타입 ========== */

function HostsIntroPreviewHeroB({ base, hero }: { base: HostsIntroPreviewBase; hero: React.ReactNode }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock, yy, mm, dd, weekdayKo, hasValidDate } =
    base;
  return (
    <div className="w-full flex flex-col items-stretch pt-0">
      <div className="px-5 py-0 flex flex-col items-center text-center gap-2 mt-[60px] mb-5">
        <div className="flex items-baseline justify-center gap-2 sm:gap-3">
          <span className="text-[clamp(22px,6vw,30px)] font-light tabular-nums tracking-tight" style={{ color: titleColor }}>
            {yy}
          </span>
          <span className="text-[14px] font-extralight opacity-35" style={{ color: bodyColor }}>
            |
          </span>
          <span className="text-[clamp(22px,6vw,30px)] font-light tabular-nums tracking-tight" style={{ color: titleColor }}>
            {mm}
          </span>
          <span className="text-[14px] font-extralight opacity-35" style={{ color: bodyColor }}>
            |
          </span>
          <span className="text-[clamp(22px,6vw,30px)] font-light tabular-nums tracking-tight" style={{ color: titleColor }}>
            {dd}
          </span>
        </div>
        {hasValidDate && (
          <p className="text-[13px] tracking-[0.3em] opacity-65" style={{ color: bodyColor }}>
            {weekdayKo}요일
          </p>
        )}
        <div className="w-12 h-px opacity-25 mt-2 mx-auto" style={{ backgroundColor: titleColor }} aria-hidden />
      </div>
      <div className="w-full p-0 m-0">{hero}</div>
      <div className="max-w-[340px] mx-auto w-full px-6 pt-10 pb-10 flex flex-col items-center text-center gap-4">
        <p className="text-[22px] font-medium tracking-[0.04em]" style={{ color: titleColor }}>
          {firstName}
          <span className="mx-2 opacity-40">·</span>
          {secondName}
        </p>
        <div className="space-y-2 w-full">
          <p className="text-[0.95em] leading-relaxed" style={{ color: bodyColor }}>
            {dateTimeLine}
          </p>
          {venueBlock}
        </div>
      </div>
    </div>
  );
}

function HostsIntroPreviewSoloB({ base }: { base: HostsIntroPreviewBase }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock, yy, mm, dd, weekdayKo, hasValidDate } =
    base;
  return (
    <div className="w-full max-w-[340px] mx-auto flex flex-col items-center text-center gap-4">
      <div className="flex items-baseline justify-center gap-2 sm:gap-3">
        <span className="text-[clamp(26px,7vw,34px)] font-light tabular-nums tracking-tight" style={{ color: titleColor }}>
          {yy}
        </span>
        <span className="text-[15px] font-extralight opacity-40" style={{ color: bodyColor }}>
          |
        </span>
        <span className="text-[clamp(26px,7vw,34px)] font-light tabular-nums tracking-tight" style={{ color: titleColor }}>
          {mm}
        </span>
        <span className="text-[15px] font-extralight opacity-40" style={{ color: bodyColor }}>
          |
        </span>
        <span className="text-[clamp(26px,7vw,34px)] font-light tabular-nums tracking-tight" style={{ color: titleColor }}>
          {dd}
        </span>
      </div>
      {hasValidDate && (
        <p className="text-[10px] tracking-[0.35em] uppercase opacity-70" style={{ color: bodyColor }}>
          {weekdayKo}요일
        </p>
      )}
      <p className="text-[1.05em] font-medium tracking-[0.04em]" style={{ color: titleColor }}>
        {firstName}
        <span className="mx-2 opacity-40">·</span>
        {secondName}
      </p>
      <div className="space-y-2 w-full">
        <p className="text-[0.95em] leading-relaxed" style={{ color: bodyColor }}>
          {dateTimeLine}
        </p>
        {venueBlock}
      </div>
    </div>
  );
}

/* ========== C 타입 ========== */

function HostsIntroPreviewHeroC({ base, hero }: { base: HostsIntroPreviewBase; hero: React.ReactNode }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock, mm, dd } = base;
  const dateSideStyle = {
    color: `var(--key, ${titleColor})`,
  } as const;
  const dateSideClassName = "text-[38px] font-light tabular-nums tracking-tight shrink-0 text-center";
  return (
    <div className="w-full flex flex-col justify-start items-center pt-0">
      <div className="px-6 py-0 w-full max-w-[340px] flex flex-col items-center mt-[60px] mb-5">
        <div className="flex flex-row items-center justify-center gap-10 w-full">
          <span className={dateSideClassName} style={dateSideStyle}>
            {mm}
          </span>
          <div className="flex flex-col items-center text-center gap-1 w-fit max-w-full min-w-0">
            <p className="text-[16px] pt-[2px] font-medium tracking-[0.02em]" style={{ color: titleColor }}>
              {firstName}
            </p>
            <div className="w-12 h-px opacity-35 shrink-0" style={{ backgroundColor: titleColor }} aria-hidden />
            <p className="text-[16px] pt-[2px] font-medium tracking-[0.02em]" style={{ color: titleColor }}>
              {secondName}
            </p>
          </div>
          <span className={dateSideClassName} style={dateSideStyle}>
            {dd}
          </span>
        </div>
      </div>
      <div className="w-full p-0 m-0">{hero}</div>
      <div className="w-full max-w-[320px] mx-0 px-6 pt-0 pb-0 mb-10 mt-10 flex flex-col justify-center items-center space-y-2 text-center">
        <p className="text-[1em] leading-relaxed" style={{ color: bodyColor }}>
          {dateTimeLine}
        </p>
        {venueBlock}
      </div>
    </div>
  );
}

function HostsIntroPreviewSoloC({ base }: { base: HostsIntroPreviewBase }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock } = base;
  return (
    <div className="w-full max-w-[340px] mx-auto flex flex-col items-center text-center gap-3">
      <p className="text-[1.2em] font-medium tracking-[0.02em]" style={{ color: titleColor }}>
        {firstName}
      </p>
      <div className="w-10 h-px opacity-30" style={{ backgroundColor: titleColor }} aria-hidden />
      <p className="text-[1.2em] font-medium tracking-[0.02em]" style={{ color: titleColor }}>
        {secondName}
      </p>
      <div className="mt-2 space-y-2 w-full">
        <p className="text-[1em] leading-relaxed" style={{ color: bodyColor }}>
          {dateTimeLine}
        </p>
        {venueBlock}
      </div>
    </div>
  );
}

/* ========== D 타입 ========== */

function HostsIntroPreviewHeroD({ base, hero }: { base: HostsIntroPreviewBase; hero: React.ReactNode }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock, mm, dd } = base;

  return (
    <div className="w-full flex flex-col items-stretch pt-0 mt-0 mb-0">
      <div className="max-w-[340px] mx-auto w-full px-4 pt-[60px] pb-[30px] flex flex-row items-center justify-center gap-0 text-center mb-0">
        <p className="text-[28px] font-extralight w-[100px] shrink-0 text-center leading-snug break-keep" style={{ color: bodyColor }}>
          {firstName}
        </p>
        <div className="flex flex-col items-center justify-end shrink-0 px-1 min-w-[48px]">
          <span className="text-[20px] font-semibold tabular-nums leading-none" style={{ color: titleColor }}>
            {mm}
          </span>
          <div className="w-8 h-px my-1 opacity-35" style={{ backgroundColor: titleColor }} aria-hidden />
          <span className="text-[20px] font-semibold tabular-nums leading-none" style={{ color: titleColor }}>
            {dd}
          </span>
        </div>
        <p className="text-[28px] font-extralight w-[100px] shrink-0 text-center leading-snug break-keep" style={{ color: bodyColor }}>
          {secondName}
        </p>
      </div>
      <div className="w-full p-0 m-0">{hero}</div>
      <div className="max-w-[340px] mx-auto w-full px-6 pt-0 pb-[30px] mt-[30px] mb-[60px] space-y-2 text-center">
        <p className="text-[0.95em] leading-relaxed" style={{ color: bodyColor }}>
          {dateTimeLine}
        </p>
        {venueBlock}
      </div>
    </div>
  );
}

function HostsIntroPreviewSoloD({ base }: { base: HostsIntroPreviewBase }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock, mm, dd } = base;
  return (
    <div className="w-full max-w-[340px] mx-auto flex flex-col items-stretch text-center gap-5">
      <div className="flex flex-row items-center justify-center gap-2 px-1">
        <p className="text-[13px] flex-1 text-left leading-snug break-keep" style={{ color: bodyColor }}>
          {firstName}
        </p>
        <div className="flex flex-col items-center justify-end shrink-0 px-1 min-w-[52px]">
          <span className="text-[22px] font-semibold tabular-nums leading-none" style={{ color: titleColor }}>
            {mm}
          </span>
          <div className="w-9 h-px my-1 opacity-35" style={{ backgroundColor: titleColor }} aria-hidden />
          <span className="text-[22px] font-semibold tabular-nums leading-none" style={{ color: titleColor }}>
            {dd}
          </span>
        </div>
        <p className="text-[13px] flex-1 text-right leading-snug break-keep" style={{ color: bodyColor }}>
          {secondName}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-[0.95em] leading-relaxed" style={{ color: bodyColor }}>
          {dateTimeLine}
        </p>
        {venueBlock}
      </div>
    </div>
  );
}

/* ========== E 타입 ========== */

function HostsIntroPreviewHeroE({ base, hero }: { base: HostsIntroPreviewBase; hero: React.ReactNode }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock } = base;
  return (
    <div className="w-full flex flex-col items-stretch pt-0">
      <div className="mx-3 sm:mx-4 my-4 border border-gray-200">
        <div className="px-8 pt-16 pb-5 flex flex-col items-center text-center">
          <img
            src="/flower14.svg"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 mb-3"
            aria-hidden
          />
          <p className="text-[1.5em] font-medium tracking-[0.08em]" style={{ color: titleColor }}>
            {firstName}{" "}
            <span className="inline-block opacity-40 mx-0.5 font-normal text-[0.9em]" aria-hidden>
              &
            </span>{" "}
            {secondName}
          </p>
          <div className="w-14 h-px opacity-30 mt-4 mx-auto" style={{ backgroundColor: titleColor }} aria-hidden />
        </div>
        <div className="w-full p-0 m-0">
          <div className="w-full overflow-hidden rounded-none p-0 m-0 block leading-none">{hero}</div>
        </div>
        <div className="max-w-[340px] mx-auto w-full px-6 pt-10 pb-12 space-y-1.5 text-[0.95em] text-center">
          <p className="leading-relaxed" style={{ color: bodyColor }}>
            {dateTimeLine}
          </p>
          {venueBlock}
        </div>
      </div>
    </div>
  );
}

function HostsIntroPreviewSoloE({ base }: { base: HostsIntroPreviewBase }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock } = base;
  return (
    <div className="w-full px-3 sm:px-4 py-4">
      <div className="w-full max-w-[340px] mx-auto flex flex-col items-center text-center gap-4 border border-gray-200 px-6 py-10">
        <p className="text-[1.35em] font-medium tracking-[0.06em]" style={{ color: titleColor }}>
          {firstName}{" "}
          <span className="inline-block opacity-45 mx-0.5 font-normal text-[0.95em]" aria-hidden>
            &
          </span>{" "}
          {secondName}
        </p>
        <div className="w-12 h-px opacity-25 mx-auto" style={{ backgroundColor: titleColor }} aria-hidden />
        <div className="space-y-1.5 text-[0.95em] w-full">
          <p className="leading-relaxed" style={{ color: bodyColor }}>
            {dateTimeLine}
          </p>
          {venueBlock}
        </div>
      </div>
    </div>
  );
}

/* ========== F 타입 — 세로 스택: 이름 / and / 이름 (세리프 + 중앙 정렬) ========== */

function HostsIntroPreviewHeroF({ base, hero }: { base: HostsIntroPreviewBase; hero: React.ReactNode }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock } = base;
  const nameClass =
    "text-[28px] font-[200] leading-[34px] tracking-[5px] text-center align-middle";
  return (
    <div className="w-full flex flex-col items-stretch pt-0">
      <div className="w-full max-w-[340px] mx-auto px-6 pt-12 pb-8 flex flex-col items-center justify-center text-center">
        <p className={nameClass} style={{ color: titleColor }}>
          {firstName}
        </p>
        <p
          className="hosts-intro-f-and-calligraphy mt-0.5 mb-0.5 text-[clamp(16px,4.5vw,26px)] font-normal leading-none tracking-normal opacity-[0.88]"
          style={{ color: `var(--key, ${titleColor})` }}
          lang="en"
        >
          and
        </p>
        <p className={nameClass} style={{ color: titleColor }}>
          {secondName}
        </p>
      </div>
      <div className="w-full p-0 m-0">{hero}</div>
      <div className="max-w-[340px] mx-auto w-full px-6 pt-10 pb-[50px] space-y-2 text-center">
        <p className="text-[1em] leading-relaxed" style={{ color: bodyColor }}>
          {dateTimeLine}
        </p>
        {venueBlock}
      </div>
    </div>
  );
}

function HostsIntroPreviewSoloF({ base }: { base: HostsIntroPreviewBase }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock } = base;
  const nameClass =
    "text-[26px] font-normal leading-[34px] tracking-[5px] text-center align-middle";
  return (
    <div className="w-full max-w-[340px] mx-auto px-6 pt-12 pb-6 flex flex-col items-center text-center">
      <p className={nameClass} style={{ color: titleColor }}>
        {firstName}
      </p>
      <p
        className="hosts-intro-f-and-calligraphy mt-0.5 mb-0.5 text-[clamp(16px,4.5vw,26px)] font-normal leading-none tracking-normal opacity-[0.88]"
        style={{ color: titleColor }}
        lang="en"
      >
        and
      </p>
      <p className={nameClass} style={{ color: titleColor }}>
        {secondName}
      </p>
      <div className="mt-10 space-y-2 w-full">
        <p className="text-[1em] leading-relaxed" style={{ color: bodyColor }}>
          {dateTimeLine}
        </p>
        {venueBlock}
      </div>
    </div>
  );
}

/* ========== G 타입 — 한 줄: 이름 그리고 이름 / 둘째 줄: 결혼합니다 (중앙) ========== */

function HostsIntroPreviewHeroG({ base, hero }: { base: HostsIntroPreviewBase; hero: React.ReactNode }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock } = base;
  return (
    <div className="w-full flex flex-col items-stretch pt-0">
      <div className="w-full max-w-[340px] mx-auto px-6 pt-20 pb-10 flex flex-col items-center text-center gap-2">
        <p className="flex justify-center items-center gap-[5px] text-[clamp(17px,4.2vw,22px)] font-medium leading-snug">
          <span className="text-[24px] font-medium" style={{ color: titleColor }}>{firstName}</span>
          <span className="mx-2 font-normal text-base text-on-surface-30">그리고</span>
          <span className="text-[24px] font-medium" style={{ color: titleColor }}>{secondName}</span>
        </p>
        <p className="text-[24px] font-[200] leading-tight" style={{ color: `var(--key-dark, var(--key, ${titleColor}))` }}>
          결혼합니다
        </p>
      </div>
      <div className="w-full p-0 m-0">{hero}</div>
      <div className="max-w-[340px] mx-auto w-full px-6 pt-10 pb-[50px] space-y-2 text-center">
        <p className="text-[1em] leading-relaxed" style={{ color: bodyColor }}>
          {dateTimeLine}
        </p>
        {venueBlock}
      </div>
    </div>
  );
}

function HostsIntroPreviewSoloG({ base }: { base: HostsIntroPreviewBase }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock } = base;
  return (
    <div className="w-full max-w-[340px] mx-auto px-6 pt-12 pb-6 flex flex-col items-center text-center">
      <div className="space-y-2">
        <p className="text-[clamp(17px,4.2vw,22px)] font-semibold leading-snug">
          <span style={{ color: titleColor }}>{firstName}</span>
          <span className="mx-2 font-normal text-on-surface-30">그리고</span>
          <span style={{ color: titleColor }}>{secondName}</span>
        </p>
        <p className="text-[clamp(17px,4.2vw,22px)] font-semibold leading-tight" style={{ color: titleColor }}>
          결혼합니다
        </p>
      </div>
      <div className="mt-10 w-full space-y-2">
        <p className="text-[1em] leading-relaxed" style={{ color: bodyColor }}>
          {dateTimeLine}
        </p>
        {venueBlock}
      </div>
    </div>
  );
}

/* ========== H 타입 — 날짜 강조(대형 일자 + 월/시간 라인) ========== */

function toMonthLabel(mm: string) {
  const monthIndex = Math.max(1, Math.min(12, Number.parseInt(mm, 10) || 1));
  return ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][monthIndex - 1];
}

function toMeridiemTimeLabel(timeText: string) {
  const raw = (timeText || "").trim();
  if (!raw) return "";
  const compact = raw.replace(/\s+/g, "");
  const koreanMatch = compact.match(/^(오전|오후)(\d{1,2})(?::(\d{2}))?$/);
  if (koreanMatch) {
    const [, meridiem, hourRaw, minuteRaw] = koreanMatch;
    const hour = Number.parseInt(hourRaw, 10);
    const minute = minuteRaw ?? "00";
    return `${meridiem === "오전" ? "AM" : "PM"}${hour}:${minute}`;
  }
  if (/^(AM|PM)/i.test(compact)) return compact.toUpperCase();
  return compact.toUpperCase();
}

function HostsIntroPreviewHeroH({ base, hero }: { base: HostsIntroPreviewBase; hero: React.ReactNode }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock, dd, mm, timeText } = base;
  const monthLabel = toMonthLabel(mm);
  const timeLabel = toMeridiemTimeLabel(timeText);
  return (
    <div className="w-full flex flex-col items-stretch pt-0">
      <div className="w-full max-w-[340px] mx-auto px-6 pt-[58px] pb-[28px] flex flex-col items-center text-center gap-2">
        <p className="text-[50px] font-extralight leading-[0.9] tracking-[0.02em]" style={{ color: `var(--key, ${titleColor})` }}>
          {dd}
        </p>
        <div className="mt-2 mb-2 h-px w-[160px] opacity-30" style={{ backgroundColor: titleColor }} aria-hidden />
        <p className="text-[16px] font-light tracking-[0.12em] leading-none" style={{ color: bodyColor }}>
          {monthLabel}
          {timeLabel ? ` ${timeLabel}` : ""}
        </p>
      </div>
      <div className="w-full p-0 m-0">{hero}</div>
      <div className="max-w-[340px] mx-auto w-full px-6 pt-8 pb-[50px] text-center space-y-3">
        <p className="text-[22px] font-semibold tracking-[0.04em]" style={{ color: titleColor }}>
          {firstName}
          <span className="mx-2 inline-block h-[22px] w-px align-middle border-l-[0.5px] border-current opacity-45" aria-hidden />
          {secondName}
        </p>
        <div className="space-y-2">
          <p className="text-[0.95em] leading-relaxed" style={{ color: bodyColor }}>
            {dateTimeLine}
          </p>
          {venueBlock}
        </div>
      </div>
    </div>
  );
}

function HostsIntroPreviewSoloH({ base }: { base: HostsIntroPreviewBase }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock, dd, mm, timeText } = base;
  const monthLabel = toMonthLabel(mm);
  const timeLabel = toMeridiemTimeLabel(timeText);
  return (
    <div className="w-full max-w-[340px] mx-auto px-6 pt-8 pb-6 flex flex-col items-center text-center">
      <p className="text-[clamp(64px,16vw,96px)] font-extralight leading-[0.9] tracking-[0.02em]" style={{ color: titleColor }}>
        {dd}
      </p>
      <div className="mt-2 mb-2 h-px w-full opacity-30" style={{ backgroundColor: titleColor }} aria-hidden />
      <p className="text-[clamp(18px,4.7vw,26px)] font-light tracking-[0.12em] leading-none" style={{ color: bodyColor }}>
        {monthLabel}
        {timeLabel ? ` ${timeLabel}` : ""}
      </p>
      <p className="mt-7 text-[1.05em] font-medium tracking-[0.04em]" style={{ color: titleColor }}>
        {firstName}
        <span className="mx-2 opacity-45">·</span>
        {secondName}
      </p>
      <div className="mt-4 space-y-2 w-full">
        <p className="text-[0.95em] leading-relaxed" style={{ color: bodyColor }}>
          {dateTimeLine}
        </p>
        {venueBlock}
      </div>
    </div>
  );
}

/* ========== I 타입 — 라벨 + 이름 양측 배치 ========== */

function HostsIntroPreviewHeroI({ base, hero }: { base: HostsIntroPreviewBase; hero: React.ReactNode }) {
  const { titleColor, bodyColor, firstName, secondName, firstRoleEn, secondRoleEn, dateTimeLine, venueBlock } = base;
  const subtleColor = { color: `var(--key, ${titleColor})` } as const;
  const dividerColor = { backgroundColor: `color-mix(in srgb, ${bodyColor} 24%, white)` } as const;

  return (
    <div className="w-full flex flex-col items-stretch pt-0">
      <div className="max-w-[340px] mx-auto w-full h-fit px-4 pt-[60px] pb-[40px]">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-end gap-0 text-center">
          <div className="flex min-w-0 flex-col items-center gap-2">
            <p className="text-[13px] font-light tracking-[0.3em]" style={subtleColor}>
              {firstRoleEn}
            </p>
            <p className="text-[28px] font-extralight leading-[0.92] tracking-[4px] pl-0" style={{ color: titleColor }}>
              {firstName}
            </p>
          </div>
          <div className="mb-0 w-px self-stretch opacity-70" style={dividerColor} aria-hidden />
          <div className="flex min-w-0 flex-col items-center gap-2">
            <p className="text-[13px] font-light tracking-[0.3em]" style={subtleColor}>
              {secondRoleEn}
            </p>
            <p className="text-[28px] font-extralight leading-[0.92] tracking-[4px] pl-0" style={{ color: titleColor }}>
              {secondName}
            </p>
          </div>
        </div>
      </div>
      <div className="w-full p-0 m-0">{hero}</div>
      <div className="max-w-[340px] mx-auto w-full px-6 pt-8 pb-[50px] text-center space-y-2">
        <p className="text-[0.95em] leading-relaxed" style={{ color: bodyColor }}>
          {dateTimeLine}
        </p>
        {venueBlock}
      </div>
    </div>
  );
}

function HostsIntroPreviewSoloI({ base }: { base: HostsIntroPreviewBase }) {
  const { titleColor, bodyColor, firstName, secondName, firstRoleEn, secondRoleEn, dateTimeLine, venueBlock } = base;
  const subtleColor = { color: `color-mix(in srgb, ${bodyColor} 34%, white)` } as const;
  const dividerColor = { backgroundColor: `color-mix(in srgb, ${bodyColor} 24%, white)` } as const;

  return (
    <div className="w-full max-w-[340px] mx-auto px-4 pt-8 pb-6 flex flex-col items-center text-center">
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-end gap-4">
        <div className="flex min-w-0 flex-col items-center gap-3">
          <p className="text-[11px] font-light tracking-[0.28em]" style={subtleColor}>
            {firstRoleEn}
          </p>
          <p className="text-[52px] font-light leading-[0.92] tracking-[0.15em] pl-[0.15em]" style={{ color: titleColor }}>
            {firstName}
          </p>
        </div>
        <div className="mb-2 h-[90px] w-px opacity-70" style={dividerColor} aria-hidden />
        <div className="flex min-w-0 flex-col items-center gap-3">
          <p className="text-[11px] font-light tracking-[0.28em]" style={subtleColor}>
            {secondRoleEn}
          </p>
          <p className="text-[52px] font-light leading-[0.92] tracking-[0.15em] pl-[0.15em]" style={{ color: titleColor }}>
            {secondName}
          </p>
        </div>
      </div>
      <div className="mt-7 space-y-2 w-full">
        <p className="text-[0.95em] leading-relaxed" style={{ color: bodyColor }}>
          {dateTimeLine}
        </p>
        {venueBlock}
      </div>
    </div>
  );
}

/**
 * 인트로 타입 A~I는 각각 전용 컴포넌트로 분리되어 있음.
 * 한 타입의 마진·패딩을 바꿔도 다른 타입 JSX에는 손대지 않으면 영향 없음.
 */
export function HostsIntroPreview({ data, hero }: { data: CardData; hero?: React.ReactNode }) {
  const introType = ((data.main as any).introType ?? "A") as "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";
  const base = useMemo(() => buildHostsIntroBase(data), [data]);

  if (hero) {
    if (introType === "B") return <HostsIntroPreviewHeroB base={base} hero={hero} />;
    if (introType === "C") return <HostsIntroPreviewHeroC base={base} hero={hero} />;
    if (introType === "D") return <HostsIntroPreviewHeroD base={base} hero={hero} />;
    if (introType === "E") return <HostsIntroPreviewHeroE base={base} hero={hero} />;
    if (introType === "F") return <HostsIntroPreviewHeroF base={base} hero={hero} />;
    if (introType === "G") return <HostsIntroPreviewHeroG base={base} hero={hero} />;
    if (introType === "H") return <HostsIntroPreviewHeroH base={base} hero={hero} />;
    if (introType === "I") return <HostsIntroPreviewHeroI base={base} hero={hero} />;
    return <HostsIntroPreviewHeroA base={base} hero={hero} />;
  }

  if (introType === "B") return <HostsIntroPreviewSoloB base={base} />;
  if (introType === "C") return <HostsIntroPreviewSoloC base={base} />;
  if (introType === "D") return <HostsIntroPreviewSoloD base={base} />;
  if (introType === "E") return <HostsIntroPreviewSoloE base={base} />;
  if (introType === "F") return <HostsIntroPreviewSoloF base={base} />;
  if (introType === "G") return <HostsIntroPreviewSoloG base={base} />;
  if (introType === "H") return <HostsIntroPreviewSoloH base={base} />;
  if (introType === "I") return <HostsIntroPreviewSoloI base={base} />;
  return <HostsIntroPreviewSoloA base={base} />;
}
