// TEMPORARY test scaffold: in-memory stand-in for the De-Bite API server.
// Lets the real frontend (vite dev, /api proxy -> :5000) be smoke-tested
// without Postgres/Supabase credentials. Deleted after verification.
import http from 'node:http';

const now = () => new Date().toISOString();
const orders = new Map();
const menu = [
  { id: 'm1', name: 'Jollof & Chicken', category: 'Rice & Bowls', description: 'Smoky party jollof with grilled chicken.', price: 4500, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=70', options: [{ label: 'Portion', values: ['Regular', 'Large'], prices: { Regular: 0, Large: 1500 } }], available: true, featured: true },
  { id: 'm2', name: 'Suya Platter', category: 'Grills', description: 'Flame-grilled beef suya with spice.', price: 6000, image: '', options: [], available: true, featured: true },
  { id: 'm3', name: 'Puff-Puff (6 pcs)', category: 'Starters', description: 'Golden, fluffy Nigerian doughnut bites.', price: 1500, image: '', options: [], available: true, featured: false },
];
const newId = () => `DB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const publicOrder = (o) => ({ ...o, createdAt: o.createdAt, address: o.address ?? null, paymentConfirmed: Boolean(o.paymentConfirmed) });
const adminOrder = (o) => ({
  orderId: o.id, customerName: o.customerName, phone: o.phone, orderType: o.orderType,
  total: o.total, status: o.status, createdAt: o.createdAt,
  items: o.lines.map((l) => ({ itemName: l.name, quantity: l.quantity, customizations: l.customizations })),
});
const seed = (id, status, phone) => orders.set(id, {
  id, createdAt: now(), customerName: 'Test Customer', phone, orderType: 'delivery',
  address: '1 Test Street, Lekki', lines: [{ itemId: 'm1', name: 'Jollof & Chicken', quantity: 1, unitPrice: 4500, customizations: {} }],
  subtotal: 4500, deliveryFee: 1000, total: 5500, paymentConfirmed: false, status,
});
seed('DB-TEST01', 'received', '08100000001');
seed('DB-TEST02', 'preparing', '08100000002');
seed('DB-TEST03', 'cancelled', '08100000003');

const CANCELLABLE = new Set(['received', 'confirmed']);
const json = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((resolve) => { let data = ''; req.on('data', (c) => (data += c)); req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } }); });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const body = ['POST', 'PATCH'].includes(req.method) ? await readBody(req) : {};

  if (path === '/api/healthz') return json(res, 200, { status: 'ok' });
  if (path === '/api/menu') return json(res, 200, menu);
  if (path === '/api/orders' && req.method === 'POST') {
    const id = newId();
    const order = { id, createdAt: now(), customerName: body.customerName, phone: body.phone, orderType: body.orderType, address: body.address, lines: body.lines, subtotal: body.subtotal, deliveryFee: body.deliveryFee, total: body.total, paymentConfirmed: false, status: 'received' };
    orders.set(id, order);
    return json(res, 201, publicOrder(order));
  }
  if (path === '/api/orders/track') {
    const o = orders.get(body.orderId);
    if (!o || o.phone !== body.phone) return json(res, 404, { error: 'not found' });
    return json(res, 200, publicOrder(o));
  }
  if (path === '/api/orders/cancel') {
    const o = orders.get(body.orderId);
    if (!o || o.phone !== body.phone) return json(res, 404, { error: 'not found' });
    if (!CANCELLABLE.has(o.status)) return json(res, 409, { error: 'not cancellable' });
    o.status = 'cancelled';
    return json(res, 200, publicOrder(o));
  }
  let match;
  if ((match = path.match(/^\/api\/orders\/([^/]+)\/payment$/)) && req.method === 'PATCH') {
    const o = orders.get(match[1]);
    if (!o) return json(res, 404, { error: 'not found' });
    o.paymentConfirmed = Boolean(body.paymentConfirmed);
    o.status = body.paymentConfirmed ? 'confirmed' : o.status;
    return json(res, 200, publicOrder(o));
  }
  if ((match = path.match(/^\/api\/orders\/([^/]+)\/status$/)) && req.method === 'PATCH') {
    const o = orders.get(match[1]);
    if (!o) return json(res, 404, { error: 'not found' });
    o.status = body.status;
    return json(res, 200, publicOrder(o));
  }
  if (path === '/api/admin/session') return json(res, 200, { authenticated: true });
  if (path === '/api/admin/login') return json(res, 200, { authenticated: true });
  if (path === '/api/admin/orders') return json(res, 200, [...orders.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map(adminOrder));
  if ((match = path.match(/^\/api\/admin\/orders\/([^/]+)\/status$/)) && req.method === 'PATCH') {
    const o = orders.get(match[1]);
    if (!o) return json(res, 404, { error: 'not found' });
    o.status = body.status;
    return json(res, 200, adminOrder(o));
  }
  return json(res, 404, { error: `no mock for ${req.method} ${path}` });
});

server.listen(5000, () => console.log('mock api on :5000'));
