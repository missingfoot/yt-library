import {
  Atom,
  Car,
  Clapperboard,
  Cpu,
  Dumbbell,
  Ear,
  Film,
  Gamepad2,
  Gem,
  Landmark,
  Laugh,
  Luggage,
  Music,
  Newspaper,
  Palette,
  Plane,
  Sparkles,
  UtensilsCrossed,
  Wrench,
  CircleDashed,
  Tag,
  type LucideIcon,
} from "lucide-react";

const ICON_REGISTRY: Record<string, LucideIcon> = {
  Gamepad2,
  Atom,
  Cpu,
  Clapperboard,
  Laugh,
  Film,
  Landmark,
  Wrench,
  UtensilsCrossed,
  Palette,
  Car,
  Music,
  Luggage,
  Newspaper,
  Sparkles,
  Plane,
  Gem,
  Dumbbell,
  Ear,
  Tag,
  CircleDashed,
};

const DEFAULT_ICON_KEY_BY_NAME: Record<string, string> = {
  "Gaming": "Gamepad2",
  "Science & Education": "Atom",
  "Tech & Gadgets": "Cpu",
  "Video Essays & Culture": "Clapperboard",
  "Comedy & Entertainment": "Laugh",
  "Movies & TV Commentary": "Film",
  "History": "Landmark",
  "Engineering & Making": "Wrench",
  "Cooking & Food": "UtensilsCrossed",
  "Art & Design": "Palette",
  "Cars & Vehicles": "Car",
  "Music": "Music",
  "Travel & Lifestyle": "Luggage",
  "News & Politics Commentary": "Newspaper",
  "Anime & Animation": "Sparkles",
  "Aviation & Military": "Plane",
  "Beauty & Fashion": "Gem",
  "Fitness & Health": "Dumbbell",
  "ASMR": "Ear",
};

/** Default icon key to assign a *new* category at creation time, based on its name. */
export function defaultIconKeyForName(name: string | undefined): string {
  if (!name) return "CircleDashed";
  return DEFAULT_ICON_KEY_BY_NAME[name] ?? "Tag";
}

/** Resolve a persisted icon key (stored on the category entity) to its component. */
export function resolveIcon(key: string | undefined): LucideIcon {
  if (!key) return CircleDashed;
  return ICON_REGISTRY[key] ?? Tag;
}
