# De•Bite – Complete Project Specification

**Project Type:** Premium single-restaurant ordering website  
**Location:** Lagos, Nigeria  
**Ordering Method:** WhatsApp only (no payment gateway)  
**Goal:** Clean, professional, responsive, premium experience

---

## 1. Brand Identity

### Logo
- Use the provided logo (chef hat + cloche + fork design)
- Favicon: Use the same logo

### Brand Colors (extracted from logo)
| Role              | Color Name          | Hex       | Usage                              |
|-------------------|---------------------|-----------|------------------------------------|
| Primary           | Deep Forest Green   | `#0B3D2E` | Header, buttons, important text    |
| Secondary         | Golden Yellow       | `#F5A623` | Primary CTAs, highlights, accents  |
| Accent            | Warm Orange         | `#F97316` | Hover states, notifications, steam |
| Background Light  | Soft Cream          | `#F8F5F0` | Page backgrounds                   |
| White             | Pure White          | `#FFFFFF` | Cards, text on dark                |
| Dark              | Near Black          | `#111111` | Body text                          |

### Tagline
**Fresh. Bold. Delivered.**

### Tone of Voice
Premium, clean, warm, confident, and straightforward. No slang overload. Professional but approachable.

---

## 2. Core Features

- Fully responsive (mobile-first)
- Premium, clean, modern UI
- Floating glowing WhatsApp button on every page
- Menu with item customization
- Cart system
- Order via WhatsApp (pre-filled message)
- Semi-automatic order tracking
- FAQ section
- About + Contact pages
- Loading states & empty states
- Privacy Policy & Terms of Service

---

## 3. Floating WhatsApp Button

- Fixed position: bottom-right on all pages
- Circular button with official WhatsApp green
- Soft glowing pulse animation
- Opens WhatsApp chat with number: **08124379140**
- On mobile it should not interfere with content
- Tooltip on hover (desktop): “Chat with us”

---

## 4. Pages Structure

### 4.1 Home Page
- Hero section with strong food imagery + tagline + “Order Now” button
- Short value propositions (3 cards)
- Featured / Popular dishes (horizontal scroll or grid)
- How it works (3 simple steps)
- Final CTA section
- Footer

### 4.2 Menu Page
- Category navigation (sticky on mobile)
- Item cards with:
  - Image
  - Name
  - Short description
  - Starting price
  - “Customize” or “Add” button
- When an item is selected → Customization modal/drawer appears
- Persistent cart sidebar (desktop) / bottom cart bar (mobile)
- Clear “Order via WhatsApp” button when cart has items

### 4.3 Cart & Checkout (Combined flow)
- Cart summary with editable quantities and customizations
- Customer details form:
  - Full Name
  - Phone Number
  - Order Type: Delivery / Pickup (toggle)
  - Delivery Address (only if Delivery is selected)
- Order summary (subtotal + delivery fee + total)
- Big button: **Order via WhatsApp**

### 4.4 Track Order Page
- Simple form: Enter Order ID + Phone Number
- After submission → show current status with visual timeline
- Statuses:
  1. Order Received
  2. Payment Confirmed
  3. Preparing Your Food
  4. Ready for Pickup **or** Out for Delivery
  5. Completed

### 4.5 About Page
**Heading:** Made with Care. Served with Pride.

De•Bite was created for people who love real Nigerian food — the kind that tastes like home but arrives looking and tasting flawless.

We focus on a tight menu so every dish is done properly. No overcrowded menu, no shortcuts, no compromises. Just good food, carefully prepared, and delivered or ready for pickup when you want it.

Whether you’re in Lekki, Ajah, Victoria Island or Ikoyi, we’re here to make ordering Nigerian food simple, reliable, and delicious.

### 4.6 Contact Page
- WhatsApp number (clickable): 0812 437 9140
- Email: raheemcoding101@gmail.com
- Opening hours
- Service areas
- Simple contact form (Name, Phone, Message)
- Google Maps embed (optional)

### 4.7 FAQ Page / Section
Include these questions:

- How do I place an order?
- What payment methods do you accept?
- How long does delivery take?
- Which areas do you deliver to?
- Can I customize my order?
- How do I track my order?
- What are your opening hours?
- Can I cancel or change my order?

### 4.8 Privacy Policy & Terms of Service
(Use the versions already written earlier in the conversation)

---

## 5. Menu (Launch Version)

### Starters
1. Puff Puff – Portion (5 pcs / 10 pcs)
2. Suya – Protein (Beef / Chicken), Spice Level (Mild / Hot / Extra Hot)

### Soups & Swallow
3. Egusi Soup – Protein (Beef, Chicken, Fish, Assorted), Swallow (Pounded Yam, Eba, Semo, Fufu)
4. Efo Riro – Protein, Swallow
5. Ofada Rice with Ayamase – Protein (Beef, Assorted, Boiled Egg), Spice Level
6. Amala and Gbegiri – Protein

### Rice
7. Jollof Rice – Protein (Chicken, Beef, Turkey, Plain), Spice Level
8. Fried Rice – Protein
9. Coconut Rice – Protein

### Grills / Proteins
10. Grilled Chicken – Spice Level, Portion (Quarter / Half)
11. Peppered Beef – Spice Level
12. Asun – Spice Level, Portion Size

### Local Specials
13. Pepper Soup – Protein (Goat, Catfish, Chicken), Spice Level
14. Nkwobi – Spice Level

### Sides
15. Fried Plantain (Dodo)
16. Moin Moin

### Drinks
17. Chapman
18. Zobo
19. Soft Drink / Bottled Water

---

## 6. Ordering Flow (WhatsApp)

1. Customer adds items and customizes them
2. Goes to cart / checkout
3. Fills Name, Phone, Delivery/Pickup, Address
4. Clicks **Order via WhatsApp**
5. WhatsApp opens with this pre-filled message:

```
Hello De•Bite 👋

I would like to place an order:

*Order Details:*
• [Item Name] ([Customizations]) — ₦[Price]
• [Item Name] ([Customizations]) — ₦[Price]

*Subtotal:* ₦[Amount]
*Delivery Fee:* ₦[Amount or Free]
*Total:* ₦[Amount]

*Customer Details:*
Name: [Name]
Phone: [Phone]
Order Type: [Delivery / Pickup]
Address: [Address if Delivery]

Please confirm my order and send your account details for payment. Thank you!
```

6. Customer sends the message
7. Restaurant replies with confirmation + bank account details
8. After payment is confirmed, restaurant generates tracking link and sends it to customer

---

## 7. Delivery Information

- **Fee:** ₦1,000 flat
- **Free delivery** on orders above ₦15,000
- **Service Areas (Launch):**
  - Lekki Phase 1 & 2
  - Ajah
  - Sangotedo
  - Chevron
  - Ikate
  - Agungi
  - Victoria Island
  - Ikoyi

- **Opening Hours:**
  - Monday – Saturday: 10:00 AM – 9:00 PM
  - Sunday: 12:00 PM – 8:00 PM
  - Last order: 45 minutes before closing

---

## 8. Admin Requirements (Minimum)

Simple protected admin area where the restaurant can:
- View incoming orders
- Mark payment as confirmed
- Update order status
- Generate / copy tracking link
- Toggle menu items as available / sold out
- Basic settings (optional)

---

## 9. Design Guidelines

- Mobile-first, fully responsive
- Clean typography (prefer Inter, Plus Jakarta Sans, or similar modern sans-serif)
- Generous white space
- High-quality food imagery
- Soft shadows and subtle borders
- Smooth transitions and micro-interactions
- Loading skeletons / spinners
- Empty states (e.g. empty cart illustration + message)
- Premium feel — avoid clutter

### Glowing WhatsApp Button
- Soft green glow / pulse animation
- Always visible but not intrusive

---

## 10. Technical Notes (Recommended Stack)

- Frontend: Next.js + Tailwind CSS + Framer Motion (for animations)
- State: React Context or Zustand for cart
- Forms: React Hook Form
- Hosting: Netlify
- Images: Optimized (WebP) + AI-generated food photos
- WhatsApp link format: `https://wa.me/2348124379140?text=...`

---

## 11. Image Generation Prompts (for AI)

Use these later to generate consistent food photography:

- “Professional food photography of Nigerian jollof rice with chicken, top-down view, soft natural lighting, premium restaurant style, clean background”
- “Close-up of steaming egusi soup with pounded yam, rich texture, appetizing, high-end food photography”
- “Suya skewers on a dark plate, smoke, dramatic lighting, Nigerian street food elevated”
- (Create similar prompts for every menu item)

Logo should be used for favicon and header.

---

## 12. Contact Information

- **WhatsApp:** 0812 437 9140
- **Email:** raheemcoding101@gmail.com

---

## 13. Final Checklist Before Development

- [x] Brand colors & logo
- [x] Tagline
- [x] Full menu with customizations
- [x] WhatsApp ordering flow + pre-filled message
- [x] Tracking system
- [x] Delivery rules & areas
- [x] Opening hours
- [x] Privacy Policy & Terms
- [x] Floating glowing WhatsApp button
- [x] FAQ content
- [x] Loading & empty states
- [x] Responsive + premium design direction

---

**This document is the single source of truth for building De•Bite.**

Ready for development.
