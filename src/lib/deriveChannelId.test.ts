import { describe, it, expect } from "vitest";
import { deriveChannelId } from "./deriveChannelId";

describe("deriveChannelId", () => {
  it("extracts the UC id from a /channel/ URL", () => {
    expect(deriveChannelId("http://www.youtube.com/channel/UC-0LmMzjDI7CurtFFBUrvHQ")).toBe(
      "UC-0LmMzjDI7CurtFFBUrvHQ"
    );
  });

  it("handles a trailing slash", () => {
    expect(deriveChannelId("http://www.youtube.com/channel/UCabc123/")).toBe("UCabc123");
  });

  it("falls back to the last path segment for handle-style URLs", () => {
    expect(deriveChannelId("https://www.youtube.com/@SomeHandle")).toBe("@SomeHandle");
  });
});
