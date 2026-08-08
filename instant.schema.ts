import { i } from "@instantdb/core";

const _schema = i.schema({
  entities: {
    channels: i.entity({
      channelId: i.string().unique().indexed(),
      title: i.string(),
      url: i.string(),
      createdAt: i.number(),
    }),
    categories: i.entity({
      name: i.string().unique().indexed(),
      color: i.string(),
    }),
    tags: i.entity({
      name: i.string().unique().indexed(),
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
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
