import type { InstantRules } from "@instantdb/react";

const rules = {
  channels: {
    allow: { view: "true", create: "true", update: "true", delete: "true" },
  },
  categories: {
    allow: { view: "true", create: "true", update: "true", delete: "true" },
  },
  tags: {
    allow: { view: "true", create: "true", update: "true", delete: "true" },
  },
  $files: {
    allow: { view: "true", create: "true", update: "true", delete: "true" },
  },
} satisfies InstantRules;

export default rules;
