export function deriveChannelId(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  const channelMatch = trimmed.match(/\/channel\/([^/?#]+)/);
  if (channelMatch) return channelMatch[1];
  const lastSegment = trimmed.split("/").pop();
  return lastSegment || trimmed;
}
