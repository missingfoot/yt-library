import { describe, it, expect } from "vitest";
import { filterChannels, type ChannelView } from "./filterChannels";

const sample: ChannelView[] = [
  { id: "1", title: "PewDiePie", url: "u1", category: "Gaming", tags: ["Let's Play", "Comedy"], avatarUrl: undefined, isFavorite: false },
  { id: "2", title: "Astrum", url: "u2", category: "Science & Education", tags: ["Space/Astronomy"], avatarUrl: undefined, isFavorite: false },
  { id: "3", title: "Arlo", url: "u3", category: "Gaming", tags: ["Lore/Analysis", "Commentary"], avatarUrl: undefined, isFavorite: false },
  { id: "4", title: "decayingmidwest", url: "u4", category: undefined, tags: [], avatarUrl: undefined, isFavorite: false },
];

describe("filterChannels", () => {
  it("returns all channels with no filters", () => {
    const result = filterChannels(sample, {});
    expect(result).toHaveLength(4);
  });

  it("filters by search query (case-insensitive substring on title)", () => {
    const result = filterChannels(sample, { search: "pewdie" });
    expect(result.map((c) => c.title)).toEqual(["PewDiePie"]);
  });

  it("filters by selected categories", () => {
    const result = filterChannels(sample, { categories: new Set(["Gaming"]) });
    expect(result.map((c) => c.title).sort()).toEqual(["Arlo", "PewDiePie"]);
  });

  it("treats undefined category as Uncategorized when selected", () => {
    const result = filterChannels(sample, { categories: new Set(["Uncategorized"]) });
    expect(result.map((c) => c.title)).toEqual(["decayingmidwest"]);
  });

  it("filters by tags with AND mode (default) requiring all selected tags", () => {
    const result = filterChannels(sample, { tags: new Set(["Let's Play", "Comedy"]), tagMode: "and" });
    expect(result.map((c) => c.title)).toEqual(["PewDiePie"]);
  });

  it("filters by tags with OR mode requiring any selected tag", () => {
    const result = filterChannels(sample, {
      tags: new Set(["Space/Astronomy", "Commentary"]),
      tagMode: "or",
    });
    expect(result.map((c) => c.title).sort()).toEqual(["Arlo", "Astrum"]);
  });

  it("sorts by name ascending, case-insensitive", () => {
    const result = filterChannels(sample, { sort: "name" });
    expect(result.map((c) => c.title)).toEqual(["Arlo", "Astrum", "decayingmidwest", "PewDiePie"]);
  });

  it("sorts by category, with Uncategorized last", () => {
    const result = filterChannels(sample, { sort: "category" });
    expect(result.map((c) => c.category ?? "Uncategorized")).toEqual([
      "Gaming",
      "Gaming",
      "Science & Education",
      "Uncategorized",
    ]);
  });

  it("combines search, category, and tag filters together", () => {
    const result = filterChannels(sample, {
      search: "ar",
      categories: new Set(["Gaming"]),
      tags: new Set(["Lore/Analysis"]),
    });
    expect(result.map((c) => c.title)).toEqual(["Arlo"]);
  });
});
