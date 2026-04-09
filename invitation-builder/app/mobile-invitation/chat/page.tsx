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

const isTextInputQuestionId = (id: Question["id"]) =>
  id === "groomName" || id === "brideName" || id === "venueName" || id === "venueDetail";

export default function MobileInvitationChatPage() {
  const TIME_MENU_WIDTH = 240;
  const TIME_MENU_HEIGHT = 400;
  const VIEWPORT_MARGIN = 12;
  const MENU_GAP = 8;

  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<Partial<Record<Question["id"], string>>>({});
  const [addressKeyword, setAddressKeyword] = useState("");
  const [addressResults, setAddressResults] = useState<string[]>([]);
  const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false);
  const [isAddressSearching, setIsAddressSearching] = useState(false);
  const [isWeddingTimePickerOpen, setIsWeddingTimePickerOpen] = useState(false);
  const [timeMenuAnchor, setTimeMenuAnchor] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const weddingDateInputRef = useRef<HTMLInputElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const editWeddingDateInputRef = useRef<HTMLInputElement | null>(null);

  const currentQuestion = questions[currentIndex] ?? questions[questions.length - 1];
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
  const isEditingExistingAnswer = !isDone && currentIndex < chatHistory.length;

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;

    // Render 직후 높이 계산이 늦는 경우를 대비해 다음 프레임에서 하단으로 고정합니다.
    const syncToBottom = () => {
      container.scrollTop = container.scrollHeight;
      chatBottomRef.current?.scrollIntoView({ block: "end" });
    };

    syncToBottom();
    const rafId = window.requestAnimationFrame(syncToBottom);
    return () => window.cancelAnimationFrame(rafId);
  }, [chatHistory, currentIndex, isDone, isAddressSearchOpen, isAddressSearching, addressResults.length]);

  useEffect(() => {
    if (isDone || !isTextInputQuestionId(currentQuestion.id)) return;
    const input = textInputRef.current;
    if (!input) return;
    const rafId = window.requestAnimationFrame(() => {
      input.focus();
      const cursorIndex = input.value.length;
      input.setSelectionRange(cursorIndex, cursorIndex);
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [currentIndex, currentQuestion.id, isDone]);

  const submitAnswer = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const nextAnswers = { ...answers, [currentQuestion.id]: trimmed };
    const nextQuestionIndex = questions.findIndex(
      (question, index) => index > currentIndex && !nextAnswers[question.id],
    );

    setAnswers(nextAnswers);
    setDraft("");
    setCurrentIndex(nextQuestionIndex === -1 ? questions.length : nextQuestionIndex);
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

  const openTimeMenuAt = (element: HTMLButtonElement) => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - VIEWPORT_MARGIN - (rect.bottom + MENU_GAP);
    const spaceAbove = rect.top - MENU_GAP - VIEWPORT_MARGIN;
    const shouldOpenBelow = spaceBelow >= 280 || spaceBelow >= spaceAbove;
    const maxHeight = Math.max(
      200,
      Math.min(TIME_MENU_HEIGHT, shouldOpenBelow ? spaceBelow : spaceAbove),
    );
    const top = shouldOpenBelow
      ? Math.min(rect.bottom + MENU_GAP, viewportHeight - VIEWPORT_MARGIN - maxHeight)
      : Math.max(VIEWPORT_MARGIN, rect.top - MENU_GAP - maxHeight);

    let left = rect.right - TIME_MENU_WIDTH;
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

    setTimeMenuAnchor({
      top,
      left,
      width: TIME_MENU_WIDTH,
      maxHeight,
    });
    setIsWeddingTimePickerOpen(true);
  };

  const closeTimeMenu = () => {
    setIsWeddingTimePickerOpen(false);
    setTimeMenuAnchor(null);
  };

  const startEditAt = (index: number, triggerEl?: HTMLButtonElement) => {
    const targetQuestion = questions[index];
    if (!targetQuestion) return;

    const previousAnswer = answers[targetQuestion.id] ?? "";

    setCurrentIndex(index);
    setIsAddressSearchOpen(false);
    setAddressResults([]);
    setAddressKeyword("");
    if (targetQuestion.id === "weddingTime" && triggerEl) {
      openTimeMenuAt(triggerEl);
    } else {
      closeTimeMenu();
    }
    setDraft(
      targetQuestion.id === "groomName" ||
        targetQuestion.id === "brideName" ||
        targetQuestion.id === "venueName" ||
        targetQuestion.id === "venueDetail"
        ? previousAnswer
        : "",
    );

    const isTextQuestion = isTextInputQuestionId(targetQuestion.id);
    if (isTextQuestion) {
      window.setTimeout(() => {
        const input = textInputRef.current;
        if (!input) return;
        input.focus();
        const cursorIndex = input.value.length;
        input.setSelectionRange(cursorIndex, cursorIndex);
      }, 0);
    }

    if (targetQuestion.id === "weddingDate") {
      window.setTimeout(() => {
        const input = editWeddingDateInputRef.current;
        if (!input) return;
        input.focus();
        if (typeof input.showPicker === "function") {
          input.showPicker();
        }
      }, 0);
    }

  };

  return (
    <>
      <AppHeader />
      <main className="h-[calc(100vh-64px)] bg-[color:var(--surface-20)] px-4 py-4">
        <div className="mx-auto flex h-full w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-[#e7e9ee] bg-white shadow-sm">
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
                  <div className="flex items-start justify-start gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#eceff4] bg-[#f7f8fb] text-[10px] font-semibold text-[#6b7280]">
                      DH
                    </div>
                    <div className="max-w-[78%] rounded-2xl rounded-bl-md border border-[#eceff4] bg-[#fafbfc] px-4 py-3 text-sm text-[#222]">
                      {item.question}
                    </div>
                  </div>
                  <div className="group relative flex flex-col items-end">
                    <div
                      className={`max-w-[78%] rounded-2xl rounded-br-md bg-[#fff1f6] px-4 py-3 text-sm font-medium text-[#111] ${
                        currentIndex === item.index
                          ? "ring-2 ring-inset ring-[#f472b6]"
                          : ""
                      }`}
                    >
                      {item.answer}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => startEditAt(item.index, e.currentTarget)}
                      className="mt-1 inline-flex h-7 items-center self-end rounded-full border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#6b7280] opacity-0 transition-opacity hover:bg-[#f8f9fb] focus:opacity-100 group-hover:opacity-100"
                    >
                      수정
                    </button>
                    {currentIndex === item.index && currentQuestion.id === "weddingDate" && (
                      <input
                        ref={editWeddingDateInputRef}
                        type="date"
                        className="pointer-events-none absolute right-0 top-[calc(100%+4px)] h-7 w-12 opacity-0"
                        tabIndex={-1}
                        aria-hidden="true"
                        value={answers.weddingDate ?? ""}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          submitAnswer(e.target.value);
                        }}
                      />
                    )}
                  </div>
                  {currentIndex === item.index && currentQuestion.id === "venueAddress" && (
                    <div className="ml-10 mt-2 w-full max-w-[520px] rounded-xl border border-[#e5e7eb] bg-white p-3">
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
              ))}

              {!isDone && !isEditingExistingAnswer && (
                <div className="space-y-2">
                  <div className="flex items-start justify-start gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#eceff4] bg-[#f7f8fb] text-[10px] font-semibold text-[#6b7280]">
                      DH
                    </div>
                    <div className="max-w-[78%] rounded-2xl rounded-bl-md border border-[#eceff4] bg-[#fafbfc] px-4 py-3 text-sm text-[#222]">
                      {currentQuestion.question}
                    </div>
                  </div>
                  {currentQuestion.id === "weddingDate" && (
                    <div className="ml-10 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openDatePicker}
                        className="inline-flex h-11 appearance-none items-center whitespace-nowrap rounded-full border border-[#dfe3e9] bg-white px-5 text-sm font-semibold text-[#111] hover:bg-[#f8f9fb] [background-image:none] [-webkit-appearance:none] [-moz-appearance:none]"
                      >
                        날짜선택하기
                      </button>
                      <input
                        ref={weddingDateInputRef}
                        type="date"
                        className="sr-only"
                        tabIndex={-1}
                        aria-hidden="true"
                        onChange={(e) => {
                          if (!e.target.value) return;
                          submitAnswer(e.target.value);
                        }}
                      />
                    </div>
                  )}
                  {currentQuestion.id === "weddingTime" && currentIndex >= chatHistory.length && (
                    <div className="relative ml-10 space-y-2">
                      <button
                        type="button"
                        onClick={(e) => openTimeMenuAt(e.currentTarget)}
                        className="inline-flex h-11 items-center whitespace-nowrap rounded-full border border-[#dfe3e9] bg-white px-5 text-sm font-semibold text-[#111] hover:bg-[#f8f9fb]"
                      >
                        시간선택하기
                      </button>
                    </div>
                  )}
                  {currentQuestion.id === "venueAddress" && currentIndex >= chatHistory.length && (
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
              <div ref={chatBottomRef} />
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
                  ref={textInputRef}
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
        {isWeddingTimePickerOpen && timeMenuAnchor && (
          <>
            <button
              type="button"
              aria-label="시간 메뉴 닫기"
              className="fixed inset-0 z-40"
              onClick={closeTimeMenu}
            />
            <div
              className="fixed z-50 overflow-y-auto rounded-xl border border-[#e5e7eb] bg-white shadow-xl"
              style={{
                top: `${timeMenuAnchor.top}px`,
                left: `${timeMenuAnchor.left}px`,
                width: `${timeMenuAnchor.width}px`,
                maxHeight: `${timeMenuAnchor.maxHeight}px`,
              }}
            >
              {weddingTimeOptions.map((time) => (
                <button
                  key={`floating-${time}`}
                  type="button"
                  onClick={() => {
                    submitAnswer(time);
                    closeTimeMenu();
                  }}
                  className="block w-full border-b border-[#edf0f3] px-4 py-2.5 text-left text-sm font-medium text-[#111] last:border-b-0 hover:bg-[#f8f9fb]"
                >
                  {time}
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
