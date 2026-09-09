---
name: Supabase order item JSON
description: The Supabase order_items customizations field can arrive in more than one serialized shape.
---

Normalize `order_items.customizations` at the server boundary before validating or returning admin order data: accept both an object and a JSON-encoded object, and use an empty object for invalid or absent values.

**Why:** The live Supabase table returned at least one customization value as a JSON string even though the logical field is JSON-shaped, which otherwise caused the admin orders endpoint response validation to fail.

**How to apply:** Any future Supabase order or order-item reader should normalize JSONB-like fields before mapping them into API schemas.