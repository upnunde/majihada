 "use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";

const plans = [
  { name: "기본", price: "무료", desc: "초대장 생성 및 공유" },
  { name: "프리미엄", price: "9,900원", desc: "도메인/통계/추가 커스텀 기능" },
];

const watermarkDurationOptions = [
  { id: "3m", label: "3달", months: 3, price: "9,900원" },
  { id: "5m", label: "5달", months: 5, price: "14,900원" },
  { id: "12m", label: "1년", months: 12, price: "29,000원" },
] as const;

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId") ?? "";
  const intent = searchParams.get("intent") ?? "";
  const [selectedDurationId, setSelectedDurationId] = useState<(typeof watermarkDurationOptions)[number]["id"]>("3m");
  const [eventCode, setEventCode] = useState("");
  const [appliedEventCode, setAppliedEventCode] = useState<string | null>(null);
  const selectedDuration = useMemo(
    () => watermarkDurationOptions.find((option) => option.id === selectedDurationId) ?? watermarkDurationOptions[0],
    [selectedDurationId],
  );
  const baseAmount = useMemo(
    () => Number(selectedDuration.price.replace(/[^0-9]/g, "")),
    [selectedDuration.price],
  );
  const discountAmount = appliedEventCode ? Math.min(2000, baseAmount) : 0;
  const finalAmount = Math.max(0, baseAmount - discountAmount);

  return (
    <>
      <AppHeader />
      <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-14">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="text-2xl font-semibold text-[#111]">결제</h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            추후 PG 연동을 고려한 기본 결제 페이지 구조입니다.
          </p>
          {invitationId && (
            <div className="mt-4 rounded-lg border border-[#e7dcc8] bg-[#faf6ee] px-4 py-3 text-sm text-[#5e4a2f]">
              대상 초대장: {invitationId}
              {intent === "remove-watermark" ? " · 워터마크 제거 결제 진행" : ""}
            </div>
          )}

          {intent === "remove-watermark" ? (
            <section className="mt-8 rounded-xl border border-[#e5e7eb] p-5">
              <h2 className="text-lg font-semibold text-[#111]">워터마크 제거 기간 선택</h2>
              <p className="mt-2 text-sm text-[#6b7280]">
                선택한 기간 동안 초대장 공유 링크가 유지되며, 워터마크가 제거된 상태로 제공됩니다.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {watermarkDurationOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedDurationId(option.id)}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      selectedDurationId === option.id
                        ? "border-[#111] bg-[#111] text-white"
                        : "border-[#e5e7eb] bg-white text-[#111] hover:bg-[#f9fafb]"
                    }`}
                  >
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className={`mt-1 text-xl font-bold ${selectedDurationId === option.id ? "text-white" : "text-[#111]"}`}>
                      {option.price}
                    </p>
                    <p className={`mt-1 text-xs ${selectedDurationId === option.id ? "text-white/80" : "text-[#6b7280]"}`}>
                      링크 유지 {option.months}개월
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#f9fafb] px-4 py-3">
                <p className="text-sm text-[#4b5563]">
                  선택 기간: <span className="font-semibold text-[#111]">{selectedDuration.label}</span> · 링크 유지{" "}
                  <span className="font-semibold text-[#111]">{selectedDuration.months}개월</span>
                </p>
                <div className="w-full rounded-lg border border-[#e5e7eb] bg-white p-3">
                  <p className="mb-2 text-xs font-semibold text-[#374151]">이벤트 코드</p>
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={eventCode}
                      onChange={(e) => setEventCode(e.target.value)}
                      placeholder="코드 입력"
                      className="h-10 flex-1 min-w-[180px] rounded-md border border-[#d1d5db] px-3 text-sm outline-none focus:border-[#111]"
                    />
                    <button
                      type="button"
                      className="inline-flex h-10 items-center rounded-md border border-[#d1d5db] px-3 text-sm font-medium text-[#111] hover:bg-[#f9fafb]"
                      onClick={() => {
                        const normalized = eventCode.trim().toUpperCase();
                        if (!normalized) return;
                        if (normalized === "DEARHOUR2000") {
                          setAppliedEventCode(normalized);
                          return;
                        }
                        window.alert("유효하지 않은 이벤트 코드입니다.");
                      }}
                    >
                      적용
                    </button>
                  </div>
                  {appliedEventCode ? (
                    <p className="mt-2 text-xs text-emerald-700">
                      {appliedEventCode} 적용됨 · -{discountAmount.toLocaleString("ko-KR")}원
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-[#6b7280]">예시 코드: DEARHOUR2000</p>
                  )}
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 items-center rounded-lg bg-[#111] px-4 text-sm font-semibold text-white hover:bg-black"
                >
                  {finalAmount.toLocaleString("ko-KR")}원 결제하기
                </button>
              </div>
            </section>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <section key={plan.name} className="rounded-xl border border-[#e5e7eb] p-5">
                  <h2 className="text-lg font-semibold text-[#111]">{plan.name}</h2>
                  <p className="mt-1 text-2xl font-bold text-[#111]">{plan.price}</p>
                  <p className="mt-2 text-sm text-[#6b7280]">{plan.desc}</p>
                  <button
                    type="button"
                    className="mt-4 inline-flex h-10 items-center rounded-lg border border-[#e5e7eb] px-4 text-sm font-medium text-[#111] hover:bg-[#f9fafb]"
                  >
                    {plan.name} 선택
                  </button>
                </section>
              ))}
            </div>
          )}

          <div className="mt-8">
            <Link href="/mypage" className="text-sm text-[#6b7280] hover:text-[#111]">
              마이페이지로 이동
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <>
          <AppHeader />
          <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-14">
            <div className="mx-auto w-full max-w-4xl">
              <h1 className="text-2xl font-semibold text-[#111]">결제</h1>
            </div>
          </main>
        </>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}
