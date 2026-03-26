import { NextResponse } from "next/server";

type NominatimResult = {
  display_name?: string;
};

function safeText(s: unknown) {
  return typeof s === "string" ? s : "";
}

function normalizeSpace(value: string) {
  return value.replace(/\s+/g, "").trim();
}

async function fetchNominatim(query: string, limit: number, signal: AbortSignal) {
  const nomUrl = new URL("https://nominatim.openstreetmap.org/search");
  nomUrl.searchParams.set("format", "json");
  nomUrl.searchParams.set("addressdetails", "0");
  nomUrl.searchParams.set("limit", String(limit));
  nomUrl.searchParams.set("q", query);

  const res = await fetch(nomUrl.toString(), {
    method: "GET",
    signal,
    headers: {
      "Accept-Language": "ko",
      // Nominatim은 User-Agent를 요구하는 경우가 있어 프록시에서 명시합니다.
      "User-Agent": "mocheong-invitation-builder/0.1 (contact: unknown)",
    },
  });

  if (!res.ok) return [];
  const json = (await res.json()) as NominatimResult[];
  return Array.isArray(json)
    ? json.map((r) => safeText(r.display_name)).filter(Boolean)
    : [];
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const limitRaw = url.searchParams.get("limit");
    const limit = Math.max(1, Math.min(10, Number(limitRaw) || 8));

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 7000);
    const qNoSpace = normalizeSpace(q);
    const queries = Array.from(new Set([q, qNoSpace])).filter(Boolean);
    const merged: string[] = [];

    try {
      for (const query of queries) {
        const list = await fetchNominatim(query, limit, controller.signal);
        merged.push(...list);
      }
    } finally {
      clearTimeout(t);
    }

    const normalizedQuery = normalizeSpace(q).toLowerCase();
    const results = merged
      // 중복 제거
      .filter((v, i, arr) => arr.indexOf(v) === i)
      // 띄어쓰기 무시 매칭이 잘 되는 결과를 우선 노출
      .sort((a, b) => {
        const aHit = normalizeSpace(a).toLowerCase().includes(normalizedQuery) ? 1 : 0;
        const bHit = normalizeSpace(b).toLowerCase().includes(normalizedQuery) ? 1 : 0;
        return bHit - aHit;
      })
      .slice(0, limit);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

