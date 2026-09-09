import { boolean, jsonb, real, text, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const menuItemsTable = pgTable("menu_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  image: text("image").notNull(),
  options: jsonb("options").$type<Array<{
    label: string;
    values: string[];
    prices: Record<string, number>;
  }>>().notNull(),
  available: boolean("available").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
});

export const insertMenuItemSchema = createInsertSchema(menuItemsTable).omit({
  id: true,
});
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItemsTable.$inferSelect;