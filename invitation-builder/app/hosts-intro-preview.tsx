"use client";

import React, { useMemo } from "react";
import type { CardData } from "../store/useCardStore";

/** 인트로 미리보기 공통 파생 값 (타입별 컴포넌트에만 전달) */
export type HostsIntroPreviewBase = {
  titleColor: string;
  bodyColor: string;
  firstName: string;
  secondName: string;
  dateTimeLine: React.ReactNode;
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
  const eventDateText = (data.eventInfo.date ?? "").trim();
  const eventDate = eventDateText ? new Date(`${eventDateText}T00:00:00`) : null;
  const hasValidDate = !!eventDate && Number.isFinite(eventDate.getTime());
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
    dateTimeLine,
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
    <div className="w-full flex flex-col items-stretch">
      <div className="w-full p-0 m-0">{hero}</div>
      <div className="max-w-[340px] mx-auto w-full px-6 pt-10 pb-[50px] space-y-5 text-center">
        <div className="mb-[30px] flex justify-center">
          <div className="h-px w-12 opacity-25" style={{ backgroundColor: titleColor }} aria-hidden />
        </div>
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
    </div>
  );
}

function HostsIntroPreviewSoloA({ base }: { base: HostsIntroPreviewBase }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock } = base;
  return (
    <div className="w-full max-w-[340px] mx-auto space-y-5">
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
        <div className="flex items-baseline justify-center gap-2 sm:gap-3 font-serif">
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
    </div>
  );
}

function HostsIntroPreviewSoloB({ base }: { base: HostsIntroPreviewBase }) {
  const { titleColor, bodyColor, firstName, secondName, dateTimeLine, venueBlock, yy, mm, dd, weekdayKo, hasValidDate } =
    base;
  return (
    <div className="w-full max-w-[340px] mx-auto flex flex-col items-center text-center gap-4">
      <div className="flex items-baseline justify-center gap-2 sm:gap-3 font-serif">
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
    color: `color-mix(in srgb, ${titleColor} 70%, transparent)`,
  } as const;
  const dateSideClassName =
    "text-[clamp(22px,6vw,34px)] font-light tabular-nums tracking-tight shrink-0 text-center";
  return (
    <div className="w-full flex flex-col justify-start items-center pt-0">
      <div className="px-6 py-0 w-full max-w-[340px] flex flex-col items-center mt-[50px] mb-5">
        <div className="flex flex-row items-center justify-center gap-10 w-full font-serif">
          <span className={dateSideClassName} style={dateSideStyle}>
            {mm}
          </span>
          <div className="flex flex-col items-center text-center gap-2 w-fit max-w-full min-w-0">
            <p className="text-[1.15em] font-medium tracking-[0.02em]" style={{ color: titleColor }}>
              {firstName}
            </p>
            <div className="w-12 h-px opacity-35 shrink-0" style={{ backgroundColor: titleColor }} aria-hidden />
            <p className="text-[1.15em] font-medium tracking-[0.02em]" style={{ color: titleColor }}>
              {secondName}
            </p>
          </div>
          <span className={dateSideClassName} style={dateSideStyle}>
            {dd}
          </span>
        </div>
      </div>
      <div className="w-full max-w-[400px] mx-auto overflow-hidden rounded-none px-4 sm:px-6 py-0 m-0 block leading-none">
        {hero}
      </div>
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

  const decoSideLine = (side: "left" | "right") => (
    <div
      className={`block w-px shrink-0 self-stretch min-h-[100px] sm:min-h-[120px] opacity-25 ${side === "left" ? "mr-0.5 sm:mr-2" : "ml-0.5 sm:ml-2"}`}
      style={{ background: `linear-gradient(to bottom, transparent, ${titleColor}, transparent)` }}
      aria-hidden
    />
  );

  return (
    <div className="w-full flex flex-col items-stretch pt-0 mt-0 mb-0">
      <div className="max-w-[340px] mx-auto w-full px-4 pt-[60px] pb-[30px] flex flex-row items-center justify-center gap-2 text-center mb-0">
        <p className="text-[22px] font-extralight flex-1 text-center leading-snug break-keep" style={{ color: bodyColor }}>
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
        <p className="text-[22px] font-extralight flex-1 text-center leading-snug break-keep" style={{ color: bodyColor }}>
          {secondName}
        </p>
      </div>
      <div className="flex flex-row items-stretch gap-0 px-1 sm:px-2">
        {decoSideLine("left")}
        <div className="flex-1 min-w-0 p-0 m-0">
          <div className="w-full overflow-hidden rounded-none p-0 m-0 block leading-none">{hero}</div>
        </div>
        {decoSideLine("right")}
      </div>
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
        <div className="px-8 pt-16 pb-10 flex flex-col items-center text-center">
          <img
            src="/flower14.svg"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 mb-3"
            aria-hidden
          />
          <p className="text-[1.25em] font-medium tracking-[0.08em]" style={{ color: titleColor }}>
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

/**
 * 인트로 타입 A~E는 각각 전용 컴포넌트로 분리되어 있음.
 * 한 타입의 마진·패딩을 바꿔도 다른 타입 JSX에는 손대지 않으면 영향 없음.
 */
export function HostsIntroPreview({ data, hero }: { data: CardData; hero?: React.ReactNode }) {
  const introType = ((data.main as any).introType ?? "A") as "A" | "B" | "C" | "D" | "E";
  const base = useMemo(() => buildHostsIntroBase(data), [data]);

  if (hero) {
    if (introType === "B") return <HostsIntroPreviewHeroB base={base} hero={hero} />;
    if (introType === "C") return <HostsIntroPreviewHeroC base={base} hero={hero} />;
    if (introType === "D") return <HostsIntroPreviewHeroD base={base} hero={hero} />;
    if (introType === "E") return <HostsIntroPreviewHeroE base={base} hero={hero} />;
    return <HostsIntroPreviewHeroA base={base} hero={hero} />;
  }

  if (introType === "B") return <HostsIntroPreviewSoloB base={base} />;
  if (introType === "C") return <HostsIntroPreviewSoloC base={base} />;
  if (introType === "D") return <HostsIntroPreviewSoloD base={base} />;
  if (introType === "E") return <HostsIntroPreviewSoloE base={base} />;
  return <HostsIntroPreviewSoloA base={base} />;
}
