import { NextRequest, NextResponse } from "next/server";

function isAllowedHost(hostname: string): boolean {
  return hostname === "youtube.com" || hostname.endsWith(".youtube.com");
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

  const match = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (!match) {
    return NextResponse.json({ error: "Could not find channel avatar" }, { status: 404 });
  }

  return NextResponse.json({ avatarUrl: match[1] });
}
