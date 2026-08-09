import { i } from "@instantdb/core";

const _schema = i.schema({
  entities: {
    channels: i.entity({
      channelId: i.string().unique().indexed(),
      title: i.string(),
      url: i.string(),
      createdAt: i.number(),
      avatarUrl: i.string().optional(),
      isFavorite: i.boolean().optional(),
    }),
    categories: i.entity({
      name: i.string().unique().indexed(),
      color: i.string(),
      icon: i.string().optional(),
    }),
    tags: i.entity({
      name: i.string().unique().indexed(),
    }),
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
  },
  links: {
    channelCategory: {
      forward: { on: "channels", has: "one", label: "category" },
      reverse: { on: "categories", has: "many", label: "channels" },
    },
    channelTags: {
      forward: { on: "channels", has: "many", label: "tags" },
      reverse: { on: "tags", has: "many", label: "channels" },
    },
    channelAvatar: {
      forward: { on: "channels", has: "one", label: "avatarFile" },
      reverse: { on: "$files", has: "one", label: "channel" },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
