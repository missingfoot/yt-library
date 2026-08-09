import { NextRequest, NextResponse } from "next/server";

function isAllowedHost(hostname: string): boolean {
  return hostname === "youtube.com" || hostname.endsWith(".youtube.com");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseKeywords(raw: string): string[] {
  const decoded = decodeEntities(raw);
  const quoted = new Set<string>();
  const withoutQuoted = decoded.replace(/"([^"]+)"/g, (_, phrase) => {
    quoted.add(phrase.trim());
    return " ";
  });
  const words = withoutQuoted
    .split(/[,\s]+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .filter((w) => w !== "..." && !w.endsWith("..."));

  const all = [...quoted, ...words];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of all) {
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tag);
    }
  }
  return result;
}

export async function GET(request: NextRequest) {
  const channelUrl = request.nextUrl.searchParams.get("url");
  if (!channelUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(channelUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!isAllowedHost(parsed.hostname)) {
    return NextResponse.json({ error: "URL must be a youtube.com channel URL" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ChannelLibraryBot/1.0)" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed with status ${res.status}` }, { status: 502 });
    }
    html = await res.text();
  } catch {
    return NextResponse.json({ error: "Failed to fetch channel page" }, { status: 502 });
  }

  const match = html.match(/<meta name="keywords" content="([^"]*)"/);
  if (!match || !match[1].trim()) {
    return NextResponse.json({ error: "This channel has no listed keywords" }, { status: 404 });
  }

  return NextResponse.json({ tags: parseKeywords(match[1]) });
}
