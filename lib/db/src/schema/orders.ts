import { boolean, jsonb, real, text, timestamp, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type OrderLineRecord = {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  customizations: Record<string, string>;
};

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  orderType: text("order_type").notNull(),
  address: text("address"),
  lines: jsonb("lines").$type<OrderLineRecord[]>().notNull(),
  subtotal: real("subtotal").notNull(),
  deliveryFee: real("delivery_fee").notNull(),
  total: real("total").notNull(),
  paymentConfirmed: boolean("payment_confirmed").notNull().default(false),
  status: text("status").notNull().default("received"),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  createdAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;