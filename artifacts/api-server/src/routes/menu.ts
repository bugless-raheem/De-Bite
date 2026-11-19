import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, menuItemsTable } from "@workspace/db";
import {
  ListMenuResponse,
  UpdateMenuAvailabilityBody,
  UpdateMenuAvailabilityParams,
  UpdateMenuAvailabilityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const seedMenu: Array<typeof menuItemsTable.$inferInsert> = [
    {
    id: "vegetable-samosa-platter",
    name: "Vegetable Samosa Platter",
    category: "Starters",
    description: "Crisp pastry parcels served with bright herb and chilli dips.",
    price: 1800,
    image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=900&q=85",
    options: [{ label: "Portion", values: ["5 pcs", "10 pcs"], prices: { "5 pcs": 0, "10 pcs": 1400 } }],
    available: true,
    featured: true,
  },
  {
    id: "suya",
    name: "Chargrilled Steak Plate",
    category: "Grills",
    description: "Sliced chargrilled beef with roasted vegetables and a savoury house glaze.",
    price: 4200,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85",
    options: [
      { label: "Style", values: ["Classic", "Peppercorn"], prices: { Classic: 0, Peppercorn: 500 } },
      { label: "Portion", values: ["Regular", "Large"], prices: { Regular: 0, Large: 1800 } },
    ],
    available: true,
    featured: true,
  },
  {
    id: "egusi-soup",
    name: "Crispy Samosas",
    category: "Starters",
    description: "Golden pastry triangles with a savoury filling and fresh dipping sauces.",
    price: 5800,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85",
    options: [
      { label: "Filling", values: ["Chicken", "Vegetable"], prices: { Chicken: 0, Vegetable: 0 } },
      { label: "Portion", values: ["4 pcs", "8 pcs"], prices: { "4 pcs": 0, "8 pcs": 1400 } },
    ],
    available: true,
    featured: true,
  },
  {
    id: "efo-riro",
    name: "Vegetable Fried Rice",
    category: "Rice & Bowls",
    description: "Wok-tossed rice with seasonal vegetables, herbs and a savoury finish.",
    price: 5600,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=85",
    options: [
      { label: "Protein", values: ["Chicken", "Beef", "Shrimp", "Plain"], prices: { Chicken: 0, Beef: 200, Shrimp: 1000, Plain: -1200 } },
    ],
    available: true,
    featured: false,
  },
  {
    id: "ofada-rice",
    name: "Shrimp Paella",
    category: "Rice & Bowls",
    description: "Saffron rice with shrimp, peppers and a bright citrus finish.",
    price: 6500,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85",
    options: [
      { label: "Style", values: ["Classic", "Extra shrimp"], prices: { Classic: 0, "Extra shrimp": 1200 } },
    ],
    available: true,
    featured: false,
  },
  {
    id: "amala-gbegiri",
    name: "Steamed Basmati Rice",
    category: "Rice & Bowls",
    description: "Light, fluffy rice served with your choice of house topping.",
    price: 5600,
    image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=900&q=85",
    options: [{ label: "Topping", values: ["Chicken", "Beef", "Vegetable"], prices: { Chicken: 0, Beef: 200, Vegetable: 0 } }],
    available: true,
    featured: false,
  },
  {
    id: "jollof-rice",
    name: "Tomato Rice Bowl",
    category: "Rice & Bowls",
    description: "Fragrant rice in a rich tomato base with herbs and your choice of protein.",
    price: 4800,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85",
    options: [
      { label: "Protein", values: ["Chicken", "Beef", "Turkey", "Plain"], prices: { Chicken: 0, Beef: 200, Turkey: 1000, Plain: -1200 } },
      { label: "Heat", values: ["Mild", "Hot", "Extra hot"], prices: { Mild: 0, Hot: 0, "Extra hot": 0 } },
    ],
    available: true,
    featured: true,
  },
  {
    id: "fried-rice",
    name: "Egg Fried Rice",
    category: "Rice & Bowls",
    description: "Wok-tossed rice with egg, vegetables and savoury aromatics.",
    price: 4800,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=85",
    options: [{ label: "Protein", values: ["Chicken", "Beef", "Turkey", "Plain"], prices: { Chicken: 0, Beef: 200, Turkey: 1000, Plain: -1200 } }],
    available: true,
    featured: false,
  },
  {
    id: "coconut-rice",
    name: "Coconut Rice Bowl",
    category: "Rice & Bowls",
    description: "Fragrant rice with coconut, herbs and a gentle citrus finish.",
    price: 5000,
    image: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=85",
    options: [{ label: "Protein", values: ["Chicken", "Beef", "Turkey", "Plain"], prices: { Chicken: 0, Beef: 200, Turkey: 1000, Plain: -1200 } }],
    available: true,
    featured: false,
  },
  {
    id: "grilled-chicken",
    name: "Herb-Grilled Chicken",
    category: "Grills",
    description: "Tender chicken with rosemary, lemon and a glossy house marinade.",
    price: 6500,
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=85",
    options: [
      { label: "Finish", values: ["Classic", "Pepper glaze"], prices: { Classic: 0, "Pepper glaze": 500 } },
      { label: "Portion", values: ["Quarter", "Half"], prices: { Quarter: 0, Half: 4500 } },
    ],
    available: true,
    featured: true,
  },
  {
    id: "peppered-beef",
    name: "Peppercorn Beef",
    category: "Grills",
    description: "Tender beef with cracked pepper, greens and a glossy pan sauce.",
    price: 5800,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85",
    options: [{ label: "Finish", values: ["Classic", "Extra pepper"], prices: { Classic: 0, "Extra pepper": 400 } }],
    available: true,
    featured: false,
  },
  {
    id: "asun",
    name: "Garlic Pepper Steak Bites",
    category: "Grills",
    description: "Smoky steak bites tossed with garlic, peppers and spring onions.",
    price: 6200,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85",
    options: [
      { label: "Finish", values: ["Classic", "Extra pepper"], prices: { Classic: 0, "Extra pepper": 400 } },
      { label: "Portion", values: ["Regular", "Large"], prices: { Regular: 0, Large: 1800 } },
    ],
    available: true,
    featured: false,
  },
  {
    id: "pepper-soup",
    name: "Roasted Vegetable Bowl",
    category: "Rice & Bowls",
    description: "Seasonal roasted vegetables, grains and a bright house dressing.",
    price: 5200,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85",
    options: [
      { label: "Base", values: ["Basmati", "Quinoa"], prices: { Basmati: 0, Quinoa: 700 } },
      { label: "Dressing", values: ["Herb", "Chilli"], prices: { Herb: 0, Chilli: 0 } },
    ],
    available: true,
    featured: false,
  },
  {
    id: "nkwobi",
    name: "Crispy Chicken Bites",
    category: "Starters",
    description: "Golden bite-size chicken with a warm, glossy dipping sauce.",
    price: 6500,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85",
    options: [{ label: "Sauce", values: ["Herb", "Chilli"], prices: { Herb: 0, Chilli: 0 } }],
    available: true,
    featured: false,
  },
  {
    id: "fried-plantain",
    name: "Mediterranean Side Plate",
    category: "Sides",
    description: "Roasted vegetables, greens and bright pickled accents.",
    price: 1800,
    image: "https://images.unsplash.com/photo-1599020792689-9fde458e7e17?auto=format&fit=crop&w=900&q=85",
    options: [],
    available: true,
    featured: false,
  },
  {
    id: "moin-moin",
    name: "Samosa & Dip Platter",
    category: "Starters",
    description: "Golden pastry bites with fresh herb and chilli dips.",
    price: 2200,
    image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=900&q=85",
    options: [],
    available: true,
    featured: false,
  },
  {
    id: "chapman",
    name: "Citrus Sunset",
    category: "Drinks",
    description: "A bright citrus cooler with a sparkling finish.",
    price: 2200,
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85",
    options: [],
    available: true,
    featured: false,
  },
  {
    id: "zobo",
    name: "Berry Lime Cooler",
    category: "Drinks",
    description: "A chilled berry and lime cooler with a fresh citrus finish.",
    price: 1500,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=85",
    options: [],
    available: true,
    featured: false,
  },
  {
    id: "soft-drink-water",
    name: "Classic Lemon Fizz",
    category: "Drinks",
    description: "A chilled lemon soda served bright and refreshing.",
    price: 800,
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85",
    options: [],
    available: true,
    featured: false,
  },
];

let seeded = false;

async function ensureMenuSeed() {
  if (seeded) return;
  for (const item of seedMenu) {
    await db.insert(menuItemsTable).values(item).onConflictDoUpdate({
      target: menuItemsTable.id,
      set: {
        name: item.name,
        category: item.category,
        description: item.description,
        price: item.price,
        image: item.image,
        options: item.options,
        featured: item.featured,
      },
    });
  }
  seeded = true;
}

router.get("/menu", async (req, res): Promise<void> => {
  await ensureMenuSeed();
  const items = await db.select().from(menuItemsTable);
  res.json(ListMenuResponse.parse(items));
});

router.patch("/menu/:id/availability", async (req, res): Promise<void> => {
  const params = UpdateMenuAvailabilityParams.safeParse(req.params);
  const body = UpdateMenuAvailabilityBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid menu availability request" });
    return;
  }

  const [updated] = await db
    .update(menuItemsTable)
    .set({ available: body.data.available })
    .where(eq(menuItemsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }

  req.log.info({ menuItemId: updated.id, available: updated.available }, "Menu availability updated");
  res.json(UpdateMenuAvailabilityResponse.parse(updated));
});

export default router;

