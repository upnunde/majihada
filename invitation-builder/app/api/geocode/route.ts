import { NextResponse } from "next/server";
import { getNaverMapsCredentials } from "@/lib/naver-maps-credentials";

const NAVER_GEOCODE_URL = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode";

type LatLon = { lat: number; lon: number };

async function geocodeNaver(query: string, signal: AbortSignal): Promise<LatLon | null> {
  const cred = getNaverMapsCredentials();
  if (!cred) return null;

  const url = new URL(NAVER_GEOCODE_URL);
  url.searchParams.set("query", query);

  const res = await fetch(url.toString(), {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
      "X-NCP-APIGW-API-KEY-ID": cred.id,
      "X-NCP-APIGW-API-KEY": cred.secret,
    },
  });

  if (!res.ok) return null;

  const json = (await res.json()) as {
    status?: string;
    addresses?: Array<{ x?: string; y?: string }>;
  };

  const first = json.addresses?.[0];
  if (!first?.x || !first?.y) return null;

  const lon = Number(first.x);
  const lat = Number(first.y);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon };
}

async function geocodeNominatim(query: string, signal: AbortSignal): Promise<LatLon | null> {
  const nomUrl = new URL("https://nominatim.openstreetmap.org/search");
  nomUrl.searchParams.set("format", "json");
  nomUrl.searchParams.set("limit", "1");
  nomUrl.searchParams.set("q", query);

  const res = await fetch(nomUrl.toString(), {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
      "Accept-Language": "ko",
      "User-Agent": "dearhour-invitation-builder/0.1 (geocode-fallback)",
    },
  });

  if (!res.ok) return null;
  const json = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  const first = json?.[0];
  if (!first?.lat || !first?.lon) return null;
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.replace(/\u3000/g, " ").replace(/\s+/g, " ").trim() ?? "";

  if (!q) {
    return NextResponse.json({ error: "missing q" }, { status: 400 });
  }
  if (q.length > 240) {
    return NextResponse.json({ error: "query too long" }, { status: 400 });
  }

  const signal = req.signal;

  try {
    const naver = await geocodeNaver(q, signal);
    if (naver) return NextResponse.json(naver);

    const nom = await geocodeNominatim(q, signal);
    if (nom) return NextResponse.json(nom);

    return NextResponse.json({ error: "not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "geocode failed" }, { status: 502 });
  }
}
