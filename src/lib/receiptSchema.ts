import { z } from "zod";

const Numberish = z.preprocess((value) => {
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9+\-\.]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (typeof value === "number") return value;
  return undefined;
}, z.number());

export const ExpenseCategoryEnum = z.enum([
  "materials",
  "plants_and_soil",
  "mulch_and_aggregates",
  "tools_and_equipment",
  "equipment_rental",
  "fuel",
  "vehicle_maintenance",
  "disposal_and_dump_fees",
  "labor",
  "permits_and_fees",
  "safety_supplies",
  "office_and_admin",
  "meals_and_incidental",
  "other",
]);

export const LineItemSchema = z.object({
  description: z.string().min(1),
  quantity: Numberish.optional(),
  unitPrice: Numberish.optional(),
  total: Numberish.optional(),
  sku: z.string().optional(),
  // Allow arbitrary string labels from AI; we can map to our enum downstream
  category: z.string().optional(),
});

export const ReceiptSchema = z.object({
  vendorName: z.string().min(1).optional(),
  vendorAddress: z.string().optional(),
  vendorPhone: z.string().optional(),
  date: z.string().nullable().optional(),
  subtotal: Numberish.optional(),
  tax: Numberish.optional(),
  tip: Numberish.optional(),
  total: Numberish.optional(),
  currency: z.string().default("USD").optional(),
  paymentMethod: z.string().optional(),
  invoiceNumber: z.string().optional(),
  items: z.array(LineItemSchema).default([]),
  notes: z.string().optional(),
  ocrText: z.string().optional(),
});

export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;
export type LineItem = z.infer<typeof LineItemSchema>;
export type Receipt = z.infer<typeof ReceiptSchema>;

export const CATEGORY_HINTS: Record<string, ExpenseCategory> = {
  mulch: "mulch_and_aggregates",
  gravel: "mulch_and_aggregates",
  stone: "mulch_and_aggregates",
  rock: "mulch_and_aggregates",
  soil: "plants_and_soil",
  compost: "plants_and_soil",
  sod: "plants_and_soil",
  seed: "plants_and_soil",
  plant: "plants_and_soil",
  shrub: "plants_and_soil",
  tree: "plants_and_soil",
  blade: "tools_and_equipment",
  trimmer: "tools_and_equipment",
  mower: "tools_and_equipment",
  chainsaw: "tools_and_equipment",
  rake: "tools_and_equipment",
  shovel: "tools_and_equipment",
  rental: "equipment_rental",
  lease: "equipment_rental",
  gasoline: "fuel",
  diesel: "fuel",
  fuel: "fuel",
  oil: "vehicle_maintenance",
  tire: "vehicle_maintenance",
  dump: "disposal_and_dump_fees",
  landfill: "disposal_and_dump_fees",
  permit: "permits_and_fees",
  gloves: "safety_supplies",
  ppe: "safety_supplies",
  safety: "safety_supplies",
  office: "office_and_admin",
  admin: "office_and_admin",
  lunch: "meals_and_incidental",
  meal: "meals_and_incidental",
};

export function inferCategoryFromDescription(description: string): ExpenseCategory | undefined {
  const normalized = description.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_HINTS)) {
    if (normalized.includes(keyword)) return category;
  }
  return undefined;
}


