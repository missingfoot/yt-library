import type { InstantRules } from "@instantdb/react";

const rules = {
  channels: {
    allow: { view: "true", $default: "auth.id != null" },
  },
  categories: {
    allow: { view: "true", $default: "auth.id != null" },
  },
  tags: {
    allow: { view: "true", $default: "auth.id != null" },
  },
  $files: {
    allow: { view: "true", $default: "auth.id != null" },
  },
} satisfies InstantRules;

export default rules;
