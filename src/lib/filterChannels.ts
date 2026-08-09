export interface ChannelView {
  id: string;
  title: string;
  url: string;
  category: string | undefined;
  tags: string[];
  avatarUrl: string | undefined;
}

export interface FilterOptions {
  search?: string;
  categories?: Set<string>;
  tags?: Set<string>;
  tagMode?: "and" | "or";
  sort?: "name" | "category";
}

function matchesCategory(channel: ChannelView, categories: Set<string>): boolean {
  const effective = channel.category ?? "Uncategorized";
  return categories.has(effective);
}

function matchesTags(channel: ChannelView, tags: Set<string>, mode: "and" | "or"): boolean {
  if (mode === "and") {
    return [...tags].every((t) => channel.tags.includes(t));
  }
  return [...tags].some((t) => channel.tags.includes(t));
}

export function filterChannels(list: ChannelView[], options: FilterOptions): ChannelView[] {
  let result = list;

  const search = options.search?.trim().toLowerCase();
  if (search) {
    result = result.filter((c) => c.title.toLowerCase().includes(search));
  }

  if (options.categories && options.categories.size > 0) {
    result = result.filter((c) => matchesCategory(c, options.categories!));
  }

  if (options.tags && options.tags.size > 0) {
    result = result.filter((c) => matchesTags(c, options.tags!, options.tagMode ?? "and"));
  }

  const sorted = [...result];
  if (options.sort === "category") {
    sorted.sort((a, b) => {
      const ac = a.category ?? "￿"; // sorts Uncategorized last
      const bc = b.category ?? "￿";
      if (ac !== bc) return ac.localeCompare(bc);
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    });
  } else {
    sorted.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
  }

  return sorted;
}
