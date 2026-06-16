import { base44 } from "@/api/base44Client";

const DEFAULT_TYPES = [
  { name: "Ramonage", color: "#3b82f6" },
  { name: "Entretien technique", color: "#10b981" },
  { name: "Débistrage", color: "#f59e0b" },
  { name: "Remise aux normes", color: "#ef4444" },
  { name: "Pose de poêle à bois", color: "#8b5cf6" },
];

let seeded = false;

export async function ensureInterventionTypes() {
  if (seeded) return;
  seeded = true;
  const existing = await base44.entities.InterventionType.list();
  if (existing.length === 0) {
    await base44.entities.InterventionType.bulkCreate(DEFAULT_TYPES);
  }
}