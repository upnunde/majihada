"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";

type Question = {
  id:
    | "groomName"
    | "brideName"
    | "weddingDate"
    | "weddingTime"
    | "venueName"
    | "venueDetail"
    | "venueAddress";
  question: string;
  placeholder?: string;
  options?: string[];
};

const questions: Question[] = [
  { id: "groomName", question: "신랑의 이름을 알려 주세요.", placeholder: "예: 홍길동" },
  { id: "brideName", question: "신부의 이름을 알려 주세요.", placeholder: "예: 김여사" },
  { id: "weddingDate", question: "예식 날짜를 입력해 주세요.", placeholder: "예: 2026-10-17" },
  { id: "weddingTime", question: "예식 시간을 입력해 주세요.", placeholder: "예: 오후 1:00" },
  { id: "venueName", question: "웨딩홀 이름을 알려 주세요.", placeholder: "예: OOO웨딩홀" },
  { id: "venueDetail", question: "홀/층 등 상세 장소를 알려 주세요.", placeholder: "예: 그랜드홀 3F" },
  { id: "venueAddress", question: "웨딩홀 주소를 입력해 주세요.", placeholder: "예: 서울특별시 강남구 ..." },
];

const weddingTimeOptions = [
  "오전 11:00",
  "오전 11:30",
  "오후 12:00",
  "오후 12:30",
  "오후 1:00",
  "오후 1:30",
  "오후 2:00",
  "오후 2:30",
  "오후 3:00",
  "오후 3:30",
  "오후 4:00",
  "오후 4:30",
  "오후 5:00",
  "오후 5:30",
  "오후 6:00",
];

export default function MobileInvitationChatPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<Partial<Record<Question["id"], string>>>({});
  const [addressKeyword, setAddressKeyword] = useState("");
  const [addressResults, setAddressResults] = useState<string[]>([]);
  const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false);
  const [isAddressSearching, setIsAddressSearching] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const weddingDateInputRef = useRef<HTMLInputElement | null>(null);

  const currentQuestion = questions[currentIndex];
  const isDone = currentIndex >= questions.length;

  const chatHistory = useMemo(() => {
    return questions
      .map((q, index) => ({
        question: q.question,
        answer: answers[q.id],
        index,
      }))
      .filter((item) => item.index < currentIndex || !!item.answer);
  }, [answers, currentIndex, isDone]);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatHistory, currentIndex, isDone]);

  const submitAnswer = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: trimmed }));
    setDraft("");
    setCurrentIndex((prev) => prev + 1);
  };

  const goToEditor = () => {
    const params = new URLSearchParams({
      onboarding: "1",
      groomName: answers.groomName ?? "",
      brideName: answers.brideName ?? "",
      weddingDate: answers.weddingDate ?? "",
      weddingTime: answers.weddingTime ?? "",
      venueName: answers.venueName ?? "",
      venueDetail: answers.venueDetail ?? "",
      venueAddress: answers.venueAddress ?? "",
    });
    router.push(`/editor?${params.toString()}`);
  };

  const openDatePicker = () => {
    if (!weddingDateInputRef.current) return;
    const input = weddingDateInputRef.current;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  const runAddressSearch = async () => {
    const keyword = addressKeyword.trim();
    if (!keyword) return;
    setIsAddressSearching(true);
    try {
      const res = await fetch(`/api/address-search?q=${encodeURIComponent(keyword)}&limit=6`);
      const json = (await res.json()) as { results?: string[] };
      setAddressResults(Array.isArray(json.results) ? json.results : []);
    } catch {
      setAddressResults([]);
    } finally {
      setIsAddressSearching(false);
    }
  };

  return (
    <>
      <AppHeader />
      <main className="h-[calc(100vh-64px)] bg-[color:var(--surface-20)] px-4 py-4">
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#e7e9ee] bg-white shadow-sm">
          <div className="flex h-14 items-center justify-between border-b border-[#eef0f4] bg-white px-4">
            <div>
              <p className="text-sm font-semibold text-[#111]">dearhour 도우미</p>
              <p className="text-xs text-[#6b7280]">모바일청첩장 필수 정보 입력</p>
            </div>
            <span className="rounded-full border border-[#e3e6eb] bg-[#f9fafb] px-3 py-1 text-xs font-medium text-[#4b5563]">
              {Math.min(currentIndex + 1, questions.length)}/{questions.length}
            </span>
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto bg-white px-4 py-5">
            <div className="space-y-3">
              {chatHistory.map((item, idx) => (
                <div key={`${item.question}-${idx}`} className="space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="h-8 w-8 rounded-full border border-[#eceff4] bg-[#f7f8fb]" />
                    <div className="max-w-[78%] rounded-2xl rounded-bl-md border border-[#eceff4] bg-[#fafbfc] px-4 py-3 text-sm text-[#222]">
                      {item.question}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[78%] rounded-2xl rounded-br-md border border-[#e7e9ee] bg-white px-4 py-3 text-sm font-medium text-[#111]">
                      {item.answer}
                    </div>
                  </div>
                </div>
              ))}

              {!isDone && (
                <div className="space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="h-8 w-8 rounded-full border border-[#eceff4] bg-[#f7f8fb]" />
                    <div className="max-w-[78%] rounded-2xl rounded-bl-md border border-[#eceff4] bg-[#fafbfc] px-4 py-3 text-sm text-[#222]">
                      {currentQuestion.question}
                    </div>
                  </div>
                  {currentQuestion.id === "weddingDate" && (
                    <div className="ml-10 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openDatePicker}
                        className="inline-flex h-11 items-center whitespace-nowrap rounded-full border border-[#dfe3e9] bg-white px-5 text-sm font-semibold text-[#111] hover:bg-[#f8f9fb]"
                      >
                        날짜선택하기
                      </button>
                      <input
                        ref={weddingDateInputRef}
                        type="date"
                        className="h-11 min-w-[168px] rounded-full border border-[#d7dce4] bg-white px-4 text-sm outline-none focus:border-[#9ba6b8]"
                        onChange={(e) => {
                          if (!e.target.value) return;
                          submitAnswer(e.target.value);
                        }}
                      />
                    </div>
                  )}
                  {currentQuestion.id === "weddingTime" && (
                    <div className="ml-10 flex items-center gap-2">
                      <select
                        defaultValue=""
                        className="h-11 min-w-[188px] rounded-full border border-[#d7dce4] bg-white px-4 text-sm outline-none focus:border-[#9ba6b8]"
                        onChange={(e) => {
                          if (!e.target.value) return;
                          submitAnswer(e.target.value);
                        }}
                      >
                        <option value="" disabled>
                          시간선택하기
                        </option>
                        {weddingTimeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {currentQuestion.id === "venueAddress" && (
                    <div className="ml-10 space-y-2">
                      <button
                        type="button"
                        onClick={() => setIsAddressSearchOpen((prev) => !prev)}
                        className="inline-flex h-11 items-center whitespace-nowrap rounded-full border border-[#dfe3e9] bg-white px-5 text-sm font-semibold text-[#111] hover:bg-[#f8f9fb]"
                      >
                        주소검색하기
                      </button>
                      {isAddressSearchOpen && (
                        <div className="w-full max-w-[520px] rounded-xl border border-[#e5e7eb] bg-white p-3">
                          <div className="flex items-center gap-2">
                            <input
                              value={addressKeyword}
                              onChange={(e) => setAddressKeyword(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key !== "Enter") return;
                                e.preventDefault();
                                void runAddressSearch();
                              }}
                              placeholder="예: 더신라서울, 강남구 웨딩홀"
                              className="h-10 w-full rounded-lg border border-[#d7dce4] bg-white px-3 text-sm outline-none focus:border-[#9ba6b8]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                void runAddressSearch();
                              }}
                              className="inline-flex h-10 items-center whitespace-nowrap rounded-lg bg-[#111] px-4 text-sm font-semibold text-white hover:bg-black"
                            >
                              검색
                            </button>
                          </div>
                          <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-[#eff1f4] bg-[#fafbfc]">
                            {isAddressSearching ? (
                              <p className="px-3 py-3 text-sm text-[#6b7280]">주소를 찾는 중입니다...</p>
                            ) : addressResults.length > 0 ? (
                              addressResults.map((addr) => (
                                <button
                                  key={addr}
                                  type="button"
                                  onClick={() => {
                                    submitAnswer(addr);
                                    setAddressKeyword("");
                                    setAddressResults([]);
                                    setIsAddressSearchOpen(false);
                                  }}
                                  className="block w-full border-b border-[#edf0f3] px-3 py-3 text-left text-sm text-[#222] last:border-b-0 hover:bg-white"
                                >
                                  {addr}
                                </button>
                              ))
                            ) : (
                              <p className="px-3 py-3 text-sm text-[#9aa1ab]">검색 결과가 없습니다.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[#eef0f4] bg-white p-3">
            {!isDone && currentQuestion.options ? (
              <div className="flex flex-wrap gap-2">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => submitAnswer(option)}
                    className="inline-flex h-10 items-center rounded-full border border-[#dfe3e9] bg-white px-4 text-sm font-medium text-[#111] hover:bg-[#f8f9fb]"
                  >
                    {option}타입
                  </button>
                ))}
              </div>
            ) : !isDone && currentQuestion.id === "weddingDate" ? (
              <div className="flex h-11 items-center text-sm text-[#8b95a1]">
                날짜는 질문 말풍선 아래에서 선택해 주세요.
              </div>
            ) : !isDone && currentQuestion.id === "weddingTime" ? (
              <div className="flex h-11 items-center text-sm text-[#8b95a1]">
                예식 시간은 질문 말풍선 아래에서 선택해 주세요.
              </div>
            ) : !isDone && currentQuestion.id === "venueAddress" ? (
              <div className="flex h-11 items-center text-sm text-[#8b95a1]">
                주소는 질문 말풍선 아래에서 검색해 주세요.
              </div>
            ) : !isDone ? (
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    if ((e.nativeEvent as KeyboardEvent).isComposing) return;
                    e.preventDefault();
                    submitAnswer(draft);
                  }}
                  placeholder={currentQuestion.placeholder}
                  className="h-11 w-full rounded-full border border-[#d7dce4] bg-white px-4 text-sm outline-none focus:border-[#9ba6b8]"
                />
                <button
                  type="button"
                  onClick={() => submitAnswer(draft)}
                  className="inline-flex h-11 items-center whitespace-nowrap rounded-full bg-[#111] px-5 text-sm font-semibold text-white hover:bg-black"
                >
                  전송
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={goToEditor}
                  className="inline-flex h-11 items-center whitespace-nowrap rounded-full bg-[#111] px-5 text-sm font-semibold text-white hover:bg-black"
                >
                  에디터로 이동
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
