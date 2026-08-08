const CATEGORY_COLORS: Record<string, string> = {
  "Gaming": "#E8734A",
  "Science & Education": "#4FA8A0",
  "Tech & Gadgets": "#5B8DEF",
  "Video Essays & Culture": "#B98CE0",
  "Comedy & Entertainment": "#E8C34A",
  "Movies & TV Commentary": "#E85D75",
  "History": "#C08552",
  "Engineering & Making": "#8CA85E",
  "Cooking & Food": "#E89A4A",
  "Art & Design": "#D97BC4",
  "Cars & Vehicles": "#8B9BC4",
  "Music": "#7FC9E8",
  "Travel & Lifestyle": "#7ED9A8",
  "News & Politics Commentary": "#C4574A",
  "Anime & Animation": "#E084C1",
  "Aviation & Military": "#8FA37F",
  "Beauty & Fashion": "#E896C0",
  "Fitness & Health": "#6EC086",
  "ASMR": "#A896D9",
};

const UNCATEGORIZED_COLOR = "#5C6274";

export const CATEGORY_NAMES = Object.keys(CATEGORY_COLORS);

export function catColor(name: string | undefined): string {
  if (!name) return UNCATEGORIZED_COLOR;
  return CATEGORY_COLORS[name] ?? UNCATEGORIZED_COLOR;
}
