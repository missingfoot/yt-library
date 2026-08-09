import type { InstantRules } from "@instantdb/react";

const isOwner = "auth.email == 'ytdb@jamessparkes.com'";

const rules = {
  channels: {
    allow: { view: "true", $default: isOwner },
  },
  categories: {
    allow: { view: "true", $default: isOwner },
  },
  tags: {
    allow: { view: "true", $default: isOwner },
  },
  $files: {
    allow: { view: "true", $default: isOwner },
  },
} satisfies InstantRules;

export default rules;
