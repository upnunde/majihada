"use client";

import AppHeader from "@/components/AppHeader";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

const invitations = [
  {
    id: "moment-001",
    title: "모먼트",
    code: "KQ7M6m",
    deleteAt: "2026-05-08",
    status: "결제 전",
  },
  {
    id: "wedding-002",
    title: "민준 · 서연 결혼식",
    code: "WED23a",
    deleteAt: "2026-06-21",
    status: "결제 완료",
  },
];

const payments = [
  { id: "PAY-20260408001", product: "워터마크 제거", amount: "9,900원", status: "결제 완료", date: "2026-04-08" },
  { id: "PAY-20260330007", product: "워터마크 제거", amount: "9,900원", status: "환불 완료", date: "2026-03-30" },
];

export default function MyPage() {
  const [activeTab, setActiveTab] = useState<"invitation" | "payment">("invitation");
  const [shareModalInvitation, setShareModalInvitation] = useState<{ id: string; title: string } | null>(null);
  const [selectedShareVariant, setSelectedShareVariant] = useState<"basic" | "friends" | "family" | "coworkers">("basic");

  const handleShareCopy = async () => {
    if (!shareModalInvitation) return;
    const variantPath: Record<typeof selectedShareVariant, string> = {
      basic: "basic",
      friends: "friends",
      family: "family",
      coworkers: "coworkers",
    };
    const shareUrl = `${window.location.origin}/preview/${shareModalInvitation.id}?public=1&v=${variantPath[selectedShareVariant]}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      window.alert("공유 링크가 복사되었습니다.\n하객에게 바로 전달해 보세요.");
      setShareModalInvitation(null);
    } catch {
      window.alert(`공유 링크를 복사하지 못했습니다.\n아래 링크를 직접 복사해 주세요.\n${shareUrl}`);
    }
  };

  return (
    <>
      <AppHeader />
      <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-12">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#111]">마이페이지</h1>
              <p className="mt-1 text-sm text-[#6b7280]">내 제작내역과 결제내역을 한 번에 관리합니다.</p>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("invitation")}
              className={`inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition-colors ${
                activeTab === "invitation"
                  ? "bg-[#111] text-white"
                  : "border border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-[#f8f8f8]"
              }`}
            >
              제작내역
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("payment")}
              className={`inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition-colors ${
                activeTab === "payment"
                  ? "bg-[#111] text-white"
                  : "border border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-[#f8f8f8]"
              }`}
            >
              결제내역
            </button>
          </div>

          {activeTab === "invitation" ? (
            <section>
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <article
                    key={invitation.id}
                    className="flex flex-wrap items-center gap-4 rounded-lg border border-[#ececec] bg-white p-4"
                  >
                    <div className="h-24 w-40 overflow-hidden rounded-md border border-[#e5e7eb] bg-white">
                      <Image
                        src="/flower01.svg"
                        alt={`${invitation.title} 썸네일`}
                        width={160}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-[170px] flex-1">
                      <h3 className="text-lg font-semibold text-[#111]">{invitation.title}</h3>
                      <p className="mt-2 text-sm text-[#6b7280]">삭제 예정일: {invitation.deleteAt}</p>
                      {invitation.status !== "결제 전" && (
                        <p className="mt-1 text-sm text-[#6b7280]">상태: {invitation.status}</p>
                      )}
                    </div>

                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      <Link
                        href={`/editor?invitationId=${invitation.id}`}
                        className="inline-flex h-10 items-center rounded-md border border-[#dedede] bg-white px-4 text-sm font-medium text-[#111] hover:bg-[#f7f7f7]"
                      >
                        편집
                      </Link>
                      <Link
                        href={`/preview/${invitation.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center rounded-md border border-[#dedede] bg-white px-4 text-sm font-medium text-[#111] hover:bg-[#f7f7f7]"
                      >
                        미리보기
                      </Link>
                      {invitation.status === "결제 완료" && (
                        <button
                          type="button"
                          onClick={() => {
                            setShareModalInvitation({ id: invitation.id, title: invitation.title });
                            setSelectedShareVariant("basic");
                          }}
                          className="inline-flex h-10 items-center rounded-md border border-[#dedede] bg-white px-4 text-sm font-medium text-[#111] hover:bg-[#f7f7f7]"
                        >
                          공유하기
                        </button>
                      )}
                      {invitation.status !== "결제 완료" && (
                        <Link
                          href={`/payment?invitationId=${invitation.id}&intent=remove-watermark`}
                          className="inline-flex h-10 items-center rounded-md border border-[#dedede] bg-white px-4 text-sm font-medium text-[#111] hover:bg-[#f7f7f7]"
                        >
                          워터마크 제거
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <section>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#efefef] p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#111]">{payment.product}</p>
                      <p className="mt-1 text-xs text-[#6b7280]">
                        주문번호 {payment.id} · {payment.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#111]">{payment.amount}</p>
                      <p className="mt-1 text-xs text-[#6b7280]">{payment.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {shareModalInvitation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <h3 className="text-lg font-semibold text-[#111]">공유 링크 선택</h3>
              <p className="mt-1 text-sm text-[#6b7280]">{shareModalInvitation.title}에 사용할 링크 타입을 선택해 주세요.</p>

              <div className="mt-4 space-y-2">
                {[
                  { id: "basic", label: "기본 링크" },
                  { id: "friends", label: "지인용 링크" },
                  { id: "family", label: "부모님/친척용 링크" },
                  { id: "coworkers", label: "직장동료용 링크" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedShareVariant(option.id as typeof selectedShareVariant)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                      selectedShareVariant === option.id
                        ? "border-[#111] bg-[#111] text-white"
                        : "border-[#e5e7eb] bg-white text-[#111] hover:bg-[#f9fafb]"
                    }`}
                  >
                    <span>{option.label}</span>
                    {selectedShareVariant === option.id && <span>선택됨</span>}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShareModalInvitation(null)}
                  className="inline-flex h-10 items-center rounded-lg border border-[#e5e7eb] px-4 text-sm font-medium text-[#4b5563] hover:bg-[#f9fafb]"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => void handleShareCopy()}
                  className="inline-flex h-10 items-center rounded-lg bg-[#111] px-4 text-sm font-semibold text-white hover:bg-black"
                >
                  URL 복사
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
