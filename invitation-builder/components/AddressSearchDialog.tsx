"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AddressSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
  onSelectAddress: (address: string) => void;
};

export default function AddressSearchDialog({
  open,
  onOpenChange,
  initialQuery = "",
  onSelectAddress,
}: AddressSearchDialogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const normalizedInitial = useMemo(() => initialQuery.trim(), [initialQuery]);

  useEffect(() => {
    if (!open) return;
    setQuery(normalizedInitial);
    setSelected(null);
    setResults([]);
    setLoading(false);
  }, [open, normalizedInitial]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    setSelected(null);

    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const t = window.setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/address-search?q=${encodeURIComponent(q)}&limit=8`, {
          method: "GET",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("address search failed");
        const json = (await res.json()) as { results?: string[] };
        const next = Array.isArray(json.results)
          ? json.results.filter((s) => typeof s === "string" && s.trim().length > 0)
          : [];
        setResults(next);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(t);
    };
  }, [open, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md rounded-2xl bg-white border border-[color:var(--border-10)] p-6 flex flex-col gap-5 h-[min(680px,calc(100vh-48px))] overflow-hidden">
        <div className="flex items-center justify-between">
          <DialogTitle>주소 검색</DialogTitle>
        </div>

        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="도로명/지번/건물명으로 검색"
            className="pl-9 pr-3 text-[13px] h-10 bg-[color:var(--surface-10)]"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-30">🔍</span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="flex flex-col">
            {results.map((addr) => (
              <button
                key={addr}
                type="button"
                onClick={() => setSelected(addr)}
                className={[
                  "px-3 py-3 text-left text-[13px] rounded-lg border transition-colors",
                  selected === addr
                    ? "bg-slate-50 border-black/20 text-on-surface-10"
                    : "bg-transparent border-transparent text-on-surface-20 hover:bg-slate-50",
                ].join(" ")}
              >
                {addr}
              </button>
            ))}

            {loading && (
              <div className="px-3 py-6 text-center text-[13px] text-on-surface-30">검색 중…</div>
            )}
            {!loading && query.trim().length > 0 && results.length === 0 && (
              <div className="px-3 py-6 text-center text-[13px] text-on-surface-30">검색 결과가 없어요.</div>
            )}
          </div>
        </div>

        <div className="pt-0 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-fit h-11 px-5 rounded-lg text-[14px] font-semibold border-[color:var(--border-30)] bg-white text-on-surface-20 hover:bg-slate-50 hover:text-on-surface-10"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            className="w-fit h-11 px-5 rounded-lg text-[14px] font-semibold"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              onSelectAddress(selected);
              onOpenChange(false);
            }}
          >
            적용
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

