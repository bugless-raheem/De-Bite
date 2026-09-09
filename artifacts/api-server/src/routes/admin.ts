import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminSessionResponse,
  ListAdminOrdersResponse,
  ListAdminOrdersResponseItem,
  UpdateAdminOrderStatusBody,
} from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import { supabaseRequest } from "../lib/supabase";

const router: IRouter = Router();
const ADMIN_COOKIE = "debite_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const adminStatuses = ["received", "preparing", "out_for_delivery", "delivered"] as const;

type AdminStatus = (typeof adminStatuses)[number];
type SupabaseOrderRow = {
  id: string | number;
  customer_name: string;
  phone: string;
  order_type: string;
  total: number | string;
  status: string;
  created_at?: string | null;
};
type SupabaseOrderItemRow = {
  order_id: string | number;
  item_name: string;
  quantity: number | string;
  customizations: unknown;
};

function getSecret(name: string) {
  const value = process.env[name];
  if (!value) {
    if (name === "SESSION_SECRET") return "fallback_secret_key_123";
    throw new Error(`${name} is required.`);
  }
  return value;
}

function sessionSignature(expiresAt: number) {
  return createHmac("sha256", getSecret("SESSION_SECRET"))
    .update(`admin:${expiresAt}`)
    .digest("hex");
}

function createSessionToken() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return `${expiresAt}.${sessionSignature(expiresAt)}`;
}

function parseCookies(request: Request) {
  return Object.fromEntries(
    (request.headers.cookie ?? "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([name, value]) => name && value)
      .map(([name, ...value]) => [name, decodeURIComponent(value.join("="))]),
  );
}

function hasAdminSession(request: Request) {
  const token = parseCookies(request)[ADMIN_COOKIE];
  const [rawExpiry, signature] = token?.split(".") ?? [];
  const expiresAt = Number(rawExpiry);
  if (!signature || !Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = sessionSignature(expiresAt);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function requireAdmin(request: Request, response: Response) {
  if (hasAdminSession(request)) return true;
  response.status(401).json({ error: "Admin authentication required" });
  return false;
}

function sameSecret(actual: string, expected: string) {
  const actualHash = createHash("sha256").update(actual).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

function normalizeStatus(status: string): AdminStatus | null {
  return adminStatuses.includes(status as AdminStatus) ? (status as AdminStatus) : null;
}

function toAdminStatus(status: string): AdminStatus {
  if (status === "confirmed" || status === "ready" || status === "preparing") return "preparing";
  if (status === "out_for_delivery") return "out_for_delivery";
  if (status === "completed" || status === "delivered") return "delivered";
  return "received";
}

function normalizeCustomizations(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

async function readLocalAdminOrders() {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  return orders.map((order) => ({
    orderId: order.id,
    customerName: order.customerName,
    phone: order.phone,
    orderType: order.orderType,
    total: Number(order.total),
    status: toAdminStatus(order.status),
    createdAt: order.createdAt.toISOString(),
    items: order.lines.map((line) => ({
      itemName: line.name,
      quantity: Number(line.quantity),
      customizations: normalizeCustomizations(line.customizations),
    })),
  }));
}

async function readAdminOrders() {
  const [orders, items, localOrders] = await Promise.all([
    supabaseRequest<SupabaseOrderRow[]>(
      "orders?select=id,customer_name,phone,order_type,total,status,created_at&order=created_at.desc",
    ),
    supabaseRequest<SupabaseOrderItemRow[]>(
      "order_items?select=order_id,item_name,quantity,customizations",
    ),
    readLocalAdminOrders(),
  ]);

  const itemsByOrder = new Map<string, SupabaseOrderItemRow[]>();
  for (const item of items) {
    const key = String(item.order_id);
    const existing = itemsByOrder.get(key) ?? [];
    existing.push(item);
    itemsByOrder.set(key, existing);
  }

  const supabaseOrders = orders.map((order) => ({
    orderId: String(order.id),
    customerName: order.customer_name,
    phone: order.phone,
    orderType: order.order_type,
    total: Number(order.total),
    status: order.status,
    createdAt: order.created_at ?? null,
    items: (itemsByOrder.get(String(order.id)) ?? []).map((item) => ({
      itemName: item.item_name,
      quantity: Number(item.quantity),
      customizations: normalizeCustomizations(item.customizations),
    })),
  }));

  return [...supabaseOrders, ...localOrders].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    return bTime - aTime;
  });
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success || parsed.data.password !== "debite_raheem") {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${encodeURIComponent(createSessionToken())}; Max-Age=${SESSION_TTL_SECONDS}; Path=/api/admin; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  res.json(AdminLoginResponse.parse({ authenticated: true }));
});

router.get("/admin/session", (req, res): void => {
  res.json(GetAdminSessionResponse.parse({ authenticated: hasAdminSession(req) }));
});

router.get("/admin/orders", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const orders = await readAdminOrders();
  res.json(ListAdminOrdersResponse.parse(orders));
});

router.patch("/admin/orders/:orderId/status", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
  const parsed = UpdateAdminOrderStatusBody.safeParse(req.body);
  if (!orderId || !parsed.success || !normalizeStatus(parsed.data.status)) {
    res.status(400).json({ error: "Invalid admin order status request" });
    return;
  }

  const updated = await supabaseRequest<SupabaseOrderRow[]>(
    `orders?id=eq.${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      prefer: "return=representation",
      body: JSON.stringify({ status: parsed.data.status }),
    },
  );
  if (!updated.length) {
    const localStatus = parsed.data.status === "delivered" ? "completed" : parsed.data.status;
    const [localOrder] = await db
      .update(ordersTable)
      .set({ status: localStatus })
      .where(eq(ordersTable.id, orderId))
      .returning();
    if (!localOrder) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
  }

  const order = (await readAdminOrders()).find((candidate) => candidate.orderId === String(orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(ListAdminOrdersResponseItem.parse(order));
});

export default router;