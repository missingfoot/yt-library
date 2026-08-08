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
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Gaming": Gamepad2,
  "Science & Education": Atom,
  "Tech & Gadgets": Cpu,
  "Video Essays & Culture": Clapperboard,
  "Comedy & Entertainment": Laugh,
  "Movies & TV Commentary": Film,
  "History": Landmark,
  "Engineering & Making": Wrench,
  "Cooking & Food": UtensilsCrossed,
  "Art & Design": Palette,
  "Cars & Vehicles": Car,
  "Music": Music,
  "Travel & Lifestyle": Luggage,
  "News & Politics Commentary": Newspaper,
  "Anime & Animation": Sparkles,
  "Aviation & Military": Plane,
  "Beauty & Fashion": Gem,
  "Fitness & Health": Dumbbell,
  "ASMR": Ear,
};

export function catIcon(name: string | undefined): LucideIcon {
  if (!name) return CircleDashed;
  return CATEGORY_ICONS[name] ?? CircleDashed;
}
