import { NextRequest, NextResponse } from "next/server";
import { init } from "@instantdb/admin";
import schema from "../../../../instant.schema";

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  schema,
});

function isAllowedHost(hostname: string): boolean {
  return hostname === "youtube.com" || hostname.endsWith(".youtube.com");
}

export async function GET(request: NextRequest) {
  const channelUrl = request.nextUrl.searchParams.get("url");
  const channelId = request.nextUrl.searchParams.get("channelId");
  if (!channelUrl || !channelId) {
    return NextResponse.json({ error: "Missing url or channelId parameter" }, { status: 400 });
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

  let buffer: Buffer;
  let contentType: string;
  try {
    const imgRes = await fetch(match[1]);
    if (!imgRes.ok) {
      return NextResponse.json({ error: `Avatar image fetch failed with status ${imgRes.status}` }, { status: 502 });
    }
    contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    buffer = Buffer.from(await imgRes.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Failed to download avatar image" }, { status: 502 });
  }

  const path = `avatars/${channelId}`;
  try {
    const { data } = await db.storage.uploadFile(path, buffer, { contentType });
    await db.transact(db.tx.channels[channelId].link({ avatarFile: data.id }));

    const fileResult = await db.query({ $files: { $: { where: { id: data.id } } } });
    const avatarUrl = fileResult.$files[0]?.url;

    return NextResponse.json({ avatarUrl });
  } catch {
    return NextResponse.json({ error: "Failed to store avatar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const channelId = request.nextUrl.searchParams.get("channelId");
  if (!channelId) {
    return NextResponse.json({ error: "Missing channelId parameter" }, { status: 400 });
  }

  const result = await db.query({ $files: { $: { where: { path: `avatars/${channelId}` } } } });
  const fileId = result.$files[0]?.id;
  if (fileId) {
    await db.transact(db.tx.$files[fileId].delete());
  }

  return NextResponse.json({ ok: true });
}
