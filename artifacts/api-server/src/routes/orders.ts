import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import {
  CreateOrderBody,
  CreateOrderResponse,
  ListOrdersResponse,
  TrackOrderBody,
  TrackOrderResponse,
  UpdateOrderPaymentBody,
  UpdateOrderPaymentParams,
  UpdateOrderPaymentResponse,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  UpdateOrderStatusResponse,
} from "@workspace/api-zod";
import { supabaseRequest } from "../lib/supabase";

const router: IRouter = Router();

type SupabaseTrackOrderRow = {
  id: string | number;
  customer_name: string;
  phone: string;
  order_type: string;
  total: number | string;
  status: string;
  created_at?: string | null;
};

type SupabaseTrackOrderItemRow = {
  item_name: string;
  quantity: number | string;
  customizations: unknown;
};

function formatOrder(order: typeof ordersTable.$inferSelect) {
  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
  };
}

function normalizeCustomizations(value: unknown): Record<string, string> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, String(entry)]),
    );
  }
  if (typeof value === "string") {
    try {
      return normalizeCustomizations(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeTrackStatus(status: string) {
  if (status === "delivered") return "completed";
  if (["received", "confirmed", "preparing", "ready", "out_for_delivery", "completed"].includes(status)) {
    return status;
  }
  return "received";
}

async function findSupabaseOrder(orderId: string, phone: string) {
  const encodedOrderId = encodeURIComponent(orderId);
  const encodedPhone = encodeURIComponent(phone);
  const [orders, items] = await Promise.all([
    supabaseRequest<SupabaseTrackOrderRow[]>(
      `orders?select=id,customer_name,phone,order_type,total,status,created_at&id=eq.${encodedOrderId}&phone=eq.${encodedPhone}`,
    ),
    supabaseRequest<SupabaseTrackOrderItemRow[]>(
      `order_items?select=item_name,quantity,customizations&order_id=eq.${encodedOrderId}`,
    ),
  ]);
  const [order] = orders;
  if (!order) return null;

  const total = Number(order.total);
  return {
    id: String(order.id),
    createdAt: order.created_at ?? new Date().toISOString(),
    customerName: order.customer_name,
    phone: order.phone,
    orderType: order.order_type,
    address: null,
    lines: items.map((item, index) => ({
      itemId: `${order.id}-${index}`,
      name: item.item_name,
      quantity: Number(item.quantity),
      unitPrice: 0,
      customizations: normalizeCustomizations(item.customizations),
    })),
    subtotal: total,
    deliveryFee: 0,
    total,
    paymentConfirmed: false,
    status: normalizeTrackStatus(order.status),
  };
}

router.get("/orders", async (_req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(100);
  res.json(ListOrdersResponse.parse(orders.map(formatOrder)));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const id = `DB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const [order] = await db
    .insert(ordersTable)
    .values({
      id,
      ...parsed.data,
      address: parsed.data.address ?? null,
      paymentConfirmed: false,
      status: "received",
    })
    .returning();

  const formatted = formatOrder(order);
  req.log.info({ orderId: id, total: order.total }, "New order created");
  res.status(201).json(CreateOrderResponse.parse(formatted));
});

router.post("/orders/track", async (req, res): Promise<void> => {
  const parsed = TrackOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, parsed.data.orderId), eq(ordersTable.phone, parsed.data.phone)));

  if (order) {
    res.json(TrackOrderResponse.parse(formatOrder(order)));
    return;
  }

  const supabaseOrder = await findSupabaseOrder(parsed.data.orderId, parsed.data.phone);
  if (!supabaseOrder) {
    res.status(404).json({ error: "We could not find an order with those details" });
    return;
  }

  res.json(TrackOrderResponse.parse(supabaseOrder));
});

router.patch("/orders/:id/payment", async (req, res): Promise<void> => {
  const params = UpdateOrderPaymentParams.safeParse(req.params);
  const body = UpdateOrderPaymentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid payment update request" });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({
      paymentConfirmed: body.data.paymentConfirmed,
      status: body.data.paymentConfirmed ? "confirmed" : "received",
    })
    .where(eq(ordersTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  req.log.info({ orderId: updated.id, paymentConfirmed: updated.paymentConfirmed }, "Order payment updated");
  res.json(UpdateOrderPaymentResponse.parse(formatOrder(updated)));
});

router.patch("/orders/:id/status", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  const body = UpdateOrderStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid order status request" });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: body.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  req.log.info({ orderId: updated.id, status: updated.status }, "Order status updated");
  res.json(UpdateOrderStatusResponse.parse(formatOrder(updated)));
});

export default router;