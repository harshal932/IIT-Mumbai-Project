import { db } from "./index";
import { categories } from "./schema";

const DEFAULT_CATEGORIES = [
  {
    id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1201",
    name: "Potholes & Roads",
    slug: "potholes-roads",
    description: "Road damage, broken asphalt, missing signs, traffic light failures",
    icon: "truck",
    color: "#f59e0b",
  },
  {
    id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1202",
    name: "Street Lighting & Electricity",
    slug: "street-lighting-electricity",
    description: "Unlit dark streets, broken lamp posts, exposed wiring",
    icon: "zap",
    color: "#eab308",
  },
  {
    id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1203",
    name: "Water, Plumbing & Drainage",
    slug: "water-plumbing-drainage",
    description: "Water main leaks, clogged storm drains, sewage overflows",
    icon: "droplet",
    color: "#3b82f6",
  },
  {
    id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1204",
    name: "Sanitation & Waste Management",
    slug: "sanitation-waste",
    description: "Illegal dumping, overflowing public trash cans, litter build-up",
    icon: "trash",
    color: "#10b981",
  },
  {
    id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1205",
    name: "Public Safety & Hazards",
    slug: "public-safety-hazards",
    description: "Fallen trees, dangerous structures, physical safety hazards",
    icon: "shield-alert",
    color: "#ef4444",
  },
  {
    id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1206",
    name: "Parks & Environment",
    slug: "parks-environment",
    description: "Damaged playground equipment, overgrown brush, park maintenance",
    icon: "trees",
    color: "#84cc16",
  },
  {
    id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1207",
    name: "Accessibility & Sidewalks",
    slug: "accessibility-sidewalks",
    description: "Cracked sidewalks, blocked curb ramps, missing accessibility features",
    icon: "accessibility",
    color: "#6366f1",
  },
  {
    id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1208",
    name: "Community / General Help",
    slug: "community-general-help",
    description: "Personal help requests, neighbor assistance, local organizing",
    icon: "users",
    color: "#a855f7",
  },
];

export async function seedCategories() {
  console.log("Seeding categories...");
  for (const cat of DEFAULT_CATEGORIES) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoNothing({ target: categories.slug });
  }
  console.log("Seeding completed.");
}

// Allow direct execution
if (require.main === module) {
  seedCategories().catch(console.error);
}
